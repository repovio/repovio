import type { WorkflowRunStatus } from '../../generated/prisma/client.js';

/** Persisted or provider timing, retaining millisecond number or BigInt ownership. */
export interface WorkflowRunTiming<Duration extends number | bigint> {
  status: WorkflowRunStatus;
  startedAt: Date | null;
  completedAt: Date | null;
  durationMs: Duration | null;
}

/**
 * Reject impossible run timestamps and final active timing without manufacturing measured values.
 * @param run - Provider or persisted execution timing; duration units are milliseconds.
 * @returns Independently valid timing, retaining the original duration representation.
 * @typeParam Duration - Numeric duration representation at the calling boundary.
 */
export function normalizeWorkflowRunTiming<Duration extends number | bigint>(
  run: WorkflowRunTiming<Duration>,
): Omit<WorkflowRunTiming<Duration>, 'status'> {
  const startedAt = validRunDate(run.startedAt);
  const completedAt = validRunDate(run.completedAt);
  const active = run.status === 'QUEUED' || run.status === 'RUNNING';
  const validDuration =
    run.durationMs !== null &&
    (typeof run.durationMs === 'bigint'
      ? run.durationMs >= 0n
      : Number.isFinite(run.durationMs) && run.durationMs >= 0);
  return {
    startedAt,
    completedAt: !active && completedAt && (!startedAt || completedAt >= startedAt) ? completedAt : null,
    durationMs: !active && validDuration ? run.durationMs : null,
  };
}

/**
 * Discard missing, invalid and nonpositive provider sentinel instants.
 * @param date - Optional workflow execution timestamp.
 * @returns The original valid date, or null if unavailable.
 */
function validRunDate(date: Date | null): Date | null {
  return date && Number.isFinite(date.getTime()) && date.getTime() > 0 ? date : null;
}
