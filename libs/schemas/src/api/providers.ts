import { z } from 'zod';

import { resourceQuerySchemas } from '../queries.js';

import { optionalInput, providerBaseUrlSchema } from './validation.js';

/** Shared ProviderAccount boundary schema. */
export const ApiProviderAccountSchema = z.strictObject({
  id: z.string(),
  providerType: z.union([z.literal('GITHUB'), z.literal('GITLAB'), z.literal('FORGEJO'), z.literal('GITEA')]),
  displayName: z.string(),
  baseUrl: z.union([z.null(), z.string()]),
  enabled: z.boolean(),
  lastSyncAt: z.union([z.null(), z.iso.datetime({ offset: true })]),
});

/** Shared ProviderAccountQuery boundary schema. */
export const ApiProviderAccountQuerySchema = resourceQuerySchemas.ProviderAccount.extend({
  search: z.string().trim().max(1024).optional(),
});

/** Shared StartProviderOAuth boundary schema. */
export const ApiStartProviderOAuthSchema = z.strictObject({
  providerType: z.union([z.literal('GITHUB'), z.literal('GITLAB'), z.literal('FORGEJO')]),
  displayName: z.string().max(255),
  baseUrl: optionalInput(providerBaseUrlSchema),
});

/** Shared ProviderOAuthCallback boundary schema. */
export const ApiProviderOAuthCallbackSchema = z.strictObject({
  state: z.string().max(4096),
  code: optionalInput(z.string().max(4096)),
  error: optionalInput(z.string().max(255)),
  error_description: optionalInput(z.string().max(4096)),
  error_uri: optionalInput(z.string().max(4096)),
});

/** Shared ProviderRepository boundary schema. */
export const ApiProviderRepositorySchema = z.strictObject({
  providerRepositoryId: z.string(),
  owner: z.string(),
  name: z.string(),
  url: z.string(),
  tracked: z.boolean(),
});

/** Shared CreateProviderAccount boundary schema. */
export const ApiCreateProviderAccountSchema = z.strictObject({
  providerType: z.union([z.literal('GITHUB'), z.literal('GITLAB'), z.literal('FORGEJO'), z.literal('GITEA')]),
  displayName: z.string().max(255),
  accessToken: z.string().min(1).max(4096),
  baseUrl: optionalInput(providerBaseUrlSchema),
  enabled: optionalInput(z.boolean()),
});

/** Shared UpdateProviderAccount boundary schema. */
export const ApiUpdateProviderAccountSchema = z.strictObject({
  displayName: optionalInput(z.string().max(255)),
  baseUrl: z.union([z.null(), providerBaseUrlSchema]).optional(),
  enabled: optionalInput(z.boolean()),
  accessToken: optionalInput(z.string().min(1).max(4096)),
});

/** Shared CreateTrackedRepository boundary schema. */
export const ApiCreateTrackedRepositorySchema = z.strictObject({ providerRepositoryId: z.string().min(1).max(255) });

/** Shared RepositorySyncJobQuery boundary schema. */
export const ApiRepositorySyncJobQuerySchema = resourceQuerySchemas.Repository.extend({
  search: z.string().trim().max(1024).optional(),
});

/** Shared RepositorySyncJob boundary schema. */
export const ApiRepositorySyncJobSchema = z.strictObject({
  id: z.string(),
  repositoryName: z.string(),
  repositoryOwner: z.string(),
  providerName: z.string(),
  providerType: z.union([z.literal('GITHUB'), z.literal('GITLAB'), z.literal('FORGEJO'), z.literal('GITEA')]),
  status: z.union([
    z.literal('PENDING'),
    z.literal('RUNNING'),
    z.literal('FAILED'),
    z.literal('WARNING'),
    z.literal('IDLE'),
  ]),
  scopes: z.array(
    z.union([z.literal('WORKFLOWS'), z.literal('ISSUES'), z.literal('PULL_REQUESTS'), z.literal('ALERTS')]),
  ),
  warningKinds: z.array(z.string()),
  attempt: z.number(),
  requestedAt: z.union([z.null(), z.iso.datetime({ offset: true })]),
  runAfter: z.union([z.null(), z.iso.datetime({ offset: true })]),
  startedAt: z.union([z.null(), z.iso.datetime({ offset: true })]),
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
  progressCurrent: z.union([z.null(), z.number()]),
  progressTotal: z.union([z.null(), z.number()]),
  lastError: z.union([z.null(), z.string()]),
});

/** Shared RepositorySyncJobSummary boundary schema. */
export const ApiRepositorySyncJobSummarySchema = z.strictObject({
  total: z.number(),
  idle: z.number(),
  pending: z.number(),
  running: z.number(),
  failed: z.number(),
  warning: z.number(),
});

/** Shared RepositorySyncJobStart boundary schema. */
export const ApiRepositorySyncJobStartSchema = z.strictObject({ queuedCount: z.number() });
