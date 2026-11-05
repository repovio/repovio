import { ApiNotificationChannelQuerySchema, ApiNotificationDeliveryQuerySchema } from '@repovio/schemas';
import { createZodDto } from '../../../util/schema-dto.js';

export class NotificationChannelQueryDto extends createZodDto(ApiNotificationChannelQuerySchema) {}
export class NotificationDeliveryQueryDto extends createZodDto(ApiNotificationDeliveryQuerySchema) {}
