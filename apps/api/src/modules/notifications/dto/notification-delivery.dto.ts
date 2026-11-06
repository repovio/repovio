import { ApiNotificationDeliveryAttemptSchema, ApiNotificationDeliverySchema } from '@repovio/schemas';
import { createZodDto } from '../../../util/schema-dto.js';

import { toWire } from '../../../util/to-wire.js';

import type {
  NotificationChannelType,
  NotificationDelivery,
  NotificationDeliveryAttempt,
} from '../../../generated/prisma/client.js';

type DeliveryAttemptModel = NotificationDeliveryAttempt & {
  browserPushSubscription?: { id: string } | null;
  notificationChannel?: { name: string; type: NotificationChannelType };
};

/** Defines the delivery history model contract shared by its consumers. */ export type DeliveryHistoryModel =
  NotificationDelivery & {
    attempts: DeliveryAttemptModel[];
    issue?: { id: string; number: string; title: string; url: string } | null;
    notificationChannel: { id: string; name: string; type: NotificationChannelType };
    pullRequest?: { id: string; number: string; title: string; url: string } | null;
    repository?: { id: string; name: string; owner: string } | null;
    securityAlert?: { id: string; kind: string; providerUrl: string; title: string } | null;
    requestedBy?: { username: string } | null;
    workflowRun?: { id: string; url: string; workflowName: string } | null;
  };

/** Safe delivery-attempt metadata visible to system administrators. */
export class NotificationDeliveryAttemptDto extends createZodDto(ApiNotificationDeliveryAttemptSchema) {
  /**
   * Convert an attempt without exposing any channel or subscription secret.
   *
   * @param model - Loaded database record and relations required by the DTO mapping.
   * @returns The explicit public DTO projected from the supplied record.
   */
  static fromModel(model: DeliveryAttemptModel): NotificationDeliveryAttemptDto {
    return NotificationDeliveryAttemptDto.schema.parse(
      toWire({
        id: model.id,
        notificationChannelId: model.notificationChannelId,
        notificationChannelName: model.notificationChannel?.name ?? 'Deleted channel',
        notificationChannelType: model.notificationChannel?.type ?? 'CUSTOM_APPRISE',
        browserPushSubscriptionId: model.browserPushSubscriptionId,
        deviceLabel: model.browserPushSubscription ? 'Browser device' : null,
        attempt: model.attempt,
        deliveredAt: model.deliveredAt,
        error: model.error,
        createdAt: model.createdAt,
      }),
    );
  }
}

/** Safe global event or test delivery history representation. */
export class NotificationDeliveryDto extends createZodDto(ApiNotificationDeliverySchema) {
  /**
   * Convert a delivery and its relations without credentials or endpoint details.
   *
   * @param model - Loaded database record and relations required by the DTO mapping.
   * @returns The explicit public DTO projected from the supplied record.
   */
  static fromModel(model: DeliveryHistoryModel): NotificationDeliveryDto {
    const subjectKind = model.workflowRun
      ? 'WORKFLOW_RUN'
      : model.pullRequest
        ? 'PULL_REQUEST'
        : model.issue
          ? 'ISSUE'
          : model.securityAlert
            ? 'SECURITY_ALERT'
            : null;
    return NotificationDeliveryDto.schema.parse(
      toWire({
        id: model.id,
        kind: model.kind,
        eventType: model.eventType,
        notificationChannelId: model.notificationChannelId,
        notificationChannelName: model.notificationChannel.name,
        notificationChannelType: model.notificationChannel.type,
        repositoryId: model.repository?.id ?? null,
        repositoryOwner: model.repository?.owner ?? null,
        repositoryName: model.repository?.name ?? null,
        subjectKind,
        subjectTitle:
          model.workflowRun?.workflowName ??
          (model.pullRequest ? `#${model.pullRequest.number} ${model.pullRequest.title}` : undefined) ??
          (model.issue ? `#${model.issue.number} ${model.issue.title}` : undefined) ??
          model.securityAlert?.title ??
          null,
        subjectUrl:
          model.workflowRun?.url ??
          model.pullRequest?.url ??
          model.issue?.url ??
          model.securityAlert?.providerUrl ??
          null,
        requestedByUsername: model.requestedBy?.username ?? null,
        status: model.status,
        finalError: model.finalError,
        nextAttemptAt: model.nextAttemptAt,
        createdAt: model.createdAt,
        updatedAt: model.updatedAt,
        attempts: model.attempts.map(NotificationDeliveryAttemptDto.fromModel),
      }),
    );
  }
}
