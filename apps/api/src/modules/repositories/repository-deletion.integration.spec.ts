import { type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';

import { PoliciesGuard } from '../../casl/policies.guard.js';
import type { Prisma } from '../../generated/prisma/client.js';
import type { JobRunnerService } from '../../jobs/job-runner.service.js';
import { configureApiRoutes, createApiDocument } from '../../openapi/document.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { TestDatabaseService } from '../../prisma/test-database.service.js';
import type { CredentialEncryptionService } from '../../security/credential-encryption.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import type { AuthenticatedUser } from '../auth/types.js';
import { ProviderSyncQueueService } from '../providers/sync-queue.service.js';
import type { ProviderSyncService } from '../providers/sync.service.js';
import { RepositoriesController } from './repositories.controller.js';
import { RepositoryConfigurationService } from './repository-configuration.service.js';
import type { WorkflowFilterService } from './workflow-filter.service.js';

const admin: AuthenticatedUser = { authProvider: 'LOCAL', id: randomUUID(), role: 'SYSTEM_ADMIN', username: 'admin' };

/** Create a controllable signal without time-based waits. */
function signal() {
  let resolve!: () => void;
  const promise = new Promise<void>(
    /** Retain the resolver for deterministic concurrency tests. */ (done) => {
      resolve = done;
    },
  );
  return { promise, resolve };
}

/** Exercise the real HTTP deletion contract and PostgreSQL cascades with synthetic authentication. */
describe('repository deletion integration', /** Verify local deletion and its concurrency boundaries. */ () => {
  const prisma = new PrismaService();
  const service = new RepositoryConfigurationService(
    prisma,
    {} as CredentialEncryptionService,
    {} as WorkflowFilterService,
  );
  let http: NestFastifyApplication;
  let repositoryId: string;
  let otherId: string;
  let accountId: string;

  /** Send a deletion request through real routing with an optional synthetic identity. */
  function remove(id = repositoryId, role: string | undefined = 'SYSTEM_ADMIN') {
    return http.inject({
      method: 'DELETE',
      url: `/api/v1/repositories/${id}`,
      headers: role ? { authorization: `Bearer ${role}` } : {},
    });
  }

  /** Construct a real durable queue with a controlled synchronization implementation. */
  function queue(sync: object): ProviderSyncQueueService {
    return new ProviderSyncQueueService(
      prisma,
      {
        run: jest.fn(/** Execute the synthetic job immediately. */ (_name, callback) => callback()),
      } as unknown as JobRunnerService,
      sync as ProviderSyncService,
    );
  }

  beforeAll(
    /** Initialize PostgreSQL and real Nest routing with synthetic JWT identities. */ async () => {
      await prisma.onModuleInit();
      const module = await Test.createTestingModule({
        controllers: [RepositoriesController],
        providers: [
          { provide: PrismaService, useValue: prisma },
          { provide: RepositoryConfigurationService, useValue: service },
        ],
      })
        .useMocker(/** Supply unused constructor dependencies without mocking deletion. */ () => ({}))
        .overrideGuard(JwtAuthGuard)
        .useValue({
          /** Authenticate only the explicit synthetic identity supplied by this test. */
          canActivate(context: ExecutionContext): boolean {
            const request = context.switchToHttp().getRequest<{ headers: Record<string, string>; user: object }>();
            if (!request.headers.authorization) throw new UnauthorizedException();
            request.user = { ...admin, role: request.headers.authorization.replace('Bearer ', '') };
            return true;
          },
        })
        .overrideGuard(PoliciesGuard)
        .useValue({ /** Leave administrator enforcement to the real configuration service. */ canActivate: () => true })
        .compile();
      http = module.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
      configureApiRoutes(http);
      await http.init();
      await http.getHttpAdapter().getInstance().ready();
    },
  );

  beforeEach(
    /** Reset isolated fixtures and create two independent tracked repositories. */ async () => {
      jest.restoreAllMocks();
      await new TestDatabaseService(prisma).cleanup();
      const account = await prisma.providerAccount.create({
        data: { displayName: 'Synthetic provider', encryptedAccessToken: 'synthetic', providerType: 'GITHUB' },
      });
      accountId = account.id;
      const first = await prisma.repository.create({
        data: {
          name: 'first',
          owner: 'fixture',
          providerAccountId: accountId,
          providerRepositoryId: '1',
          url: 'https://example.test/first',
        },
      });
      const other = await prisma.repository.create({
        data: {
          name: 'other',
          owner: 'fixture',
          providerAccountId: accountId,
          providerRepositoryId: '2',
          url: 'https://example.test/other',
        },
      });
      repositoryId = first.id;
      otherId = other.id;
    },
  );

  afterAll(
    /** Close HTTP and database resources. */ async () => {
      await http?.close();
      await prisma.onModuleDestroy();
    },
  );

  it('rejects unauthenticated users and non-administrators before repository reads', /** Verify enforcement independently of UI visibility. */ async () => {
    const read = jest.spyOn(prisma.repository, 'findUnique');
    expect((await remove(repositoryId, '')).statusCode).toBe(401);
    for (const role of ['VIEWER', 'MANAGER']) expect((await remove(repositoryId, role)).statusCode).toBe(403);
    expect(read).not.toHaveBeenCalled();
    await expect(prisma.repository.count()).resolves.toBe(2);
  });

  it('returns 404 for missing or already deleted repositories and validates UUIDs', /** Verify stable transport statuses. */ async () => {
    expect((await remove(randomUUID())).statusCode).toBe(404);
    expect((await remove('invalid')).statusCode).toBe(400);
    const response = await remove();
    expect(response.statusCode).toBe(204);
    expect(response.body).toBe('');
    expect((await remove()).statusCode).toBe(404);
    const document = createApiDocument(http, '/');
    const operation = document.paths['/api/v1/repositories/{repositoryId}'].delete!;
    expect(Object.keys(operation.responses)).toEqual(expect.arrayContaining(['204', '401', '403', '404', '409']));
    expect(operation.responses['204']).not.toHaveProperty('content');
  });

  it('cascades owned data while preserving other repositories and shared resources', /** Seed every repository-owned relation and inspect real database cleanup. */ async () => {
    const now = new Date();
    const user = await prisma.user.create({ data: { username: 'fixture', passwordHash: 'synthetic' } });
    const actor = await prisma.providerActor.create({
      data: { providerAccountId: accountId, providerActorId: '1', username: 'actor' },
    });
    const group = await prisma.userGroup.create({
      data: { name: 'Shared group', repositories: { create: { repositoryId, role: 'VIEWER' } } },
    });
    const channel = await prisma.notificationChannel.create({ data: { name: 'Shared channel' } });
    const label = await prisma.workItemLabel.create({ data: { repositoryId, name: 'bug', normalizedName: 'bug' } });
    const issue = await prisma.issue.create({
      data: {
        repositoryId,
        providerIssueId: '1',
        number: '1',
        title: 'Issue',
        state: 'OPEN',
        url: 'https://example.test/issue',
        providerCreatedAt: now,
        providerUpdatedAt: now,
        authorId: actor.id,
        assignees: { create: { actorId: actor.id } },
        labels: { create: { labelId: label.id } },
      },
    });
    const pull = await prisma.pullRequest.create({
      data: {
        repositoryId,
        providerPullRequestId: '2',
        number: '2',
        title: 'Pull request',
        state: 'OPEN',
        sourceBranch: 'feature',
        targetBranch: 'main',
        url: 'https://example.test/pull',
        providerCreatedAt: now,
        providerUpdatedAt: now,
        authorId: actor.id,
        assignees: { create: { actorId: actor.id } },
        labels: { create: { labelId: label.id } },
      },
    });
    const workflow = await prisma.workflow.create({
      data: { repositoryId, providerWorkflowId: '1', name: 'Build', lastSeenAt: now },
    });
    const run = await prisma.workflowRun.create({
      data: {
        repositoryId,
        workflowId: workflow.id,
        pullRequestId: pull.id,
        providerRunId: '1',
        workflowName: 'Build',
        displayTitle: 'Build',
        url: 'https://example.test/run',
        providerCreatedAt: now,
        status: 'SUCCESS',
        scopeKey: 'main',
      },
    });
    const alert = await prisma.securityAlert.create({
      data: {
        repositoryId,
        kind: 'DEPENDENCY',
        state: 'OPEN',
        severity: 'HIGH',
        providerAlertId: '1',
        title: 'Alert',
        identifiers: [],
        providerCreatedAt: now,
        providerUpdatedAt: now,
        providerUrl: 'https://example.test/alert',
      },
    });
    await prisma.repository.update({
      where: { id: repositoryId },
      data: {
        encryptedWebhookSecret: 'synthetic',
        memberships: { create: { userId: user.id, role: 'MANAGER' } },
        workflowFilters: { create: { mode: 'ALLOW', pattern: '*' } },
        webhookDeliveries: { create: { deliveryId: '1', event: 'push' } },
        workItemSyncCursors: { create: { kind: 'ISSUE' } },
        securityAlertSyncStates: { create: { kind: 'DEPENDENCY', availability: 'AVAILABLE' } },
        syncRequest: { create: { requestedAt: now, runAfter: now } },
      },
    });
    await prisma.notificationDelivery.create({
      data: {
        repositoryId,
        workflowRunId: run.id,
        issueId: issue.id,
        pullRequestId: pull.id,
        securityAlertId: alert.id,
        notificationChannelId: channel.id,
        deduplicationKey: 'owned',
        attempts: { create: { notificationChannelId: channel.id, attempt: 1 } },
      },
    });
    await prisma.notificationDelivery.create({
      data: { repositoryId: otherId, notificationChannelId: channel.id, deduplicationKey: 'keep' },
    });

    expect((await remove()).statusCode).toBe(204);
    const ownedCounts = await Promise.all([
      prisma.workflow.count(),
      prisma.workflowRun.count(),
      prisma.issue.count(),
      prisma.pullRequest.count(),
      prisma.securityAlert.count(),
      prisma.workflowFilter.count(),
      prisma.repositoryMembership.count(),
      prisma.repositoryGroupGrant.count(),
      prisma.webhookDelivery.count(),
      prisma.workItemSyncCursor.count(),
      prisma.securityAlertSyncState.count(),
      prisma.repositorySyncRequest.count(),
      prisma.workItemLabel.count(),
      prisma.issueAssignee.count(),
      prisma.issueLabel.count(),
      prisma.pullRequestAssignee.count(),
      prisma.pullRequestLabel.count(),
      prisma.notificationDeliveryAttempt.count(),
    ]);
    expect(ownedCounts).toEqual(Array(18).fill(0));
    await expect(prisma.repository.findUnique({ where: { id: otherId } })).resolves.not.toBeNull();
    await expect(prisma.providerAccount.count()).resolves.toBe(1);
    await expect(prisma.user.count()).resolves.toBe(1);
    await expect(prisma.userGroup.findUnique({ where: { id: group.id } })).resolves.not.toBeNull();
    await expect(prisma.providerActor.count()).resolves.toBe(1);
    await expect(prisma.notificationChannel.count()).resolves.toBe(1);
    await expect(prisma.notificationDelivery.count()).resolves.toBe(1);
    // The unique provider identity is available for fresh tracking again.
    const readded = await prisma.repository.create({
      data: {
        name: 'first',
        owner: 'fixture',
        providerAccountId: accountId,
        providerRepositoryId: '1',
        url: 'https://example.test/first',
      },
    });
    expect(readded.id).not.toBe(repositoryId);
    expect(readded.encryptedWebhookSecret).toBeNull();
  });

  it('removes the final restricted subscription without widening other or global subscriptions', /** Preserve notification scope after cascade cleanup. */ async () => {
    const channel = await prisma.notificationChannel.create({ data: { name: 'Shared channel' } });
    const sole = await prisma.notificationEventSubscription.create({
      data: {
        notificationChannelId: channel.id,
        eventType: 'ISSUE_OPENED',
        workflowPatterns: [],
        repositories: { create: { repositoryId } },
      },
    });
    const shared = await prisma.notificationEventSubscription.create({
      data: {
        notificationChannelId: channel.id,
        eventType: 'ISSUE_CLOSED',
        workflowPatterns: [],
        repositories: { create: [{ repositoryId }, { repositoryId: otherId }] },
      },
    });
    const global = await prisma.notificationEventSubscription.create({
      data: { notificationChannelId: channel.id, eventType: 'ISSUE_REOPENED', workflowPatterns: [] },
    });
    expect((await remove()).statusCode).toBe(204);
    await expect(prisma.notificationEventSubscription.findUnique({ where: { id: sole.id } })).resolves.toBeNull();
    await expect(
      prisma.notificationEventSubscriptionRepository.findMany({
        where: { notificationEventSubscriptionId: shared.id },
      }),
    ).resolves.toEqual([expect.objectContaining({ repositoryId: otherId })]);
    await expect(prisma.notificationEventSubscription.findUnique({ where: { id: global.id } })).resolves.not.toBeNull();
  });

  it('serializes deletion of the last two filters across different provider accounts', /** Concurrent deletions must never leave a restricted subscription global. */ async () => {
    const secondAccount = await prisma.providerAccount.create({
      data: { displayName: 'Second provider', encryptedAccessToken: 'synthetic', providerType: 'GITHUB' },
    });
    await prisma.repository.update({ where: { id: otherId }, data: { providerAccountId: secondAccount.id } });
    const channel = await prisma.notificationChannel.create({ data: { name: 'Shared channel' } });
    await prisma.notificationEventSubscription.create({
      data: {
        notificationChannelId: channel.id,
        eventType: 'ISSUE_OPENED',
        workflowPatterns: [],
        repositories: { create: [{ repositoryId }, { repositoryId: otherId }] },
      },
    });
    const results = await Promise.all([remove(repositoryId), remove(otherId)]);
    expect(results.map(/** Read each HTTP status. */ (result) => result.statusCode)).toEqual([204, 204]);
    await expect(prisma.notificationEventSubscription.count()).resolves.toBe(0);
    await expect(prisma.notificationChannel.count()).resolves.toBe(1);
  });

  it('rejects deletion while the real queue owns a running synchronization', /** Hold real synchronization open until the conflict is observed. */ async () => {
    const started = signal();
    const release = signal();
    const worker = queue({
      syncRepositoryById: jest.fn(
        /** Retain the durable running request. */ async () => {
          started.resolve();
          await release.promise;
          return true;
        },
      ),
    });
    await worker.enqueueRepositorySync(repositoryId);
    const processing = worker.processDueRequests();
    await started.promise;
    try {
      expect((await remove()).statusCode).toBe(409);
      await expect(prisma.repository.findUnique({ where: { id: repositoryId } })).resolves.not.toBeNull();
    } finally {
      release.resolve();
      await processing;
    }
    expect((await remove()).statusCode).toBe(204);
  });

  it('prevents a previously discovered queue candidate from starting after deletion wins the lock', /** Exercise the actual account-lock and request-claim ordering. */ async () => {
    const locked = signal();
    const release = signal();
    const discovered = signal();
    const sync = { syncRepositoryById: jest.fn() };
    const worker = queue(sync);
    await worker.enqueueRepositorySync(repositoryId);
    jest.spyOn(prisma, 'transaction').mockImplementationOnce(
      /** Hold deletion under the account lock while the worker discovers its stale candidate. */ async <T>(
        callback: (transaction: Prisma.TransactionClient) => Promise<T>,
      ): Promise<T> =>
        prisma.$transaction(
          /** Retain the same real lock that deletion and claims use. */ async (transaction) => {
            await transaction.$queryRaw`SELECT id FROM provider_accounts WHERE id = ${accountId}::uuid FOR UPDATE`;
            locked.resolve();
            await release.promise;
            return callback(transaction);
          },
        ),
    );
    const findCandidates = prisma.repositorySyncRequest.findMany.bind(prisma.repositorySyncRequest);
    jest.spyOn(prisma.repositorySyncRequest, 'findMany').mockImplementationOnce(
      /** Signal once a candidate has actually been loaded before deletion commits. */ (args) => {
        const candidates = findCandidates(args);
        void candidates.then(/** Signal after the database returns the real candidates. */ () => discovered.resolve());
        return candidates;
      },
    );
    const deletion = service.deleteRepository(admin, repositoryId);
    await locked.promise;
    const processing = worker.processDueRequests();
    try {
      await discovered.promise;
    } finally {
      release.resolve();
    }
    await deletion;
    await processing;
    expect(sync.syncRepositoryById).not.toHaveBeenCalled();
    await expect(prisma.repositorySyncRequest.count()).resolves.toBe(0);
    await expect(prisma.providerAccount.findUnique({ where: { id: accountId } })).resolves.toMatchObject({
      syncLeaseToken: null,
    });
  });
});
