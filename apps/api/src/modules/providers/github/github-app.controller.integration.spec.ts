import { jest } from '@jest/globals';
import { type ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import { generateKeyPairSync } from 'node:crypto';

import { PoliciesGuard } from '../../../casl/policies.guard.js';
import { configureApiRoutes, createApiDocument } from '../../../openapi/document.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { TestDatabaseService } from '../../../prisma/test-database.service.js';
import { CredentialEncryptionService } from '../../../security/credential-encryption.service.js';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard.js';
import { GitHubAppController } from './github-app.controller.js';
import { GitHubAppService } from './github-app.service.js';

/** Exercise real validation, authorization, serialization and generated OpenAPI on the HTTP boundary. */
describe('GitHub App HTTP contract', /** Groups scenarios for GitHub App HTTP contract. */ () => {
  const prisma = new PrismaService();
  const privateKey = generateKeyPairSync('rsa', { modulusLength: 2048 })
    .privateKey.export({ type: 'pkcs8', format: 'pem' })
    .toString();
  const providerFetch = jest.fn<typeof fetch>(
    /** Provides isolated providerFetch behavior for this test fixture. */ async () =>
      Response.json({ id: 12, slug: 'repovio-test' }),
  );
  let http: NestFastifyApplication;

  beforeAll(
    /** Prepares shared test state for beforeAll. */ async () => {
      await prisma.onModuleInit();
      await new TestDatabaseService(prisma).cleanup();
      const service = new GitHubAppService(prisma, new CredentialEncryptionService(), providerFetch);
      const moduleRef = await Test.createTestingModule({
        controllers: [GitHubAppController],
        providers: [{ provide: GitHubAppService, useValue: service }],
      })
        .overrideGuard(JwtAuthGuard)
        .useValue({
          /** Checks whether the caller can activate. */
          canActivate(context: ExecutionContext) {
            const request = context.switchToHttp().getRequest<{ headers: Record<string, string>; user: object }>();
            if (!request.headers.authorization) throw new UnauthorizedException();
            request.user = {
              id: 'admin',
              username: 'admin',
              role: request.headers.authorization === 'Bearer admin' ? 'SYSTEM_ADMIN' : 'VIEWER',
              authProvider: 'LOCAL',
            };
            return true;
          },
        })
        .overrideGuard(PoliciesGuard)
        .useValue({ /** Checks whether the caller can activate. */ canActivate: () => true })
        .compile();
      http = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
      configureApiRoutes(http);
      http.useGlobalPipes(new ZodValidationPipe());
      http.useGlobalInterceptors(new ZodSerializerInterceptor(http.get(Reflector)));
      await http.init();
      await http.getHttpAdapter().getInstance().ready();
    },
  );
  afterAll(
    /** Restores shared test state for afterAll. */ async () => {
      await http?.close();
      await prisma.onModuleDestroy();
    },
  );

  it('requires login and denies viewer configuration reads', /** Verifies requires login and denies viewer configuration reads. */ async () => {
    expect((await http.inject({ method: 'GET', url: '/api/v1/github-app' })).statusCode).toBe(401);
    const response = await http.inject({
      method: 'GET',
      url: '/api/v1/github-app',
      headers: { authorization: 'Bearer viewer' },
    });
    expect(response.statusCode).toBe(403);
    expect(response.json().message).toBe(new ForbiddenException('System administrator access is required.').message);
  });

  it('rejects malformed input and unknown fields before contacting GitHub', /** Verifies rejects malformed input and unknown fields before contacting GitHub. */ async () => {
    for (const payload of [
      { appId: '../other', slug: 'repovio-test' },
      { appId: '12', slug: 'repovio-test', webhookSecret: 'short' },
      { appId: '12', slug: 'repovio-test', encryptedPrivateKey: 'unexpected' },
    ])
      expect(
        (
          await http.inject({
            method: 'PUT',
            url: '/api/v1/github-app',
            headers: { authorization: 'Bearer admin' },
            payload,
          })
        ).statusCode,
      ).toBe(400);
    expect(providerFetch).not.toHaveBeenCalled();
  });

  it('serializes safe metadata after saving real encrypted configuration', /** Verifies serializes safe metadata after saving real encrypted configuration. */ async () => {
    const response = await http.inject({
      method: 'PUT',
      url: '/api/v1/github-app',
      headers: { authorization: 'Bearer admin' },
      payload: { appId: '12', slug: 'repovio-test', privateKey, webhookSecret: 'synthetic-webhook-secret' },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      appId: '12',
      configured: true,
      slug: 'repovio-test',
      installationUrl: 'https://github.com/apps/repovio-test/installations/new',
      webhookUrl: 'http://localhost:3000/api/v1/webhooks/github-app',
    });
    expect(response.body).not.toContain('PRIVATE KEY');
    expect(response.body).not.toContain('synthetic-webhook-secret');
  });

  it('connects an installation with matching 201 response and a credential-free account DTO', /** Verifies connects an installation with matching 201 response and a credential-free account DTO. */ async () => {
    providerFetch.mockResolvedValueOnce(
      Response.json({
        id: 42,
        app_id: 12,
        account: { login: 'example' },
        suspended_at: null,
        permissions: { actions: 'read', issues: 'read', pull_requests: 'read' },
      }),
    );
    const response = await http.inject({
      method: 'POST',
      url: '/api/v1/github-app/installations',
      headers: { authorization: 'Bearer admin' },
      payload: { installationId: '42', displayName: 'example' },
    });
    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      providerType: 'GITHUB',
      authenticationMethod: 'GITHUB_APP',
      githubInstallationState: 'ACTIVE',
    });
    expect(response.json()).not.toHaveProperty('encryptedAccessToken');
    expect(response.json()).not.toHaveProperty('githubInstallationId');
  });

  it('documents configuration and connection schemas on versioned routes', /** Verifies documents configuration and connection schemas on versioned routes. */ () => {
    const document = createApiDocument(http, 'http://localhost:3000');
    expect(document.paths['/api/v1/github-app']?.put?.requestBody).toBeDefined();
    expect(document.paths['/api/v1/github-app/installations']?.post?.responses['201']).toBeDefined();
    expect(JSON.stringify(document)).not.toContain(privateKey);
  });
});
