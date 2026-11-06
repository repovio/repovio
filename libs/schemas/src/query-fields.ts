/** Explicit fields supported by public resource-query contracts. Credentials and internal model data are excluded. */
export const queryFields = {
  IssueAssignee: {
    actor: {
      type: 'ProviderActor',
      list: false,
      nullable: false,
    },
  },
  IssueLabel: {
    label: {
      type: 'WorkItemLabel',
      list: false,
      nullable: false,
    },
  },
  Issue: {
    id: {
      type: 'String',
      list: false,
      nullable: false,
    },
    createdAt: {
      type: 'DateTime',
      list: false,
      nullable: false,
    },
    updatedAt: {
      type: 'DateTime',
      list: false,
      nullable: false,
    },
    number: {
      type: 'String',
      list: false,
      nullable: false,
    },
    title: {
      type: 'String',
      list: false,
      nullable: false,
    },
    body: {
      type: 'String',
      list: false,
      nullable: true,
    },
    state: {
      type: 'IssueState',
      list: false,
      nullable: false,
    },
    url: {
      type: 'String',
      list: false,
      nullable: false,
    },
    providerCreatedAt: {
      type: 'DateTime',
      list: false,
      nullable: false,
    },
    providerUpdatedAt: {
      type: 'DateTime',
      list: false,
      nullable: false,
    },
    closedAt: {
      type: 'DateTime',
      list: false,
      nullable: true,
    },
    milestone: {
      type: 'String',
      list: false,
      nullable: true,
    },
    repositoryId: {
      type: 'String',
      list: false,
      nullable: false,
    },
    repository: {
      type: 'Repository',
      list: false,
      nullable: false,
    },
    author: {
      type: 'ProviderActor',
      list: false,
      nullable: true,
    },
    assignees: {
      type: 'IssueAssignee',
      list: true,
      nullable: false,
    },
    labels: {
      type: 'IssueLabel',
      list: true,
      nullable: false,
    },
  },
  NotificationChannelRecipient: {
    notificationChannelId: {
      type: 'String',
      list: false,
      nullable: false,
    },
    notificationChannel: {
      type: 'NotificationChannel',
      list: false,
      nullable: false,
    },
    userId: {
      type: 'String',
      list: false,
      nullable: false,
    },
    user: {
      type: 'User',
      list: false,
      nullable: false,
    },
  },
  NotificationChannel: {
    id: {
      type: 'String',
      list: false,
      nullable: false,
    },
    createdAt: {
      type: 'DateTime',
      list: false,
      nullable: false,
    },
    updatedAt: {
      type: 'DateTime',
      list: false,
      nullable: false,
    },
    name: {
      type: 'String',
      list: false,
      nullable: false,
    },
    type: {
      type: 'NotificationChannelType',
      list: false,
      nullable: false,
    },
    enabled: {
      type: 'Boolean',
      list: false,
      nullable: false,
    },
    recipients: {
      type: 'NotificationChannelRecipient',
      list: true,
      nullable: false,
    },
    eventSubscriptions: {
      type: 'NotificationEventSubscription',
      list: true,
      nullable: false,
    },
  },
  NotificationDelivery: {
    id: {
      type: 'String',
      list: false,
      nullable: false,
    },
    createdAt: {
      type: 'DateTime',
      list: false,
      nullable: false,
    },
    updatedAt: {
      type: 'DateTime',
      list: false,
      nullable: false,
    },
    kind: {
      type: 'NotificationDeliveryKind',
      list: false,
      nullable: false,
    },
    eventType: {
      type: 'NotificationEventType',
      list: false,
      nullable: true,
    },
    status: {
      type: 'NotificationDeliveryStatus',
      list: false,
      nullable: false,
    },
    nextAttemptAt: {
      type: 'DateTime',
      list: false,
      nullable: true,
    },
    notificationChannelId: {
      type: 'String',
      list: false,
      nullable: false,
    },
    notificationChannel: {
      type: 'NotificationChannel',
      list: false,
      nullable: false,
    },
    repositoryId: {
      type: 'String',
      list: false,
      nullable: true,
    },
    repository: {
      type: 'Repository',
      list: false,
      nullable: true,
    },
  },
  NotificationEventSubscription: {
    id: {
      type: 'String',
      list: false,
      nullable: false,
    },
    createdAt: {
      type: 'DateTime',
      list: false,
      nullable: false,
    },
    updatedAt: {
      type: 'DateTime',
      list: false,
      nullable: false,
    },
    eventType: {
      type: 'NotificationEventType',
      list: false,
      nullable: false,
    },
    notificationChannelId: {
      type: 'String',
      list: false,
      nullable: false,
    },
    notificationChannel: {
      type: 'NotificationChannel',
      list: false,
      nullable: false,
    },
    repositories: {
      type: 'NotificationEventSubscriptionRepository',
      list: true,
      nullable: false,
    },
  },
  NotificationEventSubscriptionRepository: {
    repositoryId: {
      type: 'String',
      list: false,
      nullable: false,
    },
    repository: {
      type: 'Repository',
      list: false,
      nullable: false,
    },
  },
  ProviderAccount: {
    authenticationMethod: { type: 'String', list: false, nullable: false },
    githubInstallationState: { type: 'String', list: false, nullable: true },
    id: {
      type: 'String',
      list: false,
      nullable: false,
    },
    createdAt: {
      type: 'DateTime',
      list: false,
      nullable: false,
    },
    updatedAt: {
      type: 'DateTime',
      list: false,
      nullable: false,
    },
    providerType: {
      type: 'ProviderType',
      list: false,
      nullable: false,
    },
    displayName: {
      type: 'String',
      list: false,
      nullable: false,
    },
    baseUrl: {
      type: 'String',
      list: false,
      nullable: true,
    },
    enabled: {
      type: 'Boolean',
      list: false,
      nullable: false,
    },
    lastSyncAt: {
      type: 'DateTime',
      list: false,
      nullable: true,
    },
    repositories: {
      type: 'Repository',
      list: true,
      nullable: false,
    },
  },
  ProviderActor: {
    id: {
      type: 'String',
      list: false,
      nullable: false,
    },
    createdAt: {
      type: 'DateTime',
      list: false,
      nullable: false,
    },
    updatedAt: {
      type: 'DateTime',
      list: false,
      nullable: false,
    },
    username: {
      type: 'String',
      list: false,
      nullable: false,
    },
    displayName: {
      type: 'String',
      list: false,
      nullable: true,
    },
    url: {
      type: 'String',
      list: false,
      nullable: true,
    },
    providerAccountId: {
      type: 'String',
      list: false,
      nullable: false,
    },
    providerAccount: {
      type: 'ProviderAccount',
      list: false,
      nullable: false,
    },
  },
  PullRequestAssignee: {
    actor: {
      type: 'ProviderActor',
      list: false,
      nullable: false,
    },
  },
  PullRequestLabel: {
    label: {
      type: 'WorkItemLabel',
      list: false,
      nullable: false,
    },
  },
  PullRequest: {
    id: {
      type: 'String',
      list: false,
      nullable: false,
    },
    createdAt: {
      type: 'DateTime',
      list: false,
      nullable: false,
    },
    updatedAt: {
      type: 'DateTime',
      list: false,
      nullable: false,
    },
    number: {
      type: 'String',
      list: false,
      nullable: false,
    },
    title: {
      type: 'String',
      list: false,
      nullable: false,
    },
    body: {
      type: 'String',
      list: false,
      nullable: true,
    },
    state: {
      type: 'PullRequestState',
      list: false,
      nullable: false,
    },
    draft: {
      type: 'Boolean',
      list: false,
      nullable: false,
    },
    sourceBranch: {
      type: 'String',
      list: false,
      nullable: false,
    },
    targetBranch: {
      type: 'String',
      list: false,
      nullable: false,
    },
    url: {
      type: 'String',
      list: false,
      nullable: false,
    },
    providerCreatedAt: {
      type: 'DateTime',
      list: false,
      nullable: false,
    },
    providerUpdatedAt: {
      type: 'DateTime',
      list: false,
      nullable: false,
    },
    closedAt: {
      type: 'DateTime',
      list: false,
      nullable: true,
    },
    mergedAt: {
      type: 'DateTime',
      list: false,
      nullable: true,
    },
    workflowStatus: {
      type: 'PullRequestWorkflowStatus',
      list: false,
      nullable: false,
    },
    workflowApprovalRequired: {
      type: 'Boolean',
      list: false,
      nullable: false,
    },
    repositoryId: {
      type: 'String',
      list: false,
      nullable: false,
    },
    repository: {
      type: 'Repository',
      list: false,
      nullable: false,
    },
    author: {
      type: 'ProviderActor',
      list: false,
      nullable: true,
    },
    assignees: {
      type: 'PullRequestAssignee',
      list: true,
      nullable: false,
    },
    labels: {
      type: 'PullRequestLabel',
      list: true,
      nullable: false,
    },
  },
  RepositoryMembership: {
    id: {
      type: 'String',
      list: false,
      nullable: false,
    },
    createdAt: {
      type: 'DateTime',
      list: false,
      nullable: false,
    },
    updatedAt: {
      type: 'DateTime',
      list: false,
      nullable: false,
    },
    role: {
      type: 'RepositoryRole',
      list: false,
      nullable: false,
    },
    userId: {
      type: 'String',
      list: false,
      nullable: false,
    },
    user: {
      type: 'User',
      list: false,
      nullable: false,
    },
    repositoryId: {
      type: 'String',
      list: false,
      nullable: false,
    },
    repository: {
      type: 'Repository',
      list: false,
      nullable: false,
    },
  },
  RepositorySyncRequest: {
    id: {
      type: 'String',
      list: false,
      nullable: false,
    },
    createdAt: {
      type: 'DateTime',
      list: false,
      nullable: false,
    },
    updatedAt: {
      type: 'DateTime',
      list: false,
      nullable: false,
    },
    status: {
      type: 'RepositorySyncRequestStatus',
      list: false,
      nullable: false,
    },
    requestedAt: {
      type: 'DateTime',
      list: false,
      nullable: false,
    },
    runAfter: {
      type: 'DateTime',
      list: false,
      nullable: false,
    },
    attempt: {
      type: 'Int',
      list: false,
      nullable: false,
    },
    startedAt: {
      type: 'DateTime',
      list: false,
      nullable: true,
    },
    repositoryId: {
      type: 'String',
      list: false,
      nullable: false,
    },
    repository: {
      type: 'Repository',
      list: false,
      nullable: false,
    },
  },
  Repository: {
    id: {
      type: 'String',
      list: false,
      nullable: false,
    },
    createdAt: {
      type: 'DateTime',
      list: false,
      nullable: false,
    },
    updatedAt: {
      type: 'DateTime',
      list: false,
      nullable: false,
    },
    providerRepositoryId: {
      type: 'String',
      list: false,
      nullable: false,
    },
    owner: {
      type: 'String',
      list: false,
      nullable: false,
    },
    name: {
      type: 'String',
      list: false,
      nullable: false,
    },
    url: {
      type: 'String',
      list: false,
      nullable: false,
    },
    enabled: {
      type: 'Boolean',
      list: false,
      nullable: false,
    },
    lastSyncAt: {
      type: 'DateTime',
      list: false,
      nullable: true,
    },
    providerAccountId: {
      type: 'String',
      list: false,
      nullable: false,
    },
    providerAccount: {
      type: 'ProviderAccount',
      list: false,
      nullable: false,
    },
    memberships: {
      type: 'RepositoryMembership',
      list: true,
      nullable: false,
    },
    securityAlertSyncStates: {
      type: 'SecurityAlertSyncState',
      list: true,
      nullable: false,
    },
    syncRequest: {
      type: 'RepositorySyncRequest',
      list: false,
      nullable: true,
    },
    workflowRunRetentionDays: {
      type: 'Int',
      list: false,
      nullable: true,
    },
    issueRetentionDays: {
      type: 'Int',
      list: false,
      nullable: true,
    },
    pullRequestRetentionDays: {
      type: 'Int',
      list: false,
      nullable: true,
    },
  },
  SecurityAlert: {
    id: {
      type: 'String',
      list: false,
      nullable: false,
    },
    createdAt: {
      type: 'DateTime',
      list: false,
      nullable: false,
    },
    updatedAt: {
      type: 'DateTime',
      list: false,
      nullable: false,
    },
    kind: {
      type: 'SecurityAlertKind',
      list: false,
      nullable: false,
    },
    state: {
      type: 'SecurityAlertState',
      list: false,
      nullable: false,
    },
    severity: {
      type: 'SecurityAlertSeverity',
      list: false,
      nullable: false,
    },
    title: {
      type: 'String',
      list: false,
      nullable: false,
    },
    scanner: {
      type: 'String',
      list: false,
      nullable: true,
    },
    providerCreatedAt: {
      type: 'DateTime',
      list: false,
      nullable: false,
    },
    providerUpdatedAt: {
      type: 'DateTime',
      list: false,
      nullable: false,
    },
    resolvedAt: {
      type: 'DateTime',
      list: false,
      nullable: true,
    },
    resolution: {
      type: 'String',
      list: false,
      nullable: true,
    },
    packageName: {
      type: 'String',
      list: false,
      nullable: true,
    },
    ecosystem: {
      type: 'String',
      list: false,
      nullable: true,
    },
    manifest: {
      type: 'String',
      list: false,
      nullable: true,
    },
    ruleId: {
      type: 'String',
      list: false,
      nullable: true,
    },
    tool: {
      type: 'String',
      list: false,
      nullable: true,
    },
    secretType: {
      type: 'String',
      list: false,
      nullable: true,
    },
    secretProvider: {
      type: 'String',
      list: false,
      nullable: true,
    },
    repositoryId: {
      type: 'String',
      list: false,
      nullable: false,
    },
    repository: {
      type: 'Repository',
      list: false,
      nullable: false,
    },
  },
  SecurityAlertSyncState: {
    id: {
      type: 'String',
      list: false,
      nullable: false,
    },
    createdAt: {
      type: 'DateTime',
      list: false,
      nullable: false,
    },
    updatedAt: {
      type: 'DateTime',
      list: false,
      nullable: false,
    },
    kind: {
      type: 'SecurityAlertKind',
      list: false,
      nullable: false,
    },
    repositoryId: {
      type: 'String',
      list: false,
      nullable: false,
    },
    repository: {
      type: 'Repository',
      list: false,
      nullable: false,
    },
  },
  User: {
    id: {
      type: 'String',
      list: false,
      nullable: false,
    },
    createdAt: {
      type: 'DateTime',
      list: false,
      nullable: false,
    },
    updatedAt: {
      type: 'DateTime',
      list: false,
      nullable: false,
    },
    username: {
      type: 'String',
      list: false,
      nullable: false,
    },
    firstName: {
      type: 'String',
      list: false,
      nullable: true,
    },
    lastName: {
      type: 'String',
      list: false,
      nullable: true,
    },
    authProvider: {
      type: 'AuthProvider',
      list: false,
      nullable: false,
    },
    role: {
      type: 'UserRole',
      list: false,
      nullable: false,
    },
  },
  WorkItemLabel: {
    id: {
      type: 'String',
      list: false,
      nullable: false,
    },
    createdAt: {
      type: 'DateTime',
      list: false,
      nullable: false,
    },
    updatedAt: {
      type: 'DateTime',
      list: false,
      nullable: false,
    },
    name: {
      type: 'String',
      list: false,
      nullable: false,
    },
    normalizedName: {
      type: 'String',
      list: false,
      nullable: false,
    },
    repositoryId: {
      type: 'String',
      list: false,
      nullable: false,
    },
    repository: {
      type: 'Repository',
      list: false,
      nullable: false,
    },
  },
  WorkflowRun: {
    id: {
      type: 'String',
      list: false,
      nullable: false,
    },
    createdAt: {
      type: 'DateTime',
      list: false,
      nullable: false,
    },
    updatedAt: {
      type: 'DateTime',
      list: false,
      nullable: false,
    },
    providerRunId: {
      type: 'String',
      list: false,
      nullable: false,
    },
    workflowName: {
      type: 'String',
      list: false,
      nullable: false,
    },
    displayTitle: {
      type: 'String',
      list: false,
      nullable: false,
    },
    url: {
      type: 'String',
      list: false,
      nullable: false,
    },
    providerCreatedAt: {
      type: 'DateTime',
      list: false,
      nullable: false,
    },
    startedAt: {
      type: 'DateTime',
      list: false,
      nullable: true,
    },
    completedAt: {
      type: 'DateTime',
      list: false,
      nullable: true,
    },
    durationMs: {
      type: 'BigInt',
      list: false,
      nullable: true,
    },
    status: {
      type: 'WorkflowRunStatus',
      list: false,
      nullable: false,
    },
    awaitingApproval: {
      type: 'Boolean',
      list: false,
      nullable: false,
    },
    event: {
      type: 'String',
      list: false,
      nullable: true,
    },
    scopeKey: {
      type: 'String',
      list: false,
      nullable: false,
    },
    workflowId: {
      type: 'String',
      list: false,
      nullable: false,
    },
    workflow: {
      type: 'Workflow',
      list: false,
      nullable: false,
    },
    repositoryId: {
      type: 'String',
      list: false,
      nullable: false,
    },
    repository: {
      type: 'Repository',
      list: false,
      nullable: false,
    },
  },
  Workflow: {
    id: {
      type: 'String',
      list: false,
      nullable: false,
    },
    createdAt: {
      type: 'DateTime',
      list: false,
      nullable: false,
    },
    updatedAt: {
      type: 'DateTime',
      list: false,
      nullable: false,
    },
    name: {
      type: 'String',
      list: false,
      nullable: false,
    },
    path: {
      type: 'String',
      list: false,
      nullable: true,
    },
    kind: {
      type: 'WorkflowKind',
      list: false,
      nullable: false,
    },
    repositoryId: {
      type: 'String',
      list: false,
      nullable: false,
    },
    repository: {
      type: 'Repository',
      list: false,
      nullable: false,
    },
  },
} as const;

/** Enum values accepted by the public resource filters. */
export const queryEnums = {
  AuthProvider: ['LOCAL', 'OIDC'],
  IssueState: ['OPEN', 'CLOSED'],
  NotificationChannelType: ['EMAIL', 'GOTIFY', 'NTFY', 'DISCORD', 'CUSTOM_APPRISE', 'BROWSER_PUSH'],
  NotificationDeliveryKind: ['EVENT', 'TEST'],
  NotificationDeliveryStatus: ['PENDING', 'DELIVERED', 'FAILED'],
  NotificationEventType: [
    'WORKFLOW_RUN_SUCCEEDED',
    'WORKFLOW_RUN_FAILED',
    'WORKFLOW_RUN_RECOVERED',
    'PULL_REQUEST_OPENED',
    'PULL_REQUEST_CLOSED',
    'PULL_REQUEST_REOPENED',
    'PULL_REQUEST_MERGED',
    'ISSUE_OPENED',
    'ISSUE_CLOSED',
    'ISSUE_REOPENED',
    'DEPENDENCY_ALERT_OPENED',
    'DEPENDENCY_ALERT_RESOLVED',
    'CODE_ALERT_OPENED',
    'CODE_ALERT_RESOLVED',
    'SECRET_ALERT_OPENED',
    'SECRET_ALERT_RESOLVED',
  ],
  ProviderType: ['GITHUB', 'GITLAB', 'FORGEJO', 'GITEA'],
  PullRequestState: ['OPEN', 'CLOSED', 'MERGED'],
  PullRequestWorkflowStatus: ['PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'CANCELLED', 'UNKNOWN'],
  RepositoryRole: ['VIEWER', 'MANAGER'],
  RepositorySyncRequestStatus: ['PENDING', 'RUNNING', 'FAILED', 'WARNING'],
  SecurityAlertKind: ['DEPENDENCY', 'CODE', 'SECRET'],
  SecurityAlertState: ['OPEN', 'RESOLVED', 'DISMISSED'],
  SecurityAlertSeverity: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO', 'UNKNOWN'],
  UserRole: ['SYSTEM_ADMIN', 'VIEWER', 'MANAGER'],
  WorkflowKind: ['STANDARD', 'DEPENDABOT_INTERNAL'],
  WorkflowRunStatus: ['QUEUED', 'RUNNING', 'SUCCESS', 'FAILED', 'CANCELLED', 'SKIPPED', 'UNKNOWN'],
} as const;
