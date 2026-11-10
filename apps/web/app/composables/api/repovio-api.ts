import type { AxiosResponse } from 'axios';
import { userSearchWhere } from '~/util/user-search';

import type { OidcCheckResult, OidcConfig, UpdateOidcConfig } from '~/types/api/auth';
import { apiEndpoints } from '~/types/api/endpoints';
import type {
  ApplicationSettings,
  BrowserPushEnrollment,
  BrowserPushStatus,
  ConnectGitHubApp,
  CreatedMcpAccessToken,
  CreateMcpAccessToken,
  CreateNotificationChannel,
  CreateOrganizationWebhook,
  CreateProviderAccount,
  CreateUser,
  DashboardPeriodQuery,
  DashboardSummary,
  DashboardWorkflowRun,
  GitHubAppConfiguration,
  GitHubAppInstallation,
  HealthResponse,
  Issue,
  IssueSummary,
  McpAccessToken,
  NotificationChannel,
  NotificationDelivery,
  NotificationEventSubscription,
  NotificationRulePreview,
  OrganizationWebhook,
  OrganizationWebhookDraft,
  PaginatedResource,
  ProviderAccount,
  ProviderAuthenticationOptions,
  ProviderOAuthAuthorization,
  ProviderRepository,
  PullRequest,
  PullRequestSummary,
  RecentNotifications,
  Repository,
  RepositoryDetail,
  RepositoryGroup,
  RepositoryHealth,
  RepositoryMembership,
  RepositorySyncJobSummary,
  RepositoryWebhookConfiguration,
  ResetUserPassword,
  RotateOrganizationWebhook,
  SaveGitHubApp,
  SaveUserGroup,
  SecurityAlert,
  SecurityAlertFilterOptions,
  SecurityAlertSummary,
  StartProviderOAuth,
  UpdateApplicationSettings,
  UpdateNotificationChannel,
  UpdateProviderAccount,
  User,
  UserGroup,
  WorkflowFilter,
  WorkflowRun,
  WorkflowRunTrendBucket,
  WorkflowRunTrendQuery,
  WorkItemFilterOptions,
} from '~/types/api/resources';
import { useApi } from './api';

/** Provide typed methods for Repovio's non-Query-Kit API endpoints. */
export function useRepovioApi() {
  const api = useApi();

  return {
    githubApp: {
      /** Fetches safe GitHub App setup metadata without credentials. */
      configuration: (): Promise<AxiosResponse<GitHubAppConfiguration>> => api.get(apiEndpoints.githubApp),
      /** Creates or rotates the configured GitHub App credentials. */
      save: (input: SaveGitHubApp): Promise<AxiosResponse<GitHubAppConfiguration>> =>
        api.put(apiEndpoints.githubApp, input),
      /** Removes GitHub App configuration after connected accounts are removed. */
      delete: (): Promise<AxiosResponse<void>> => api.delete(apiEndpoints.githubApp),
      /** Lists App installations and their local connection state. */
      installations: (): Promise<AxiosResponse<GitHubAppInstallation[]>> =>
        api.get(`${apiEndpoints.githubApp}/installations`),
      /** Creates a local provider account for the selected App installation. */
      connect: (input: ConnectGitHubApp): Promise<AxiosResponse<ProviderAccount>> =>
        api.post(`${apiEndpoints.githubApp}/installations`, input),
    },
    dashboard: {
      /** Retrieves awaiting approval. */
      getAwaitingApproval: (): Promise<AxiosResponse<DashboardWorkflowRun[]>> =>
        api.get(apiEndpoints.dashboard.awaitingApproval),
      /** Retrieves failures. */
      getFailures: (): Promise<AxiosResponse<DashboardWorkflowRun[]>> => api.get(apiEndpoints.dashboard.failures),
      /** Retrieves latest runs. */
      getLatestRuns: (): Promise<AxiosResponse<DashboardWorkflowRun[]>> => api.get(apiEndpoints.dashboard.latestRuns),
      /** Retrieves repository health. */
      getRepositoryHealth: (query: DashboardPeriodQuery): Promise<AxiosResponse<RepositoryHealth[]>> =>
        api.get(apiEndpoints.dashboard.repositories, { params: query }),
      /** Retrieves summary. */
      getSummary: (query: DashboardPeriodQuery): Promise<AxiosResponse<DashboardSummary>> =>
        api.get(apiEndpoints.dashboard.summary, { params: query }),
      /** Retrieves trend. */
      getTrend: (query: WorkflowRunTrendQuery): Promise<AxiosResponse<WorkflowRunTrendBucket[]>> =>
        api.get(apiEndpoints.dashboard.trend, { params: query }),
    },
    /** Fetches the API, database, and provider health snapshot. */
    health: (): Promise<AxiosResponse<HealthResponse>> => api.get(apiEndpoints.health),
    issues: {
      /** Fetches available issue filter values. */
      filterOptions: (): Promise<AxiosResponse<WorkItemFilterOptions>> =>
        api.get(`${apiEndpoints.issues}/filter-options`),
      /** Fetches issue details by identifier. */
      get: (id: string): Promise<AxiosResponse<Issue>> => api.get(`${apiEndpoints.issues}/${id}`),
      /** Lists issue resources belonging to the selected repository. */
      listForRepository: (repositoryId: string): Promise<AxiosResponse<PaginatedResource<Issue>>> =>
        api.get(apiEndpoints.issues, {
          params: {
            fields: 'id,number,title,state,providerUpdatedAt,url',
            orderBy: JSON.stringify([{ providerUpdatedAt: 'desc' }, { id: 'desc' }]),
            page: 1,
            perPage: 5,
            where: JSON.stringify({ repositoryId }),
          },
        }),
      /** Fetches aggregate issue counts and status. */
      summary: (): Promise<AxiosResponse<IssueSummary>> => api.get(`${apiEndpoints.issues}/summary`),
    },
    jobs: {
      /** Queues synchronization for the selected repository without changing provider resources. */
      start: (repositoryId: string): Promise<AxiosResponse<{ queuedCount: number }>> =>
        api.post(`${apiEndpoints.repositorySyncJobs}/${repositoryId}/run`),
      /** Queues all enabled repository synchronization jobs. */
      startAll: (): Promise<AxiosResponse<{ queuedCount: number }>> =>
        api.post(`${apiEndpoints.repositorySyncJobs}/run`),
      /** Fetches aggregate repository synchronization job counts and status. */
      summary: (): Promise<AxiosResponse<RepositorySyncJobSummary>> =>
        api.get(`${apiEndpoints.repositorySyncJobs}/summary`),
    },
    mcpTokens: {
      /** Creates a MCP access token from validated input. */
      create: (input: CreateMcpAccessToken): Promise<AxiosResponse<CreatedMcpAccessToken>> =>
        api.post(apiEndpoints.mcpTokens, input),
      /** Lists visible MCP access token resources. */
      list: (userId?: string): Promise<AxiosResponse<McpAccessToken[]>> =>
        api.get(apiEndpoints.mcpTokens, { params: { userId } }),
      /** Revokes the selected MCP access token. */
      revoke: (id: string): Promise<AxiosResponse<void>> => api.delete(`${apiEndpoints.mcpTokens}/${id}`),
    },
    notificationChannels: {
      /** Creates a notification channel from validated input. */
      create: (input: CreateNotificationChannel): Promise<AxiosResponse<NotificationChannel>> =>
        api.post(apiEndpoints.notificationChannels, input),
      /** Deletes the selected notification channel. */
      delete: (id: string): Promise<AxiosResponse<void>> => api.delete(`${apiEndpoints.notificationChannels}/${id}`),
      /** Lists visible notification channel resources. */
      list: (): Promise<AxiosResponse<NotificationChannel[]>> => api.get(apiEndpoints.notificationChannels),
      /** Lists repositories available for notification-rule management. */
      manageableRepositories: (): Promise<AxiosResponse<Array<{ id: string; name: string; owner: string }>>> =>
        api.get(`${apiEndpoints.notificationChannels}/manageable-repositories`),
      /** Previews notification-rule matches for the selected event subscriptions. */
      preview: (eventSubscriptions: NotificationEventSubscription[]): Promise<AxiosResponse<NotificationRulePreview>> =>
        api.post(`${apiEndpoints.notificationChannels}/preview`, { eventSubscriptions }),
      /** Sends a test delivery through the selected notification channel. */
      test: (id: string): Promise<AxiosResponse<NotificationDelivery>> =>
        api.post(`${apiEndpoints.notificationChannels}/${id}/test`),
      /** Persists the supplied notification channel changes. */
      update: (id: string, input: UpdateNotificationChannel): Promise<AxiosResponse<NotificationChannel>> =>
        api.patch(`${apiEndpoints.notificationChannels}/${id}`, input),
    },
    notifications: {
      /** Fetches at most five current-user deliveries with live repository authorization. */
      recent: (): Promise<AxiosResponse<RecentNotifications>> => api.get('/notifications/recent'),
    },
    browserPush: {
      /** Checks enrollment without disclosing another account's ownership. */
      enrolled: (endpoint: string): Promise<AxiosResponse<BrowserPushEnrollment>> =>
        api.post(`${apiEndpoints.browserPush}/subscriptions/status`, { endpoint }),
      /** Fetches browser-push availability and subscription state. */
      status: (): Promise<AxiosResponse<BrowserPushStatus>> => api.get(apiEndpoints.browserPush),
      /** Registers this browser push subscription for the authenticated user. */
      register: (subscription: PushSubscriptionJSON): Promise<AxiosResponse<void>> =>
        api.post(`${apiEndpoints.browserPush}/subscriptions`, {
          endpoint: subscription.endpoint,
          keys: subscription.keys,
        }),
      /** Unregisters the browser push subscription identified by its endpoint. */
      remove: (endpoint: string): Promise<AxiosResponse<void>> =>
        api.delete(`${apiEndpoints.browserPush}/subscriptions`, { data: { endpoint } }),
    },
    notificationDeliveries: {
      /** Lists visible notification delivery resources. */
      list: (repositoryId?: string): Promise<AxiosResponse<NotificationDelivery[]>> =>
        api.get(apiEndpoints.notificationDeliveries, { params: { repositoryId } }),
    },
    oidc: {
      /** Checks the configured OpenID Connect provider connectivity. */
      check: (): Promise<AxiosResponse<OidcCheckResult>> => api.post(apiEndpoints.auth.oidc.check),
      /** Fetches the current OpenID Connect configuration. */
      config: (): Promise<AxiosResponse<OidcConfig>> => api.get(apiEndpoints.auth.oidc.config),
      /** Persists the supplied OpenID Connect configuration changes. */
      update: (input: UpdateOidcConfig): Promise<AxiosResponse<OidcConfig>> =>
        api.put(apiEndpoints.auth.oidc.config, input),
    },
    providerAccounts: {
      /** Lists safe organization and GitLab group webhook configurations for one connection. */
      organizationWebhooks: (id: string): Promise<AxiosResponse<OrganizationWebhook[]>> =>
        api.get(`${apiEndpoints.providerAccounts.base}/${id}/organization-webhooks`),
      /** Preview canonical setup metadata without creating configuration. */
      organizationWebhookDraft: (id: string): Promise<AxiosResponse<OrganizationWebhookDraft>> =>
        api.get(`${apiEndpoints.providerAccounts.base}/${id}/organization-webhooks/draft`),
      /** Stores an immutable namespace and encrypted signing secret locally. */
      createOrganizationWebhook: (
        id: string,
        input: CreateOrganizationWebhook,
      ): Promise<AxiosResponse<OrganizationWebhook>> =>
        api.post(`${apiEndpoints.providerAccounts.base}/${id}/organization-webhooks`, input),
      /** Rotates the write-only signing secret without changing namespace or callback URL. */
      rotateOrganizationWebhook: (
        id: string,
        webhookId: string,
        input: RotateOrganizationWebhook,
      ): Promise<AxiosResponse<OrganizationWebhook>> =>
        api.patch(`${apiEndpoints.providerAccounts.base}/${id}/organization-webhooks/${webhookId}`, input),
      /** Removes only local configuration, retaining existing repository webhook secrets. */
      removeOrganizationWebhook: (id: string, webhookId: string): Promise<AxiosResponse<void>> =>
        api.delete(`${apiEndpoints.providerAccounts.base}/${id}/organization-webhooks/${webhookId}`),
      /** Starts in-place GitLab OAuth authorization using server-owned account metadata. */
      authorizeExisting: (id: string): Promise<AxiosResponse<ProviderOAuthAuthorization>> =>
        api.post(`${apiEndpoints.providerAccounts.base}/${id}/oauth`, {}),
      /** Starts the configured provider OAuth authorization flow. */
      authorize: (input: StartProviderOAuth): Promise<AxiosResponse<ProviderOAuthAuthorization>> =>
        api.post(apiEndpoints.providerAccounts.authorize, input),
      /** Fetches the supported provider authentication methods. */
      authenticationOptions: (): Promise<AxiosResponse<ProviderAuthenticationOptions>> =>
        api.get(apiEndpoints.providerAccounts.authenticationOptions),
      /** Creates a provider account from validated input. */
      create: (input: CreateProviderAccount): Promise<AxiosResponse<ProviderAccount>> =>
        api.post(apiEndpoints.providerAccounts.base, input),
      /** Deletes the selected provider account. */
      delete: (id: string): Promise<AxiosResponse<void>> => api.delete(`${apiEndpoints.providerAccounts.base}/${id}`),
      /** Lists visible provider account resources. */
      list: (): Promise<AxiosResponse<PaginatedResource<ProviderAccount>>> =>
        api.get(apiEndpoints.providerAccounts.base, {
          params: { fields: 'id,displayName,providerType,enabled', page: 1, perPage: 100 },
        }),
      /** Lists repositories. */
      listRepositories: (id: string): Promise<AxiosResponse<ProviderRepository[]>> =>
        api.get(`${apiEndpoints.providerAccounts.base}/${id}/repositories`),
      /** Adds repository. */
      addRepository: (id: string, providerRepositoryId: string): Promise<AxiosResponse<Repository>> =>
        api.post(`${apiEndpoints.providerAccounts.base}/${id}/repositories`, { providerRepositoryId }),
      /** Persists the supplied provider account changes. */
      update: (id: string, input: UpdateProviderAccount): Promise<AxiosResponse<ProviderAccount>> =>
        api.patch(`${apiEndpoints.providerAccounts.base}/${id}`, input),
    },
    pullRequests: {
      /** Fetches available pull request filter values. */
      filterOptions: (): Promise<AxiosResponse<WorkItemFilterOptions>> =>
        api.get(`${apiEndpoints.pullRequests}/filter-options`),
      /** Fetches pull request details by identifier. */
      get: (id: string): Promise<AxiosResponse<PullRequest>> => api.get(`${apiEndpoints.pullRequests}/${id}`),
      /** Lists pull request resources belonging to the selected repository. */
      listForRepository: (repositoryId: string): Promise<AxiosResponse<PaginatedResource<PullRequest>>> =>
        api.get(apiEndpoints.pullRequests, {
          params: {
            fields: 'id,number,title,state,providerUpdatedAt,url',
            orderBy: JSON.stringify([{ providerUpdatedAt: 'desc' }, { id: 'desc' }]),
            page: 1,
            perPage: 5,
            where: JSON.stringify({ repositoryId }),
          },
        }),
      /** Fetches aggregate pull request counts and status. */
      summary: (): Promise<AxiosResponse<PullRequestSummary>> => api.get(`${apiEndpoints.pullRequests}/summary`),
    },
    repositories: {
      /** Permanently delete local repository tracking and owned history; rejects while synchronization runs. */
      delete: (id: string): Promise<AxiosResponse<void>> => api.delete(`${apiEndpoints.repositories}/${id}`),
      /** Clears webhook configuration. */
      clearWebhookConfiguration: (id: string): Promise<AxiosResponse<void>> =>
        api.delete(`${apiEndpoints.repositories}/${id}/webhook-configuration`),
      /** Creates workflow filter. */
      createWorkflowFilter: (
        id: string,
        input: Pick<WorkflowFilter, 'mode' | 'pattern'>,
      ): Promise<AxiosResponse<WorkflowFilter>> =>
        api.post(`${apiEndpoints.repositories}/${id}/workflow-filters`, input),
      /** Deletes membership. */
      deleteMembership: (id: string, userId: string): Promise<AxiosResponse<void>> =>
        api.delete(`${apiEndpoints.repositories}/${id}/memberships/${userId}`),
      /** Deletes workflow filter. */
      deleteWorkflowFilter: (id: string, filterId: string): Promise<AxiosResponse<void>> =>
        api.delete(`${apiEndpoints.repositories}/${id}/workflow-filters/${filterId}`),
      /** Fetches repository details by identifier. */
      get: (id: string): Promise<AxiosResponse<RepositoryDetail>> => api.get(`${apiEndpoints.repositories}/${id}`),
      /** Lists visible repository resources. */
      list: (page: number): Promise<AxiosResponse<PaginatedResource<Pick<Repository, 'id' | 'name' | 'owner'>>>> =>
        api.get(apiEndpoints.repositories, {
          params: {
            fields: 'id,name,owner',
            orderBy: JSON.stringify([{ owner: 'asc' }, { name: 'asc' }, { id: 'asc' }]),
            page,
            perPage: 1_000,
          },
        }),
      /** Lists memberships. */
      listMemberships: (id: string): Promise<AxiosResponse<RepositoryMembership[]>> =>
        api.get(`${apiEndpoints.repositories}/${id}/memberships`),
      /** Lists workflow filters. */
      listWorkflowFilters: (id: string): Promise<AxiosResponse<WorkflowFilter[]>> =>
        api.get(`${apiEndpoints.repositories}/${id}/workflow-filters`),
      /** Fetches repository webhook setup states without exposing secrets. */
      webhookConfigurations: (): Promise<AxiosResponse<RepositoryWebhookConfiguration[]>> =>
        api.get(`${apiEndpoints.repositories}/webhook-configurations`),
      /** Refreshes the selected repository’s local metadata from its provider. */
      refresh: (id: string): Promise<AxiosResponse<Repository>> =>
        api.post(`${apiEndpoints.repositories}/${id}/refresh`),
      /** Queues a repository synchronization without changing provider resources. */
      sync: (id: string): Promise<AxiosResponse<void>> => api.post(`${apiEndpoints.repositories}/${id}/sync`),
      /** Sets webhook secret. */
      setWebhookSecret: (id: string, webhookSecret: string): Promise<AxiosResponse<RepositoryWebhookConfiguration>> =>
        api.put(`${apiEndpoints.repositories}/${id}/webhook-configuration`, { webhookSecret }),
      /** Persists the supplied repository changes. */
      update: (
        id: string,
        input: Partial<
          Pick<Repository, 'enabled' | 'issueRetentionDays' | 'pullRequestRetentionDays' | 'workflowRunRetentionDays'>
        >,
      ): Promise<AxiosResponse<void>> => api.patch(`${apiEndpoints.repositories}/${id}`, input),
      /** Creates or replaces a user role on the selected repository. */
      upsertMembership: (
        id: string,
        userId: string,
        input: Pick<RepositoryMembership, 'role'>,
      ): Promise<AxiosResponse<RepositoryMembership>> =>
        api.put(`${apiEndpoints.repositories}/${id}/memberships/${userId}`, input),
    },
    securityAlerts: {
      /** Fetches available security alert filter values. */
      filterOptions: (): Promise<AxiosResponse<SecurityAlertFilterOptions>> =>
        api.get(`${apiEndpoints.securityAlerts}/filter-options`),
      /** Fetches security alert details by identifier. */
      get: (id: string): Promise<AxiosResponse<SecurityAlert>> => api.get(`${apiEndpoints.securityAlerts}/${id}`),
      /** Lists security alert resources belonging to the selected repository. */
      listForRepository: (repositoryId: string): Promise<AxiosResponse<PaginatedResource<SecurityAlert>>> =>
        api.get(apiEndpoints.securityAlerts, {
          params: {
            fields: 'id,title,kind,state,severity,providerUpdatedAt,providerUrl',
            orderBy: JSON.stringify([{ providerUpdatedAt: 'desc' }, { id: 'desc' }]),
            page: 1,
            perPage: 5,
            where: JSON.stringify({ repositoryId }),
          },
        }),
      /** Fetches aggregate security alert counts and status. */
      summary: (): Promise<AxiosResponse<SecurityAlertSummary>> => api.get(`${apiEndpoints.securityAlerts}/summary`),
    },
    workflowRuns: {
      /** Lists workflow run resources belonging to the selected repository. */
      listForRepository: (repositoryId: string): Promise<AxiosResponse<PaginatedResource<WorkflowRun>>> =>
        api.get(apiEndpoints.workflowRuns, {
          params: {
            fields: 'id,displayTitle,workflowName,status,completedAt,providerCreatedAt,url',
            orderBy: JSON.stringify([{ providerCreatedAt: 'desc' }, { id: 'desc' }]),
            page: 1,
            perPage: 5,
            where: JSON.stringify({ repositoryId }),
          },
        }),
    },
    settings: {
      /** Fetches application settings details by identifier. */
      get: (): Promise<AxiosResponse<ApplicationSettings>> => api.get(apiEndpoints.settings.base),
      /** Persists the supplied application settings changes. */
      update: (input: UpdateApplicationSettings): Promise<AxiosResponse<ApplicationSettings>> =>
        api.patch(apiEndpoints.settings.base, input),
    },
    userGroups: {
      /** Creates a local group. */
      create: (input: SaveUserGroup): Promise<AxiosResponse<UserGroup>> => api.post(apiEndpoints.userGroups, input),
      /** Renames a group without altering its grants. */
      rename: (id: string, input: SaveUserGroup): Promise<AxiosResponse<UserGroup>> =>
        api.put(`${apiEndpoints.userGroups}/${id}`, input),
      /** Deletes a group and only its inherited grants. */
      delete: (id: string): Promise<AxiosResponse<void>> => api.delete(`${apiEndpoints.userGroups}/${id}`),
      /** Searches groups with server-side pagination. */
      search: (name: string, page = 1): Promise<AxiosResponse<PaginatedResource<UserGroup>>> =>
        api.get(apiEndpoints.userGroups, {
          params: {
            page,
            perPage: 10,
            where: JSON.stringify({ name: { contains: name, mode: 'insensitive' } }),
            orderBy: JSON.stringify([{ name: 'asc' }, { id: 'asc' }]),
          },
        }),
      /** Lists the selected group's members with server-side pagination. */
      members: (id: string, page = 1): Promise<AxiosResponse<PaginatedResource<User>>> =>
        api.get(`${apiEndpoints.userGroups}/${id}/members`, { params: { page, perPage: 10 } }),
      /** Adds an existing user idempotently. */
      addMember: (id: string, userId: string): Promise<AxiosResponse<void>> =>
        api.put(`${apiEndpoints.userGroups}/${id}/members/${userId}`),
      /** Removes membership while preserving other grants. */
      removeMember: (id: string, userId: string): Promise<AxiosResponse<void>> =>
        api.delete(`${apiEndpoints.userGroups}/${id}/members/${userId}`),
      /** Lists repository group assignments. */
      repositoryGrants: (repositoryId: string): Promise<AxiosResponse<RepositoryGroup[]>> =>
        api.get(`${apiEndpoints.repositories}/${repositoryId}/group-memberships`),
      /** Sets one group's inherited repository role. */
      setRepositoryGrant: (
        repositoryId: string,
        groupId: string,
        role: RepositoryGroup['role'],
      ): Promise<AxiosResponse<RepositoryGroup>> =>
        api.put(`${apiEndpoints.repositories}/${repositoryId}/group-memberships/${groupId}`, { role }),
      /** Removes a group's repository grant. */
      removeRepositoryGrant: (repositoryId: string, groupId: string): Promise<AxiosResponse<void>> =>
        api.delete(`${apiEndpoints.repositories}/${repositoryId}/group-memberships/${groupId}`),
    },
    users: {
      /** Searches users without silently truncating installations with more than 100 accounts. */
      search: (search: string, page = 1): Promise<AxiosResponse<PaginatedResource<User>>> =>
        api.get(apiEndpoints.users, {
          params: {
            page,
            perPage: 10,
            where: JSON.stringify(userSearchWhere(search)),
            orderBy: JSON.stringify([{ username: 'asc' }, { id: 'asc' }]),
          },
        }),
      /** Creates a local account without linking an external identity. */
      create: (input: CreateUser): Promise<AxiosResponse<User>> => api.post(apiEndpoints.users, input),
      /** Replaces a local account password and invalidates its JWT sessions. */
      resetPassword: (id: string, input: ResetUserPassword): Promise<AxiosResponse<void>> =>
        api.put(`${apiEndpoints.users}/${id}/password`, input),
      /** Deletes the selected user. */
      delete: (id: string): Promise<AxiosResponse<void>> => api.delete(`${apiEndpoints.users}/${id}`),
      /** Lists visible user resources. */
      list: (): Promise<AxiosResponse<PaginatedResource<User>>> =>
        api.get(apiEndpoints.users, {
          params: {
            fields: 'id,username,firstName,lastName,role,authProvider,avatarSource,avatarUpdatedAt,createdAt,updatedAt',
            page: 1,
            perPage: 100,
          },
        }),
    },
    /** Fetches application version information. */
    version: (): Promise<AxiosResponse<{ latest: string | null }>> => api.get(apiEndpoints.version),
  };
}
