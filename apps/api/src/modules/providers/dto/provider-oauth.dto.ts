import { ApiProviderOAuthCallbackSchema, ApiStartProviderOAuthSchema } from '@repovio/schemas';
import { createZodDto } from '../../../util/schema-dto.js';

/** Payload used to start a provider OAuth authorization. */
export class StartProviderOAuthDto extends createZodDto(ApiStartProviderOAuthSchema) {}

/** A browser destination returned when an OAuth authorization is started. */
export interface ProviderOAuthAuthorizationDto {
  authorizationUrl: string;
}

/** Query parameters returned by an OAuth provider after an authorization attempt. */
export class ProviderOAuthCallbackDto extends createZodDto(ApiProviderOAuthCallbackSchema) {}
