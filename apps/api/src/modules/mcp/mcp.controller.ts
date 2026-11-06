import type { AuthInfo } from '@modelcontextprotocol/server';
import { Controller, HttpStatus, Post, Req, Res, VERSION_NEUTRAL, Version } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { ENV } from '../../config/env.js';
import { getCorsOrigins } from '../../config/http.js';
import { McpHttpService } from './mcp-http.service.js';
import { McpTokenService } from './mcp-token.service.js';

type AuthenticatedMcpRequest = FastifyRequest & { raw: FastifyRequest['raw'] & { auth?: AuthInfo } };

/** Serves authenticated stateless MCP requests outside the versioned REST API prefix. */
@ApiExcludeController()
@Controller('mcp')
export class McpController {
  /**
   * Initialize McpController with its required dependencies.
   *
   * @param http - Stateless MCP HTTP transport owned by the application.
   * @param tokens - Service managing and authenticating MCP access tokens.
   */
  constructor(
    private readonly http: McpHttpService,
    private readonly tokens: McpTokenService,
  ) {}

  /**
   * Validate MCP request origin and bearer authentication before invoking the stateless transport.
   *
   * @param request - Incoming request with the authentication or webhook context required by this endpoint.
   * @param response - HTTP response being validated, decoded, or written.
   * @returns A promise that resolves when the operation completes.
   */
  @Post()
  @Version(VERSION_NEUTRAL)
  async handle(@Req() request: AuthenticatedMcpRequest, @Res() response: FastifyReply): Promise<void> {
    if (request.url.includes('?')) {
      response.code(HttpStatus.BAD_REQUEST).send({ message: 'MCP query parameters are not supported.' });
      return;
    }
    if (!this.isAllowedOrigin(request.headers.origin)) {
      response.code(HttpStatus.FORBIDDEN).send({ message: 'Origin is not allowed.' });
      return;
    }

    const token = this.getBearerToken(request.headers.authorization);
    if (!token) {
      this.unauthorized(response);
      return;
    }

    const authenticated = await this.tokens
      .authenticate(token)
      .catch(
        /** Evaluates `undefined` when this.tokens.authenticate(token).catch invokes this callback. */ () => undefined,
      );
    if (!authenticated) {
      this.unauthorized(response);
      return;
    }

    request.raw.auth = {
      clientId: authenticated.record.id,
      ...(authenticated.expiresAt ? { expiresAt: Math.floor(authenticated.expiresAt.getTime() / 1000) } : {}),
      extra: { user: authenticated.user },
      scopes: ['repovio:read'],
      token,
    };
    for (const [name, value] of Object.entries(response.getHeaders())) {
      if (value !== undefined) response.raw.setHeader(name, value);
    }
    response.hijack();
    await this.http.nodeHandler(request.raw, response.raw, request.body);
  }

  /**
   * Extract a single bearer token from an Authorization header.
   *
   * @param header - Authorization header value, if supplied.
   * @returns The bearer token, or undefined when the header does not match the expected format.
   */
  private getBearerToken(header?: string): string | undefined {
    const match = /^Bearer ([^\s]+)$/.exec(header ?? '');
    return match?.[1];
  }

  /**
   * Check whether an optional request origin matches the configured CORS policy.
   *
   * @param origin - Request origin, if supplied by the client.
   * @returns Whether the origin is absent or permitted by the configured CORS policy.
   */
  private isAllowedOrigin(origin?: string): boolean {
    if (!origin) return true;
    const allowed = getCorsOrigins(ENV.CORS_ORIGIN);
    return allowed === true || allowed.includes(origin);
  }

  /**
   * Send an HTTP 401 response with the bearer authentication challenge.
   *
   * @param response - HTTP response being validated, decoded, or written.
   * @returns No return value.
   */
  private unauthorized(response: FastifyReply): void {
    response.header('WWW-Authenticate', 'Bearer');
    response.code(HttpStatus.UNAUTHORIZED).send({ message: 'Unauthorized.' });
  }
}
