import { z } from 'zod';

import { isoDateInputSchema } from './validation.js';

/** Shared DashboardSecurityAlertSummary boundary schema. */
export const ApiDashboardSecurityAlertSummarySchema = z.strictObject({
  dependency: z.number(),
  code: z.number(),
  secret: z.number(),
  critical: z.number(),
  high: z.number(),
  medium: z.number(),
  low: z.number(),
  info: z.number(),
  unknown: z.number(),
});

/** Shared DashboardStatusDistribution boundary schema. */
export const ApiDashboardStatusDistributionSchema = z.strictObject({
  success: z.number(),
  failed: z.number(),
  cancelled: z.number(),
  skipped: z.number(),
  unknown: z.number(),
});

/** Shared DashboardSummary boundary schema. */
export const ApiDashboardSummarySchema = z.strictObject({
  securityAlerts: z
    .strictObject({
      dependency: z.number(),
      code: z.number(),
      secret: z.number(),
      critical: z.number(),
      high: z.number(),
      medium: z.number(),
      low: z.number(),
      info: z.number(),
      unknown: z.number(),
    })
    .optional(),
  awaitingApprovalCount: z.number(),
  completedCount: z.number(),
  successRate: z.number(),
  medianDurationMs: z.union([z.null(), z.number()]),
  totalRunDurationMs: z.number(),
  queuedCount: z.number(),
  runningCount: z.number(),
  statuses: z.strictObject({
    success: z.number(),
    failed: z.number(),
    cancelled: z.number(),
    skipped: z.number(),
    unknown: z.number(),
  }),
});

/** Shared DashboardProvider boundary schema. */
export const ApiDashboardProviderSchema = z.strictObject({
  id: z.string(),
  providerType: z.union([z.literal('GITHUB'), z.literal('GITLAB'), z.literal('FORGEJO'), z.literal('GITEA')]),
  displayName: z.string(),
});

/** Shared DashboardRepository boundary schema. */
export const ApiDashboardRepositorySchema = z.strictObject({
  id: z.string(),
  owner: z.string(),
  name: z.string(),
  url: z.string(),
});

/** Shared DashboardWorkflowRun boundary schema. */
export const ApiDashboardWorkflowRunSchema = z.strictObject({
  awaitingApproval: z.boolean(),
  id: z.string(),
  providerRunId: z.string(),
  workflowName: z.string(),
  displayTitle: z.string(),
  url: z.string(),
  providerCreatedAt: z.iso.datetime({ offset: true }),
  startedAt: z.union([z.null(), z.iso.datetime({ offset: true })]),
  completedAt: z.union([z.null(), z.iso.datetime({ offset: true })]),
  durationMs: z.union([z.null(), z.number()]),
  reviewUrl: z.union([z.null(), z.string()]),
  status: z.union([
    z.literal('RUNNING'),
    z.literal('FAILED'),
    z.literal('QUEUED'),
    z.literal('SUCCESS'),
    z.literal('CANCELLED'),
    z.literal('SKIPPED'),
    z.literal('UNKNOWN'),
  ]),
  repository: z.strictObject({ id: z.string(), owner: z.string(), name: z.string(), url: z.string() }),
  provider: z.strictObject({
    id: z.string(),
    providerType: z.union([z.literal('GITHUB'), z.literal('GITLAB'), z.literal('FORGEJO'), z.literal('GITEA')]),
    displayName: z.string(),
  }),
});

/** Shared RepositoryHealth boundary schema. */
export const ApiRepositoryHealthSchema = z.strictObject({
  repository: z.strictObject({ id: z.string(), owner: z.string(), name: z.string(), url: z.string() }),
  completedCount: z.number(),
  failedCount: z.number(),
  successRate: z.number(),
  medianDurationMs: z.union([z.null(), z.number()]),
});

/** Shared DashboardPeriodQuery boundary schema. */
export const ApiDashboardPeriodQuerySchema = z.strictObject({
  from: isoDateInputSchema,
  to: isoDateInputSchema,
});

/** Shared WorkflowRunTrendBucket boundary schema. */
export const ApiWorkflowRunTrendBucketSchema = z.strictObject({
  bucketStart: z.iso.datetime({ offset: true }),
  successCount: z.number(),
  errorCount: z.number(),
});

/** Shared WorkflowRunTrendQuery boundary schema. */
export const ApiWorkflowRunTrendQuerySchema = ApiDashboardPeriodQuerySchema.extend({
  bucket: z.union([z.literal('hour'), z.literal('day'), z.literal('week')]).default('day'),
});
