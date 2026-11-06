import type { FastifyReply } from 'fastify';

import type { AuthenticatedUser } from '../auth/types.js';
import type { McpHttpService } from './mcp-http.service.js';
import type { McpTokenService } from './mcp-token.service.js';
import { McpController } from './mcp.controller.js';

const user: AuthenticatedUser = { authProvider: 'LOCAL' as const, id: 'user-id', role: 'VIEWER', username: 'viewer' };

describe('McpController', /** Groups scenarios for McpController. */ () => {
  const nodeHandler = jest.fn();
  const authenticate = jest.fn();
  const controller = new McpController(
    { nodeHandler } as unknown as McpHttpService,
    { authenticate } as unknown as McpTokenService,
  );

  beforeEach(/** Prepares shared test state for beforeEach. */ () => jest.resetAllMocks());

  /** Builds the MCP HTTP response fixture. */
  function response(): FastifyReply {
    const result = {
      code: jest.fn(),
      getHeaders: jest.fn().mockReturnValue({ 'access-control-allow-origin': 'http://localhost:3000' }),
      header: jest.fn(),
      hijack: jest.fn(),
      raw: { setHeader: jest.fn() },
      send: jest.fn(),
    };
    result.code.mockReturnValue(result);
    return result as unknown as FastifyReply;
  }

  it('rejects credentials supplied through a query string', /** Verifies rejects credentials supplied through a query string. */ async () => {
    const res = response();
    await controller.handle({ body: {}, headers: {}, url: '/mcp?token=secret' } as never, res);
    expect(res.code).toHaveBeenCalledWith(400);
    expect(authenticate).not.toHaveBeenCalled();
    expect(res.hijack).not.toHaveBeenCalled();
    expect(nodeHandler).not.toHaveBeenCalled();
  });

  it('returns a bearer challenge for missing or invalid authorization', /** Verifies returns a bearer challenge for missing or invalid authorization. */ async () => {
    const res = response();
    await controller.handle({ body: {}, headers: {}, url: '/mcp' } as never, res);
    expect(res.header).toHaveBeenCalledWith('WWW-Authenticate', 'Bearer');
    expect(res.code).toHaveBeenCalledWith(401);
    expect(res.hijack).not.toHaveBeenCalled();
  });

  it('rejects an untrusted Origin before authenticating the bearer token', /** Verifies rejects an untrusted Origin before authenticating the bearer token. */ async () => {
    const res = response();
    await controller.handle(
      {
        body: {},
        headers: { authorization: 'Bearer repovio_mcp_secret', origin: 'https://untrusted.example' },
        url: '/mcp',
      } as never,
      res,
    );

    expect(res.code).toHaveBeenCalledWith(403);
    expect(authenticate).not.toHaveBeenCalled();
    expect(res.hijack).not.toHaveBeenCalled();
  });

  it('keeps failed bearer authentication in the normal Fastify response lifecycle', /** Verifies keeps failed bearer authentication in the normal Fastify response lifecycle. */ async () => {
    authenticate.mockRejectedValue(new Error('Token lookup failed'));
    const res = response();

    await controller.handle(
      { body: {}, headers: { authorization: 'Bearer invalid' }, raw: {}, url: '/mcp' } as never,
      res,
    );

    expect(res.code).toHaveBeenCalledWith(401);
    expect(res.header).toHaveBeenCalledWith('WWW-Authenticate', 'Bearer');
    expect(res.send).toHaveBeenCalledWith({ message: 'Unauthorized.' });
    expect(res.hijack).not.toHaveBeenCalled();
    expect(nodeHandler).not.toHaveBeenCalled();
  });

  it('passes validated token and current user context to the MCP handler', /** Verifies passes validated token and current user context to the MCP handler. */ async () => {
    authenticate.mockResolvedValue({ expiresAt: null, record: { id: 'token-id' }, user });
    const request = {
      body: { jsonrpc: '2.0' },
      headers: { authorization: 'Bearer repovio_mcp_secret' },
      raw: {},
      url: '/mcp',
    };
    const res = response();

    await controller.handle(request as never, res);

    expect(request.raw).toEqual({
      auth: expect.objectContaining({ clientId: 'token-id', extra: { user }, scopes: ['repovio:read'] }),
    });
    expect(res.raw.setHeader).toHaveBeenCalledWith('access-control-allow-origin', 'http://localhost:3000');
    expect(res.hijack).toHaveBeenCalledTimes(1);
    expect((res.hijack as jest.Mock).mock.invocationCallOrder[0]).toBeLessThan(
      nodeHandler.mock.invocationCallOrder[0]!,
    );
    expect(nodeHandler).toHaveBeenCalledWith(request.raw, res.raw, request.body);
  });
});
