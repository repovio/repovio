import {
  ApiOidcCheckSchema,
  ApiOidcConfigSchema,
  ApiOidcExchangeSchema,
  ApiOidcStatusSchema,
  ApiUpdateOidcConfigSchema,
} from '@repovio/schemas';
import { createZodDto } from '../../../util/schema-dto.js';

export class OidcStatusDto extends createZodDto(ApiOidcStatusSchema) {}

export class OidcConfigDto extends createZodDto(ApiOidcConfigSchema) {}

export class UpdateOidcConfigDto extends createZodDto(ApiUpdateOidcConfigSchema) {}

export class OidcExchangeDto extends createZodDto(ApiOidcExchangeSchema) {}

export class OidcCheckDto extends createZodDto(ApiOidcCheckSchema) {}
