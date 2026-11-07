import { z } from 'zod';

import { resourceQuerySchemas } from '../queries.js';

import { httpsUrlSchema, oidcClaimPath, oidcScopeToken, optionalInput, optionalNameSchema } from './validation.js';

/** Shared RemoteAvatar boundary schema. */
export const ApiRemoteAvatarSchema = z.strictObject({ url: httpsUrlSchema.max(2048) });

/** Shared Setup boundary schema. */
export const ApiSetupSchema = z.strictObject({
  firstName: optionalNameSchema,
  lastName: optionalNameSchema,
  username: z.string().trim().min(1).max(255),
  password: z.string().min(12).max(256),
});

/** Shared SignIn boundary schema. */
export const ApiSignInSchema = z.strictObject({ username: z.string().max(255), password: z.string().min(1) });

/** Shared UpdatePassword boundary schema. */
export const ApiUpdatePasswordSchema = z.strictObject({
  currentPassword: z.string(),
  newPassword: z.string().min(12).max(256),
});

/** Shared UpdateProfile boundary schema. */
export const ApiUpdateProfileSchema = z.strictObject({
  firstName: z.string().trim().max(255).nullable(),
  lastName: z.string().trim().max(255).nullable(),
  username: z.string().trim().min(1).max(255),
  currentPassword: optionalInput(z.string()),
});

/** Shared OidcEndpoints boundary schema. */
export const ApiOidcEndpointsSchema = z.strictObject({
  authorization: z.boolean(),
  jwks: z.boolean(),
  token: z.boolean(),
  userinfo: z.boolean(),
});

/** Shared OidcStatus boundary schema. */
export const ApiOidcStatusSchema = z.strictObject({ enabled: z.boolean(), providerName: z.string().optional() });

/** Shared OidcConfig boundary schema. */
export const ApiOidcConfigSchema = z.strictObject({
  allowHttpIssuer: z.boolean(),
  allowUnmatchedViewer: z.boolean(),
  managerGroups: z.array(z.string()),
  clientId: z.union([z.null(), z.string()]),
  clientSecretConfigured: z.boolean(),
  configRevision: z.number(),
  callbackUrl: z.string(),
  enabled: z.boolean(),
  groupsClaim: z.string(),
  issuer: z.union([z.null(), z.string()]),
  observedGroups: z.array(z.string()),
  providerName: z.union([z.null(), z.string()]),
  scopes: z.array(z.string()),
  secretDecryptable: z.boolean(),
  systemAdministratorGroups: z.array(z.string()),
  updatedAt: z.iso.datetime({ offset: true }),
  viewerGroups: z.array(z.string()),
});

/** Shared UpdateOidcConfig boundary schema. */
export const ApiUpdateOidcConfigSchema = z.strictObject({
  allowHttpIssuer: optionalInput(z.boolean()),
  allowUnmatchedViewer: optionalInput(z.boolean()),
  managerGroups: optionalInput(z.array(z.string().max(512)).max(100)),
  clientId: z.string().min(1).max(512).nullable().optional(),
  clientSecretClear: optionalInput(z.boolean()),
  clientSecret: optionalInput(z.string().min(1).max(4096)),
  enabled: optionalInput(z.boolean()),
  groupsClaim: optionalInput(z.string().min(1).max(200).regex(oidcClaimPath)),
  issuer: z.string().min(1).max(2048).nullable().optional(),
  providerName: z.string().max(64).nullable().optional(),
  scopes: optionalInput(z.array(z.string().max(128).regex(oidcScopeToken)).max(20)),
  systemAdministratorGroups: optionalInput(z.array(z.string().max(512)).max(100)),
  viewerGroups: optionalInput(z.array(z.string().max(512)).max(100)),
});

/** Shared OidcExchange boundary schema. */
export const ApiOidcExchangeSchema = z.strictObject({ code: z.string().min(43).max(128) });

/** Shared OidcCheck boundary schema. */
export const ApiOidcCheckSchema = z.strictObject({
  ok: z.boolean(),
  code: z.string().optional(),
  endpoints: z
    .strictObject({ authorization: z.boolean(), jwks: z.boolean(), token: z.boolean(), userinfo: z.boolean() })
    .optional(),
  idTokenAlgorithm: z.string().optional(),
  issuer: z.string().optional(),
  tokenEndpointAuthenticationMethod: z
    .union([z.literal('client_secret_basic'), z.literal('client_secret_post'), z.literal('none')])
    .optional(),
  warnings: z.array(z.string()).optional(),
});

/** Shared UserQuery boundary schema. */
export const ApiUserQuerySchema = resourceQuerySchemas.User.extend({});

/** Shared User boundary schema. */
export const ApiUserSchema = z.strictObject({
  authProvider: z.union([z.literal('LOCAL'), z.literal('OIDC')]),
  avatarSource: z.enum(['LOCAL', 'OIDC']).nullable().optional(),
  avatarUpdatedAt: z.union([z.null(), z.iso.datetime({ offset: true })]),
  firstName: z.union([z.null(), z.string()]),
  id: z.string(),
  lastName: z.union([z.null(), z.string()]),
  username: z.string(),
  role: z.union([z.literal('SYSTEM_ADMIN'), z.literal('VIEWER'), z.literal('MANAGER')]),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
});

/** Shared CreateUser boundary schema. */
export const ApiCreateUserSchema = z.strictObject({
  username: z.string().trim().min(1).max(255),
  firstName: optionalNameSchema,
  lastName: optionalNameSchema,
  password: z.string().min(12).max(256),
  role: z.union([z.literal('SYSTEM_ADMIN'), z.literal('VIEWER'), z.literal('MANAGER')]),
});

/** Administrative reset of a local account's password. */
export const ApiResetUserPasswordSchema = z.strictObject({ newPassword: z.string().min(12).max(256) });
