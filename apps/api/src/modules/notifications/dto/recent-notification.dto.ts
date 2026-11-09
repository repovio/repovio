import { ApiRecentNotificationsSchema } from '@repovio/schemas';
import { createZodDto } from '../../../util/schema-dto.js';

/** Bounded current-recipient history with no administrative or transport metadata. */
export class RecentNotificationsDto extends createZodDto(ApiRecentNotificationsSchema) {}
