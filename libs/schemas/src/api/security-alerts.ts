import { z } from 'zod';

import { resourceQuerySchemas } from '../queries.js';

/** Shared SecurityAlertQuery boundary schema. */
export const ApiSecurityAlertQuerySchema = resourceQuerySchemas.SecurityAlert.extend({
  search: z.string().trim().max(1024).optional(),
});

/** Shared SecurityAlert boundary schema. */
export const ApiSecurityAlertSchema = z.strictObject({
  id: z.string(),
  kind: z.union([z.literal('DEPENDENCY'), z.literal('CODE'), z.literal('SECRET')]),
  state: z.union([z.literal('OPEN'), z.literal('RESOLVED'), z.literal('DISMISSED')]),
  severity: z.union([
    z.literal('UNKNOWN'),
    z.literal('CRITICAL'),
    z.literal('HIGH'),
    z.literal('MEDIUM'),
    z.literal('LOW'),
    z.literal('INFO'),
  ]),
  title: z.string(),
  description: z.union([z.null(), z.string()]).optional(),
  identifiers: z.array(z.string()),
  scanner: z.union([z.null(), z.string()]),
  providerCreatedAt: z.iso.datetime({ offset: true }),
  providerUpdatedAt: z.iso.datetime({ offset: true }),
  resolvedAt: z.union([z.null(), z.iso.datetime({ offset: true })]),
  resolution: z.union([z.null(), z.string()]),
  providerUrl: z.string(),
  packageName: z.union([z.null(), z.string()]),
  ecosystem: z.union([z.null(), z.string()]),
  manifest: z.union([z.null(), z.string()]),
  vulnerableRange: z.union([z.null(), z.string()]),
  fixedVersion: z.union([z.null(), z.string()]),
  ruleId: z.union([z.null(), z.string()]),
  tool: z.union([z.null(), z.string()]),
  secretType: z.union([z.null(), z.string()]),
  secretProvider: z.union([z.null(), z.string()]),
  location: z.record(z.string(), z.union([z.string(), z.number()])).nullable(),
  repositoryId: z.string(),
  repositoryOwner: z.string(),
  repositoryName: z.string(),
  providerType: z.union([z.literal('GITHUB'), z.literal('GITLAB'), z.literal('FORGEJO'), z.literal('GITEA')]),
});

/** Shared SecurityAlertSummary boundary schema. */
export const ApiSecurityAlertSummarySchema = z.strictObject({
  open: z.strictObject({ DEPENDENCY: z.number(), CODE: z.number(), SECRET: z.number() }),
  severity: z.strictObject({
    UNKNOWN: z.number(),
    CRITICAL: z.number(),
    HIGH: z.number(),
    MEDIUM: z.number(),
    LOW: z.number(),
    INFO: z.number(),
  }),
  unavailableRepositories: z.number(),
});

/** Shared SecurityAlertFilterOptions boundary schema. */
export const ApiSecurityAlertFilterOptionsSchema = z.strictObject({
  repositories: z.array(z.strictObject({ id: z.string(), name: z.string(), owner: z.string() })),
  ecosystems: z.array(z.string()),
  packages: z.array(z.string()),
  manifests: z.array(z.string()),
  scanners: z.array(z.string()),
  rules: z.array(z.string()),
  paths: z.array(z.string()),
  secretTypes: z.array(z.string()),
  secretProviders: z.array(z.string()),
  availability: z.array(
    z.strictObject({
      availability: z.string(),
      kind: z.string(),
      lastSuccessfulSyncAt: z.union([z.null(), z.iso.datetime({ offset: true })]),
      reason: z.union([z.null(), z.string()]),
      repositoryId: z.string(),
    }),
  ),
});
