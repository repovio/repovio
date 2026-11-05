import { ApiSetupSchema } from '@repovio/schemas';
import { createZodDto } from '../../../util/schema-dto.js';

/** Credentials and optional personal data used to create the first administrator. */
export class SetupDto extends createZodDto(ApiSetupSchema) {}
