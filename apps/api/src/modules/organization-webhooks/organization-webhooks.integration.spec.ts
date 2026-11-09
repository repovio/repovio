import { jest } from '@jest/globals';
import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import { createHmac, randomUUID } from 'node:crypto';
import { PoliciesGuard } from '../../casl/policies.guard.js';
import type { ProviderType } from '../../generated/prisma/client.js';
import { configureApiRoutes, createApiDocument } from '../../openapi/document.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { TestDatabaseService } from '../../prisma/test-database.service.js';
import { CredentialEncryptionService } from '../../security/credential-encryption.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { ForgejoActionsAdapter } from '../providers/forgejo/forgejo-actions.adapter.js';
import { GiteaActionsAdapter } from '../providers/gitea/gitea-actions.adapter.js';
import { GitHubActionsAdapter } from '../providers/github/github-actions.adapter.js';
import { GitLabPipelinesAdapter } from '../providers/gitlab/gitlab-pipelines.adapter.js';
import { ProviderAdapterRegistry } from '../providers/provider-adapter.registry.js';
import { ProviderCredentialService } from '../providers/provider-credential.service.js';
import { ProviderSyncQueueService } from '../providers/sync-queue.service.js';
import { RepositoryConfigurationService } from '../repositories/repository-configuration.service.js';
import { WorkflowFilterService } from '../repositories/workflow-filter.service.js';
import { GitHubAppWebhookService } from '../webhooks/github-app-webhook.service.js';
import { OrganizationWebhookService } from '../webhooks/organization-webhook.service.js';
import { WebhookController } from '../webhooks/webhook.controller.js';
import { WebhookService } from '../webhooks/webhook.service.js';
import { OrganizationWebhooksController } from './organization-webhooks.controller.js';
import { OrganizationWebhooksService } from './organization-webhooks.service.js';

const secret = 'synthetic-organization-signing-secret';
const administrator = { id: 'admin', username: 'admin', role: 'SYSTEM_ADMIN' as const, authProvider: 'LOCAL' as const };

/** Exercise actual PostgreSQL, provider signature verification, validation, serialization, and queue transactions. */
describe('Organization webhook HTTP and persistence', /** Group isolated synthetic webhook scenarios. */ () => {
  const prisma = new PrismaService();
  const encryption = new CredentialEncryptionService();
  const providerFetch = jest.fn<typeof fetch>();
  const registry = new ProviderAdapterRegistry([
    new GitHubActionsAdapter(providerFetch),
    new GitLabPipelinesAdapter(providerFetch),
    new ForgejoActionsAdapter(providerFetch),
    new GiteaActionsAdapter(providerFetch),
  ]);
  const queue = new ProviderSyncQueueService(prisma, {} as never, {} as never);
  const repositoryWebhooks = new WebhookService(prisma, registry, new ProviderCredentialService(encryption), queue);
  const receiver = new OrganizationWebhookService(prisma, encryption, registry, queue, repositoryWebhooks);
  const configurations = new OrganizationWebhooksService(prisma, encryption);
  const repositories = new RepositoryConfigurationService(prisma, encryption, new WorkflowFilterService());
  let http: NestFastifyApplication;

  beforeAll(
    /** Start the production transport pipeline with synthetic authentication only. */ async () => {
      await prisma.onModuleInit();
      const module = await Test.createTestingModule({
        controllers: [OrganizationWebhooksController, WebhookController],
        providers: [
          { provide: OrganizationWebhooksService, useValue: configurations },
          { provide: OrganizationWebhookService, useValue: receiver },
          { provide: WebhookService, useValue: repositoryWebhooks },
          { provide: GitHubAppWebhookService, useValue: {} },
        ],
      })
        .overrideGuard(JwtAuthGuard)
        .useValue({
          /** Authenticate synthetic callers while leaving service authorization intact. */
          canActivate(context: ExecutionContext): boolean {
            const request = context.switchToHttp().getRequest<{ headers: Record<string, string>; user: object }>();
            if (!request.headers.authorization) throw new UnauthorizedException();
            request.user = {
              ...administrator,
              role: request.headers.authorization === 'Bearer admin' ? 'SYSTEM_ADMIN' : 'VIEWER',
            };
            return true;
          },
        })
        .overrideGuard(PoliciesGuard)
        .useValue({ /** Delegate role checks to the real configuration service. */ canActivate: () => true })
        .compile();
      http = module.createNestApplication<NestFastifyApplication>(new FastifyAdapter(), { rawBody: true });
      configureApiRoutes(http);
      http.useGlobalPipes(new ZodValidationPipe());
      http.useGlobalInterceptors(new ZodSerializerInterceptor(http.get(Reflector)));
      await http.init();
      await http.getHttpAdapter().getInstance().ready();
    },
  );

  beforeEach(
    /** Clear only the configured disposable test database. */ async () => {
      await new TestDatabaseService(prisma).cleanup();
      providerFetch.mockClear();
    },
  );

  afterEach(
    /** Prove that configuration and webhook processing perform no provider requests. */ () => {
      expect(providerFetch).not.toHaveBeenCalled();
    },
  );

  afterAll(
    /** Release the HTTP adapter and PostgreSQL connections. */ async () => {
      await http?.close();
      await prisma.onModuleDestroy();
    },
  );

  /** Create an isolated provider connection containing no live credentials. */
  async function account(providerType: ProviderType = 'GITHUB') {
    return prisma.providerAccount.create({
      data: { displayName: randomUUID(), providerType, encryptedAccessToken: encryption.encrypt('synthetic-token') },
    });
  }

  /** Create an already tracked repository with a preserved repository-specific secret. */
  async function repository(providerAccountId: string, owner = 'acme', providerRepositoryId = '42') {
    return prisma.repository.create({
      data: {
        providerAccountId,
        owner,
        providerRepositoryId,
        name: 'repo',
        url: `https://example.test/${owner}/repo`,
        encryptedWebhookSecret: encryption.encrypt(secret),
      },
    });
  }

  /** Sign raw payload bytes using the provider's supported signing convention. */
  function delivery(
    provider: ProviderType,
    value: unknown = { repository: { id: 42 }, project: { id: 42 } },
    key = secret,
    event?: string,
    deliveryId = randomUUID(),
  ) {
    const payload = Buffer.from(JSON.stringify(value));
    const signature = createHmac('sha256', key).update(payload).digest('hex');
    const headers: Record<string, string> =
      provider === 'GITHUB'
        ? {
            'x-github-event': event ?? 'issues',
            'x-github-delivery': deliveryId,
            'x-hub-signature-256': `sha256=${signature}`,
          }
        : provider === 'GITLAB'
          ? { 'x-gitlab-event': event ?? 'Issue Hook', 'x-gitlab-event-uuid': deliveryId, 'x-gitlab-token': key }
          : provider === 'FORGEJO'
            ? {
                'x-forgejo-event': event ?? 'issues',
                'x-forgejo-delivery': deliveryId,
                'x-forgejo-signature': signature,
              }
            : { 'x-gitea-event': event ?? 'issues', 'x-gitea-delivery': deliveryId, 'x-gitea-signature': signature };
    return { payload, headers };
  }

  /** Deliver through real raw-body handling at either stable or versioned URL. */
  async function post(webhookId: string, request: ReturnType<typeof delivery>, versioned = false) {
    return http.inject({
      method: 'POST',
      url: `/api/${versioned ? 'v1/' : ''}webhooks/organization/${webhookId}`,
      headers: { ...request.headers, 'content-type': 'application/json' },
      payload: request.payload,
    });
  }

  it.each(['GITHUB', 'GITLAB', 'FORGEJO', 'GITEA'] as const)(
    'verifies, deduplicates, rotates, and isolates %s deliveries',
    /** Exercise real signatures and durable queue writes for every provider. */ async (provider) => {
      const connection = await account(provider);
      const repo = await repository(connection.id);
      const hook = await configurations.create(administrator, connection.id, { scope: 'Acme', webhookSecret: secret });
      const request = delivery(provider);
      expect((await post(hook.id, request)).statusCode).toBe(202);
      expect((await post(hook.id, request, true)).json()).toEqual({ accepted: true, duplicate: true });
      expect(await prisma.webhookDelivery.count()).toBe(1);
      expect(await prisma.organizationWebhookDelivery.count()).toBe(1);
      expect(await prisma.repositorySyncRequest.findUnique({ where: { repositoryId: repo.id } })).toMatchObject({
        syncIssues: true,
        syncWorkflows: false,
      });
      expect((await post(hook.id, delivery(provider, undefined, 'incorrect-secret'))).statusCode).toBe(401);
      await configurations.rotate(administrator, connection.id, hook.id, 'replacement-signing-secret');
      expect((await post(hook.id, delivery(provider))).statusCode).toBe(401);
      expect((await post(hook.id, delivery(provider, undefined, 'replacement-signing-secret'))).statusCode).toBe(202);
      expect((await configurations.list(administrator, connection.id))[0]?.lastDeliveryAt).toBeTruthy();
      const stored = await prisma.organizationWebhook.findUniqueOrThrow({ where: { id: hook.id } });
      expect(stored.encryptedWebhookSecret).not.toContain('replacement-signing-secret');
    },
  );

  it('validates administrator CRUD, immutable scope, duplicate scope, and safe OpenAPI contracts', /** Exercise the real configuration request and response contracts. */ async () => {
    const connection = await account();
    const url = `/api/v1/provider-accounts/${connection.id}/organization-webhooks`;
    const denied = await http.inject({ method: 'GET', url });
    expect(denied.statusCode).toBe(401);
    for (const method of ['GET', 'POST', 'PATCH', 'DELETE'] as const) {
      const result = await http.inject({
        method,
        url: ['PATCH', 'DELETE'].includes(method) ? `${url}/${randomUUID()}` : url,
        headers: { authorization: 'Bearer viewer' },
        ...(method === 'POST'
          ? { payload: { scope: 'acme', webhookSecret: secret } }
          : method === 'PATCH'
            ? { payload: { webhookSecret: secret } }
            : {}),
      });
      expect(result.statusCode).toBe(403);
    }
    const headers = { authorization: 'Bearer admin' };
    expect(
      (await http.inject({ method: 'POST', url, headers, payload: { scope: 'acme/sub', webhookSecret: secret } }))
        .statusCode,
    ).toBe(400);
    expect(
      (await http.inject({ method: 'POST', url, headers, payload: { scope: 'acme', webhookSecret: 'short' } }))
        .statusCode,
    ).toBe(400);
    const created = await http.inject({
      method: 'POST',
      url,
      headers,
      payload: { scope: ' Acme ', webhookSecret: secret },
    });
    expect(created.statusCode).toBe(201);
    expect(created.json().scope).toBe('acme');
    expect(created.body).not.toContain(secret);
    expect(created.body).not.toContain('encrypted');
    expect(
      (await http.inject({ method: 'POST', url, headers, payload: { scope: 'ACME', webhookSecret: secret } }))
        .statusCode,
    ).toBe(409);
    const itemUrl = `${url}/${created.json().id}`;
    expect(
      (
        await http.inject({
          method: 'PATCH',
          url: itemUrl,
          headers,
          payload: { scope: 'other', webhookSecret: secret },
        })
      ).statusCode,
    ).toBe(400);
    expect(
      (await http.inject({ method: 'PATCH', url: itemUrl, headers, payload: { webhookSecret: 'replacement-secret' } }))
        .statusCode,
    ).toBe(200);
    const listed = await http.inject({ method: 'GET', url, headers });
    expect(listed.json()).toHaveLength(1);
    expect(listed.body).not.toContain('replacement-secret');
    const document = createApiDocument(http, '/');
    expect(
      document.paths['/api/v1/provider-accounts/{id}/organization-webhooks']?.post?.responses['201'],
    ).toBeDefined();
    expect(document.paths['/api/webhooks/organization/{webhookId}']).toBeDefined();
    expect((await http.inject({ method: 'DELETE', url: itemUrl, headers })).statusCode).toBe(204);
    expect(await prisma.organizationWebhook.count()).toBe(0);
  });

  it('scopes rotation and removal to the selected provider connection', /** Reject cross-account identifiers without modifying stored secrets. */ async () => {
    const first = await account();
    const other = await account();
    const hook = await configurations.create(administrator, first.id, { scope: 'acme', webhookSecret: secret });
    const headers = { authorization: 'Bearer admin' };
    const url = `/api/v1/provider-accounts/${other.id}/organization-webhooks/${hook.id}`;
    expect(
      (await http.inject({ method: 'PATCH', url, headers, payload: { webhookSecret: 'replacement-secret' } }))
        .statusCode,
    ).toBe(404);
    expect((await http.inject({ method: 'DELETE', url, headers })).statusCode).toBe(404);
    expect(
      encryption.decrypt(
        (await prisma.organizationWebhook.findUniqueOrThrow({ where: { id: hook.id } })).encryptedWebhookSecret,
      ),
    ).toBe(secret);
  });

  it('atomically deduplicates concurrent organization and repository deliveries', /** Verify unique constraints prevent duplicate queue generations across hook sources. */ async () => {
    const connection = await account();
    const repo = await repository(connection.id);
    const hook = await configurations.create(administrator, connection.id, { scope: 'acme', webhookSecret: secret });
    const request = delivery('GITHUB');
    const results = await Promise.all([
      receiver.receive(hook.id, request),
      receiver.receive(hook.id, request),
      repositoryWebhooks.receive('GITHUB', repo.id, request),
    ]);
    expect(
      results.filter(/** Count the single accepted queue insertion. */ (result) => !result.duplicate),
    ).toHaveLength(1);
    expect(await prisma.webhookDelivery.count()).toBe(1);
    expect(await prisma.repositorySyncRequest.findUnique({ where: { repositoryId: repo.id } })).toMatchObject({
      generation: 1,
    });
  });

  it.each(['GITHUB', 'GITLAB', 'FORGEJO', 'GITEA'] as const)(
    'acknowledges %s ping and unknown repositories without importing or queueing',
    /** Persist verified ignored deliveries without creating repositories. */ async (provider) => {
      const connection = await account(provider);
      const hook = await configurations.create(administrator, connection.id, { scope: 'acme', webhookSecret: secret });
      expect((await post(hook.id, delivery(provider, {}, secret, 'ping'))).statusCode).toBe(202);
      expect((await post(hook.id, delivery(provider))).statusCode).toBe(202);
      expect(await prisma.organizationWebhookDelivery.count()).toBe(2);
      expect(await prisma.repository.count()).toBe(0);
      expect(await prisma.repositorySyncRequest.count()).toBe(0);
    },
  );

  it('accepts group descendants while isolating prefix collisions, other organizations, and accounts', /** Check database-scoped repository identity before namespace matching. */ async () => {
    const connection = await account('GITLAB');
    const other = await account('GITLAB');
    const child = await repository(connection.id, 'acme/team');
    await repository(connection.id, 'acme-other', '43');
    await repository(connection.id, 'another', '44');
    await repository(other.id, 'acme', '45');
    const hook = await configurations.create(administrator, connection.id, { scope: 'acme', webhookSecret: secret });
    for (const id of [42, 43, 44, 45])
      expect((await post(hook.id, delivery('GITLAB', { project: { id } }))).statusCode).toBe(202);
    expect(await prisma.webhookDelivery.findMany({ select: { repositoryId: true } })).toEqual([
      { repositoryId: child.id },
    ]);
  });

  it('preserves organization display priority, deepest GitLab group, and repository fallback', /** Inspect real safe metadata before and after removal. */ async () => {
    const connection = await account('GITLAB');
    const repo = await repository(connection.id, 'acme/team');
    const parent = await configurations.create(administrator, connection.id, { scope: 'acme', webhookSecret: secret });
    const child = await configurations.create(administrator, connection.id, {
      scope: 'acme/team',
      webhookSecret: secret,
    });
    expect((await repositories.listWebhookConfigurations(administrator))[0]).toMatchObject({
      source: 'ORGANIZATION',
      organizationWebhook: { id: child.id },
      callbackUrl: child.callbackUrl,
    });
    await configurations.remove(administrator, connection.id, child.id);
    expect((await repositories.listWebhookConfigurations(administrator))[0]?.organizationWebhook?.id).toBe(parent.id);
    await configurations.remove(administrator, connection.id, parent.id);
    expect((await repositories.listWebhookConfigurations(administrator))[0]).toMatchObject({
      source: 'REPOSITORY',
      configured: true,
      organizationWebhook: null,
    });
    expect(
      encryption.decrypt(
        (await prisma.repository.findUniqueOrThrow({ where: { id: repo.id } })).encryptedWebhookSecret!,
      ),
    ).toBe(secret);
  });

  it('automatically covers multiple tracked repositories with one organization configuration', /** Verify one setup applies across repositories without individual organization assignments. */ async () => {
    const connection = await account();
    const first = await repository(connection.id, 'acme', '42');
    const second = await repository(connection.id, 'acme', '43');
    const hook = await configurations.create(administrator, connection.id, { scope: 'acme', webhookSecret: secret });
    const metadata = await repositories.listWebhookConfigurations(administrator);
    expect(metadata).toHaveLength(2);
    for (const configuration of metadata) {
      expect(configuration).toMatchObject({ source: 'ORGANIZATION', organizationWebhook: { id: hook.id } });
    }
    for (const id of [42, 43]) {
      expect((await post(hook.id, delivery('GITHUB', { repository: { id } }))).statusCode).toBe(202);
    }
    const queued = await prisma.repositorySyncRequest.findMany({ select: { repositoryId: true } });
    expect(queued).toEqual(expect.arrayContaining([{ repositoryId: first.id }, { repositoryId: second.id }]));
    expect(queued).toHaveLength(2);
  });

  it('rejects disabled connections and ignores disabled repositories', /** Prevent disabled resources from entering the synchronization queue. */ async () => {
    const connection = await account();
    const repo = await repository(connection.id);
    const hook = await configurations.create(administrator, connection.id, { scope: 'acme', webhookSecret: secret });
    await prisma.repository.update({ where: { id: repo.id }, data: { enabled: false } });
    expect((await post(hook.id, delivery('GITHUB'))).statusCode).toBe(202);
    expect(await prisma.repositorySyncRequest.count()).toBe(0);
    await prisma.providerAccount.update({ where: { id: connection.id }, data: { enabled: false } });
    expect((await post(hook.id, delivery('GITHUB'))).statusCode).toBe(401);
    expect(await prisma.organizationWebhookDelivery.count()).toBe(1);
  });

  it('rolls receipts back when queue persistence fails', /** Ensure a retry can schedule work after a transactional failure. */ async () => {
    const connection = await account();
    await repository(connection.id);
    const hook = await configurations.create(administrator, connection.id, { scope: 'acme', webhookSecret: secret });
    const request = delivery('GITHUB');
    const enqueue = jest
      .spyOn(queue, 'enqueueWebhookRepository')
      .mockRejectedValueOnce(new Error('Synthetic queue failure'));
    await expect(receiver.receive(hook.id, request)).rejects.toThrow('Synthetic queue failure');
    expect(await prisma.organizationWebhookDelivery.count()).toBe(0);
    expect(await prisma.webhookDelivery.count()).toBe(0);
    enqueue.mockRestore();
    await expect(receiver.receive(hook.id, request)).resolves.toMatchObject({ duplicate: false });
  });

  it('supports GitLab signed webhooks and rejects modified raw payloads', /** Reuse the existing Standard Webhooks signature implementation. */ async () => {
    const connection = await account('GITLAB');
    await repository(connection.id);
    const key = Buffer.from('synthetic-gitlab-standard-signature-key');
    const hook = await configurations.create(administrator, connection.id, {
      scope: 'acme',
      webhookSecret: `whsec_${key.toString('base64')}`,
    });
    const payload = Buffer.from('{"project":{"id":42}}');
    const id = randomUUID();
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = createHmac('sha256', key)
      .update(`${id}.${timestamp}.${payload.toString('utf8')}`)
      .digest('base64');
    const request = {
      payload,
      headers: {
        'x-gitlab-event': 'Pipeline Hook',
        'webhook-id': id,
        'webhook-timestamp': timestamp,
        'webhook-signature': `v1,${signature}`,
      },
    };
    expect((await post(hook.id, request)).statusCode).toBe(202);
    expect((await post(hook.id, { ...request, payload: Buffer.from('{ "project":{"id":42}}') })).statusCode).toBe(401);
  });

  it('rejects authenticated malformed payloads and missing delivery identifiers without receipts', /** Check transport-safe failures after signature verification. */ async () => {
    const connection = await account();
    const hook = await configurations.create(administrator, connection.id, { scope: 'acme', webhookSecret: secret });
    for (const value of [null, [], 'invalid'])
      expect((await post(hook.id, delivery('GITHUB', value))).statusCode).toBe(400);
    const missingId = delivery('GITHUB');
    delete missingId.headers['x-github-delivery'];
    expect((await post(hook.id, missingId)).statusCode).toBe(401);
    expect(await prisma.organizationWebhookDelivery.count()).toBe(0);
  });
});
