import {
  ApiCreateNotificationChannelSchema,
  ApiNotificationChannelSchema,
  ApiNotificationEventSubscriptionInputSchema,
  ApiNotificationRulePreviewInputSchema,
  ApiNotificationRulePreviewMatchSchema,
  ApiNotificationRulePreviewSchema,
  ApiUpdateNotificationChannelSchema,
} from '@repovio/schemas';
import { createZodDto } from '../../../util/schema-dto.js';

import { toWire } from '../../../util/to-wire.js';

import { NotificationEventType, type NotificationChannel } from '../../../generated/prisma/client.js';

/** Defines the email notification configuration input contract shared by its consumers. */ export interface EmailNotificationConfigurationInput {
  from: string;
  password?: string;
  port?: number;
  recipients: string[];
  security: 'NONE' | 'STARTTLS' | 'TLS';
  smtpHost: string;
  username?: string;
}

/** Defines the gotify notification configuration input contract shared by its consumers. */ export interface GotifyNotificationConfigurationInput {
  priority?: 'low' | 'moderate' | 'normal' | 'high';
  serverUrl: string;
  token: string;
}

/** Defines the ntfy notification configuration input contract shared by its consumers. */ export interface NtfyNotificationConfigurationInput {
  password?: string;
  priority?: 'min' | 'low' | 'default' | 'high' | 'max';
  serverUrl?: string;
  token?: string;
  topic: string;
  username?: string;
}

/** Defines the discord notification configuration input contract shared by its consumers. */ export interface DiscordNotificationConfigurationInput {
  webhookUrl: string;
}

/** Defines the custom apprise notification configuration input contract shared by its consumers. */ export interface CustomAppriseNotificationConfigurationInput {
  url: string;
}

/** Defines the notification configuration input contract shared by its consumers. */ export type NotificationConfigurationInput =
  | EmailNotificationConfigurationInput
  | GotifyNotificationConfigurationInput
  | NtfyNotificationConfigurationInput
  | DiscordNotificationConfigurationInput
  | CustomAppriseNotificationConfigurationInput;

/** One global event subscription with optional repository and workflow filters. */
export class NotificationEventSubscriptionInputDto extends createZodDto(ApiNotificationEventSubscriptionInputSchema) {}

/** Input accepted when previewing workflow notification subscriptions. */
export class NotificationRulePreviewInputDto extends createZodDto(ApiNotificationRulePreviewInputSchema) {}

/** One existing workflow run matched by a notification-rule preview. */
export class NotificationRulePreviewMatchDto extends createZodDto(ApiNotificationRulePreviewMatchSchema) {}

/** Read-only preview result for workflow notification subscriptions. */
export class NotificationRulePreviewDto extends createZodDto(ApiNotificationRulePreviewSchema) {}

/** Defines the notification channel with relations contract shared by its consumers. */ export interface NotificationChannelWithRelations extends NotificationChannel {
  eventSubscriptions: Array<{
    eventType: NotificationEventType;
    workflowPatterns: string[];
    repositories: Array<{ repositoryId: string }>;
  }>;
  recipients: Array<{ user: { id: string; username: string } }>;
}

/** Safe response representation of a global notification channel. */
export class NotificationChannelDto extends createZodDto(ApiNotificationChannelSchema) {
  /**
   * Convert a database model without exposing encrypted credentials.
   *
   * @param model - Loaded database record and relations required by the DTO mapping.
   * @param canManage - Whether administrative channel details may be exposed.
   * @returns The explicit public DTO projected from the supplied record.
   */
  static fromModel(model: NotificationChannelWithRelations, canManage = false): NotificationChannelDto {
    return NotificationChannelDto.schema.parse(
      toWire({
        id: model.id,
        name: model.name,
        type: model.type,
        enabled: model.enabled,
        urlScheme: model.urlScheme,
        eventSubscriptions: model.eventSubscriptions.map(
          /** Projects each entry using `({ eventType: subscription.eventType, repositoryIds: subscription.repositories.map(({ repositoryId }) => repositoryId), workflowPatterns: subscription.workflowPatterns, })`. */ (
            subscription,
          ) => ({
            eventType: subscription.eventType,
            repositoryIds: subscription.repositories.map(
              /** Projects each entry using `repositoryId`. */ ({ repositoryId }) => repositoryId,
            ),
            workflowPatterns: subscription.workflowPatterns,
          }),
        ),
        browserRecipients: model.recipients.map(/** Projects each entry using `user`. */ ({ user }) => user),
        canManage,
        requiresReconfiguration: model.requiresReconfiguration,
        createdAt: model.createdAt,
        updatedAt: model.updatedAt,
      }),
    );
  }
}

/** Input accepted when creating a global notification channel. */
export class CreateNotificationChannelDto extends createZodDto(ApiCreateNotificationChannelSchema) {}

/** Input accepted when updating a global notification channel. */
export class UpdateNotificationChannelDto extends createZodDto(ApiUpdateNotificationChannelSchema) {}
