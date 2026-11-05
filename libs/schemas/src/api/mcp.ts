import { z } from 'zod';

import { isoDateInputSchema, optionalInput } from './validation.js';

/** Shared CreateMcpAccessToken boundary schema. */
export const ApiCreateMcpAccessTokenSchema = z.strictObject({
  name: z.string().trim().min(1).max(100),
  expiresAt: z.union([z.null(), isoDateInputSchema]).optional(),
});

/** Shared McpAccessToken boundary schema. */
export const ApiMcpAccessTokenSchema = z.strictObject({
  id: z.string(),
  name: z.string(),
  tokenPrefix: z.string(),
  createdAt: z.iso.datetime({ offset: true }),
  lastUsedAt: z.union([z.null(), z.iso.datetime({ offset: true })]),
  expiresAt: z.union([z.null(), z.iso.datetime({ offset: true })]),
  revokedAt: z.union([z.null(), z.iso.datetime({ offset: true })]),
  status: z.union([z.literal('ACTIVE'), z.literal('EXPIRED'), z.literal('REVOKED')]),
  userId: z.string(),
});

/** Shared ListMcpAccessTokensQuery boundary schema. */
export const ApiListMcpAccessTokensQuerySchema = z.strictObject({ userId: optionalInput(z.uuid()) });

/** Shared CreatedMcpAccessToken boundary schema. */
export const ApiCreatedMcpAccessTokenSchema = ApiMcpAccessTokenSchema.extend({ token: z.string() });
