import { ApiUpdatePasswordSchema } from '@repovio/schemas';
import { createZodDto } from '../../../util/schema-dto.js';

/** Defines the update password dto class contract. */ export class UpdatePasswordDto extends createZodDto(
  ApiUpdatePasswordSchema,
) {}
