import { z } from 'zod';

import { resourceQuerySchemas } from '../queries.js';

import { optionalInput } from './validation.js';

/** Shared IssueQuery boundary schema. */
export const ApiIssueQuerySchema = resourceQuerySchemas.Issue.extend({
  search: optionalInput(z.string().trim().max(1024)),
  labels: optionalInput(
    z
      .union([z.string().max(255), z.array(z.string().max(255))])
      .transform((value) => (typeof value === 'string' ? [value] : value)),
  ),
});

/** Shared WorkItemActor boundary schema. */
export const ApiWorkItemActorSchema = z.strictObject({
  username: z.string(),
  displayName: z.union([z.null(), z.string()]),
  avatarUrl: z.union([z.null(), z.string()]),
  url: z.union([z.null(), z.string()]),
});

/** Shared WorkItemLabel boundary schema. */
export const ApiWorkItemLabelSchema = z.strictObject({
  name: z.string(),
  color: z.union([z.null(), z.string()]),
  description: z.union([z.null(), z.string()]),
});

/** Shared Issue boundary schema. */
export const ApiIssueSchema = z.strictObject({
  id: z.string(),
  number: z.string(),
  title: z.string(),
  body: z.union([z.null(), z.string()]).optional(),
  state: z.union([z.literal('OPEN'), z.literal('CLOSED')]),
  url: z.string(),
  providerCreatedAt: z.iso.datetime({ offset: true }),
  providerUpdatedAt: z.iso.datetime({ offset: true }),
  closedAt: z.union([z.null(), z.iso.datetime({ offset: true })]),
  milestone: z.union([z.null(), z.string()]),
  repositoryId: z.string(),
  repositoryName: z.string(),
  repositoryOwner: z.string(),
  providerType: z.union([z.literal('GITHUB'), z.literal('GITLAB'), z.literal('FORGEJO'), z.literal('GITEA')]),
  author: z.union([
    z.null(),
    z.strictObject({
      username: z.string(),
      displayName: z.union([z.null(), z.string()]),
      avatarUrl: z.union([z.null(), z.string()]),
      url: z.union([z.null(), z.string()]),
    }),
  ]),
  assignees: z.array(
    z.strictObject({
      username: z.string(),
      displayName: z.union([z.null(), z.string()]),
      avatarUrl: z.union([z.null(), z.string()]),
      url: z.union([z.null(), z.string()]),
    }),
  ),
  labels: z.array(
    z.strictObject({
      name: z.string(),
      color: z.union([z.null(), z.string()]),
      description: z.union([z.null(), z.string()]),
    }),
  ),
});

/** Shared PullRequest boundary schema. */
export const ApiPullRequestSchema = z.strictObject({
  id: z.string(),
  number: z.string(),
  title: z.string(),
  body: z.union([z.null(), z.string()]).optional(),
  state: z.union([z.literal('OPEN'), z.literal('CLOSED'), z.literal('MERGED')]),
  draft: z.boolean(),
  sourceBranch: z.string(),
  targetBranch: z.string(),
  url: z.string(),
  providerCreatedAt: z.iso.datetime({ offset: true }),
  providerUpdatedAt: z.iso.datetime({ offset: true }),
  closedAt: z.union([z.null(), z.iso.datetime({ offset: true })]),
  mergedAt: z.union([z.null(), z.iso.datetime({ offset: true })]),
  workflowStatus: z.union([
    z.literal('PENDING'),
    z.literal('RUNNING'),
    z.literal('FAILED'),
    z.literal('SUCCESS'),
    z.literal('CANCELLED'),
    z.literal('UNKNOWN'),
  ]),
  workflowApprovalRequired: z.boolean(),
  repositoryId: z.string(),
  repositoryName: z.string(),
  repositoryOwner: z.string(),
  providerType: z.union([z.literal('GITHUB'), z.literal('GITLAB'), z.literal('FORGEJO'), z.literal('GITEA')]),
  author: z.union([
    z.null(),
    z.strictObject({
      username: z.string(),
      displayName: z.union([z.null(), z.string()]),
      avatarUrl: z.union([z.null(), z.string()]),
      url: z.union([z.null(), z.string()]),
    }),
  ]),
  assignees: z.array(
    z.strictObject({
      username: z.string(),
      displayName: z.union([z.null(), z.string()]),
      avatarUrl: z.union([z.null(), z.string()]),
      url: z.union([z.null(), z.string()]),
    }),
  ),
  labels: z.array(
    z.strictObject({
      name: z.string(),
      color: z.union([z.null(), z.string()]),
      description: z.union([z.null(), z.string()]),
    }),
  ),
});

/** Shared IssueSummary boundary schema. */
export const ApiIssueSummarySchema = z.strictObject({
  open: z.number(),
  recentlyUpdated: z.number(),
  assigned: z.number(),
  stale: z.number(),
});

/** Shared PullRequestSummary boundary schema. */
export const ApiPullRequestSummarySchema = z.strictObject({
  open: z.number(),
  drafts: z.number(),
  failedWorkflows: z.number(),
  workflowApprovalRequired: z.number(),
});

/** Shared WorkItemFilterOptions boundary schema. */
export const ApiWorkItemFilterOptionsSchema = z.strictObject({
  labels: z.array(z.string()),
  authors: z.array(z.string()),
  assignees: z.array(z.string()),
  milestones: z.array(z.string()),
});

/** Shared PullRequestQuery boundary schema. */
export const ApiPullRequestQuerySchema = resourceQuerySchemas.PullRequest.extend({
  search: optionalInput(z.string().trim().max(1024)),
  labels: optionalInput(
    z
      .union([z.string().max(255), z.array(z.string().max(255))])
      .transform((value) => (typeof value === 'string' ? [value] : value)),
  ),
});
