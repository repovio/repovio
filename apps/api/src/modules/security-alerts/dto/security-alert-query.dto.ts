import { ApiSecurityAlertQuerySchema } from '@repovio/schemas';
import { createZodDto } from '../../../util/schema-dto.js';

/** Paginated security-alert query with case-insensitive text search. */
export class SecurityAlertQueryDto extends createZodDto(ApiSecurityAlertQuerySchema) {}
