import { ApiUserQuerySchema } from '@repovio/schemas';
import { createZodDto } from '../../../util/schema-dto.js';

/** Paginated Query Kit request for system-user administration. */
export class UserQueryDto extends createZodDto(ApiUserQuerySchema) {}
