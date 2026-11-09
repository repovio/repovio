import { z } from 'zod';

import { resourceQuerySchemas } from '../queries.js';

import { optionalInput } from './validation.js';

/** Shared RepositoryMemberSummary boundary schema. */
export const ApiRepositoryMemberSummarySchema = z.strictObject({
  avatarSource: z.enum(['LOCAL', 'OIDC']).nullable().optional(),
  avatarUpdatedAt: z.union([z.null(), z.iso.datetime({ offset: true })]),
  firstName: z.union([z.null(), z.string()]),
  lastName: z.union([z.null(), z.string()]),
  userId: z.string(),
  username: z.string(),
});

/** Shared Repository boundary schema. */
export const ApiRepositorySchema = z.strictObject({
  id: z.string(),
  providerRepositoryId: z.string(),
  owner: z.string(),
  name: z.string(),
  url: z.string(),
  enabled: z.boolean(),
  lastSyncAt: z.union([z.null(), z.iso.datetime({ offset: true })]),
  issueRetentionDays: z.union([z.null(), z.number()]),
  pullRequestRetentionDays: z.union([z.null(), z.number()]),
  workflowRunRetentionDays: z.union([z.null(), z.number()]),
  providerAccountId: z.string(),
  workflowRunCount: z.number().optional(),
  members: z.array(
    z.strictObject({
      avatarSource: z.enum(['LOCAL', 'OIDC']).nullable().optional(),
      avatarUpdatedAt: z.union([z.null(), z.iso.datetime({ offset: true })]),
      firstName: z.union([z.null(), z.string()]),
      lastName: z.union([z.null(), z.string()]),
      userId: z.string(),
      username: z.string(),
    }),
  ),
});

/** Shared RepositorySyncState boundary schema. */
export const ApiRepositorySyncStateSchema = z.strictObject({
  attempt: z.number(),
  lastError: z.union([z.null(), z.string()]),
  progressCurrent: z.union([z.null(), z.number()]),
  progressPhase: z.union([
    z.null(),
    z.literal('LOADING_REPOSITORY'),
    z.literal('SYNCING_ISSUES'),
    z.literal('SYNCING_PULL_REQUESTS'),
    z.literal('SYNCING_ALERTS'),
    z.literal('FETCHING_WORKFLOWS'),
    z.literal('PROCESSING_WORKFLOWS'),
    z.literal('REFRESHING_CHANGE_REQUESTS'),
  ]),
  progressTotal: z.union([z.null(), z.number()]),
  requestedAt: z.union([z.null(), z.iso.datetime({ offset: true })]),
  scopes: z.array(
    z.union([z.literal('WORKFLOWS'), z.literal('ISSUES'), z.literal('PULL_REQUESTS'), z.literal('ALERTS')]),
  ),
  warningKinds: z.array(z.string()),
  startedAt: z.union([z.null(), z.iso.datetime({ offset: true })]),
  status: z.union([
    z.literal('PENDING'),
    z.literal('RUNNING'),
    z.literal('FAILED'),
    z.literal('WARNING'),
    z.literal('IDLE'),
  ]),
});

/** Shared WorkflowFilter boundary schema. */
export const ApiWorkflowFilterSchema = z.strictObject({
  id: z.string(),
  pattern: z.string(),
  mode: z.union([z.literal('ALLOW'), z.literal('DENY')]),
  repositoryId: z.string(),
});

/** Shared RepositoryMembership boundary schema. */
export const ApiRepositoryMembershipSchema = z.strictObject({
  id: z.string(),
  role: z.union([z.literal('VIEWER'), z.literal('MANAGER')]),
  repositoryId: z.string(),
  userId: z.string(),
  user: z.strictObject({
    id: z.string(),
    username: z.string(),
    firstName: z.union([z.null(), z.string()]),
    lastName: z.union([z.null(), z.string()]),
    role: z.union([z.literal('SYSTEM_ADMIN'), z.literal('VIEWER'), z.literal('MANAGER')]),
    avatarSource: z.enum(['LOCAL', 'OIDC']).nullable().optional(),
    avatarUpdatedAt: z.union([z.null(), z.iso.datetime({ offset: true })]),
  }),
});

/** Shared RepositoryQuery boundary schema. */
export const ApiRepositoryQuerySchema = resourceQuerySchemas.Repository.extend({
  search: z.string().trim().max(1024).optional(),
});

/** Shared RepositoryWebhookConfiguration boundary schema. */
export const ApiRepositoryWebhookConfigurationSchema = z.strictObject({
  repositoryId: z.string(),
  providerType: z.union([z.literal('GITHUB'), z.literal('GITLAB'), z.literal('FORGEJO'), z.literal('GITEA')]),
  callbackUrl: z.string(),
  configured: z.boolean(),
  source: z.enum(['ORGANIZATION', 'REPOSITORY', 'NONE']),
  organizationWebhook: z.object({ id: z.uuid(), providerAccountId: z.uuid(), scope: z.string() }).nullable(),
  lastDeliveryAt: z.union([z.null(), z.iso.datetime({ offset: true })]),
});

/** Shared UpdateRepository boundary schema. */
export const ApiUpdateRepositorySchema = z.strictObject({
  enabled: optionalInput(z.boolean()),
  issueRetentionDays: z.number().int().min(1).max(3650).nullable().optional(),
  pullRequestRetentionDays: z.number().int().min(1).max(3650).nullable().optional(),
  workflowRunRetentionDays: z.number().int().min(1).max(3650).nullable().optional(),
});

/** Shared CreateWorkflowFilter boundary schema. */
export const ApiCreateWorkflowFilterSchema = z.strictObject({
  mode: z.union([z.literal('ALLOW'), z.literal('DENY')]),
  pattern: z.string().max(1024),
});

/** Shared UpsertRepositoryMembership boundary schema. */
export const ApiUpsertRepositoryMembershipSchema = z.strictObject({
  role: z.union([z.literal('VIEWER'), z.literal('MANAGER')]),
});

/** Shared SetRepositoryWebhookSecret boundary schema. */
export const ApiSetRepositoryWebhookSecretSchema = z.strictObject({
  webhookSecret: z.string().trim().min(1).max(4096),
});

/** Shared RepositoryDetail boundary schema. */
export const ApiRepositoryDetailSchema = ApiRepositorySchema.extend({
  syncIntervalSeconds: z.number(),
  syncState: z.strictObject({
    attempt: z.number(),
    lastError: z.union([z.null(), z.string()]),
    progressCurrent: z.union([z.null(), z.number()]),
    progressPhase: z.union([
      z.null(),
      z.literal('LOADING_REPOSITORY'),
      z.literal('SYNCING_ISSUES'),
      z.literal('SYNCING_PULL_REQUESTS'),
      z.literal('SYNCING_ALERTS'),
      z.literal('FETCHING_WORKFLOWS'),
      z.literal('PROCESSING_WORKFLOWS'),
      z.literal('REFRESHING_CHANGE_REQUESTS'),
    ]),
    progressTotal: z.union([z.null(), z.number()]),
    requestedAt: z.union([z.null(), z.iso.datetime({ offset: true })]),
    scopes: z.array(
      z.union([z.literal('WORKFLOWS'), z.literal('ISSUES'), z.literal('PULL_REQUESTS'), z.literal('ALERTS')]),
    ),
    warningKinds: z.array(z.string()),
    startedAt: z.union([z.null(), z.iso.datetime({ offset: true })]),
    status: z.union([
      z.literal('PENDING'),
      z.literal('RUNNING'),
      z.literal('FAILED'),
      z.literal('WARNING'),
      z.literal('IDLE'),
    ]),
  }),
});
