import { z } from 'zod';
import {
  ApiApplicationSettingsSchema,
  ApiBrowserPushStatusSchema,
  ApiCreatedMcpAccessTokenSchema,
  ApiCreateMcpAccessTokenSchema,
  ApiCreateNotificationChannelSchema,
  ApiCreateProviderAccountSchema,
  ApiDashboardPeriodQuerySchema,
  ApiDashboardProviderSchema,
  ApiDashboardRepositorySchema,
  ApiDashboardStatusDistributionSchema,
  ApiDashboardSummarySchema,
  ApiDashboardWorkflowRunSchema,
  ApiIssueSchema,
  ApiIssueSummarySchema,
  ApiMcpAccessTokenSchema,
  ApiNotificationChannelSchema,
  ApiNotificationDeliveryAttemptSchema,
  ApiNotificationDeliverySchema,
  ApiNotificationRulePreviewSchema,
  ApiOidcConfigSchema,
  ApiOidcStatusSchema,
  ApiProviderAccountSchema,
  ApiProviderRepositorySchema,
  ApiPullRequestSchema,
  ApiPullRequestSummarySchema,
  ApiRepositoryDetailSchema,
  ApiRepositoryHealthSchema,
  ApiRepositoryMembershipSchema,
  ApiRepositoryMemberSummarySchema,
  ApiRepositorySchema,
  ApiRepositorySyncJobSchema,
  ApiRepositorySyncJobSummarySchema,
  ApiRepositoryWebhookConfigurationSchema,
  ApiSecurityAlertFilterOptionsSchema,
  ApiSecurityAlertSchema,
  ApiSecurityAlertSummarySchema,
  ApiSetupSchema,
  ApiSignInSchema,
  ApiStartProviderOAuthSchema,
  ApiUpdateApplicationSettingsSchema,
  ApiUpdateNotificationChannelSchema,
  ApiUpdateOidcConfigSchema,
  ApiUpdatePasswordSchema,
  ApiUpdateProfileSchema,
  ApiUpdateProviderAccountSchema,
  ApiUserSchema,
  ApiWorkflowFilterSchema,
  ApiWorkflowRunSchema,
  ApiWorkflowRunTrendBucketSchema,
  ApiWorkflowRunTrendQuerySchema,
  ApiWorkItemActorSchema,
  ApiWorkItemFilterOptionsSchema,
  ApiWorkItemLabelSchema,
} from './api-contracts.js';

/** Roles that can be returned for an authenticated Repovio user. */
export const userRoles = ['SYSTEM_ADMIN', 'VIEWER', 'MANAGER'] as const;

/** Validate local sign-in credentials before submitting them to the API. */
export const signInRequestSchema = ApiSignInSchema.extend({ username: ApiSignInSchema.shape.username.min(1) });

/** Validate a password-change request before submitting it to the API. */
export const updatePasswordRequestSchema = ApiUpdatePasswordSchema.extend({
  currentPassword: ApiUpdatePasswordSchema.shape.currentPassword.min(1),
});

/** Validate the first administrator form, including its client-only password confirmation. */
export const setupFormSchema = ApiSetupSchema.extend({
  confirmPassword: z.string().min(1),
  firstName: ApiUpdateProfileSchema.shape.firstName.unwrap(),
  lastName: ApiUpdateProfileSchema.shape.lastName.unwrap(),
});

/** Add a localized password-confirmation error to the first-run form schema. */
export function createSetupFormSchema(passwordMismatchMessage: string) {
  return setupFormSchema.refine((value) => value.password === value.confirmPassword, {
    message: passwordMismatchMessage,
    path: ['confirmPassword'],
  });
}

/** Validate the password settings form, including its client-only confirmation. */
export const updatePasswordFormSchema = updatePasswordRequestSchema.extend({ confirmPassword: z.string().min(1) });

/** Add a localized password-confirmation error to the password settings schema. */
export function createUpdatePasswordFormSchema(passwordMismatchMessage: string) {
  return updatePasswordFormSchema.refine((value) => value.newPassword === value.confirmPassword, {
    message: passwordMismatchMessage,
    path: ['confirmPassword'],
  });
}

/** Validate editable personal identity fields before submitting them to the API. */
export const updateProfileRequestSchema = ApiUpdateProfileSchema.extend({
  firstName: ApiUpdateProfileSchema.shape.firstName.unwrap(),
  lastName: ApiUpdateProfileSchema.shape.lastName.unwrap(),
});

/** Application-wide date and time presentation supported by the API. */
export const defaultDateTimeFormats = ['LOCALE_SHORT', 'LOCALE_MEDIUM', 'ISO'] as const;

/** Validate global settings before sending an administrative update. */
export const applicationSettingsSchema = ApiUpdateApplicationSettingsSchema;

/** Source forge type for a configured provider account. */
export const providerTypes = ['GITHUB', 'GITLAB', 'FORGEJO', 'GITEA'] as const;

/** Validate the fields required for an OAuth provider authorization. */
export const providerOAuthFormSchema = ApiCreateProviderAccountSchema.omit({ accessToken: true, enabled: true }).extend(
  {
    baseUrl: ApiCreateProviderAccountSchema.shape.baseUrl.or(z.literal('')),
    displayName: ApiCreateProviderAccountSchema.shape.displayName.trim().min(1),
  },
);

/** Validate the fields required for a personal-access-token provider account. */
export const providerPatFormSchema = providerOAuthFormSchema
  .extend({
    accessToken: z.string().min(1).max(4096),
    baseUrl: z.string().url().optional().or(z.literal('')),
  })
  .superRefine((provider, context) => {
    if (provider.providerType === 'GITEA' && !provider.baseUrl) {
      context.addIssue({ code: 'custom', message: 'A Gitea base URL is required.', path: ['baseUrl'] });
    }
  });

export const systemStatusEvent = 'system-status';

export const providerSyncActivitySchema = z.object({
  kind: z.literal('PROVIDER_SYNC'),
  phase: z.enum(['LOADING_REPOSITORIES', 'FETCHING_WORKFLOWS', 'PROCESSING_WORKFLOWS']),
  repositoriesCompleted: z.number().int().nonnegative(),
  repositoriesTotal: z.number().int().nonnegative(),
  workflowRunsCompleted: z.number().int().nonnegative().nullable(),
  workflowRunsTotal: z.number().int().nonnegative().nullable(),
});

export const systemStatusSnapshotSchema = z.object({
  activity: providerSyncActivitySchema.nullable(),
  runningWorkflowCount: z.number().int().nonnegative(),
  updatedAt: z.string(),
});

/** Shared SetupRequest transport contract. */
export const SetupRequestSchema = ApiSetupSchema;
export type SetupRequest = z.output<typeof SetupRequestSchema>;

/** Shared SetupStatus transport contract. */
export const SetupStatusSchema = z.strictObject({
  initialized: z.boolean(),
});
export type SetupStatus = z.output<typeof SetupStatusSchema>;

/** Shared UpdateProfileRequest transport contract. */
export const UpdateProfileRequestSchema = ApiUpdateProfileSchema;
export type UpdateProfileRequest = z.output<typeof UpdateProfileRequestSchema>;

/** Shared AuthenticatedUser transport contract. */
export const AuthenticatedUserSchema = z.strictObject({
  authProvider: z.union([z.literal('LOCAL'), z.literal('OIDC')]),
  avatarUpdatedAt: z.union([z.string(), z.null()]),
  firstName: z.union([z.string(), z.null()]),
  id: z.string(),
  lastName: z.union([z.string(), z.null()]),
  role: z.enum(userRoles),
  username: z.string(),
});
export type AuthenticatedUser = z.output<typeof AuthenticatedUserSchema>;

/** Shared AuthResult transport contract. */
export const AuthResultSchema = z.strictObject({
  accessToken: z.string(),
  user: AuthenticatedUserSchema,
});
export type AuthResult = z.output<typeof AuthResultSchema>;

/** Shared OidcStatus transport contract. */
export const OidcStatusSchema = ApiOidcStatusSchema;
export type OidcStatus = z.output<typeof OidcStatusSchema>;

/** Shared OidcConfig transport contract. */
export const OidcConfigSchema = ApiOidcConfigSchema;
export type OidcConfig = z.output<typeof OidcConfigSchema>;

/** Shared UpdateOidcConfig transport contract. */
export const UpdateOidcConfigSchema = ApiUpdateOidcConfigSchema;
export type UpdateOidcConfig = z.output<typeof UpdateOidcConfigSchema>;

/** Shared OidcCheckResult transport contract. */
export const OidcCheckResultSchema = z.strictObject({
  code: z.string().optional(),
  endpoints: z
    .strictObject({
      authorization: z.boolean(),
      jwks: z.boolean(),
      token: z.boolean(),
      userinfo: z.boolean(),
    })
    .optional(),
  idTokenAlgorithm: z.string().optional(),
  issuer: z.string().optional(),
  ok: z.boolean(),
  tokenEndpointAuthenticationMethod: z
    .union([z.literal('client_secret_basic'), z.literal('client_secret_post'), z.literal('none')])
    .optional(),
  warnings: z.array(z.string()).optional(),
});
export type OidcCheckResult = z.output<typeof OidcCheckResultSchema>;

/** Shared OidcExchangeResult transport contract. */
export const OidcExchangeResultSchema = AuthResultSchema.extend(
  z.strictObject({
    returnTo: z.string(),
  }).shape,
);
export type OidcExchangeResult = z.output<typeof OidcExchangeResultSchema>;

/** Shared ApiTimestamp transport contract. */
export const ApiTimestampSchema = z.string();
export type ApiTimestamp = z.output<typeof ApiTimestampSchema>;

/** Shared DefaultDateTimeFormat transport contract. */
export const DefaultDateTimeFormatSchema = z.enum(defaultDateTimeFormats);
export type DefaultDateTimeFormat = z.output<typeof DefaultDateTimeFormatSchema>;

/** Shared ApplicationSettings transport contract. */
export const ApplicationSettingsSchema = ApiApplicationSettingsSchema;
export type ApplicationSettings = z.output<typeof ApplicationSettingsSchema>;

/** Shared UpdateApplicationSettings transport contract. */
export const UpdateApplicationSettingsSchema = ApiUpdateApplicationSettingsSchema;
export type UpdateApplicationSettings = z.output<typeof UpdateApplicationSettingsSchema>;

/** Shared McpAccessTokenStatus transport contract. */
export const McpAccessTokenStatusSchema = z.union([z.literal('ACTIVE'), z.literal('EXPIRED'), z.literal('REVOKED')]);
export type McpAccessTokenStatus = z.output<typeof McpAccessTokenStatusSchema>;

/** Shared McpAccessToken transport contract. */
export const McpAccessTokenSchema = ApiMcpAccessTokenSchema;
export type McpAccessToken = z.output<typeof McpAccessTokenSchema>;

/** Shared CreatedMcpAccessToken transport contract. */
export const CreatedMcpAccessTokenSchema = ApiCreatedMcpAccessTokenSchema;
export type CreatedMcpAccessToken = z.output<typeof CreatedMcpAccessTokenSchema>;

/** Shared CreateMcpAccessToken transport contract. */
export const CreateMcpAccessTokenSchema = ApiCreateMcpAccessTokenSchema;
export type CreateMcpAccessToken = z.output<typeof CreateMcpAccessTokenSchema>;

/** Shared ProviderType transport contract. */
export const ProviderTypeSchema = z.enum(providerTypes);
export type ProviderType = z.output<typeof ProviderTypeSchema>;

/** Shared ProviderAccount transport contract. */
export const ProviderAccountSchema = ApiProviderAccountSchema;
export type ProviderAccount = z.output<typeof ProviderAccountSchema>;

/** Shared RepositoryWebhookConfiguration transport contract. */
export const RepositoryWebhookConfigurationSchema = ApiRepositoryWebhookConfigurationSchema;
export type RepositoryWebhookConfiguration = z.output<typeof RepositoryWebhookConfigurationSchema>;

/** Shared ProviderRepository transport contract. */
export const ProviderRepositorySchema = ApiProviderRepositorySchema;
export type ProviderRepository = z.output<typeof ProviderRepositorySchema>;

/** Shared RepositorySyncJobStatus transport contract. */
export const RepositorySyncJobStatusSchema = z.union([
  z.literal('IDLE'),
  z.literal('PENDING'),
  z.literal('RUNNING'),
  z.literal('FAILED'),
  z.literal('WARNING'),
]);
export type RepositorySyncJobStatus = z.output<typeof RepositorySyncJobStatusSchema>;

/** Shared RepositorySyncProgressPhase transport contract. */
export const RepositorySyncProgressPhaseSchema = z.union([
  z.literal('LOADING_REPOSITORY'),
  z.literal('SYNCING_ISSUES'),
  z.literal('SYNCING_PULL_REQUESTS'),
  z.literal('SYNCING_ALERTS'),
  z.literal('FETCHING_WORKFLOWS'),
  z.literal('PROCESSING_WORKFLOWS'),
  z.literal('REFRESHING_CHANGE_REQUESTS'),
]);
export type RepositorySyncProgressPhase = z.output<typeof RepositorySyncProgressPhaseSchema>;

/** Shared SecurityAlertKind transport contract. */
export const SecurityAlertKindSchema = z.union([z.literal('DEPENDENCY'), z.literal('CODE'), z.literal('SECRET')]);
export type SecurityAlertKind = z.output<typeof SecurityAlertKindSchema>;

/** Shared RepositorySyncJob transport contract. */
export const RepositorySyncJobSchema = ApiRepositorySyncJobSchema;
export type RepositorySyncJob = z.output<typeof RepositorySyncJobSchema>;

/** Shared RepositorySyncJobSummary transport contract. */
export const RepositorySyncJobSummarySchema = ApiRepositorySyncJobSummarySchema;
export type RepositorySyncJobSummary = z.output<typeof RepositorySyncJobSummarySchema>;

/** Shared StartProviderOAuth transport contract. */
export const StartProviderOAuthSchema = ApiStartProviderOAuthSchema;
export type StartProviderOAuth = z.output<typeof StartProviderOAuthSchema>;

/** Shared CreateProviderAccount transport contract. */
export const CreateProviderAccountSchema = ApiCreateProviderAccountSchema;
export type CreateProviderAccount = z.output<typeof CreateProviderAccountSchema>;

/** Shared ProviderOAuthAuthorization transport contract. */
export const ProviderOAuthAuthorizationSchema = z.strictObject({
  authorizationUrl: z.string(),
});
export type ProviderOAuthAuthorization = z.output<typeof ProviderOAuthAuthorizationSchema>;

/** Shared ProviderAuthenticationOptions transport contract. */
export const ProviderAuthenticationOptionsSchema = z.strictObject({
  oauthProviderTypes: z.array(ProviderTypeSchema),
});
export type ProviderAuthenticationOptions = z.output<typeof ProviderAuthenticationOptionsSchema>;

/** Shared UpdateProviderAccount transport contract. */
export const UpdateProviderAccountSchema = ApiUpdateProviderAccountSchema;
export type UpdateProviderAccount = z.output<typeof UpdateProviderAccountSchema>;

/** Shared RepositoryMemberSummary transport contract. */
export const RepositoryMemberSummarySchema = ApiRepositoryMemberSummarySchema;
export type RepositoryMemberSummary = z.output<typeof RepositoryMemberSummarySchema>;

/** Shared Repository transport contract. */
export const RepositorySchema = ApiRepositorySchema;
export type Repository = z.output<typeof RepositorySchema>;

/** Shared RepositoryDetail transport contract. */
export const RepositoryDetailSchema = ApiRepositoryDetailSchema;
export type RepositoryDetail = z.output<typeof RepositoryDetailSchema>;

/** Shared WorkflowFilter transport contract. */
export const WorkflowFilterSchema = ApiWorkflowFilterSchema;
export type WorkflowFilter = z.output<typeof WorkflowFilterSchema>;

/** Shared RepositoryRole transport contract. */
export const RepositoryRoleSchema = z.union([z.literal('VIEWER'), z.literal('MANAGER')]);
export type RepositoryRole = z.output<typeof RepositoryRoleSchema>;

/** Shared User transport contract. */
export const UserSchema = ApiUserSchema;
export type User = z.output<typeof UserSchema>;

/** Shared RepositoryMembership transport contract. */
export const RepositoryMembershipSchema = ApiRepositoryMembershipSchema;
export type RepositoryMembership = z.output<typeof RepositoryMembershipSchema>;

/** Shared WorkflowRunStatus transport contract. */
export const WorkflowRunStatusSchema = z.union([
  z.literal('QUEUED'),
  z.literal('RUNNING'),
  z.literal('SUCCESS'),
  z.literal('FAILED'),
  z.literal('CANCELLED'),
  z.literal('SKIPPED'),
  z.literal('UNKNOWN'),
]);
export type WorkflowRunStatus = z.output<typeof WorkflowRunStatusSchema>;

/** Shared DashboardProvider transport contract. */
export const DashboardProviderSchema = ApiDashboardProviderSchema;
export type DashboardProvider = z.output<typeof DashboardProviderSchema>;

/** Shared DashboardRepository transport contract. */
export const DashboardRepositorySchema = ApiDashboardRepositorySchema;
export type DashboardRepository = z.output<typeof DashboardRepositorySchema>;

/** Shared DashboardWorkflowRun transport contract. */
export const DashboardWorkflowRunSchema = ApiDashboardWorkflowRunSchema;
export type DashboardWorkflowRun = z.output<typeof DashboardWorkflowRunSchema>;

/** Shared DashboardStatusDistribution transport contract. */
export const DashboardStatusDistributionSchema = ApiDashboardStatusDistributionSchema;
export type DashboardStatusDistribution = z.output<typeof DashboardStatusDistributionSchema>;

/** Shared DashboardSummary transport contract. */
export const DashboardSummarySchema = ApiDashboardSummarySchema;
export type DashboardSummary = z.output<typeof DashboardSummarySchema>;

/** Shared RepositoryHealth transport contract. */
export const RepositoryHealthSchema = ApiRepositoryHealthSchema;
export type RepositoryHealth = z.output<typeof RepositoryHealthSchema>;

/** Shared TrendBucketSize transport contract. */
export const TrendBucketSizeSchema = z.union([z.literal('hour'), z.literal('day'), z.literal('week')]);
export type TrendBucketSize = z.output<typeof TrendBucketSizeSchema>;

/** Shared DashboardPeriodQuery transport contract. */
export const DashboardPeriodQuerySchema = ApiDashboardPeriodQuerySchema;
export type DashboardPeriodQuery = z.output<typeof DashboardPeriodQuerySchema>;

/** Shared WorkflowRunTrendQuery transport contract. */
export const WorkflowRunTrendQuerySchema = ApiWorkflowRunTrendQuerySchema;
export type WorkflowRunTrendQuery = z.output<typeof WorkflowRunTrendQuerySchema>;

/** Shared WorkflowRunTrendBucket transport contract. */
export const WorkflowRunTrendBucketSchema = ApiWorkflowRunTrendBucketSchema;
export type WorkflowRunTrendBucket = z.output<typeof WorkflowRunTrendBucketSchema>;

/** Shared WorkflowRun transport contract. */
export const WorkflowRunSchema = ApiWorkflowRunSchema;
export type WorkflowRun = z.output<typeof WorkflowRunSchema>;

/** Shared WorkItemActor transport contract. */
export const WorkItemActorSchema = ApiWorkItemActorSchema;
export type WorkItemActor = z.output<typeof WorkItemActorSchema>;

/** Shared WorkItemLabel transport contract. */
export const WorkItemLabelSchema = ApiWorkItemLabelSchema;
export type WorkItemLabel = z.output<typeof WorkItemLabelSchema>;

/** Shared WorkItemBase transport contract. */
export const WorkItemBaseSchema = z.strictObject({
  assignees: z.array(WorkItemActorSchema),
  author: z.union([WorkItemActorSchema, z.null()]),
  body: z.union([z.string(), z.null()]).optional(),
  closedAt: z.union([ApiTimestampSchema, z.null()]),
  id: z.string(),
  labels: z.array(WorkItemLabelSchema),
  number: z.string(),
  providerCreatedAt: ApiTimestampSchema,
  providerType: ProviderTypeSchema,
  providerUpdatedAt: ApiTimestampSchema,
  repositoryId: z.string(),
  repositoryName: z.string(),
  repositoryOwner: z.string(),
  title: z.string(),
  url: z.string(),
});
export type WorkItemBase = z.output<typeof WorkItemBaseSchema>;

/** Shared Issue transport contract. */
export const IssueSchema = ApiIssueSchema;
export type Issue = z.output<typeof IssueSchema>;

/** Shared PullRequest transport contract. */
export const PullRequestSchema = ApiPullRequestSchema;
export type PullRequest = z.output<typeof PullRequestSchema>;

/** Shared IssueSummary transport contract. */
export const IssueSummarySchema = ApiIssueSummarySchema;
export type IssueSummary = z.output<typeof IssueSummarySchema>;

/** Shared PullRequestSummary transport contract. */
export const PullRequestSummarySchema = ApiPullRequestSummarySchema;
export type PullRequestSummary = z.output<typeof PullRequestSummarySchema>;

/** Shared WorkItemFilterOptions transport contract. */
export const WorkItemFilterOptionsSchema = ApiWorkItemFilterOptionsSchema;
export type WorkItemFilterOptions = z.output<typeof WorkItemFilterOptionsSchema>;

/** Shared SecurityAlertState transport contract. */
export const SecurityAlertStateSchema = z.union([z.literal('OPEN'), z.literal('RESOLVED'), z.literal('DISMISSED')]);
export type SecurityAlertState = z.output<typeof SecurityAlertStateSchema>;

/** Shared SecurityAlertSeverity transport contract. */
export const SecurityAlertSeveritySchema = z.union([
  z.literal('CRITICAL'),
  z.literal('HIGH'),
  z.literal('MEDIUM'),
  z.literal('LOW'),
  z.literal('INFO'),
  z.literal('UNKNOWN'),
]);
export type SecurityAlertSeverity = z.output<typeof SecurityAlertSeveritySchema>;

/** Shared SecurityAlert transport contract. */
export const SecurityAlertSchema = ApiSecurityAlertSchema;
export type SecurityAlert = z.output<typeof SecurityAlertSchema>;

/** Shared SecurityAlertSummary transport contract. */
export const SecurityAlertSummarySchema = ApiSecurityAlertSummarySchema;
export type SecurityAlertSummary = z.output<typeof SecurityAlertSummarySchema>;

/** Shared SecurityAlertFilterOptions transport contract. */
export const SecurityAlertFilterOptionsSchema = ApiSecurityAlertFilterOptionsSchema;
export type SecurityAlertFilterOptions = z.output<typeof SecurityAlertFilterOptionsSchema>;

/** Shared NotificationChannelType transport contract. */
export const NotificationChannelTypeSchema = z.union([
  z.literal('EMAIL'),
  z.literal('GOTIFY'),
  z.literal('NTFY'),
  z.literal('DISCORD'),
  z.literal('CUSTOM_APPRISE'),
  z.literal('BROWSER_PUSH'),
]);
export type NotificationChannelType = z.output<typeof NotificationChannelTypeSchema>;

/** Shared NotificationChannelConfiguration transport contract. */
export const NotificationChannelConfigurationSchema = z.union([
  z.strictObject({
    from: z.string(),
    password: z.string().optional(),
    port: z.number().optional(),
    recipients: z.array(z.string()),
    security: z.union([z.literal('NONE'), z.literal('STARTTLS'), z.literal('TLS')]),
    smtpHost: z.string(),
    username: z.string().optional(),
  }),
  z.strictObject({
    priority: z.union([z.literal('low'), z.literal('moderate'), z.literal('normal'), z.literal('high')]).optional(),
    serverUrl: z.string(),
    token: z.string(),
  }),
  z.strictObject({
    password: z.string().optional(),
    priority: z
      .union([z.literal('min'), z.literal('low'), z.literal('default'), z.literal('high'), z.literal('max')])
      .optional(),
    serverUrl: z.string().optional(),
    token: z.string().optional(),
    topic: z.string(),
    username: z.string().optional(),
  }),
  z.strictObject({
    webhookUrl: z.string(),
  }),
  z.strictObject({
    url: z.string(),
  }),
]);
export type NotificationChannelConfiguration = z.output<typeof NotificationChannelConfigurationSchema>;

/** Shared NotificationEventType transport contract. */
export const NotificationEventTypeSchema = z.union([
  z.literal('WORKFLOW_RUN_SUCCEEDED'),
  z.literal('WORKFLOW_RUN_FAILED'),
  z.literal('WORKFLOW_RUN_RECOVERED'),
  z.literal('PULL_REQUEST_OPENED'),
  z.literal('PULL_REQUEST_CLOSED'),
  z.literal('PULL_REQUEST_REOPENED'),
  z.literal('PULL_REQUEST_MERGED'),
  z.literal('ISSUE_OPENED'),
  z.literal('ISSUE_CLOSED'),
  z.literal('ISSUE_REOPENED'),
  z.literal('DEPENDENCY_ALERT_OPENED'),
  z.literal('DEPENDENCY_ALERT_RESOLVED'),
  z.literal('CODE_ALERT_OPENED'),
  z.literal('CODE_ALERT_RESOLVED'),
  z.literal('SECRET_ALERT_OPENED'),
  z.literal('SECRET_ALERT_RESOLVED'),
]);
export type NotificationEventType = z.output<typeof NotificationEventTypeSchema>;

/** Shared NotificationEventSubscription transport contract. */
export const NotificationEventSubscriptionSchema = z.strictObject({
  eventType: NotificationEventTypeSchema,
  repositoryIds: z.array(z.string()),
  workflowPatterns: z.array(z.string()),
});
export type NotificationEventSubscription = z.output<typeof NotificationEventSubscriptionSchema>;

/** Shared NotificationRulePreviewStatus transport contract. */
export const NotificationRulePreviewStatusSchema = z.union([
  z.literal('MATCHES'),
  z.literal('NO_RESULTS'),
  z.literal('NEVER_SYNCHRONIZED'),
  z.literal('SYNCHRONIZATION_FAILED'),
  z.literal('PARTIAL'),
]);
export type NotificationRulePreviewStatus = z.output<typeof NotificationRulePreviewStatusSchema>;

/** Shared NotificationRulePreview transport contract. */
export const NotificationRulePreviewSchema = ApiNotificationRulePreviewSchema;
export type NotificationRulePreview = z.output<typeof NotificationRulePreviewSchema>;

/** Shared NotificationChannel transport contract. */
export const NotificationChannelSchema = ApiNotificationChannelSchema;
export type NotificationChannel = z.output<typeof NotificationChannelSchema>;

/** Shared CreateNotificationChannel transport contract. */
export const CreateNotificationChannelSchema = ApiCreateNotificationChannelSchema;
export type CreateNotificationChannel = z.output<typeof CreateNotificationChannelSchema>;

/** Shared UpdateNotificationChannel transport contract. */
export const UpdateNotificationChannelSchema = ApiUpdateNotificationChannelSchema;
export type UpdateNotificationChannel = z.output<typeof UpdateNotificationChannelSchema>;

/** Shared NotificationDeliveryStatus transport contract. */
export const NotificationDeliveryStatusSchema = z.union([
  z.literal('PENDING'),
  z.literal('DELIVERED'),
  z.literal('FAILED'),
]);
export type NotificationDeliveryStatus = z.output<typeof NotificationDeliveryStatusSchema>;

/** Shared NotificationDeliveryAttempt transport contract. */
export const NotificationDeliveryAttemptSchema = ApiNotificationDeliveryAttemptSchema;
export type NotificationDeliveryAttempt = z.output<typeof NotificationDeliveryAttemptSchema>;

/** Shared NotificationDelivery transport contract. */
export const NotificationDeliverySchema = ApiNotificationDeliverySchema;
export type NotificationDelivery = z.output<typeof NotificationDeliverySchema>;

/** Shared BrowserPushStatus transport contract. */
export const BrowserPushStatusSchema = ApiBrowserPushStatusSchema;
export type BrowserPushStatus = z.output<typeof BrowserPushStatusSchema>;

/** Shared ProviderAccountHealth transport contract. */
export const ProviderAccountHealthSchema = z.strictObject({
  displayName: z.string(),
  enabled: z.boolean(),
  id: z.string(),
  lastSyncAt: z.union([ApiTimestampSchema, z.null()]),
  providerType: ProviderTypeSchema,
  syncStatus: z.union([z.literal('disabled'), z.literal('failed'), z.literal('healthy'), z.literal('unknown')]),
});
export type ProviderAccountHealth = z.output<typeof ProviderAccountHealthSchema>;

/** Shared HealthResponse transport contract. */
export const HealthResponseSchema = z.strictObject({
  api: z.literal('ok'),
  database: z.union([z.literal('error'), z.literal('ok')]),
  providers: z.array(ProviderAccountHealthSchema),
  status: z.union([z.literal('degraded'), z.literal('ok')]),
});
export type HealthResponse = z.output<typeof HealthResponseSchema>;

/** Local sign-in request payload. */
export type SignInRequest = z.output<typeof signInRequestSchema>;

/** First-run administrator form state. */
export type SetupForm = z.output<typeof setupFormSchema>;

/** Password-change request payload. */
export type UpdatePasswordRequest = z.output<typeof updatePasswordRequestSchema>;

/** Password settings form state. */
export type UpdatePasswordForm = z.output<typeof updatePasswordFormSchema>;

/** Browser form state validated before a personal profile update. */
export type UpdateProfileForm = z.output<typeof updateProfileRequestSchema>;

export type ProviderSyncActivity = z.output<typeof providerSyncActivitySchema>;

export type SystemStatusSnapshot = z.output<typeof systemStatusSnapshotSchema>;

/** Pagination envelope shared by resource endpoints. */
export const pageMetaSchema = z.strictObject({
  hasNextPage: z.boolean(),
  hasPrevPage: z.boolean(),
  itemCount: z.number().int().nonnegative(),
  page: z.number().int().min(1),
  pageCount: z.number().int().nonnegative(),
  perPage: z.number().int().min(1),
});
export function createPaginatedSchema<T extends z.ZodType>(item: T) {
  return z.strictObject({ items: z.array(item), meta: pageMetaSchema });
}
export type PaginatedResource<T> = { items: T[]; meta: z.output<typeof pageMetaSchema> };

/** Latest public release metadata. */
export const LatestVersionResponseSchema = z.strictObject({ latest: z.string().nullable() });
export type LatestVersionResponse = z.output<typeof LatestVersionResponseSchema>;
/** Safe HTTP error envelope, without validation input or secrets. */
export const HttpErrorSchema = z.strictObject({
  error: z.string(),
  message: z.union([z.string(), z.array(z.string())]),
  statusCode: z.number().int(),
});
export type HttpError = z.output<typeof HttpErrorSchema>;
