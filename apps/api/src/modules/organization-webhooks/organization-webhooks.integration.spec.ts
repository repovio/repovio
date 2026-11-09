import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import { randomUUID } from 'node:crypto';
import { PoliciesGuard } from '../../casl/policies.guard.js';
import type { ProviderType } from '../../generated/prisma/client.js';
import { configureApiRoutes, createApiDocument } from '../../openapi/document.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { TestDatabaseService } from '../../prisma/test-database.service.js';
import { CredentialEncryptionService } from '../../security/credential-encryption.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { OrganizationWebhooksController } from './organization-webhooks.controller.js';
import { OrganizationWebhooksService } from './organization-webhooks.service.js';

const secret = 'synthetic-organization-signing-secret';
const administrator = { id: 'admin', username: 'admin', role: 'SYSTEM_ADMIN' as const, authProvider: 'LOCAL' as const };

/** Verify local configuration through the real PostgreSQL and Fastify boundaries. */
describe('Organization webhook configuration HTTP and persistence', /** Group administrator configuration scenarios. */ () => {
  const prisma = new PrismaService();
  const encryption = new CredentialEncryptionService();
  const configurations = new OrganizationWebhooksService(prisma, encryption);
  let http: NestFastifyApplication;

  beforeAll(
    /** Start the production validation and serialization stack with synthetic authentication. */ async () => {
      await prisma.onModuleInit();
      const module = await Test.createTestingModule({
        controllers: [OrganizationWebhooksController],
        providers: [{ provide: OrganizationWebhooksService, useValue: configurations }],
      })
        .overrideGuard(JwtAuthGuard)
        .useValue({
          /** Authenticate test callers while retaining service role checks. */
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
        .useValue({ /** Keep administrator checks in the real service. */ canActivate: () => true })
        .compile();
      http = module.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
      configureApiRoutes(http);
      http.useGlobalPipes(new ZodValidationPipe());
      http.useGlobalInterceptors(new ZodSerializerInterceptor(http.get(Reflector)));
      await http.init();
      await http.getHttpAdapter().getInstance().ready();
    },
  );

  beforeEach(
    /** Clear only the disposable test database. */ async () => {
      await new TestDatabaseService(prisma).cleanup();
    },
  );

  afterAll(
    /** Close the HTTP adapter and database pool. */ async () => {
      await http?.close();
      await prisma.onModuleDestroy();
    },
  );

  /** Create a synthetic provider connection without live credentials. */
  async function account(providerType: ProviderType = 'GITHUB') {
    return prisma.providerAccount.create({
      data: { displayName: randomUUID(), providerType, encryptedAccessToken: encryption.encrypt('synthetic-token') },
    });
  }

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
});
