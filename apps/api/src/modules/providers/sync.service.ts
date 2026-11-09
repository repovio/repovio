import { Injectable, Logger, Optional } from '@nestjs/common';

import type { ProviderType } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { WorkflowFilterService } from '../repositories/workflow-filter.service.js';
import { SystemStatusService } from '../system-status/system-status.service.js';
import type {
  ProviderAccountContext,
  ProviderAdapter,
  ProviderRepositoryReference,
  ProviderSyncScope,
  ProviderWorkflowLifecycle,
  ProviderWorkflowRun,
} from './provider-adapter.js';
import { ProviderAdapterRegistry } from './provider-adapter.registry.js';
import { ProviderCredentialService } from './provider-credential.service.js';
import { RepositoryMetadataService } from './repository-metadata.service.js';
import { SecurityAlertSyncService } from './security-alert-sync.service.js';
import type { RepositorySyncProgressReporter } from './sync-progress.js';
import { WorkItemSyncService } from './work-item-sync.service.js';

type SyncRepository = Awaited<ReturnType<PrismaService['repository']['findMany']>>[number] & {
  workflowCiEnabled?: boolean | null;
  providerAccount: { id: string; providerType: ProviderType; baseUrl: string | null; encryptedAccessToken: string };
  workflowFilters: { mode: 'ALLOW' | 'DENY'; pattern: string }[];
};
type SyncProgress = { id: string; repositoriesCompleted: number; repositoriesTotal: number };

const terminalWorkflowRunStatuses = ['SUCCESS', 'FAILED', 'CANCELLED', 'SKIPPED', 'UNKNOWN'] as const;
const closedChangeRequestRefreshIntervalMs = 24 * 60 * 60 * 1000;
const unknownChangeRequestRefreshIntervalMs = 60 * 60 * 1000;

/** Incrementally synchronizes enabled tracked repositories without provider writes. */
@Injectable()
export class ProviderSyncService {
  private readonly logger = new Logger(ProviderSyncService.name);
  /**
   * Initialize ProviderSyncService with its required dependencies.
   *
   * @param prisma - Database client used for persisted application state.
   * @param adapters - Registry resolving the read-only adapter for each provider type.
   * @param credentials - Service encrypting and decrypting persisted credentials.
   * @param metadata - Service refreshing tracked repository identity and location.
   * @param filters - Service determining whether a workflow name should be tracked.
   * @param notifications - Service managing channels and idempotent notification events.
   * @param status - Service broadcasting active synchronization progress and workflow counts.
   * @param workItems - Optional service synchronizing issues, pull requests, and run associations.
   * @param securityAlerts - Optional service synchronizing normalized security alerts.
   */
  constructor(
    private readonly prisma: PrismaService,
    private readonly adapters: ProviderAdapterRegistry,
    private readonly credentials: ProviderCredentialService,
    private readonly metadata: RepositoryMetadataService,
    private readonly filters: WorkflowFilterService,
    private readonly notifications: NotificationsService,
    private readonly status: SystemStatusService,
    @Optional() private readonly workItems?: WorkItemSyncService,
    @Optional() private readonly securityAlerts?: SecurityAlertSyncService,
  ) {}

  /**
   * Synchronize enabled tracked repositories while reporting aggregate progress.
   *
   * @returns A promise that resolves when the operation completes.
   * @throws NotFoundException - Provider repository not found.
   * @throws ConflictException - Provider repository identity does not match the tracked repository.
   * @throws Error - When no adapter is registered for the requested provider type.
   * @throws ProviderRequestError - When a provider read fails, including rate limiting; status and retry metadata are
   * preserved.
   * @throws TypeError - When the provider request fails at the network layer.
   */
  async syncEnabledRepositories(): Promise<void> {
    const syncId = this.status.beginProviderSync();
    try {
      const repositories = await this.prisma.repository.findMany({
        where: { enabled: true, providerAccount: { enabled: true } },
        include: { providerAccount: true, workflowFilters: true },
      });
      for (const [index, repository] of repositories.entries()) {
        await this.syncRepository(repository, {
          id: syncId,
          repositoriesCompleted: index,
          repositoriesTotal: repositories.length,
        });
        this.status.updateProviderSync(syncId, {
          phase: 'FETCHING_WORKFLOWS',
          repositoriesCompleted: index + 1,
          repositoriesTotal: repositories.length,
          workflowRunsCompleted: null,
          workflowRunsTotal: null,
        });
      }
    } finally {
      this.status.finishProviderSync(syncId);
    }
  }

  /**
   * Synchronize one enabled repository claimed by the durable sync queue.
   *
   * @param repositoryId - Local identifier of the tracked repository.
   * @param scopes - Repository domains requested for this synchronization.
   * @param reportProgress - Optional asynchronous callback persisting per-repository progress.
   * @returns Whether an enabled tracked repository was found and synchronized.
   * @throws NotFoundException - Provider repository not found.
   * @throws ConflictException - Provider repository identity does not match the tracked repository.
   * @throws Error - When no adapter is registered for the requested provider type.
   * @throws ProviderRequestError - When a provider read fails, including rate limiting; status and retry metadata are
   * preserved.
   * @throws TypeError - When the provider request fails at the network layer.
   */
  async syncRepositoryById(
    repositoryId: string,
    scopes: ProviderSyncScope[] = ['WORKFLOWS', 'ISSUES', 'PULL_REQUESTS', 'ALERTS'],
    reportProgress?: RepositorySyncProgressReporter,
  ): Promise<boolean> {
    const syncId = this.status.beginProviderSync();
    try {
      const repository = await this.prisma.repository.findFirst({
        where: { enabled: true, id: repositoryId, providerAccount: { enabled: true } },
        include: { providerAccount: true, workflowFilters: true },
      });
      if (!repository) return false;

      await this.syncRepository(
        repository,
        { id: syncId, repositoriesCompleted: 0, repositoriesTotal: 1 },
        scopes,
        reportProgress,
      );
      this.status.updateProviderSync(syncId, {
        phase: 'FETCHING_WORKFLOWS',
        repositoriesCompleted: 1,
        repositoriesTotal: 1,
        workflowRunsCompleted: null,
        workflowRunsTotal: null,
      });
      return true;
    } finally {
      this.status.finishProviderSync(syncId);
    }
  }

  /**
   * Coordinate repository metadata, requested domains, progress, and synchronization status.
   *
   * @param repository - Repository identity and metadata required by the operation.
   * @param progress - Aggregate synchronization identifier and repository counts.
   * @param scopes - Repository domains requested for this synchronization.
   * @param reportProgress - Optional asynchronous callback persisting per-repository progress.
   * @returns A promise that resolves when the operation completes.
   * @throws NotFoundException - Provider repository not found.
   * @throws ConflictException - Provider repository identity does not match the tracked repository.
   * @throws Error - When no adapter is registered for the requested provider type.
   * @throws ProviderRequestError - When a provider read fails, including rate limiting; status and retry metadata are
   * preserved.
   * @throws TypeError - When the provider request fails at the network layer.
   */
  private async syncRepository(
    repository: SyncRepository,
    progress: SyncProgress,
    scopes: ProviderSyncScope[] = ['WORKFLOWS', 'ISSUES', 'PULL_REQUESTS', 'ALERTS'],
    reportProgress?: RepositorySyncProgressReporter,
  ): Promise<void> {
    const synchronizationStartedAt = new Date();
    this.status.updateProviderSync(progress.id, {
      phase: 'FETCHING_WORKFLOWS',
      repositoriesCompleted: progress.repositoriesCompleted,
      repositoriesTotal: progress.repositoriesTotal,
      workflowRunsCompleted: null,
      workflowRunsTotal: null,
    });
    try {
      await reportProgress?.({ current: null, phase: 'LOADING_REPOSITORY', total: null });
      const refreshedRepository = await this.metadata.refresh(repository);
      const adapter = this.adapters.get(refreshedRepository.providerAccount.providerType);
      const context = {
        providerAccountId: refreshedRepository.providerAccount.id,
        baseUrl: refreshedRepository.providerAccount.baseUrl,
        accessToken: await this.credentials.accessToken(refreshedRepository.providerAccount),
      };
      await this.workItems?.synchronize(context, refreshedRepository, adapter, scopes, reportProgress);
      if (scopes.includes('ALERTS'))
        await this.securityAlerts?.synchronize(context, refreshedRepository, adapter, reportProgress);
      if (!scopes.includes('WORKFLOWS')) {
        await this.markSynchronizationSuccess(repository, synchronizationStartedAt, false);
        return;
      }
      await reportProgress?.({ current: null, phase: 'FETCHING_WORKFLOWS', total: null });
      const { existingProviderRunIds, runs, lifecycles } = await this.reconcileWorkflowLifecycles(
        context,
        refreshedRepository,
        adapter,
      );
      await this.processWorkflowRuns(repository, runs, existingProviderRunIds, progress, reportProgress, lifecycles);
      await reportProgress?.({ current: null, phase: 'REFRESHING_CHANGE_REQUESTS', total: null });
      await this.workItems?.reconcileWorkflowRunChangeRequests(repository.id);
      await this.refreshChangeRequestStates(context, refreshedRepository, adapter);
      await this.markSynchronizationSuccess(repository, synchronizationStartedAt);
    } catch (error) {
      await this.markSynchronizationFailure(repository.providerAccount.id);
      throw error;
    } finally {
      await this.status.refreshRunningWorkflowCount();
    }
  }

  /**
   * Merge newly discovered runs with refreshed current failed, queued, running, or approval-gated runs.
   *
   * @param context - Provider account credentials and instance configuration for this request.
   * @param repository - Repository identity and metadata required by the operation.
   * @param adapter - Read-only provider adapter for the selected repository.
   * @returns Discovered and refreshed runs plus the provider IDs of existing runs that must bypass current filters.
   * @throws ProviderRequestError - When a provider read fails, including rate limiting; status and retry metadata are
   * preserved.
   * @throws TypeError - When the provider request fails at the network layer.
   */
  private async findWorkflowRuns(
    context: ProviderAccountContext,
    repository: SyncRepository,
    adapter: ProviderAdapter,
  ): Promise<{ existingProviderRunIds: Set<string>; runs: ProviderWorkflowRun[] }> {
    const discoveredRuns = await adapter.listWorkflowRuns(context, repository, repository.lastSyncAt ?? undefined);
    const currentRuns = await this.prisma.workflowRun.findMany({
      distinct: ['workflowId', 'scopeKey'],
      orderBy: [{ providerCreatedAt: 'desc' }, { id: 'desc' }],
      select: { awaitingApproval: true, id: true, providerRunId: true, pullRequestId: true, status: true },
      where: {
        repositoryId: repository.id,
      },
    });
    const activeRuns = await this.prisma.workflowRun.findMany({
      select: { awaitingApproval: true, id: true, providerRunId: true, pullRequestId: true, status: true },
      where: { repositoryId: repository.id, status: { in: ['QUEUED', 'RUNNING'] } },
    });
    const runsToRefresh = new Map(
      [...currentRuns, ...activeRuns]
        .filter(
          /** Keeps entries matching `run.awaitingApproval || run.status === 'FAILED' || run.status === 'QUEUED' || run.status === 'RUNNING'`. */
          (run) =>
            run.awaitingApproval || run.status === 'FAILED' || run.status === 'QUEUED' || run.status === 'RUNNING',
        )
        .map(/** Projects each entry using `[run.providerRunId, run]`. */ (run) => [run.providerRunId, run]),
    );
    const runsByProviderId = new Map(
      discoveredRuns.map(
        /** Projects each entry using `[run.providerRunId, run]`. */ (run) => [run.providerRunId, run],
      ),
    );
    for (const run of runsToRefresh.values()) {
      if (runsByProviderId.has(run.providerRunId)) continue;
      const refreshedRun = await adapter.getWorkflowRun(context, repository, run.providerRunId);
      if (refreshedRun) {
        runsByProviderId.set(refreshedRun.providerRunId, refreshedRun);
        continue;
      }
      if (run.status !== 'QUEUED' && run.status !== 'RUNNING') continue;
      await this.prisma.workflowRun.update({
        data: { awaitingApproval: false, status: 'UNKNOWN' },
        where: { id: run.id },
      });
      if (run.pullRequestId) await this.workItems?.refreshPullRequestWorkflowStatus(run.pullRequestId);
    }
    return { existingProviderRunIds: new Set(runsToRefresh.keys()), runs: [...runsByProviderId.values()] };
  }

  /**
   * Refresh known and newly discovered workflow identities before evaluating run events.
   *
   * @param context - Read-only provider authentication context.
   * @param repository - Repository whose workflows are being synchronized.
   * @param adapter - Provider implementation exposing lifecycle observations when supported.
   * @returns Discovered runs and confirmed lifecycle observations for existing and new workflows.
   * @throws ProviderRequestError - When lifecycle reads fail; no observations are persisted until all reads succeed.
   * @throws TypeError - When a provider read fails at the network layer.
   */
  private async reconcileWorkflowLifecycles(
    context: ProviderAccountContext,
    repository: SyncRepository,
    adapter: ProviderAdapter,
  ): Promise<{
    existingProviderRunIds: Set<string>;
    runs: ProviderWorkflowRun[];
    lifecycles: Map<string, ProviderWorkflowLifecycle>;
  }> {
    if (!adapter.listWorkflowLifecycles)
      return {
        ...(await this.findWorkflowRuns(context, repository, adapter)),
        lifecycles: new Map(),
      };
    const workflows = await this.prisma.workflow.findMany({
      select: { providerWorkflowId: true },
      where: { repositoryId: repository.id },
    });
    const knownIds = new Set(
      workflows.map(
        /** Selects known workflow identities, including inactive ones. */ (workflow) => workflow.providerWorkflowId,
      ),
    );
    const observations = await adapter.listWorkflowLifecycles(context, repository, workflows);
    const repositoryCiDisabled =
      repository.workflowCiEnabled === false ||
      observations.some(
        /** Identifies explicit repository-level disabling. */ (observation) =>
          observation.rawState === 'repository:ci:disabled' && observation.state === 'DISABLED',
      );
    const discovered = repositoryCiDisabled
      ? { existingProviderRunIds: new Set<string>(), runs: [] as ProviderWorkflowRun[] }
      : await this.findWorkflowRuns(context, repository, adapter);
    const newIds = new Set(
      discovered.runs
        .filter(
          /** Checks only newly discovered tracked identities. */ (run) =>
            !knownIds.has(run.providerWorkflowId) &&
            this.filters.shouldTrack(run.workflowName, repository.workflowFilters),
        )
        .map(/** Selects a newly discovered identity. */ (run) => run.providerWorkflowId),
    );
    if (newIds.size > 0) {
      const repositoryObservation = observations.find(
        /** Reuses one repository-level setting for all new identities. */ (observation) =>
          observation.rawState?.startsWith('repository:ci:'),
      );
      if (repositoryObservation)
        observations.push(
          ...[...newIds].map(
            /** Copies the confirmed repository setting without another provider read. */ (providerWorkflowId) => ({
              ...repositoryObservation,
              providerWorkflowId,
            }),
          ),
        );
      else if (
        knownIds.size === 0 ||
        (repository.providerAccount.providerType !== 'FORGEJO' && repository.providerAccount.providerType !== 'GITLAB')
      )
        observations.push(
          ...(await adapter.listWorkflowLifecycles(
            context,
            repository,
            [...newIds].map(
              /** Builds an identity-only provider request. */ (providerWorkflowId) => ({ providerWorkflowId }),
            ),
          )),
        );
    }
    const checkedAt = new Date();
    await this.prisma.$transaction(
      observations.map(
        /** Updates only known identities in this repository. */ (observation) =>
          this.prisma.workflow.updateMany({
            data: {
              lifecycleState: observation.state,
              lifecycleRawState: observation.rawState,
              lifecycleCheckedAt: checkedAt,
            },
            where: { repositoryId: repository.id, providerWorkflowId: observation.providerWorkflowId },
          }),
      ),
    );
    return {
      ...discovered,
      lifecycles: new Map(
        observations.map(
          /** Indexes authoritative observations for new workflows. */ (observation) => [
            observation.providerWorkflowId,
            observation,
          ],
        ),
      ),
    };
  }

  /**
   * Persist tracked runs and report progress for each discovered or refreshed run.
   *
   * @param repository - Repository identity and metadata required by the operation.
   * @param runs - Workflow runs to aggregate, associate, or persist.
   * @param existingProviderRunIds - Existing runs that remain tracked even when filters changed after persistence.
   * @param progress - Aggregate synchronization identifier and repository counts.
   * @param reportProgress - Optional asynchronous callback persisting per-repository progress.
   * @param lifecycles - Authoritative observations used for newly discovered workflows.
   * @returns A promise that resolves when the operation completes.
   * @throws Error - When an event delivery lacks its repository, event type, or source work item.
   */
  private async processWorkflowRuns(
    repository: SyncRepository,
    runs: ProviderWorkflowRun[],
    existingProviderRunIds: Set<string>,
    progress: SyncProgress,
    reportProgress?: RepositorySyncProgressReporter,
    lifecycles: Map<string, ProviderWorkflowLifecycle> = new Map(),
  ): Promise<void> {
    await reportProgress?.({ current: 0, phase: 'PROCESSING_WORKFLOWS', total: runs.length });
    this.status.updateProviderSync(progress.id, {
      phase: 'PROCESSING_WORKFLOWS',
      repositoriesCompleted: progress.repositoriesCompleted,
      repositoriesTotal: progress.repositoriesTotal,
      workflowRunsCompleted: 0,
      workflowRunsTotal: runs.length,
    });
    for (const [index, run] of runs.entries()) {
      if (
        existingProviderRunIds.has(run.providerRunId) ||
        this.filters.shouldTrack(run.workflowName, repository.workflowFilters)
      )
        await this.persistRunAndEvaluateEvents(
          repository.id,
          run,
          !repository.lastSyncAt,
          lifecycles.get(run.providerWorkflowId),
        );
      await reportProgress?.({ current: index + 1, phase: 'PROCESSING_WORKFLOWS', total: runs.length });
      this.status.updateProviderSync(progress.id, {
        phase: 'PROCESSING_WORKFLOWS',
        repositoriesCompleted: progress.repositoriesCompleted,
        repositoriesTotal: progress.repositoriesTotal,
        workflowRunsCompleted: index + 1,
        workflowRunsTotal: runs.length,
      });
    }
  }

  /**
   * Persist a sanitized account synchronization failure and log the account identifier.
   *
   * @param providerAccountId - Local identifier of the provider account.
   * @returns A promise that resolves when the operation completes.
   */
  private async markSynchronizationFailure(providerAccountId: string): Promise<void> {
    await this.prisma.providerAccount.update({
      where: { id: providerAccountId },
      data: {
        lastSyncAt: new Date(),
        lastSyncError: 'Synchronization failed. Check provider connectivity and credentials.',
      },
    });
    this.logger.warn(`Synchronization failed for provider account ${providerAccountId}.`);
  }

  /**
   * Clear the account error and advance the workflow cursor when requested.
   *
   * @param repository - Repository identity and metadata required by the operation.
   * @param lastSyncAt - Synchronization start time used as the next incremental cursor.
   * @param updateWorkflowCursor - Whether workflow synchronization completed and its repository cursor may advance.
   * @returns A promise that resolves when the operation completes.
   */
  private async markSynchronizationSuccess(
    repository: { id: string; providerAccount: { id: string } },
    lastSyncAt: Date,
    updateWorkflowCursor = true,
  ): Promise<void> {
    if (updateWorkflowCursor)
      await this.prisma.repository.update({ where: { id: repository.id }, data: { lastSyncAt } });
    await this.prisma.providerAccount.update({
      where: { id: repository.providerAccount.id },
      data: { lastSyncAt, lastSyncError: null },
    });
  }

  /**
   * Refresh lifecycle metadata for change requests whose current terminal workflow result still failed.
   *
   * @param context - Provider account credentials and instance configuration for this request.
   * @param repository - Repository identity and metadata required by the operation.
   * @param adapter - Read-only provider adapter for the selected repository.
   * @returns A promise that resolves when the operation completes.
   * @throws ProviderRequestError - When a provider read fails, including rate limiting; status and retry metadata are
   * preserved.
   * @throws TypeError - When the provider request fails at the network layer.
   */
  private async refreshChangeRequestStates(
    context: ProviderAccountContext,
    repository: ProviderRepositoryReference & { id: string },
    adapter: ProviderAdapter,
  ): Promise<void> {
    const latestTerminalRuns = await this.prisma.workflowRun.findMany({
      distinct: ['workflowId', 'scopeKey'],
      orderBy: [{ providerCreatedAt: 'desc' }, { id: 'desc' }],
      select: {
        changeRequestCheckedAt: true,
        changeRequestNumber: true,
        changeRequestState: true,
        status: true,
      },
      where: {
        awaitingApproval: false,
        changeRequestNumber: { not: null },
        completedAt: { not: null },
        repositoryId: repository.id,
        status: { in: [...terminalWorkflowRunStatuses] },
        workflow: { kind: 'STANDARD' },
      },
    });
    const now = new Date();
    const candidates = new Map<string, (typeof latestTerminalRuns)[number]>();
    for (const run of latestTerminalRuns) {
      if (run.status !== 'FAILED' || !run.changeRequestNumber) continue;
      const existing = candidates.get(run.changeRequestNumber);
      if (!existing || (!this.shouldRefreshChangeRequest(existing, now) && this.shouldRefreshChangeRequest(run, now)))
        candidates.set(run.changeRequestNumber, run);
    }

    for (const [changeRequestNumber, candidate] of candidates) {
      if (!this.shouldRefreshChangeRequest(candidate, now)) continue;
      const state = await adapter.getChangeRequestState(context, repository, changeRequestNumber);
      await this.prisma.workflowRun.updateMany({
        data: {
          changeRequestCheckedAt: now,
          changeRequestMergedAt: state?.mergedAt ?? null,
          changeRequestState: state?.state ?? 'UNKNOWN',
          changeRequestTargetBranch: state?.targetBranch ?? null,
        },
        where: { changeRequestNumber, repositoryId: repository.id },
      });
    }
  }

  /**
   * Decide whether cached change-request lifecycle metadata is old enough to refresh.
   *
   * @param candidate - Candidate record whose eligibility is checked against current state.
   * @param now - Reference time for deterministic time-dependent calculations.
   * @returns Whether the cached lifecycle state is eligible for a provider refresh.
   */
  private shouldRefreshChangeRequest(
    candidate: { changeRequestCheckedAt: Date | null; changeRequestState: 'UNKNOWN' | 'OPEN' | 'CLOSED' | 'MERGED' },
    now: Date,
  ): boolean {
    if (candidate.changeRequestState === 'MERGED') return false;
    if (candidate.changeRequestState === 'OPEN' || !candidate.changeRequestCheckedAt) return true;
    const refreshInterval =
      candidate.changeRequestState === 'CLOSED'
        ? closedChangeRequestRefreshIntervalMs
        : unknownChangeRequestRefreshIntervalMs;
    return now.getTime() - candidate.changeRequestCheckedAt.getTime() >= refreshInterval;
  }

  /**
   * Upsert workflow identity and run state before evaluating notifications and pull-request status.
   *
   * @param repositoryId - Local identifier of the tracked repository.
   * @param run - Workflow run whose provider data or persisted state is being processed.
   * @param lifecycle - Confirmed lifecycle metadata for a newly discovered workflow.
   * @param baseline - Whether this is the initial synchronization, during which lifecycle notifications are suppressed.
   * @returns A promise that resolves when the operation completes.
   * @throws Error - When an event delivery lacks its repository, event type, or source work item.
   */
  private async persistRunAndEvaluateEvents(
    repositoryId: string,
    run: ProviderWorkflowRun,
    baseline: boolean,
    lifecycle?: ProviderWorkflowLifecycle,
  ): Promise<void> {
    const { durationMs, providerWorkflowId, workflowKind, workflowPath, ...runData } = run;
    const persistedRunData = { ...runData, durationMs: durationMs === null ? null : BigInt(durationMs) };
    const lastSeenAt = new Date();
    const workflow = await this.prisma.workflow.upsert({
      where: { repositoryId_providerWorkflowId: { repositoryId, providerWorkflowId } },
      create: {
        ...(lifecycle
          ? {
              lifecycleState: lifecycle.state,
              lifecycleRawState: lifecycle.rawState,
              lifecycleCheckedAt: lastSeenAt,
            }
          : {}),
        kind: workflowKind,
        lastSeenAt,
        name: run.workflowName,
        path: workflowPath,
        providerWorkflowId,
        repositoryId,
      },
      update: {
        kind: workflowKind,
        lastSeenAt,
        name: run.workflowName,
        path: workflowPath,
      },
    });
    await this.consolidateLegacyWorkflow(repositoryId, run, workflow.id);
    const pullRequest =
      run.changeRequestNumber && this.workItems
        ? await this.prisma.pullRequest.findUnique({
            select: { id: true },
            where: { repositoryId_number: { number: run.changeRequestNumber, repositoryId } },
          })
        : null;
    const previous = await this.prisma.workflowRun.findUnique({
      select: { status: true },
      where: { repositoryId_providerRunId: { repositoryId, providerRunId: run.providerRunId } },
    });
    const workflowRun = await this.prisma.workflowRun.upsert({
      where: { repositoryId_providerRunId: { repositoryId, providerRunId: run.providerRunId } },
      create: {
        ...persistedRunData,
        ...(this.workItems ? { pullRequestId: pullRequest?.id ?? null } : {}),
        repositoryId,
        workflowId: workflow.id,
      },
      update: {
        ...persistedRunData,
        ...(this.workItems ? { pullRequestId: pullRequest?.id ?? null } : {}),
        workflowId: workflow.id,
      },
    });
    if (workflow.lifecycleState !== 'REMOVED' && workflow.lifecycleState !== 'DISABLED')
      await this.notifications.evaluateWorkflowRun(workflowRun, previous?.status ?? null, baseline);
    if (workflowRun.pullRequestId) await this.workItems?.refreshPullRequestWorkflowStatus(workflowRun.pullRequestId);
  }

  /**
   * Move legacy workflow runs to the discovered identity before deleting the obsolete workflow.
   *
   * @param repositoryId - Local identifier of the tracked repository.
   * @param run - Workflow run whose provider data or persisted state is being processed.
   * @param workflowId - Local workflow identity that should own the normalized runs.
   * @returns A promise that resolves when the operation completes.
   */
  private async consolidateLegacyWorkflow(
    repositoryId: string,
    run: ProviderWorkflowRun,
    workflowId: string,
  ): Promise<void> {
    const legacyProviderWorkflowId =
      run.workflowKind === 'DEPENDABOT_INTERNAL'
        ? 'github:dynamic/dependabot/dependabot-updates'
        : `legacy:name:${run.workflowName}`;
    if (legacyProviderWorkflowId === run.providerWorkflowId) return;

    const legacyWorkflow = await this.prisma.workflow.findUnique({
      where: {
        repositoryId_providerWorkflowId: { providerWorkflowId: legacyProviderWorkflowId, repositoryId },
      },
    });
    if (!legacyWorkflow || legacyWorkflow.id === workflowId) return;

    await this.prisma.workflowRun.updateMany({
      data: { scopeKey: run.scopeKey, workflowId },
      where: { workflowId: legacyWorkflow.id },
    });
    await this.prisma.workflow.delete({ where: { id: legacyWorkflow.id } });
  }
}
