import type { PrismaService } from '../../prisma/prisma.service.js';
import type { NotificationsService } from '../notifications/notifications.service.js';
import type { WorkflowFilterService } from '../repositories/workflow-filter.service.js';
import type { SystemStatusService } from '../system-status/system-status.service.js';
import type { ProviderWorkflowLifecycle } from './provider-adapter.js';
import type { ProviderAdapterRegistry } from './provider-adapter.registry.js';
import type { ProviderCredentialService } from './provider-credential.service.js';
import { ProviderSyncService } from './sync.service.js';

describe('ProviderSyncService', /** Groups scenarios for ProviderSyncService. */ () => {
  it('upserts repeated provider-native run IDs within each repository', /** Verifies upserts repeated provider-native run IDs within each repository. */ async () => {
    const firstRepository = createRepository('first-repository');
    const secondRepository = createRepository('second-repository');
    const mocks = {
      prisma: {
        providerAccount: { update: jest.fn().mockResolvedValue(undefined) },
        repository: {
          findMany: jest.fn().mockResolvedValue([firstRepository, secondRepository]),
          update: jest.fn().mockResolvedValue(undefined),
        },
        workflowRun: {
          findMany: jest.fn().mockResolvedValue([]),
          findUnique: jest.fn().mockResolvedValue(null),
          updateMany: jest.fn().mockResolvedValue({ count: 0 }),
          upsert: jest.fn(
            /** Provides isolated upsert behavior for this test fixture. */ ({ create }) =>
              Promise.resolve({ id: 'run-id', ...create }),
          ),
        },
        workflow: {
          delete: jest.fn().mockResolvedValue(undefined),
          findUnique: jest.fn().mockResolvedValue(null),
          upsert: jest.fn().mockResolvedValue({ id: 'workflow-id' }),
        },
      },
      adapter: {
        getWorkflowRun: jest.fn().mockResolvedValue(createWorkflowRun()),
        listWorkflowRuns: jest.fn().mockResolvedValue([createWorkflowRun()]),
      },
      credentials: {
        decrypt: jest.fn().mockReturnValue('access-token'),
        accessToken: jest.fn().mockResolvedValue('access-token'),
      },
      filters: { shouldTrack: jest.fn().mockReturnValue(true) },
      notifications: { evaluateWorkflowRun: jest.fn().mockResolvedValue(undefined) },
      status: {
        beginProviderSync: jest.fn().mockReturnValue('sync-id'),
        finishProviderSync: jest.fn(),
        refreshRunningWorkflowCount: jest.fn().mockResolvedValue(undefined),
        updateProviderSync: jest.fn(),
      },
    };
    const service = new ProviderSyncService(
      mocks.prisma as unknown as PrismaService,
      { get: jest.fn().mockReturnValue(mocks.adapter) } as unknown as ProviderAdapterRegistry,
      mocks.credentials as unknown as ProviderCredentialService,
      {
        refresh: jest.fn(
          /** Provides isolated refresh behavior for this test fixture. */ (repository) => Promise.resolve(repository),
        ),
      } as never,
      mocks.filters as unknown as WorkflowFilterService,
      mocks.notifications as unknown as NotificationsService,
      mocks.status as unknown as SystemStatusService,
    );

    await service.syncEnabledRepositories();
    await service.syncEnabledRepositories();

    const { durationMs, providerWorkflowId, workflowKind, workflowPath, ...persistedRun } = createWorkflowRun();
    const persistedRunData = { ...persistedRun, durationMs: BigInt(durationMs) };
    expect(mocks.prisma.workflow.upsert).toHaveBeenCalledTimes(4);
    expect(mocks.prisma.workflow.upsert).toHaveBeenNthCalledWith(1, {
      create: {
        kind: workflowKind,
        lastSeenAt: expect.any(Date),
        name: persistedRun.workflowName,
        path: workflowPath,
        providerWorkflowId,
        repositoryId: firstRepository.id,
      },
      update: {
        kind: workflowKind,
        lastSeenAt: expect.any(Date),
        name: persistedRun.workflowName,
        path: workflowPath,
      },
      where: {
        repositoryId_providerWorkflowId: {
          providerWorkflowId,
          repositoryId: firstRepository.id,
        },
      },
    });
    expect(mocks.prisma.workflowRun.upsert).toHaveBeenCalledTimes(4);
    expect(mocks.prisma.workflowRun.updateMany).not.toHaveBeenCalled();
    expect(mocks.prisma.workflow.delete).not.toHaveBeenCalled();
    expect(mocks.adapter.getWorkflowRun).not.toHaveBeenCalled();
    expect(mocks.prisma.workflowRun.upsert).toHaveBeenNthCalledWith(1, {
      create: { ...persistedRunData, repositoryId: firstRepository.id, workflowId: 'workflow-id' },
      update: { ...persistedRunData, workflowId: 'workflow-id' },
      where: {
        repositoryId_providerRunId: {
          providerRunId: '12345',
          repositoryId: firstRepository.id,
        },
      },
    });
    expect(mocks.prisma.workflowRun.upsert).toHaveBeenNthCalledWith(2, {
      create: { ...persistedRunData, repositoryId: secondRepository.id, workflowId: 'workflow-id' },
      update: { ...persistedRunData, workflowId: 'workflow-id' },
      where: {
        repositoryId_providerRunId: {
          providerRunId: '12345',
          repositoryId: secondRepository.id,
        },
      },
    });
    expect(mocks.notifications.evaluateWorkflowRun).toHaveBeenCalledTimes(4);
    expect(mocks.status.refreshRunningWorkflowCount).toHaveBeenCalledTimes(4);
    expect(mocks.status.updateProviderSync).toHaveBeenCalledWith('sync-id', {
      phase: 'PROCESSING_WORKFLOWS',
      repositoriesCompleted: 0,
      repositoriesTotal: 2,
      workflowRunsCompleted: 0,
      workflowRunsTotal: 1,
    });
    expect(mocks.status.finishProviderSync).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['listed', 'RUNNING'],
    ['listed', 'QUEUED'],
    ['detail', 'RUNNING'],
    ['detail', 'QUEUED'],
    ['queued-webhook', 'RUNNING'],
    ['queued-webhook', 'QUEUED'],
  ])(
    'overwrites stale active final timing through %s synchronization for %s',
    /** Verify every repository sync entry path persists explicit null values without duplicating runs. */ async (
      entry,
      status,
    ) => {
      const { adapter, prisma, repository, service } = createLifecycleSyncFixture('ACTIVE');
      const run = { ...createWorkflowRun(), status, completedAt: new Date(0), durationMs: -1000 };
      adapter.listWorkflowRuns.mockResolvedValue(entry === 'detail' ? [] : [run]);
      const getWorkflowRun = jest.fn().mockResolvedValue(run);
      Object.assign(adapter, { getWorkflowRun });
      prisma.workflowRun.findMany.mockResolvedValue([
        { id: 'run-id', providerRunId: run.providerRunId, status: 'RUNNING' },
      ]);
      Object.assign(prisma.repository, { findFirst: jest.fn().mockResolvedValue(repository) });
      for (let attempt = 0; attempt < 2; attempt++) {
        if (entry === 'queued-webhook') await service.syncRepositoryById(repository.id, ['WORKFLOWS']);
        else await service.syncEnabledRepositories();
      }
      expect(prisma.workflowRun.upsert).toHaveBeenCalledTimes(2);
      expect(prisma.workflowRun.upsert).toHaveBeenLastCalledWith(
        expect.objectContaining({
          where: { repositoryId_providerRunId: { repositoryId: repository.id, providerRunId: run.providerRunId } },
          create: expect.objectContaining({ completedAt: null, durationMs: null, status }),
          update: expect.objectContaining({ completedAt: null, durationMs: null, status }),
        }),
      );
      expect(getWorkflowRun).toHaveBeenCalledTimes(entry === 'detail' ? 2 : 0);
    },
  );

  it('records terminal timing on the same active row and clears it again on a return to active', /** Verify stable identity and round fractional provider milliseconds at the BigInt persistence boundary. */ async () => {
    const { adapter, prisma, service } = createLifecycleSyncFixture('ACTIVE');
    const run = createWorkflowRun();
    adapter.listWorkflowRuns.mockResolvedValue([{ ...run, status: 'RUNNING' }]);
    await service.syncEnabledRepositories();
    adapter.listWorkflowRuns.mockResolvedValue([{ ...run, durationMs: 3000.25 }]);
    await service.syncEnabledRepositories();
    adapter.listWorkflowRuns.mockResolvedValue([{ ...run, status: 'QUEUED' }]);
    await service.syncEnabledRepositories();
    const calls = prisma.workflowRun.upsert.mock.calls;
    expect(calls[0][0].update).toMatchObject({ completedAt: null, durationMs: null, status: 'RUNNING' });
    expect(calls[1][0].update).toMatchObject({ completedAt: run.completedAt, durationMs: 3000n, status: 'SUCCESS' });
    expect(calls[2][0].update).toMatchObject({ completedAt: null, durationMs: null, status: 'QUEUED' });
    expect(calls[1][0].where).toEqual(calls[0][0].where);
    expect(calls[2][0].where).toEqual(calls[0][0].where);
  });

  it('moves migrated name-based runs to their provider-native workflow on first observation', /** Verifies moves migrated name-based runs to their provider-native workflow on first observation. */ async () => {
    const repository = createRepository('repository');
    const run = createWorkflowRun();
    const prisma = {
      providerAccount: { update: jest.fn().mockResolvedValue(undefined) },
      repository: {
        findMany: jest.fn().mockResolvedValue([repository]),
        update: jest.fn().mockResolvedValue(undefined),
      },
      workflow: {
        delete: jest.fn().mockResolvedValue(undefined),
        findUnique: jest.fn().mockResolvedValue({ id: 'legacy-workflow-id' }),
        upsert: jest.fn().mockResolvedValue({ id: 'provider-workflow-id' }),
      },
      workflowRun: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
        updateMany: jest.fn().mockResolvedValue({ count: 3 }),
        upsert: jest.fn(
          /** Provides isolated upsert behavior for this test fixture. */ ({ create }) =>
            Promise.resolve({ id: 'run-id', ...create }),
        ),
      },
    };
    const status = {
      beginProviderSync: jest.fn().mockReturnValue('sync-id'),
      finishProviderSync: jest.fn(),
      refreshRunningWorkflowCount: jest.fn().mockResolvedValue(undefined),
      updateProviderSync: jest.fn(),
    };
    const service = new ProviderSyncService(
      prisma as unknown as PrismaService,
      {
        get: jest.fn().mockReturnValue({
          getWorkflowRun: jest.fn(),
          listWorkflowRuns: jest.fn().mockResolvedValue([run]),
        }),
      } as unknown as ProviderAdapterRegistry,
      {
        decrypt: jest.fn().mockReturnValue('access-token'),
        accessToken: jest.fn().mockResolvedValue('access-token'),
      } as unknown as ProviderCredentialService,
      {
        refresh: jest.fn(
          /** Provides isolated refresh behavior for this test fixture. */ (value) => Promise.resolve(value),
        ),
      } as never,
      { shouldTrack: jest.fn().mockReturnValue(true) } as unknown as WorkflowFilterService,
      { evaluateWorkflowRun: jest.fn().mockResolvedValue(undefined) } as unknown as NotificationsService,
      status as unknown as SystemStatusService,
    );

    await service.syncEnabledRepositories();

    expect(prisma.workflow.findUnique).toHaveBeenCalledWith({
      where: {
        repositoryId_providerWorkflowId: {
          providerWorkflowId: 'legacy:name:Test',
          repositoryId: repository.id,
        },
      },
    });
    expect(prisma.workflowRun.updateMany).toHaveBeenCalledWith({
      data: { scopeKey: 'branch:main', workflowId: 'provider-workflow-id' },
      where: { workflowId: 'legacy-workflow-id' },
    });
    expect(prisma.workflow.delete).toHaveBeenCalledWith({ where: { id: 'legacy-workflow-id' } });
  });

  it('refreshes current active and failed workflow contexts', /** Verifies refreshes current active and failed workflow contexts. */ async () => {
    const repository = createRepository('repository');
    const refreshedApproval = { ...createWorkflowRun(), providerRunId: 'current-approval' };
    const refreshedFailure = { ...createWorkflowRun(), providerRunId: 'current-failure', status: 'SUCCESS' as const };
    const prisma = {
      providerAccount: { update: jest.fn().mockResolvedValue(undefined) },
      repository: {
        findMany: jest.fn().mockResolvedValue([repository]),
        update: jest.fn().mockResolvedValue(undefined),
      },
      workflow: {
        delete: jest.fn().mockResolvedValue(undefined),
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue({ id: 'workflow-id' }),
      },
      workflowRun: {
        findMany: jest.fn().mockResolvedValue([
          { awaitingApproval: false, providerRunId: 'new-success', status: 'SUCCESS' },
          { awaitingApproval: true, providerRunId: 'current-approval', status: 'QUEUED' },
          { awaitingApproval: false, providerRunId: 'current-failure', status: 'FAILED' },
        ]),
        findUnique: jest.fn().mockResolvedValue(null),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        upsert: jest.fn(
          /** Provides isolated upsert behavior for this test fixture. */ ({ create }) =>
            Promise.resolve({ id: 'run-id', ...create }),
        ),
      },
    };
    const adapter = {
      getWorkflowRun: jest.fn(
        /** Provides isolated getWorkflowRun behavior for this test fixture. */ (_, __, providerRunId: string) =>
          Promise.resolve(providerRunId === 'current-failure' ? refreshedFailure : refreshedApproval),
      ),
      listWorkflowRuns: jest.fn().mockResolvedValue([]),
    };
    const service = new ProviderSyncService(
      prisma as unknown as PrismaService,
      { get: jest.fn().mockReturnValue(adapter) } as unknown as ProviderAdapterRegistry,
      {
        decrypt: jest.fn().mockReturnValue('access-token'),
        accessToken: jest.fn().mockResolvedValue('access-token'),
      } as unknown as ProviderCredentialService,
      {
        refresh: jest.fn(
          /** Provides isolated refresh behavior for this test fixture. */ (value) => Promise.resolve(value),
        ),
      } as never,
      { shouldTrack: jest.fn().mockReturnValue(true) } as unknown as WorkflowFilterService,
      { evaluateWorkflowRun: jest.fn().mockResolvedValue(undefined) } as unknown as NotificationsService,
      {
        beginProviderSync: jest.fn().mockReturnValue('sync-id'),
        finishProviderSync: jest.fn(),
        refreshRunningWorkflowCount: jest.fn(),
        updateProviderSync: jest.fn(),
      } as unknown as SystemStatusService,
    );

    await service.syncEnabledRepositories();

    expect(prisma.workflowRun.findMany).toHaveBeenCalledWith({
      distinct: ['workflowId', 'scopeKey'],
      orderBy: [{ providerCreatedAt: 'desc' }, { id: 'desc' }],
      select: { awaitingApproval: true, id: true, providerRunId: true, pullRequestId: true, status: true },
      where: { repositoryId: repository.id },
    });
    expect(prisma.workflowRun.findMany).toHaveBeenCalledWith({
      select: { awaitingApproval: true, id: true, providerRunId: true, pullRequestId: true, status: true },
      where: { repositoryId: repository.id, status: { in: ['QUEUED', 'RUNNING'] } },
    });
    expect(adapter.getWorkflowRun).toHaveBeenCalledTimes(2);
    expect(adapter.getWorkflowRun).toHaveBeenCalledWith(expect.anything(), repository, 'current-approval');
    expect(adapter.getWorkflowRun).toHaveBeenCalledWith(expect.anything(), repository, 'current-failure');
    expect(prisma.workflowRun.upsert).toHaveBeenCalledTimes(2);
    expect(prisma.workflowRun.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ providerRunId: 'current-failure', status: 'SUCCESS' }),
      }),
    );
  });

  it('refreshes every active run while reusing runs returned by the incremental listing', /** Verifies refreshes every active run while reusing runs returned by the incremental listing. */ async () => {
    const repository = createRepository('repository');
    const listedRun = { ...createWorkflowRun(), providerRunId: 'active-new', status: 'SUCCESS' as const };
    const refreshedRun = { ...createWorkflowRun(), providerRunId: 'active-old', status: 'CANCELLED' as const };
    const activeRuns = [
      {
        awaitingApproval: false,
        id: 'active-new-id',
        providerRunId: 'active-new',
        pullRequestId: null,
        status: 'RUNNING',
      },
      {
        awaitingApproval: false,
        id: 'active-old-id',
        providerRunId: 'active-old',
        pullRequestId: null,
        status: 'QUEUED',
      },
    ];
    const prisma = {
      providerAccount: { update: jest.fn().mockResolvedValue(undefined) },
      repository: {
        findMany: jest.fn().mockResolvedValue([repository]),
        update: jest.fn().mockResolvedValue(undefined),
      },
      workflow: {
        delete: jest.fn().mockResolvedValue(undefined),
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue({ id: 'workflow-id' }),
      },
      workflowRun: {
        findMany: jest
          .fn()
          .mockResolvedValueOnce([activeRuns[0]])
          .mockResolvedValueOnce(activeRuns)
          .mockResolvedValueOnce([]),
        findUnique: jest.fn().mockResolvedValue(null),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        upsert: jest.fn(
          /** Provides isolated upsert behavior for this test fixture. */ ({ create }) =>
            Promise.resolve({ id: 'run-id', ...create }),
        ),
      },
    };
    const adapter = {
      getWorkflowRun: jest.fn().mockResolvedValue(refreshedRun),
      listWorkflowRuns: jest.fn().mockResolvedValue([listedRun]),
    };
    const service = new ProviderSyncService(
      prisma as unknown as PrismaService,
      { get: jest.fn().mockReturnValue(adapter) } as unknown as ProviderAdapterRegistry,
      {
        decrypt: jest.fn().mockReturnValue('access-token'),
        accessToken: jest.fn().mockResolvedValue('access-token'),
      } as unknown as ProviderCredentialService,
      {
        refresh: jest.fn(
          /** Provides isolated refresh behavior for this test fixture. */ (value) => Promise.resolve(value),
        ),
      } as never,
      { shouldTrack: jest.fn().mockReturnValue(false) } as unknown as WorkflowFilterService,
      { evaluateWorkflowRun: jest.fn().mockResolvedValue(undefined) } as unknown as NotificationsService,
      {
        beginProviderSync: jest.fn().mockReturnValue('sync-id'),
        finishProviderSync: jest.fn(),
        refreshRunningWorkflowCount: jest.fn(),
        updateProviderSync: jest.fn(),
      } as unknown as SystemStatusService,
    );

    await service.syncEnabledRepositories();

    expect(adapter.getWorkflowRun).toHaveBeenCalledTimes(1);
    expect(adapter.getWorkflowRun).toHaveBeenCalledWith(expect.anything(), repository, 'active-old');
    expect(prisma.workflowRun.upsert).toHaveBeenCalledTimes(2);
    expect(prisma.workflowRun.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: expect.objectContaining({ providerRunId: 'active-new', status: 'SUCCESS' }) }),
    );
    expect(prisma.workflowRun.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ providerRunId: 'active-old', status: 'CANCELLED' }),
      }),
    );
  });

  it('marks missing active runs unknown and refreshes linked pull requests', /** Verifies marks missing active runs unknown and refreshes linked pull requests. */ async () => {
    const repository = createRepository('repository');
    const activeRun = {
      awaitingApproval: true,
      id: 'active-run-id',
      providerRunId: 'missing-active',
      pullRequestId: 'pull-request-id',
      status: 'RUNNING',
    };
    const prisma = {
      providerAccount: { update: jest.fn().mockResolvedValue(undefined) },
      repository: {
        findMany: jest.fn().mockResolvedValue([repository]),
        update: jest.fn().mockResolvedValue(undefined),
      },
      workflowRun: {
        findMany: jest
          .fn()
          .mockResolvedValueOnce([activeRun])
          .mockResolvedValueOnce([activeRun])
          .mockResolvedValueOnce([]),
        update: jest.fn().mockResolvedValue({ ...activeRun, awaitingApproval: false, status: 'UNKNOWN' }),
      },
    };
    const adapter = {
      getWorkflowRun: jest.fn().mockResolvedValue(null),
      listWorkflowRuns: jest.fn().mockResolvedValue([]),
    };
    const workItems = {
      reconcileWorkflowRunChangeRequests: jest.fn().mockResolvedValue(undefined),
      refreshPullRequestWorkflowStatus: jest.fn().mockResolvedValue(undefined),
      synchronize: jest.fn().mockResolvedValue(undefined),
    };
    const service = new ProviderSyncService(
      prisma as unknown as PrismaService,
      { get: jest.fn().mockReturnValue(adapter) } as unknown as ProviderAdapterRegistry,
      {
        decrypt: jest.fn().mockReturnValue('access-token'),
        accessToken: jest.fn().mockResolvedValue('access-token'),
      } as unknown as ProviderCredentialService,
      {
        refresh: jest.fn(
          /** Provides isolated refresh behavior for this test fixture. */ (value) => Promise.resolve(value),
        ),
      } as never,
      { shouldTrack: jest.fn() } as unknown as WorkflowFilterService,
      { evaluateWorkflowRun: jest.fn() } as unknown as NotificationsService,
      {
        beginProviderSync: jest.fn().mockReturnValue('sync-id'),
        finishProviderSync: jest.fn(),
        refreshRunningWorkflowCount: jest.fn(),
        updateProviderSync: jest.fn(),
      } as unknown as SystemStatusService,
      workItems as never,
    );

    await service.syncEnabledRepositories();

    expect(prisma.workflowRun.update).toHaveBeenCalledWith({
      data: { awaitingApproval: false, status: 'UNKNOWN' },
      where: { id: activeRun.id },
    });
    expect(workItems.refreshPullRequestWorkflowStatus).toHaveBeenCalledWith(activeRun.pullRequestId);
  });

  it('refreshes current failed pull-request runs missing their change-request context', /** Verifies refreshes current failed pull-request runs missing their change-request context. */ async () => {
    const repository = createRepository('repository');
    const refreshedFailure = {
      ...createWorkflowRun(),
      changeRequestNumber: '14',
      event: 'pull_request',
      providerRunId: 'missing-change-request',
      scopeKey: 'change-request:14',
      status: 'FAILED' as const,
    };
    const prisma = {
      providerAccount: { update: jest.fn().mockResolvedValue(undefined) },
      repository: {
        findMany: jest.fn().mockResolvedValue([repository]),
        update: jest.fn().mockResolvedValue(undefined),
      },
      workflow: {
        delete: jest.fn().mockResolvedValue(undefined),
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue({ id: 'workflow-id' }),
      },
      workflowRun: {
        findMany: jest
          .fn()
          .mockResolvedValueOnce([
            {
              awaitingApproval: false,
              providerRunId: 'missing-change-request',
              status: 'FAILED',
            },
          ])
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([]),
        findUnique: jest.fn().mockResolvedValue(null),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        upsert: jest.fn(
          /** Provides isolated upsert behavior for this test fixture. */ ({ create }) =>
            Promise.resolve({ id: 'run-id', ...create }),
        ),
      },
    };
    const adapter = {
      getWorkflowRun: jest.fn().mockResolvedValue(refreshedFailure),
      listWorkflowRuns: jest.fn().mockResolvedValue([]),
    };
    const service = new ProviderSyncService(
      prisma as unknown as PrismaService,
      { get: jest.fn().mockReturnValue(adapter) } as unknown as ProviderAdapterRegistry,
      {
        decrypt: jest.fn().mockReturnValue('access-token'),
        accessToken: jest.fn().mockResolvedValue('access-token'),
      } as unknown as ProviderCredentialService,
      {
        refresh: jest.fn(
          /** Provides isolated refresh behavior for this test fixture. */ (value) => Promise.resolve(value),
        ),
      } as never,
      { shouldTrack: jest.fn().mockReturnValue(true) } as unknown as WorkflowFilterService,
      { evaluateWorkflowRun: jest.fn().mockResolvedValue(undefined) } as unknown as NotificationsService,
      {
        beginProviderSync: jest.fn().mockReturnValue('sync-id'),
        finishProviderSync: jest.fn(),
        refreshRunningWorkflowCount: jest.fn(),
        updateProviderSync: jest.fn(),
      } as unknown as SystemStatusService,
    );

    await service.syncEnabledRepositories();

    expect(adapter.getWorkflowRun).toHaveBeenCalledWith(expect.anything(), repository, 'missing-change-request');
    expect(prisma.workflowRun.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ changeRequestNumber: '14', scopeKey: 'change-request:14' }),
      }),
    );
  });

  it('deduplicates and persists change-request lifecycle refreshes for current failures', /** Verifies deduplicates and persists change-request lifecycle refreshes for current failures. */ async () => {
    const repository = createRepository('repository');
    const prisma = {
      providerAccount: { update: jest.fn().mockResolvedValue(undefined) },
      repository: {
        findMany: jest.fn().mockResolvedValue([repository]),
        update: jest.fn().mockResolvedValue(undefined),
      },
      workflowRun: {
        findMany: jest
          .fn()
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([
            {
              changeRequestCheckedAt: null,
              changeRequestNumber: '42',
              changeRequestState: 'UNKNOWN',
              status: 'FAILED',
            },
            {
              changeRequestCheckedAt: null,
              changeRequestNumber: '42',
              changeRequestState: 'UNKNOWN',
              status: 'FAILED',
            },
          ]),
        updateMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
    };
    const adapter = {
      getChangeRequestState: jest.fn().mockResolvedValue({
        mergedAt: null,
        state: 'CLOSED',
        targetBranch: 'main',
      }),
      getWorkflowRun: jest.fn(),
      listWorkflowRuns: jest.fn().mockResolvedValue([]),
    };
    const service = new ProviderSyncService(
      prisma as unknown as PrismaService,
      { get: jest.fn().mockReturnValue(adapter) } as unknown as ProviderAdapterRegistry,
      {
        decrypt: jest.fn().mockReturnValue('access-token'),
        accessToken: jest.fn().mockResolvedValue('access-token'),
      } as unknown as ProviderCredentialService,
      {
        refresh: jest.fn(
          /** Provides isolated refresh behavior for this test fixture. */ (value) => Promise.resolve(value),
        ),
      } as never,
      { shouldTrack: jest.fn() } as unknown as WorkflowFilterService,
      { evaluateWorkflowRun: jest.fn() } as unknown as NotificationsService,
      {
        beginProviderSync: jest.fn().mockReturnValue('sync-id'),
        finishProviderSync: jest.fn(),
        refreshRunningWorkflowCount: jest.fn(),
        updateProviderSync: jest.fn(),
      } as unknown as SystemStatusService,
    );

    await service.syncEnabledRepositories();

    expect(adapter.getChangeRequestState).toHaveBeenCalledTimes(1);
    expect(adapter.getChangeRequestState).toHaveBeenCalledWith(expect.anything(), repository, '42');
    expect(prisma.workflowRun.updateMany).toHaveBeenCalledWith({
      data: {
        changeRequestCheckedAt: expect.any(Date),
        changeRequestMergedAt: null,
        changeRequestState: 'CLOSED',
        changeRequestTargetBranch: 'main',
      },
      where: { changeRequestNumber: '42', repositoryId: repository.id },
    });
  });

  it('reports a failed change-request lifecycle lookup to the durable queue', /** Verifies reports a failed change-request lifecycle lookup to the durable queue. */ async () => {
    const repository = createRepository('repository');
    const prisma = {
      providerAccount: { update: jest.fn().mockResolvedValue(undefined) },
      repository: {
        findMany: jest.fn().mockResolvedValue([repository]),
        update: jest.fn().mockResolvedValue(undefined),
      },
      workflowRun: {
        findMany: jest
          .fn()
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([
            {
              changeRequestCheckedAt: null,
              changeRequestNumber: '42',
              changeRequestState: 'UNKNOWN',
              status: 'FAILED',
            },
          ]),
        updateMany: jest.fn(),
      },
    };
    const adapter = {
      getChangeRequestState: jest.fn().mockRejectedValue(new Error('provider unavailable')),
      getWorkflowRun: jest.fn(),
      listWorkflowRuns: jest.fn().mockResolvedValue([]),
    };
    const service = new ProviderSyncService(
      prisma as unknown as PrismaService,
      { get: jest.fn().mockReturnValue(adapter) } as unknown as ProviderAdapterRegistry,
      {
        decrypt: jest.fn().mockReturnValue('access-token'),
        accessToken: jest.fn().mockResolvedValue('access-token'),
      } as unknown as ProviderCredentialService,
      {
        refresh: jest.fn(
          /** Provides isolated refresh behavior for this test fixture. */ (value) => Promise.resolve(value),
        ),
      } as never,
      { shouldTrack: jest.fn() } as unknown as WorkflowFilterService,
      { evaluateWorkflowRun: jest.fn() } as unknown as NotificationsService,
      {
        beginProviderSync: jest.fn().mockReturnValue('sync-id'),
        finishProviderSync: jest.fn(),
        refreshRunningWorkflowCount: jest.fn(),
        updateProviderSync: jest.fn(),
      } as unknown as SystemStatusService,
    );

    await expect(service.syncEnabledRepositories()).rejects.toThrow('provider unavailable');

    expect(adapter.getChangeRequestState).toHaveBeenCalledTimes(1);
    expect(prisma.workflowRun.updateMany).not.toHaveBeenCalled();
    expect(prisma.repository.update).not.toHaveBeenCalled();
    expect(prisma.providerAccount.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          lastSyncError: 'Synchronization failed. Check provider connectivity and credentials.',
        }),
      }),
    );
  });

  it('uses refreshed repository metadata for workflow requests', /** Verifies uses refreshed repository metadata for workflow requests. */ async () => {
    const repository = createRepository('repository');
    const adapter = { getWorkflowRun: jest.fn(), listWorkflowRuns: jest.fn().mockResolvedValue([]) };
    const metadata = {
      refresh: jest.fn().mockResolvedValue({
        ...repository,
        name: 'renamed',
        owner: 'new-owner',
        url: 'https://github.com/new-owner/renamed',
      }),
    };
    const prisma = {
      providerAccount: { update: jest.fn().mockResolvedValue(undefined) },
      repository: {
        findMany: jest.fn().mockResolvedValue([repository]),
        update: jest.fn().mockResolvedValue(undefined),
      },
      workflowRun: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const service = new ProviderSyncService(
      prisma as unknown as PrismaService,
      { get: jest.fn().mockReturnValue(adapter) } as unknown as ProviderAdapterRegistry,
      {
        decrypt: jest.fn().mockReturnValue('access-token'),
        accessToken: jest.fn().mockResolvedValue('access-token'),
      } as unknown as ProviderCredentialService,
      metadata as never,
      { shouldTrack: jest.fn() } as unknown as WorkflowFilterService,
      { evaluateWorkflowRun: jest.fn() } as unknown as NotificationsService,
      {
        beginProviderSync: jest.fn().mockReturnValue('sync-id'),
        finishProviderSync: jest.fn(),
        refreshRunningWorkflowCount: jest.fn(),
        updateProviderSync: jest.fn(),
      } as unknown as SystemStatusService,
    );

    await service.syncEnabledRepositories();

    expect(metadata.refresh).toHaveBeenCalledWith(repository);
    expect(adapter.listWorkflowRuns).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ name: 'renamed', owner: 'new-owner' }),
      undefined,
    );
  });

  it('records the synchronization start as the next incremental cursor', /** Verifies records the synchronization start as the next incremental cursor. */ async () => {
    jest.useFakeTimers();
    const synchronizationStartedAt = new Date('2026-09-13T10:00:00.000Z');
    const synchronizationFinishedAt = new Date('2026-09-13T10:05:00.000Z');
    jest.setSystemTime(synchronizationStartedAt);
    const repository = createRepository('repository');
    const prisma = {
      providerAccount: { update: jest.fn().mockResolvedValue(undefined) },
      repository: {
        findMany: jest.fn().mockResolvedValue([repository]),
        update: jest.fn().mockResolvedValue(undefined),
      },
      workflowRun: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const adapter = {
      getWorkflowRun: jest.fn(),
      listWorkflowRuns: jest.fn().mockImplementation(
        /** Provides isolated listWorkflowRuns behavior for this test fixture. */ async () => {
          jest.setSystemTime(synchronizationFinishedAt);
          return [];
        },
      ),
    };
    const service = new ProviderSyncService(
      prisma as unknown as PrismaService,
      { get: jest.fn().mockReturnValue(adapter) } as unknown as ProviderAdapterRegistry,
      {
        decrypt: jest.fn().mockReturnValue('access-token'),
        accessToken: jest.fn().mockResolvedValue('access-token'),
      } as unknown as ProviderCredentialService,
      {
        refresh: jest.fn(
          /** Provides isolated refresh behavior for this test fixture. */ (value) => Promise.resolve(value),
        ),
      } as never,
      { shouldTrack: jest.fn() } as unknown as WorkflowFilterService,
      { evaluateWorkflowRun: jest.fn() } as unknown as NotificationsService,
      {
        beginProviderSync: jest.fn().mockReturnValue('sync-id'),
        finishProviderSync: jest.fn(),
        refreshRunningWorkflowCount: jest.fn(),
        updateProviderSync: jest.fn(),
      } as unknown as SystemStatusService,
    );

    try {
      await service.syncEnabledRepositories();
    } finally {
      jest.useRealTimers();
    }

    expect(prisma.repository.update).toHaveBeenCalledWith({
      data: { lastSyncAt: synchronizationStartedAt },
      where: { id: repository.id },
    });
    expect(prisma.providerAccount.update).toHaveBeenCalledWith({
      data: { lastSyncAt: synchronizationStartedAt, lastSyncError: null },
      where: { id: repository.providerAccount.id },
    });
  });

  it('reconciles legacy workflow-run contexts during the existing repository sync', /** Verifies reconciles legacy workflow-run contexts during the existing repository sync. */ async () => {
    const repository = createRepository('repository');
    const prisma = {
      providerAccount: { update: jest.fn().mockResolvedValue(undefined) },
      repository: {
        findMany: jest.fn().mockResolvedValue([repository]),
        update: jest.fn().mockResolvedValue(undefined),
      },
      workflowRun: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const adapter = {
      getWorkflowRun: jest.fn(),
      listWorkflowRuns: jest.fn().mockResolvedValue([]),
    };
    const workItems = {
      reconcileWorkflowRunChangeRequests: jest.fn().mockResolvedValue(undefined),
      synchronize: jest.fn().mockResolvedValue(undefined),
    };
    const service = new ProviderSyncService(
      prisma as unknown as PrismaService,
      { get: jest.fn().mockReturnValue(adapter) } as unknown as ProviderAdapterRegistry,
      {
        decrypt: jest.fn().mockReturnValue('access-token'),
        accessToken: jest.fn().mockResolvedValue('access-token'),
      } as unknown as ProviderCredentialService,
      {
        refresh: jest.fn(
          /** Provides isolated refresh behavior for this test fixture. */ (value) => Promise.resolve(value),
        ),
      } as never,
      { shouldTrack: jest.fn() } as unknown as WorkflowFilterService,
      { evaluateWorkflowRun: jest.fn() } as unknown as NotificationsService,
      {
        beginProviderSync: jest.fn().mockReturnValue('sync-id'),
        finishProviderSync: jest.fn(),
        refreshRunningWorkflowCount: jest.fn(),
        updateProviderSync: jest.fn(),
      } as unknown as SystemStatusService,
      workItems as never,
    );

    await service.syncEnabledRepositories();

    expect(workItems.synchronize).toHaveBeenCalled();
    expect(workItems.reconcileWorkflowRunChangeRequests).toHaveBeenCalledWith(repository.id);
  });

  it('does not advance the workflow cursor for a work-item-only synchronization', /** Verifies does not advance the workflow cursor for a work-item-only synchronization. */ async () => {
    const repository = createRepository('repository');
    const prisma = {
      providerAccount: { update: jest.fn().mockResolvedValue(undefined) },
      repository: {
        findFirst: jest.fn().mockResolvedValue(repository),
        update: jest.fn().mockResolvedValue(undefined),
      },
    };
    const workItems = { synchronize: jest.fn().mockResolvedValue(undefined) };
    const service = new ProviderSyncService(
      prisma as unknown as PrismaService,
      { get: jest.fn().mockReturnValue({}) } as unknown as ProviderAdapterRegistry,
      {
        decrypt: jest.fn().mockReturnValue('access-token'),
        accessToken: jest.fn().mockResolvedValue('access-token'),
      } as unknown as ProviderCredentialService,
      {
        refresh: jest.fn(
          /** Provides isolated refresh behavior for this test fixture. */ (value) => Promise.resolve(value),
        ),
      } as never,
      { shouldTrack: jest.fn() } as unknown as WorkflowFilterService,
      { evaluateWorkflowRun: jest.fn() } as unknown as NotificationsService,
      {
        beginProviderSync: jest.fn().mockReturnValue('sync-id'),
        finishProviderSync: jest.fn(),
        refreshRunningWorkflowCount: jest.fn(),
        updateProviderSync: jest.fn(),
      } as unknown as SystemStatusService,
      workItems as never,
    );

    await expect(service.syncRepositoryById(repository.id, ['ISSUES'])).resolves.toBe(true);

    expect(workItems.synchronize).toHaveBeenCalledWith(
      expect.anything(),
      repository,
      expect.anything(),
      ['ISSUES'],
      undefined,
    );
    expect(prisma.repository.update).not.toHaveBeenCalled();
    expect(prisma.providerAccount.update).toHaveBeenCalledWith({
      data: { lastSyncAt: expect.any(Date), lastSyncError: null },
      where: { id: repository.providerAccount.id },
    });
  });
});

describe('ProviderSyncService workflow lifecycle reconciliation', /** Groups lifecycle ordering and preservation regressions. */ () => {
  it('checks persisted inactive and newly discovered identities once before evaluating events', /** Verifies identity reconciliation precedes notifications. */ async () => {
    const fixture = createLifecycleSyncFixture('ACTIVE');
    fixture.adapter.listWorkflowRuns.mockResolvedValue([
      createWorkflowRun(),
      { ...createWorkflowRun(), providerRunId: 'new-run', providerWorkflowId: '19' },
    ]);
    fixture.adapter.listWorkflowLifecycles.mockResolvedValueOnce([
      { providerWorkflowId: '17', state: 'ACTIVE', rawState: 'active' },
    ]);

    await fixture.service.syncEnabledRepositories();

    expect(fixture.adapter.listWorkflowLifecycles).toHaveBeenCalledTimes(2);
    expect(fixture.adapter.listWorkflowLifecycles).toHaveBeenNthCalledWith(1, expect.anything(), fixture.repository, [
      { providerWorkflowId: '17' },
      { providerWorkflowId: '18' },
    ]);
    expect(fixture.adapter.listWorkflowLifecycles).toHaveBeenNthCalledWith(2, expect.anything(), fixture.repository, [
      { providerWorkflowId: '19' },
    ]);
    expect(fixture.events).toEqual(['lifecycle', 'notification', 'notification']);
  });

  it.each(['REMOVED', 'DISABLED'] as const)(
    'suppresses notifications and preserves run results for %s workflows across repeated synchronization',
    /** Verifies lifecycle reconciliation never synthesizes run recovery or reactivation. */ async (lifecycleState) => {
      const fixture = createLifecycleSyncFixture('ACTIVE');
      fixture.adapter.listWorkflowLifecycles.mockResolvedValue([
        { providerWorkflowId: '17', state: lifecycleState, rawState: lifecycleState.toLowerCase() },
      ]);

      await fixture.service.syncEnabledRepositories();
      await fixture.service.syncEnabledRepositories();

      expect(fixture.state.lifecycleState).toBe(lifecycleState);
      expect(fixture.notifications.evaluateWorkflowRun).not.toHaveBeenCalled();
      expect(fixture.prisma.workflowRun.upsert).toHaveBeenCalledTimes(2);
      expect(fixture.prisma.workflowRun.upsert).toHaveBeenLastCalledWith(
        expect.objectContaining({ update: expect.objectContaining({ status: 'SUCCESS' }) }),
      );
      for (const [input] of fixture.prisma.workflow.upsert.mock.calls)
        expect(input.update).not.toHaveProperty('lifecycleState');
      expect(fixture.prisma.workflow.updateMany).toHaveBeenCalledWith({
        data: {
          lifecycleCheckedAt: expect.any(Date),
          lifecycleRawState: lifecycleState.toLowerCase(),
          lifecycleState,
        },
        where: { repositoryId: fixture.repository.id, providerWorkflowId: '17' },
      });
    },
  );

  it('keeps prior removal when historical run payloads have no new lifecycle observation', /** Verifies refreshed historical runs cannot reactivate a removed workflow. */ async () => {
    const fixture = createLifecycleSyncFixture('REMOVED');
    const checkedAt = fixture.state.lifecycleCheckedAt;

    await fixture.service.syncEnabledRepositories();

    expect(fixture.state).toMatchObject({ lifecycleCheckedAt: checkedAt, lifecycleState: 'REMOVED' });
    expect(fixture.prisma.workflow.updateMany).not.toHaveBeenCalled();
    expect(fixture.notifications.evaluateWorkflowRun).not.toHaveBeenCalled();
    expect(fixture.prisma.workflow.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: expect.not.objectContaining({ lifecycleState: expect.anything() }) }),
    );
  });

  it('initializes newly discovered removed workflows before evaluating their runs', /** Verifies new workflow creation uses the authoritative lifecycle observation. */ async () => {
    const fixture = createLifecycleSyncFixture('UNKNOWN');
    fixture.prisma.workflow.findMany.mockResolvedValue([]);
    fixture.adapter.listWorkflowLifecycles
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ providerWorkflowId: '17', state: 'REMOVED', rawState: 'deleted' }]);

    await fixture.service.syncEnabledRepositories();

    expect(fixture.prisma.workflow.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          lifecycleCheckedAt: expect.any(Date),
          lifecycleRawState: 'deleted',
          lifecycleState: 'REMOVED',
        }),
      }),
    );
    expect(fixture.notifications.evaluateWorkflowRun).not.toHaveBeenCalled();
  });

  it('persists explicitly disabled repository workflows without requesting unavailable runs', /** Verifies repository CI disabling does not fail before lifecycle reconciliation. */ async () => {
    const fixture = createLifecycleSyncFixture('ACTIVE');
    fixture.adapter.listWorkflowLifecycles.mockResolvedValueOnce([
      { providerWorkflowId: '17', state: 'DISABLED', rawState: 'repository:ci:disabled' },
    ]);
    fixture.adapter.listWorkflowRuns.mockRejectedValue(new Error('Actions API unavailable'));

    await fixture.service.syncEnabledRepositories();

    expect(fixture.state).toMatchObject({ lifecycleState: 'DISABLED', lifecycleRawState: 'repository:ci:disabled' });
    expect(fixture.adapter.listWorkflowRuns).not.toHaveBeenCalled();
    expect(fixture.prisma.workflowRun.upsert).not.toHaveBeenCalled();
    expect(fixture.prisma.repository.update).toHaveBeenCalled();
  });

  it('preserves lifecycle state, timestamp, and workflow cursor when provider lifecycle reads fail', /** Verifies failed reconciliation cannot commit partial lifecycle observations. */ async () => {
    const fixture = createLifecycleSyncFixture('REMOVED');
    const checkedAt = fixture.state.lifecycleCheckedAt;
    const error = new Error('Provider request failed');
    fixture.adapter.listWorkflowLifecycles.mockRejectedValue(error);

    await expect(fixture.service.syncEnabledRepositories()).rejects.toBe(error);

    expect(fixture.state).toMatchObject({ lifecycleCheckedAt: checkedAt, lifecycleState: 'REMOVED' });
    expect(fixture.prisma.workflow.updateMany).not.toHaveBeenCalled();
    expect(fixture.prisma.workflow.upsert).not.toHaveBeenCalled();
    expect(fixture.prisma.repository.update).not.toHaveBeenCalled();
    expect(fixture.notifications.evaluateWorkflowRun).not.toHaveBeenCalled();
    expect(fixture.prisma.providerAccount.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ lastSyncError: expect.any(String) }) }),
    );
  });
});

/**
 * Build an isolated repository sync fixture with observable lifecycle persistence and notification ordering.
 * @param lifecycleState - Previously confirmed state of the existing workflow.
 * @returns The real sync service and focused provider/database doubles.
 */
function createLifecycleSyncFixture(lifecycleState: ProviderWorkflowLifecycle['state']) {
  const repository = { ...createRepository('lifecycle-repository'), lastSyncAt: new Date('2026-08-26T08:00:00Z') };
  const events: string[] = [];
  const state = { lifecycleState, lifecycleCheckedAt: new Date('2026-08-26T07:00:00Z'), lifecycleRawState: 'previous' };
  const adapter = {
    listWorkflowRuns: jest.fn().mockResolvedValue([createWorkflowRun()]),
    listWorkflowLifecycles: jest.fn().mockResolvedValue([]),
  };
  const prisma = {
    $transaction: jest.fn(
      /** Resolves the lifecycle update transaction before run processing. */ (updates: Promise<unknown>[]) =>
        Promise.all(updates),
    ),
    repository: {
      findMany: jest.fn().mockResolvedValue([repository]),
      update: jest.fn().mockResolvedValue(undefined),
    },
    providerAccount: { update: jest.fn().mockResolvedValue(undefined) },
    workflow: {
      findMany: jest.fn().mockResolvedValue([{ providerWorkflowId: '17' }, { providerWorkflowId: '18' }]),
      findUnique: jest.fn().mockResolvedValue(null),
      updateMany: jest.fn(
        /** Records lifecycle persistence before notification evaluation. */
        async ({ data }: { data: typeof state }) => {
          Object.assign(state, data);
          events.push('lifecycle');
          return { count: 1 };
        },
      ),
      upsert: jest.fn(
        /** Returns the persisted workflow without treating a run payload as reactivation. */
        async ({
          create,
          update,
        }: {
          create: { lifecycleState?: ProviderWorkflowLifecycle['state'] };
          update: object;
        }) => ({
          id: 'workflow-id',
          ...state,
          ...(create.lifecycleState ? { lifecycleState: create.lifecycleState } : {}),
          ...update,
        }),
      ),
    },
    workflowRun: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue({ status: 'FAILED' }),
      upsert: jest.fn(
        /** Returns the persisted run for event evaluation. */ async ({ create }) => ({ id: 'run-id', ...create }),
      ),
    },
  };
  const notifications = {
    evaluateWorkflowRun: jest.fn(
      /** Records notification evaluation after lifecycle persistence. */ async () => {
        events.push('notification');
      },
    ),
  };
  const service = new ProviderSyncService(
    prisma as unknown as PrismaService,
    { get: jest.fn().mockReturnValue(adapter) } as unknown as ProviderAdapterRegistry,
    { accessToken: jest.fn().mockResolvedValue('access-token') } as unknown as ProviderCredentialService,
    { refresh: jest.fn().mockResolvedValue(repository) } as never,
    { shouldTrack: jest.fn().mockReturnValue(true) } as unknown as WorkflowFilterService,
    notifications as unknown as NotificationsService,
    {
      beginProviderSync: jest.fn().mockReturnValue('sync-id'),
      finishProviderSync: jest.fn(),
      refreshRunningWorkflowCount: jest.fn(),
      updateProviderSync: jest.fn(),
    } as unknown as SystemStatusService,
  );
  return { adapter, events, notifications, prisma, repository, service, state };
}

/** Creates repository. */
function createRepository(id: string) {
  return {
    id,
    lastSyncAt: null,
    name: 'repovio',
    owner: 'repovio',
    providerRepositoryId: 'repository-id',
    providerAccount: {
      baseUrl: null,
      encryptedAccessToken: 'encrypted-access-token',
      id: 'provider-account',
      providerType: 'GITHUB',
    },
    workflowFilters: [],
  };
}

/** Creates workflow run. */
function createWorkflowRun() {
  return {
    awaitingApproval: false,
    changeRequestNumber: null,
    completedAt: new Date('2026-08-26T09:10:00.000Z'),
    displayTitle: 'Test on main',
    durationMs: 2_592_164_000,
    event: 'push',
    headBranch: 'main',
    headSha: '0123456789abcdef',
    providerCreatedAt: new Date('2026-08-26T09:09:00.000Z'),
    providerRunId: '12345',
    providerWorkflowId: '17',
    rawStatus: 'success',
    reviewUrl: null,
    scopeKey: 'branch:main',
    startedAt: new Date('2026-08-26T09:09:00.000Z'),
    status: 'SUCCESS',
    url: 'https://github.com/repovio/repovio/actions/runs/12345',
    workflowKind: 'STANDARD',
    workflowName: 'Test',
    workflowPath: '.github/workflows/test.yml',
  };
}
