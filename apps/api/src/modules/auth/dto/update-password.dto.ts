import { ApiUpdatePasswordSchema } from '@repovio/schemas';
import { createZodDto } from '../../../util/schema-dto.js';

export class UpdatePasswordDto extends createZodDto(ApiUpdatePasswordSchema) {}
