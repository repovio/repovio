import type { ProviderAccount, Repository, WorkflowRun } from '../../../generated/prisma/client.js';
import { DashboardWorkflowRunDto } from './dashboard-workflow-run.dto.js';

describe('DashboardWorkflowRunDto', () => {
  it('includes workflow, repository, and provider display context without credentials', () => {
    const dto = DashboardWorkflowRunDto.fromModel({
      awaitingApproval: true,
      completedAt: new Date('2026-08-26T10:01:00.000Z'),
      createdAt: new Date('2026-08-26T10:00:00.000Z'),
      displayTitle: 'Test pull request',
      durationMs: 2_592_164_000n,
      id: 'run-id',
      providerCreatedAt: new Date('2026-08-26T10:00:00.000Z'),
      providerRunId: 'provider-run-id',
      rawStatus: 'failure',
      reviewUrl: 'https://github.com/repovio/repovio/pull/12',
      repository: {
        id: 'repository-id',
        encryptedWebhookSecret: 'must-not-appear',
        name: 'repovio',
        owner: 'repovio',
        providerAccount: {
          displayName: 'Repovio GitHub',
          encryptedAccessToken: 'must-not-appear',
          id: 'provider-id',
          providerType: 'GITHUB',
        } as ProviderAccount,
        url: 'https://github.com/repovio/repovio',
      } as unknown as Repository,
      repositoryId: 'repository-id',
      startedAt: new Date('2026-08-26T10:00:00.000Z'),
      status: 'FAILED',
      updatedAt: new Date('2026-08-26T10:01:00.000Z'),
      url: 'https://github.com/repovio/repovio/actions/runs/1',
      workflowName: 'Test',
    } as WorkflowRun & { repository: Repository & { providerAccount: ProviderAccount } });

    expect(dto).toEqual({
      awaitingApproval: true,
      completedAt: new Date('2026-08-26T10:01:00.000Z'),
      displayTitle: 'Test pull request',
      durationMs: 2_592_164_000,
      id: 'run-id',
      provider: { displayName: 'Repovio GitHub', id: 'provider-id', providerType: 'GITHUB' },
      providerCreatedAt: new Date('2026-08-26T10:00:00.000Z'),
      providerRunId: 'provider-run-id',
      reviewUrl: 'https://github.com/repovio/repovio/pull/12',
      repository: {
        id: 'repository-id',
        name: 'repovio',
        owner: 'repovio',
        url: 'https://github.com/repovio/repovio',
      },
      startedAt: new Date('2026-08-26T10:00:00.000Z'),
      status: 'FAILED',
      url: 'https://github.com/repovio/repovio/actions/runs/1',
      workflowName: 'Test',
    });
    expect(dto).not.toHaveProperty('provider.encryptedAccessToken');
    expect(dto).not.toHaveProperty('repository.encryptedWebhookSecret');
  });
});
