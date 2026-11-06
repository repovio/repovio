/** Resources protected by Repovio authorization policies. */
export enum CaslSubject {
  All = 'all',
  User = 'User',
  UserGroup = 'UserGroup',
  ProviderAccount = 'ProviderAccount',
  Repository = 'Repository',
  WorkflowRun = 'WorkflowRun',
  Issue = 'Issue',
  PullRequest = 'PullRequest',
  SecurityAlert = 'SecurityAlert',
  NotificationChannel = 'NotificationChannel',
  NotificationDelivery = 'NotificationDelivery',
  Settings = 'Settings',
}
