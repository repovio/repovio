import { z } from 'zod';

import { resourceQuerySchema, resourceQuerySchemas } from '../queries.js';

import { httpsUrlSchema, optionalInput } from './validation.js';

/** Shared BrowserPushStatus boundary schema. */
export const ApiBrowserPushStatusSchema = z.strictObject({
  available: z.boolean(),
  publicKey: z.union([z.null(), z.string()]),
  subscriptionCount: z.number(),
});

/** Shared RegisterBrowserPushSubscription boundary schema. */
export const ApiRegisterBrowserPushSubscriptionSchema = z.strictObject({
  endpoint: httpsUrlSchema.max(4096),
  keys: z.strictObject({ auth: z.unknown().optional(), p256dh: z.unknown().optional() }),
});

/** Shared RemoveBrowserPushSubscription boundary schema. */
export const ApiRemoveBrowserPushSubscriptionSchema = z.strictObject({
  endpoint: httpsUrlSchema.max(4096),
});

/** Shared NotificationEventSubscriptionInput boundary schema. */
export const ApiNotificationEventSubscriptionInputSchema = z.strictObject({
  eventType: z.union([
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
  ]),
  repositoryIds: optionalInput(
    z
      .array(z.uuid())
      .refine(
        /** Validates input against `new Set(value).size === value.length`. */ (value) =>
          new Set(value).size === value.length,
        { message: 'Duplicate values are not allowed.' },
      ),
  ),
  workflowPatterns: optionalInput(
    z
      .array(z.string().max(1024))
      .refine(
        /** Validates input against `new Set(value).size === value.length`. */ (value) =>
          new Set(value).size === value.length,
        { message: 'Duplicate values are not allowed.' },
      ),
  ),
});

/** Shared NotificationRulePreviewInput boundary schema. */
export const ApiNotificationRulePreviewInputSchema = z.strictObject({
  eventSubscriptions: z.array(ApiNotificationEventSubscriptionInputSchema).min(1),
});

/** Shared NotificationRulePreviewMatch boundary schema. */
export const ApiNotificationRulePreviewMatchSchema = z.strictObject({
  eventType: z.union([
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
  ]),
  id: z.string(),
  repositoryName: z.string(),
  repositoryOwner: z.string(),
  url: z.string(),
  workflowName: z.string(),
});

/** Shared NotificationRulePreview boundary schema. */
export const ApiNotificationRulePreviewSchema = z.strictObject({
  matches: z.array(
    z.strictObject({
      eventType: z.union([
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
      ]),
      id: z.string(),
      repositoryName: z.string(),
      repositoryOwner: z.string(),
      url: z.string(),
      workflowName: z.string(),
    }),
  ),
  status: z.union([
    z.literal('MATCHES'),
    z.literal('NO_RESULTS'),
    z.literal('NEVER_SYNCHRONIZED'),
    z.literal('SYNCHRONIZATION_FAILED'),
    z.literal('PARTIAL'),
  ]),
});

/** Shared NotificationChannel boundary schema. */
export const ApiNotificationChannelSchema = z.strictObject({
  id: z.string(),
  name: z.string(),
  type: z.union([
    z.literal('EMAIL'),
    z.literal('GOTIFY'),
    z.literal('NTFY'),
    z.literal('DISCORD'),
    z.literal('CUSTOM_APPRISE'),
    z.literal('BROWSER_PUSH'),
  ]),
  enabled: z.boolean(),
  urlScheme: z.union([z.null(), z.string()]),
  eventSubscriptions: z.array(
    z.strictObject({
      eventType: z.union([
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
      ]),
      repositoryIds: z.array(z.string()),
      workflowPatterns: z.array(z.string()),
    }),
  ),
  browserRecipients: z.array(z.strictObject({ id: z.string(), username: z.string() })),
  canManage: z.boolean(),
  requiresReconfiguration: z.boolean(),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
});

/** Shared CreateNotificationChannel boundary schema. */
export const ApiCreateNotificationChannelSchema = z.strictObject({
  name: z.string().max(255),
  type: optionalInput(
    z.union([
      z.literal('EMAIL'),
      z.literal('GOTIFY'),
      z.literal('NTFY'),
      z.literal('DISCORD'),
      z.literal('CUSTOM_APPRISE'),
      z.literal('BROWSER_PUSH'),
    ]),
  ),
  eventSubscriptions: z.array(ApiNotificationEventSubscriptionInputSchema).min(1),
  browserRecipientUserIds: optionalInput(
    z
      .array(z.uuid())
      .refine(
        /** Validates input against `new Set(value).size === value.length`. */ (value) =>
          new Set(value).size === value.length,
        { message: 'Duplicate values are not allowed.' },
      ),
  ),
  configuration: optionalInput(
    z.union([
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
          .union([z.literal('default'), z.literal('low'), z.literal('high'), z.literal('min'), z.literal('max')])
          .optional(),
        serverUrl: z.string().optional(),
        token: z.string().optional(),
        topic: z.string(),
        username: z.string().optional(),
      }),
      z.strictObject({ webhookUrl: z.string() }),
      z.strictObject({ url: z.string() }),
    ]),
  ),
  url: optionalInput(z.string().max(4096)),
  enabled: optionalInput(z.boolean()),
});

/** Shared UpdateNotificationChannel boundary schema. */
export const ApiUpdateNotificationChannelSchema = z.strictObject({
  name: optionalInput(z.string().max(255)),
  eventSubscriptions: optionalInput(z.array(ApiNotificationEventSubscriptionInputSchema).min(1)),
  browserRecipientUserIds: optionalInput(
    z
      .array(z.uuid())
      .refine(
        /** Validates input against `new Set(value).size === value.length`. */ (value) =>
          new Set(value).size === value.length,
        { message: 'Duplicate values are not allowed.' },
      ),
  ),
  configuration: optionalInput(
    z.union([
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
          .union([z.literal('default'), z.literal('low'), z.literal('high'), z.literal('min'), z.literal('max')])
          .optional(),
        serverUrl: z.string().optional(),
        token: z.string().optional(),
        topic: z.string(),
        username: z.string().optional(),
      }),
      z.strictObject({ webhookUrl: z.string() }),
      z.strictObject({ url: z.string() }),
    ]),
  ),
  url: optionalInput(z.string().max(4096)),
  enabled: optionalInput(z.boolean()),
});

/** Shared NotificationDeliveryAttempt boundary schema. */
export const ApiNotificationDeliveryAttemptSchema = z.strictObject({
  id: z.string(),
  notificationChannelId: z.string(),
  notificationChannelName: z.string(),
  notificationChannelType: z.union([
    z.literal('EMAIL'),
    z.literal('GOTIFY'),
    z.literal('NTFY'),
    z.literal('DISCORD'),
    z.literal('CUSTOM_APPRISE'),
    z.literal('BROWSER_PUSH'),
  ]),
  browserPushSubscriptionId: z.union([z.null(), z.string()]),
  deviceLabel: z.union([z.null(), z.string()]),
  attempt: z.number(),
  deliveredAt: z.union([z.null(), z.iso.datetime({ offset: true })]),
  error: z.union([z.null(), z.string()]),
  createdAt: z.iso.datetime({ offset: true }),
});

/** Shared NotificationDelivery boundary schema. */
export const ApiNotificationDeliverySchema = z.strictObject({
  id: z.string(),
  kind: z.union([z.literal('EVENT'), z.literal('TEST')]),
  eventType: z.union([
    z.null(),
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
  ]),
  notificationChannelId: z.string(),
  notificationChannelName: z.string(),
  notificationChannelType: z.union([
    z.literal('EMAIL'),
    z.literal('GOTIFY'),
    z.literal('NTFY'),
    z.literal('DISCORD'),
    z.literal('CUSTOM_APPRISE'),
    z.literal('BROWSER_PUSH'),
  ]),
  repositoryId: z.union([z.null(), z.string()]),
  repositoryOwner: z.union([z.null(), z.string()]),
  repositoryName: z.union([z.null(), z.string()]),
  subjectKind: z.union([
    z.null(),
    z.literal('WORKFLOW_RUN'),
    z.literal('PULL_REQUEST'),
    z.literal('ISSUE'),
    z.literal('SECURITY_ALERT'),
  ]),
  subjectTitle: z.union([z.null(), z.string()]),
  subjectUrl: z.union([z.null(), z.string()]),
  requestedByUsername: z.union([z.null(), z.string()]),
  status: z.union([z.literal('PENDING'), z.literal('FAILED'), z.literal('DELIVERED')]),
  finalError: z.union([z.null(), z.string()]),
  nextAttemptAt: z.union([z.null(), z.iso.datetime({ offset: true })]),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
  attempts: z.array(
    z.strictObject({
      id: z.string(),
      notificationChannelId: z.string(),
      notificationChannelName: z.string(),
      notificationChannelType: z.union([
        z.literal('EMAIL'),
        z.literal('GOTIFY'),
        z.literal('NTFY'),
        z.literal('DISCORD'),
        z.literal('CUSTOM_APPRISE'),
        z.literal('BROWSER_PUSH'),
      ]),
      browserPushSubscriptionId: z.union([z.null(), z.string()]),
      deviceLabel: z.union([z.null(), z.string()]),
      attempt: z.number(),
      deliveredAt: z.union([z.null(), z.iso.datetime({ offset: true })]),
      error: z.union([z.null(), z.string()]),
      createdAt: z.iso.datetime({ offset: true }),
    }),
  ),
});

/** Shared NotificationSearchQuery boundary schema. */
export const ApiNotificationSearchQuerySchema = resourceQuerySchema.extend({
  search: z.string().trim().max(1024).optional(),
});

/** Shared NotificationChannelQuery boundary schema. */
export const ApiNotificationChannelQuerySchema = resourceQuerySchemas.NotificationChannel.extend(
  ApiNotificationSearchQuerySchema.pick({ search: true }).shape,
);

/** Shared NotificationDeliveryQuery boundary schema. */
export const ApiNotificationDeliveryQuerySchema = resourceQuerySchemas.NotificationDelivery.extend(
  ApiNotificationSearchQuerySchema.pick({ search: true }).shape,
);

/** Current-device endpoint lookup; endpoint content is never placed in a query string. */
export const ApiBrowserPushLookupSchema = ApiRemoveBrowserPushSubscriptionSchema;

/** Safe enrollment lookup without foreign ownership metadata. */
export const ApiBrowserPushEnrollmentSchema = z.strictObject({ enrolled: z.boolean() });

/** Recipient-scoped summary of one logical delivery, without transport credentials. */
export const ApiRecentNotificationSchema = z.strictObject({
  id: z.uuid(),
  createdAt: z.iso.datetime({ offset: true }),
  kind: ApiNotificationDeliverySchema.shape.kind,
  eventType: ApiNotificationDeliverySchema.shape.eventType,
  repository: z.strictObject({ id: z.uuid(), owner: z.string(), name: z.string() }).nullable(),
  subjectTitle: z.string(),
  subjectUrl: z.url({ protocol: /^https?$/ }).nullable(),
  status: ApiNotificationDeliverySchema.shape.status,
});

/** Five newest private deliveries, independent of administrative history. */
export const ApiRecentNotificationsSchema = z.strictObject({ items: z.array(ApiRecentNotificationSchema).max(5) });
