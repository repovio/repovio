import { ApiProviderAccountQuerySchema } from '@repovio/schemas';
import { createZodDto } from '../../../util/schema-dto.js';

/** Paginated Query Kit request for provider-account administration. */
export class ProviderAccountQueryDto extends createZodDto(ApiProviderAccountQuerySchema) {}
