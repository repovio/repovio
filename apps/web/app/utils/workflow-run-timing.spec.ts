import { describe, expect, it } from 'vitest';
import { workflowRunTiming, type WorkflowRunTimingInput } from './workflow-run-timing';

const run: WorkflowRunTimingInput = {
  status: 'RUNNING',
  startedAt: '2026-11-09T10:00:00Z',
  completedAt: '1970-01-01T00:00:00Z',
  durationMs: -1_000,
};

describe('workflowRunTiming', /** Cover stale active payloads and independent final timing validation. */ () => {
  it.each(['QUEUED', 'RUNNING'] as const)(
    'hides all final timing for %s',
    /** Verify positive stale values and provider sentinels are equally unavailable. */ (status) => {
      for (const completedAt of [null, '1970-01-01T00:00:00Z', '2026-11-09T10:02:00Z']) {
        for (const durationMs of [null, -1000, 0, 120_000]) {
          expect(workflowRunTiming({ ...run, status, completedAt, durationMs })).toEqual({
            completedAt: null,
            durationMs: null,
          });
        }
      }
    },
  );

  it('preserves valid terminal timing', /** Prevent an active-row fix from hiding completed history. */ () => {
    expect(
      workflowRunTiming({ ...run, status: 'SUCCESS', completedAt: '2026-11-09T10:02:00Z', durationMs: 120_000 }),
    ).toEqual({ completedAt: '2026-11-09T10:02:00Z', durationMs: 120_000 });
  });
  it.each(['SUCCESS', 'FAILED', 'CANCELLED', 'SKIPPED', 'UNKNOWN'] as const)(
    'preserves zero duration and independent completion for %s',
    /** Exercise every terminal status without inventing timing from the status itself. */ (status) => {
      expect(workflowRunTiming({ ...run, status, completedAt: '2026-11-09T10:02:00Z', durationMs: 0 })).toEqual({
        completedAt: '2026-11-09T10:02:00Z',
        durationMs: 0,
      });
      expect(workflowRunTiming({ ...run, status, completedAt: null, durationMs: null })).toEqual({
        completedAt: null,
        durationMs: null,
      });
    },
  );

  it.each([null, '', 'invalid', '1970-01-01T00:00:00Z', '0001-01-01T00:00:00Z', '2026-11-09T09:59:00Z'])(
    'hides invalid completion %s without discarding valid duration',
    /** Keep independent provider duration usable when completion cannot be trusted. */ (completedAt) => {
      expect(workflowRunTiming({ ...run, status: 'SUCCESS', completedAt, durationMs: 3000 })).toEqual({
        completedAt: null,
        durationMs: 3000,
      });
    },
  );

  it.each([-1, NaN, Infinity, -Infinity])(
    'hides invalid duration %s without discarding valid completion',
    /** Reject negative and nonfinite numbers instead of displaying them or fabricating zero. */ (durationMs) => {
      expect(workflowRunTiming({ ...run, status: 'FAILED', completedAt: '2026-11-09T10:02:00Z', durationMs })).toEqual({
        completedAt: '2026-11-09T10:02:00Z',
        durationMs: null,
      });
    },
  );

  it('accepts independently valid completion without a start', /** Avoid treating a missing start as proof of invalid completion. */ () => {
    expect(
      workflowRunTiming({
        ...run,
        status: 'SUCCESS',
        startedAt: null,
        completedAt: '2026-11-09T10:02:00Z',
        durationMs: 3000,
      }),
    ).toEqual({ completedAt: '2026-11-09T10:02:00Z', durationMs: 3000 });
  });
});
