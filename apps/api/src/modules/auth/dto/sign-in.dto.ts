import { ApiSignInSchema } from '@repovio/schemas';
import { createZodDto } from '../../../util/schema-dto.js';

/** Defines the sign in dto class contract. */ export class SignInDto extends createZodDto(ApiSignInSchema) {}
