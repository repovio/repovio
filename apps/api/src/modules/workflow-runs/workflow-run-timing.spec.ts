import {
  DashboardWorkflowRunDto,
  type DashboardWorkflowRunModel,
} from '../dashboard/dto/dashboard-workflow-run.dto.js';
import { WorkflowRunDto, type WorkflowRunResourceModel } from '../repositories/dto/resource.dto.js';
import { normalizeWorkflowRunTiming } from './workflow-run-timing.js';

const startedAt = new Date('2026-11-09T10:00:00Z');
const completedAt = new Date('2026-11-09T10:02:00Z');

describe('normalizeWorkflowRunTiming', /** Exercise independent timing validity across persistence and wire boundaries. */ () => {
  it.each(['SUCCESS', 'FAILED', 'CANCELLED', 'SKIPPED', 'UNKNOWN'] as const)(
    'preserves valid %s timing including zero milliseconds',
    /** Keep zero distinct from unavailable for both numeric storage representations. */ (status) => {
      expect(normalizeWorkflowRunTiming({ status, startedAt, completedAt, durationMs: 0 })).toEqual({
        startedAt,
        completedAt,
        durationMs: 0,
      });
      expect(normalizeWorkflowRunTiming({ status, startedAt, completedAt, durationMs: 0n })).toEqual({
        startedAt,
        completedAt,
        durationMs: 0n,
      });
    },
  );

  it.each([null, new Date(0), new Date('0001-01-01T00:00:00Z'), new Date('invalid'), new Date('2026-11-09T09:59:00Z')])(
    'rejects unavailable or invalid completion %s while preserving independent duration',
    /** A malformed completion must not erase a valid duration supplied independently by a provider. */ (invalid) => {
      expect(
        normalizeWorkflowRunTiming({ status: 'SUCCESS', startedAt, completedAt: invalid, durationMs: 3000 }),
      ).toEqual({ startedAt, completedAt: null, durationMs: 3000 });
    },
  );

  it.each([null, -1, NaN, Infinity, -Infinity])(
    'rejects unavailable or invalid duration %s while preserving independent completion',
    /** Reject invalid durations without fabricating zero or suppressing valid completion. */ (durationMs) => {
      expect(normalizeWorkflowRunTiming({ status: 'FAILED', startedAt, completedAt, durationMs })).toEqual({
        startedAt,
        completedAt,
        durationMs: null,
      });
    },
  );

  it('handles missing start and invalid BigInt duration independently', /** Protect existing rows with incomplete timing. */ () => {
    expect(
      normalizeWorkflowRunTiming({ status: 'SUCCESS', startedAt: new Date('invalid'), completedAt, durationMs: -1n }),
    ).toEqual({ startedAt: null, completedAt, durationMs: null });
  });

  it.each(['SUCCESS', 'FAILED', 'CANCELLED', 'SKIPPED', 'UNKNOWN'] as const)(
    'serializes malformed stored %s timing safely in both DTOs',
    /** Exercise real schema parsing and wire serialization instead of only the helper. */ (status) => {
      const model = {
        id: 'run-74',
        providerRunId: '74',
        workflowName: 'Build',
        displayTitle: 'Build',
        awaitingApproval: false,
        providerCreatedAt: startedAt,
        startedAt: new Date('invalid'),
        completedAt: new Date(0),
        durationMs: -1n,
        status,
        reviewUrl: null,
        repositoryId: 'repo-74',
        url: 'https://example.test/runs/74',
        repository: {
          id: 'repo-74',
          name: 'repo',
          owner: 'team',
          url: 'https://example.test/team/repo',
          providerAccount: { id: 'provider-74', displayName: 'Test provider', providerType: 'FORGEJO' },
        },
      };
      expect(WorkflowRunDto.fromModel(model as unknown as WorkflowRunResourceModel)).toMatchObject({
        status,
        startedAt: null,
        completedAt: null,
        durationMs: null,
      });
      expect(DashboardWorkflowRunDto.fromModel(model as unknown as DashboardWorkflowRunModel)).toMatchObject({
        status,
        startedAt: null,
        completedAt: null,
        durationMs: null,
      });
    },
  );
});
