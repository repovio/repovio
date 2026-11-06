import {
  ApiCreatedMcpAccessTokenSchema,
  ApiCreateMcpAccessTokenSchema,
  ApiMcpAccessTokenSchema,
} from '@repovio/schemas';
import { createZodDto } from '../../../util/schema-dto.js';

import { toWire } from '../../../util/to-wire.js';

import type { McpAccessToken } from '../../../generated/prisma/client.js';

/** Defines the mcp access token status contract shared by its consumers. */ export type McpAccessTokenStatus =
  'ACTIVE' | 'EXPIRED' | 'REVOKED';

/** Validated request for creating a user-owned MCP access token. */
export class CreateMcpAccessTokenDto extends createZodDto(ApiCreateMcpAccessTokenSchema) {}

/** Safe MCP token metadata that never contains the token hash or complete secret. */
export class McpAccessTokenDto extends createZodDto(ApiMcpAccessTokenSchema) {
  /**
   * Map persisted token metadata without exposing its hash.
   *
   * @param model - Loaded database record and relations required by the DTO mapping.
   * @param now - Reference time for deterministic time-dependent calculations.
   * @returns The explicit public DTO projected from the supplied record.
   */
  static fromModel(model: McpAccessToken, now = new Date()): McpAccessTokenDto {
    return McpAccessTokenDto.schema.parse(
      toWire({
        createdAt: model.createdAt,
        expiresAt: model.expiresAt,
        id: model.id,
        lastUsedAt: model.lastUsedAt,
        name: model.name,
        revokedAt: model.revokedAt,
        status: model.revokedAt ? 'REVOKED' : model.expiresAt && model.expiresAt <= now ? 'EXPIRED' : 'ACTIVE',
        tokenPrefix: model.tokenPrefix,
        userId: model.userId,
      }),
    );
  }
}

/** One-time token creation response containing the newly generated bearer secret. */
export class CreatedMcpAccessTokenDto extends createZodDto(ApiCreatedMcpAccessTokenSchema) {}
