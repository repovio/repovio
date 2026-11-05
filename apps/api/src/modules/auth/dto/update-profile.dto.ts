import { ApiUpdateProfileSchema } from '@repovio/schemas';
import { createZodDto } from '../../../util/schema-dto.js';

/** Editable personal identity fields for the current authenticated user. */
export class UpdateProfileDto extends createZodDto(ApiUpdateProfileSchema) {}
