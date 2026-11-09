import { z } from 'zod';

import { resourceQuerySchemas } from '../queries.js';

/** Shared WorkflowRunQuery boundary schema. */
export const ApiWorkflowRunQuerySchema = resourceQuerySchemas.WorkflowRun.extend({
  search: z.string().trim().max(1024).optional(),
});

/** Shared WorkflowRun boundary schema. */
export const ApiWorkflowRunSchema = z.strictObject({
  id: z.string(),
  providerRunId: z.string(),
  workflowName: z.string(),
  workflowLifecycleState: z.enum(['UNKNOWN', 'ACTIVE', 'DISABLED', 'REMOVED']).optional(),
  workflowLifecycleCheckedAt: z.iso.datetime({ offset: true }).nullable().optional(),
  displayTitle: z.string(),
  url: z.string(),
  providerCreatedAt: z.iso.datetime({ offset: true }),
  startedAt: z.union([z.null(), z.iso.datetime({ offset: true })]),
  completedAt: z.union([z.null(), z.iso.datetime({ offset: true })]),
  durationMs: z.union([z.null(), z.number()]),
  status: z.union([
    z.literal('RUNNING'),
    z.literal('FAILED'),
    z.literal('QUEUED'),
    z.literal('SUCCESS'),
    z.literal('CANCELLED'),
    z.literal('SKIPPED'),
    z.literal('UNKNOWN'),
  ]),
  repositoryId: z.string(),
  repositoryName: z.string(),
  repositoryOwner: z.string(),
  providerType: z.union([z.literal('GITHUB'), z.literal('GITLAB'), z.literal('FORGEJO'), z.literal('GITEA')]),
});
