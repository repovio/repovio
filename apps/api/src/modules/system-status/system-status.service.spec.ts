import type { PrismaService } from '../../prisma/prisma.service.js';
import { SystemStatusService } from './system-status.service.js';
import type { SystemStatusSnapshot } from './system-status.types.js';

describe('SystemStatusService', /** Groups scenarios for SystemStatusService. */ () => {
  it('publishes running workflow counts and provider synchronization progress', /** Verifies publishes running workflow counts and provider synchronization progress. */ async () => {
    const prisma = { workflowRun: { count: jest.fn().mockResolvedValue(3) } };
    const service = new SystemStatusService(prisma as unknown as PrismaService);
    const snapshots: SystemStatusSnapshot[] = [];
    service.changes$.subscribe(
      /** Evaluates `snapshots.push(snapshot)` when service.changes$.subscribe invokes this callback. */ (snapshot) =>
        snapshots.push(snapshot),
    );

    await service.onModuleInit();
    expect(prisma.workflowRun.count).toHaveBeenCalledWith({
      where: { status: 'RUNNING', workflow: { lifecycleState: { notIn: ['DISABLED', 'REMOVED'] } } },
    });
    const syncId = service.beginProviderSync();
    service.updateProviderSync(syncId, {
      phase: 'PROCESSING_WORKFLOWS',
      repositoriesCompleted: 1,
      repositoriesTotal: 4,
      workflowRunsCompleted: 2,
      workflowRunsTotal: 5,
    });

    expect(service.getSnapshot()).toMatchObject({
      activity: {
        kind: 'PROVIDER_SYNC',
        phase: 'PROCESSING_WORKFLOWS',
        repositoriesCompleted: 1,
        repositoriesTotal: 4,
        workflowRunsCompleted: 2,
        workflowRunsTotal: 5,
      },
      runningWorkflowCount: 3,
    });
    expect(snapshots).toHaveLength(3);

    service.finishProviderSync(syncId);
    expect(service.getSnapshot()).toMatchObject({ activity: null, runningWorkflowCount: 3 });
  });

  it('restores the previous visible activity when concurrent synchronization finishes', /** Verifies restores the previous visible activity when concurrent synchronization finishes. */ () => {
    const service = new SystemStatusService({ workflowRun: { count: jest.fn() } } as unknown as PrismaService);
    const firstSyncId = service.beginProviderSync();
    const secondSyncId = service.beginProviderSync();

    service.finishProviderSync(secondSyncId);

    expect(service.getSnapshot().activity).toMatchObject({
      kind: 'PROVIDER_SYNC',
      phase: 'LOADING_REPOSITORIES',
    });
    service.finishProviderSync(firstSyncId);
    expect(service.getSnapshot().activity).toBeNull();
  });
});
