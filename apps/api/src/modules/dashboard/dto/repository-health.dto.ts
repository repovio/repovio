import { ApiRepositoryHealthSchema } from '@repovio/schemas';
import { createZodDto } from '../../../util/schema-dto.js';

/** Permission-aware workflow health aggregates for one visible repository. */
export class RepositoryHealthDto extends createZodDto(ApiRepositoryHealthSchema) {}
