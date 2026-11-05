import { ApiSignInSchema } from '@repovio/schemas';
import { createZodDto } from '../../../util/schema-dto.js';

export class SignInDto extends createZodDto(ApiSignInSchema) {}
