import {
  ApiOidcCheckSchema,
  ApiOidcConfigSchema,
  ApiOidcExchangeSchema,
  ApiOidcStatusSchema,
  ApiUpdateOidcConfigSchema,
} from '@repovio/schemas';
import { createZodDto } from '../../../util/schema-dto.js';

/** Defines the oidc status dto class contract. */ export class OidcStatusDto extends createZodDto(
  ApiOidcStatusSchema,
) {}

/** Defines the oidc config dto class contract. */ export class OidcConfigDto extends createZodDto(
  ApiOidcConfigSchema,
) {}

/** Defines the update oidc config dto class contract. */ export class UpdateOidcConfigDto extends createZodDto(
  ApiUpdateOidcConfigSchema,
) {}

/** Defines the oidc exchange dto class contract. */ export class OidcExchangeDto extends createZodDto(
  ApiOidcExchangeSchema,
) {}

/** Defines the oidc check dto class contract. */ export class OidcCheckDto extends createZodDto(ApiOidcCheckSchema) {}
