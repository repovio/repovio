import { UnauthorizedException } from '@nestjs/common';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';

import { configureApiRoutes } from '../../openapi/document.js';
import type { AuthenticatedUser } from '../auth/types.js';
import { McpHttpService } from './mcp-http.service.js';
import { McpServerFactory } from './mcp-server.factory.js';
import { McpTokenService } from './mcp-token.service.js';
import { McpToolsService } from './mcp-tools.service.js';
import { McpController } from './mcp.controller.js';

/** Protocol revisions exercised through the production HTTP transport. */
type ProtocolVersion = '2025-06-18' | '2026-07-28';

const users: Record<string, AuthenticatedUser> = {
  'synthetic-viewer-a': { authProvider: 'LOCAL', id: 'viewer-a', role: 'VIEWER', username: 'viewer-a' },
  'synthetic-viewer-b': { authProvider: 'LOCAL', id: 'viewer-b', role: 'VIEWER', username: 'viewer-b' },
};
const toolNames = [
  'list_repositories',
  'get_repository',
  'list_workflow_runs',
  'list_needs_attention',
  'list_awaiting_approval',
  'get_dashboard_summary',
  'get_workflow_trend',
];

/** Decode the JSON or single-response SSE format selected by the SDK.
 * @param response - Completed JSON-RPC HTTP exchange.
 * @returns The decoded protocol message.
 * @throws Error - An SSE response contains no data message.
 */
async function readMessage(response: Response): Promise<unknown> {
  const text = await response.text();
  if (response.headers.get('content-type')?.includes('application/json')) return JSON.parse(text);
  const data = text
    .split('\n')
    .find(/** Locate the data frame in the legacy response stream. */ (line) => line.startsWith('data:'));
  if (!data) throw new Error('Expected a JSON-RPC data frame.');
  return JSON.parse(data.slice(5));
}

/** Build a valid tool result identifying the user whose permissions were applied.
 * @param user - Current user bound to the request's server instance.
 * @returns One synthetic repository visible to that user.
 */
function repositoryPage(user: AuthenticatedUser) {
  return {
    items: [
      {
        enabled: true,
        id: user.id,
        issueRetentionDays: null,
        lastSyncAt: null,
        name: 'repository',
        owner: user.username,
        providerAccountId: 'provider-account',
        providerRepositoryId: 'provider-repository',
        pullRequestRetentionDays: null,
        url: 'https://github.com/example/repository',
        workflowRunRetentionDays: null,
      },
    ],
    page: 1,
    perPage: 25,
    total: 1,
  };
}

describe('MCP HTTP protocol compatibility', /** Exercise the production controller, handler, and tool factory. */ () => {
  let app: NestFastifyApplication;
  let baseUrl: string;
  const authenticate = jest.fn();
  const listRepositories = jest.fn();

  beforeAll(
    /** Start the real HTTP transport without a database or provider connection. */ async () => {
      const moduleRef = await Test.createTestingModule({
        controllers: [McpController],
        providers: [
          McpHttpService,
          McpServerFactory,
          { provide: McpTokenService, useValue: { authenticate } },
          { provide: McpToolsService, useValue: { listRepositories } },
        ],
      }).compile();
      app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
      configureApiRoutes(app);
      await app.listen(0, '127.0.0.1');
      baseUrl = await app.getUrl();
    },
  );

  afterAll(/** Release the HTTP listener and the production MCP handler. */ async () => app?.close());

  beforeEach(
    /** Reset synthetic credentials and permission-scoped tool responses. */ () => {
      jest.resetAllMocks();
      authenticate.mockImplementation(
        /** Resolve only the fixture's synthetic bearer tokens. */ async (token: string) => {
          const user = users[token];
          if (!user) throw new UnauthorizedException();
          return { expiresAt: null, record: { id: token }, user };
        },
      );
      listRepositories.mockImplementation(
        /** Retain asynchronous overlap between requests from different users. */ async (user: AuthenticatedUser) => {
          await new Promise(
            /** Yield to another request before resolving the current user's data. */ (resolve) =>
              setImmediate(resolve),
          );
          return repositoryPage(user);
        },
      );
    },
  );

  /** Send one revision-specific JSON-RPC request through the actual /mcp route.
   * @param version - Requested protocol revision and metadata format.
   * @param method - JSON-RPC method to invoke.
   * @param params - Method parameters before protocol metadata is added.
   * @param token - Synthetic bearer value, or null to omit authorization.
   * @param id - Request identifier, or null for a notification.
   * @param headers - Additional headers used to exercise origin and version handling.
   * @returns The raw HTTP response, including protocol errors.
   */
  function request(
    version: ProtocolVersion,
    method: string,
    params: Record<string, unknown> = {},
    token: string | null = 'synthetic-viewer-a',
    id: number | null = 1,
    headers: Record<string, string> = {},
  ): Promise<Response> {
    return fetch(`${baseUrl}/mcp`, {
      body: JSON.stringify({
        ...(id === null ? {} : { id }),
        jsonrpc: '2.0',
        method,
        params: {
          ...(version === '2026-07-28'
            ? {
                _meta: {
                  'io.modelcontextprotocol/clientCapabilities': {},
                  'io.modelcontextprotocol/clientInfo': { name: 'repovio-test', version: '1.0.0' },
                  'io.modelcontextprotocol/protocolVersion': version,
                },
              }
            : {}),
          ...params,
        },
      }),
      headers: {
        Accept: 'application/json, text/event-stream',
        ...(token === null ? {} : { Authorization: `Bearer ${token}` }),
        'Content-Type': 'application/json',
        'MCP-Protocol-Version': version,
        'Mcp-Method': method,
        ...(typeof params.name === 'string' ? { 'Mcp-Name': params.name } : {}),
        ...headers,
      },
      method: 'POST',
    });
  }

  it('completes the Codex 2025-06-18 handshake before listing and calling tools', /** Reproduce the legacy client flow rejected by the former strict handler. */ async () => {
    const initialize = await request('2025-06-18', 'initialize', {
      capabilities: {},
      clientInfo: { name: 'codex', version: 'test' },
      protocolVersion: '2025-06-18',
    });
    expect(initialize.status).toBe(200);
    expect(await readMessage(initialize)).toMatchObject({ result: { protocolVersion: '2025-06-18' } });
    const initialized = await request('2025-06-18', 'notifications/initialized', {}, 'synthetic-viewer-a', null);
    expect(initialized.status).toBe(202);
    expect(await initialized.text()).toBe('');
    const catalog = await request('2025-06-18', 'tools/list');
    expect(catalog.status).toBe(200);
    expect(await readMessage(catalog)).toMatchObject({
      result: {
        tools: toolNames.map(
          /** Require the same read-only catalog as modern clients. */ (name) => ({
            name,
            annotations: { readOnlyHint: true },
          }),
        ),
      },
    });
    const called = await request('2025-06-18', 'tools/call', { arguments: {}, name: 'list_repositories' });
    expect(called.status).toBe(200);
    expect(await readMessage(called)).toMatchObject({
      result: { structuredContent: repositoryPage(users['synthetic-viewer-a']) },
    });
  });

  it('preserves modern stateless discovery and tool calls without initialize', /** Keep the current per-request protocol working on the same endpoint. */ async () => {
    const catalog = await request('2026-07-28', 'tools/list');
    expect(catalog.status).toBe(200);
    expect(await readMessage(catalog)).toMatchObject({
      result: {
        tools: toolNames.map(
          /** Require exactly the existing tool order and read-only annotations. */ (name) => ({
            name,
            annotations: { readOnlyHint: true },
          }),
        ),
      },
    });
    const called = await request('2026-07-28', 'tools/call', { arguments: {}, name: 'list_repositories' });
    expect(called.status).toBe(200);
    expect(await readMessage(called)).toMatchObject({
      result: { structuredContent: repositoryPage(users['synthetic-viewer-a']) },
    });
  });

  it.each<ProtocolVersion>(['2025-06-18', '2026-07-28'])(
    'enforces credentials and origins for %s',
    /** Reject unauthorized requests before tool dispatch for either protocol. */ async (version) => {
      for (const token of [null, 'invalid-token']) {
        const response = await request(version, 'tools/list', {}, token);
        expect(response.status).toBe(401);
        expect(response.headers.get('www-authenticate')).toBe('Bearer');
        await response.text();
      }
      authenticate.mockClear();
      const response = await request(version, 'tools/list', {}, 'synthetic-viewer-a', 1, {
        Origin: 'https://untrusted.example',
      });
      expect(response.status).toBe(403);
      await response.text();
      expect(authenticate).not.toHaveBeenCalled();
      expect(listRepositories).not.toHaveBeenCalled();
    },
  );

  it('rejects malformed modern metadata instead of falling back to legacy handling', /** Ensure compatibility does not make incomplete modern requests acceptable. */ async () => {
    const response = await request('2026-07-28', 'tools/call', { _meta: {}, arguments: {}, name: 'list_repositories' });
    expect(response.status).toBe(400);
    expect(await readMessage(response)).toMatchObject({ error: { code: -32602 } });
    expect(listRepositories).not.toHaveBeenCalled();
  });

  it('isolates concurrent legacy and modern requests by their current authenticated user', /** Prevent shared server instances from retaining another request's user. */ async () => {
    const requests = [
      ['2025-06-18', 'synthetic-viewer-a'],
      ['2026-07-28', 'synthetic-viewer-b'],
      ['2026-07-28', 'synthetic-viewer-a'],
      ['2025-06-18', 'synthetic-viewer-b'],
    ] as const;
    await Promise.all(
      requests.map(
        /** Verify each overlapping response belongs to its own bearer identity. */ async ([version, token], index) => {
          const response = await request(
            version,
            'tools/call',
            { arguments: {}, name: 'list_repositories' },
            token,
            index + 1,
          );
          expect(response.status).toBe(200);
          expect(await readMessage(response)).toMatchObject({
            result: { structuredContent: repositoryPage(users[token]) },
          });
        },
      ),
    );
    expect(listRepositories).toHaveBeenCalledTimes(requests.length);
  });
});
