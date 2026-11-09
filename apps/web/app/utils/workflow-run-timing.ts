import type { WorkflowRun } from '../types/api/resources';

/** Run status and timestamps required to distinguish final timing from stale provider values. */
export type WorkflowRunTimingInput = Pick<WorkflowRun, 'status' | 'startedAt' | 'completedAt' | 'durationMs'>;

/**
 * Select independently valid final timing, hiding stale values for queued or running executions.
 * @param run - Workflow run whose API or cached timing is being displayed.
 * @returns Valid completion and nonnegative duration, or null for each unavailable field.
 */
export function workflowRunTiming(run: WorkflowRunTimingInput): Pick<WorkflowRun, 'completedAt' | 'durationMs'> {
  if (run.status === 'QUEUED' || run.status === 'RUNNING') return { completedAt: null, durationMs: null };
  const completed = run.completedAt ? Date.parse(run.completedAt) : NaN;
  const started = run.startedAt ? Date.parse(run.startedAt) : NaN;
  return {
    completedAt:
      Number.isFinite(completed) && completed > 0 && (!Number.isFinite(started) || started <= 0 || completed >= started)
        ? run.completedAt
        : null,
    durationMs:
      run.durationMs !== null && Number.isFinite(run.durationMs) && run.durationMs >= 0 ? run.durationMs : null,
  };
}
