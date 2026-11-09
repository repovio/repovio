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
});
