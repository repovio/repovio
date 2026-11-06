import { ApiNotificationChannelQuerySchema, ApiNotificationDeliveryQuerySchema } from '@repovio/schemas';
import { createZodDto } from '../../../util/schema-dto.js';

/** Defines the notification channel query dto class contract. */ export class NotificationChannelQueryDto extends createZodDto(
  ApiNotificationChannelQuerySchema,
) {}
/** Defines the notification delivery query dto class contract. */ export class NotificationDeliveryQueryDto extends createZodDto(
  ApiNotificationDeliveryQuerySchema,
) {}
