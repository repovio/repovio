import { ApiRepositoryQuerySchema } from '@repovio/schemas';
import { createZodDto } from '../../../util/schema-dto.js';

/** Paginated Query Kit request for repository administration. */
export class RepositoryQueryDto extends createZodDto(ApiRepositoryQuerySchema) {}
