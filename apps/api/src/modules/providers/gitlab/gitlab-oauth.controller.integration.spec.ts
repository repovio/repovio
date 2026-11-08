import { jest } from '@jest/globals';
import { type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import { randomUUID } from 'node:crypto';

import { CaslAbilityFactory } from '../../../casl/casl-ability.factory.js';
import { PoliciesGuard } from '../../../casl/policies.guard.js';
import { configureApiRoutes, createApiDocument } from '../../../openapi/document.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { TestDatabaseService } from '../../../prisma/test-database.service.js';
import { CredentialEncryptionService } from '../../../security/credential-encryption.service.js';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard.js';
import { ProviderAccountsQueryService } from '../provider-accounts-query.service.js';
import { ProviderAccountsController } from '../provider-accounts.controller.js';
import { ProviderAccountsService } from '../provider-accounts.service.js';
import { ProviderCredentialService } from '../provider-credential.service.js';
import { ProviderOAuthStateService } from '../provider-oauth-state.service.js';
import { ProviderOAuthController } from '../provider-oauth.controller.js';
import { ProviderOAuthService } from '../provider-oauth.service.js';
import { GitLabOAuthService } from './gitlab-oauth.service.js';

const configuration = {
  baseUrl: 'https://gitlab.example.test',
  clientId: 'synthetic-client',
  clientSecret: 'synthetic-secret',
  redirectUri: 'http://localhost:3001/api/v1/provider-accounts/oauth/callback',
};

/** Verify real controller validation/serialization and database writes with synthetic identities and provider HTTP. */
describe('GitLab OAuth HTTP contract and in-place authorization', /** Exercise new, legacy, and managed account boundaries. */ () => {
  const prisma = new PrismaService();
  const encryption = new CredentialEncryptionService();
  const providerFetch = jest.fn<typeof fetch>();
  const gitlab = new GitLabOAuthService(prisma, encryption, providerFetch);
  const credentials = new ProviderCredentialService(encryption, undefined, gitlab);
  const states = new ProviderOAuthStateService(credentials);
  const accounts = new ProviderAccountsService(prisma, credentials, {} as never, {} as never);
  const queries = new ProviderAccountsQueryService(prisma, new CaslAbilityFactory());
  const oauth = new ProviderOAuthService(accounts, providerFetch, prisma, states, gitlab);
  let http: NestFastifyApplication;
  let adminId: string;

  beforeAll(
    /** Create the real HTTP validation and serialization pipeline with a synthetic authentication guard. */ async () => {
      await prisma.onModuleInit();
      const moduleRef = await Test.createTestingModule({
        controllers: [ProviderAccountsController, ProviderOAuthController],
        providers: [
          { provide: ProviderAccountsService, useValue: accounts },
          { provide: ProviderAccountsQueryService, useValue: queries },
          { provide: ProviderOAuthService, useValue: oauth },
        ],
      })
        .overrideGuard(JwtAuthGuard)
        .useValue({
          /** Authenticate synthetic test identities; production JWT validation is covered by existing auth tests. */
          canActivate(context: ExecutionContext) {
            const request = context.switchToHttp().getRequest<{ headers: Record<string, string>; user: object }>();
            if (!request.headers.authorization) throw new UnauthorizedException();
            request.user = {
              id: adminId,
              username: 'admin',
              role: request.headers.authorization === 'Bearer admin' ? 'SYSTEM_ADMIN' : 'VIEWER',
              authProvider: 'LOCAL',
            };
            return true;
          },
        })
        .overrideGuard(PoliciesGuard)
        .useValue({ /** Leave role enforcement to the real service under test. */ canActivate: () => true })
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
    /** Close the HTTP server and database pool. */ async () => {
      await http?.close();
      await prisma.onModuleDestroy();
    },
  );
  beforeEach(
    /** Reset records and install deterministic provider responses. */ async () => {
      await new TestDatabaseService(prisma).cleanup();
      adminId = (
        await prisma.user.create({ data: { username: 'admin', passwordHash: 'synthetic-hash', role: 'SYSTEM_ADMIN' } })
      ).id;
      jest.spyOn(gitlab, 'configuration').mockReturnValue(configuration);
      providerFetch.mockReset().mockImplementation(
        /** Return only synthetic token and numeric identity data. */ async (url) =>
          Response.json(
            String(url).endsWith('/oauth/token')
              ? {
                  access_token: 'synthetic-access',
                  refresh_token: 'synthetic-refresh',
                  token_type: 'Bearer',
                  created_at: Math.floor(Date.now() / 1000),
                  expires_in: 7200,
                }
              : { id: 42, username: 'mutable-name' },
          ),
      );
    },
  );

  /** Create a disabled legacy account with tracked configuration and history to preserve through conversion. */
  async function target() {
    const account = await prisma.providerAccount.create({
      data: {
        providerType: 'GITLAB',
        displayName: 'Keep this name',
        baseUrl: configuration.baseUrl,
        enabled: false,
        encryptedAccessToken: encryption.encrypt('legacy-pat'),
      },
    });
    const repository = await prisma.repository.create({
      data: {
        providerAccountId: account.id,
        providerRepositoryId: '42',
        owner: 'example',
        name: 'history',
        url: `${configuration.baseUrl}/example/history`,
        issueRetentionDays: 30,
      },
    });
    await prisma.repositoryMembership.create({
      data: { userId: adminId, repositoryId: repository.id, role: 'MANAGER' },
    });
    await prisma.workflow.create({
      data: { repositoryId: repository.id, providerWorkflowId: 'ci', name: 'CI', lastSeenAt: new Date() },
    });
    return { account, repository };
  }
  /** Start authorization through the actual endpoint and extract opaque state. */
  async function begin(id: string) {
    const response = await http.inject({
      method: 'POST',
      url: `/api/v1/provider-accounts/${id}/oauth`,
      headers: { authorization: 'Bearer admin' },
      payload: {},
    });
    expect(response.statusCode).toBe(201);
    const url = new URL(response.json().authorizationUrl);
    expect(url.origin).toBe(configuration.baseUrl);
    expect(url.searchParams.get('scope')).toBe('read_api read_user');
    expect(response.body).not.toContain(configuration.clientSecret);
    return url.searchParams.get('state')!;
  }
  /** Complete authorization through the public callback without a mocked signed-in callback user. */
  async function callback(state: string, extra: Record<string, string> = { code: 'synthetic-code' }) {
    return http.inject({ method: 'GET', url: '/api/v1/provider-accounts/oauth/callback', query: { state, ...extra } });
  }
  /** Read current target state so denied flows can prove no mutation. */
  async function stored(id: string) {
    return prisma.providerAccount.findUniqueOrThrow({ where: { id } });
  }

  it('converts in place and preserves disabled state, repositories, membership, configuration, and history', /** Verify the existing account remains the sole connection after conversion. */ async () => {
    const { account, repository } = await target();
    const state = await begin(account.id);
    await accounts.update({ id: adminId, role: 'SYSTEM_ADMIN', authProvider: 'LOCAL', username: 'admin' }, account.id, {
      displayName: 'Renamed during consent',
    });
    const response = await callback(state);
    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toContain('oauth=connected');
    expect(await stored(account.id)).toMatchObject({
      id: account.id,
      displayName: 'Renamed during consent',
      enabled: false,
      authenticationMethod: 'TOKEN',
      gitlabUserId: '42',
      oauthStatus: 'CONNECTED',
      oauthAuthorizationRevision: 1,
    });
    expect(await prisma.providerAccount.count()).toBe(1);
    expect(await prisma.repository.findUnique({ where: { id: repository.id } })).toEqual(repository);
    expect(await prisma.repositoryMembership.count()).toBe(1);
    expect(await prisma.workflow.count()).toBe(1);
    expect(encryption.decrypt((await stored(account.id)).encryptedRefreshToken!)).toBe('synthetic-refresh');
  });

  it('requires authentication and administrator authorization before target lookup', /** Verify unauthenticated and non-admin requests never contact GitLab. */ async () => {
    for (const [authorization, status] of [
      [undefined, 401],
      ['Bearer viewer', 403],
    ] as const) {
      const response = await http.inject({
        method: 'POST',
        url: `/api/v1/provider-accounts/${randomUUID()}/oauth`,
        headers: authorization ? { authorization } : {},
        payload: {},
      });
      expect(response.statusCode).toBe(status);
    }
    expect(providerFetch).not.toHaveBeenCalled();
  });

  it('rejects replacement metadata and invalid provider/instance targets', /** Verify server-owned metadata cannot be overridden by request bodies. */ async () => {
    const { account } = await target();
    const headers = { authorization: 'Bearer admin' };
    expect(
      (
        await http.inject({
          method: 'POST',
          url: `/api/v1/provider-accounts/${account.id}/oauth`,
          headers,
          payload: { baseUrl: 'https://attacker.example.test' },
        })
      ).statusCode,
    ).toBe(400);
    await prisma.providerAccount.update({ where: { id: account.id }, data: { baseUrl: 'https://other.example.test' } });
    expect(
      (
        await http.inject({
          method: 'POST',
          url: `/api/v1/provider-accounts/${account.id}/oauth`,
          headers,
          payload: {},
        })
      ).statusCode,
    ).toBe(400);
    await prisma.providerAccount.update({ where: { id: account.id }, data: { providerType: 'GITHUB' } });
    expect(
      (
        await http.inject({
          method: 'POST',
          url: `/api/v1/provider-accounts/${account.id}/oauth`,
          headers,
          payload: {},
        })
      ).statusCode,
    ).toBe(400);
    expect(
      (
        await http.inject({
          method: 'POST',
          url: `/api/v1/provider-accounts/${randomUUID()}/oauth`,
          headers,
          payload: {},
        })
      ).statusCode,
    ).toBe(404);
    expect(providerFetch).not.toHaveBeenCalled();
  });

  it('allows matching numeric identity despite a renamed GitLab user and rejects another user', /** Verify stable identity binding on repeated authorizations. */ async () => {
    const { account } = await target();
    await callback(await begin(account.id));
    await callback(await begin(account.id));
    const before = await stored(account.id);
    providerFetch
      .mockResolvedValueOnce(
        Response.json({
          access_token: 'wrong-access',
          refresh_token: 'wrong-refresh',
          token_type: 'bearer',
          created_at: Math.floor(Date.now() / 1000),
          expires_in: 7200,
        }),
      )
      .mockResolvedValueOnce(Response.json({ id: 999, username: 'mutable-name' }));
    expect((await callback(await begin(account.id))).headers.location).toContain('oauth=failed');
    expect(await stored(account.id)).toEqual(before);
  });

  it('rejects competing stale callbacks and direct managed-token/base-URL replacement', /** Verify revision checks before upstream exchange and credential-safe update errors. */ async () => {
    const { account } = await target();
    const first = await begin(account.id);
    const stale = await begin(account.id);
    await callback(first);
    providerFetch.mockClear();
    expect((await callback(stale)).headers.location).toContain('oauth=failed');
    expect(providerFetch).not.toHaveBeenCalled();
    for (const payload of [{ accessToken: 'replacement' }, { baseUrl: configuration.baseUrl }]) {
      expect(
        (
          await http.inject({
            method: 'PATCH',
            url: `/api/v1/provider-accounts/${account.id}`,
            headers: { authorization: 'Bearer admin' },
            payload,
          })
        ).statusCode,
      ).toBe(400);
    }
  });

  it('keeps cancellation, provider errors, tampered and expired state from changing the account', /** Verify each failed callback leaves the original credential generation intact. */ async () => {
    const { account } = await target();
    const before = await stored(account.id);
    const state = await begin(account.id);
    expect((await callback(state, { error: 'access_denied' })).headers.location).toContain('oauth=cancelled');
    expect((await callback(state, { error: 'server_error', code: 'ignored-code' })).headers.location).toContain(
      'oauth=failed',
    );
    expect((await callback(`${state}tampered`)).headers.location).toContain('oauth=failed');
    const clock = jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 11 * 60_000);
    try {
      expect((await callback(state)).headers.location).toContain('oauth=failed');
    } finally {
      clock.mockRestore();
    }
    expect(await stored(account.id)).toEqual(before);
    expect(providerFetch).not.toHaveBeenCalled();
  });

  it('denies permission loss before and during code exchange', /** Recheck persisted administrator authority immediately before credentials are committed. */ async () => {
    const { account } = await target();
    const state = await begin(account.id);
    await prisma.user.update({ where: { id: adminId }, data: { role: 'VIEWER' } });
    expect((await callback(state)).headers.location).toContain('oauth=failed');
    expect(providerFetch).not.toHaveBeenCalled();
    await prisma.user.update({ where: { id: adminId }, data: { role: 'SYSTEM_ADMIN' } });
    providerFetch.mockImplementationOnce(
      /** Revoke administrator rights after the callback starts exchange. */ async () => {
        await prisma.user.update({ where: { id: adminId }, data: { role: 'VIEWER' } });
        return Response.json({
          access_token: 'synthetic-access',
          refresh_token: 'synthetic-refresh',
          token_type: 'bearer',
          created_at: Math.floor(Date.now() / 1000),
          expires_in: 7200,
        });
      },
    );
    expect((await callback(state)).headers.location).toContain('oauth=failed');
    expect((await stored(account.id)).oauthStatus).toBe('NONE');
  });

  it('denies deleted targets and targets changed during browser consent', /** Never recreate a target or overwrite a replacement PAT. */ async () => {
    const { account } = await target();
    const state = await begin(account.id);
    await accounts.update({ id: adminId, role: 'SYSTEM_ADMIN', authProvider: 'LOCAL', username: 'admin' }, account.id, {
      accessToken: 'new-pat',
    });
    expect((await callback(state)).headers.location).toContain('oauth=failed');
    const second = await begin(account.id);
    await prisma.providerAccount.delete({ where: { id: account.id } });
    expect((await callback(second)).headers.location).toContain('oauth=failed');
    expect(await prisma.providerAccount.count()).toBe(0);
    expect(providerFetch).not.toHaveBeenCalled();
  });

  it('rejects configuration changes and keeps tokens away from arbitrary instance URLs', /** Check configuration snapshots for existing and new-account flows. */ async () => {
    const { account } = await target();
    const state = await begin(account.id);
    jest.spyOn(gitlab, 'configuration').mockReturnValue({ ...configuration, clientId: 'changed-client' });
    expect((await callback(state)).headers.location).toContain('oauth=failed');
    expect(
      (
        await http.inject({
          method: 'POST',
          url: '/api/v1/provider-accounts/oauth/authorize',
          headers: { authorization: 'Bearer admin' },
          payload: { providerType: 'GITLAB', displayName: 'New', baseUrl: 'https://attacker.example.test' },
        })
      ).statusCode,
    ).toBe(400);
    expect(providerFetch).not.toHaveBeenCalled();
  });

  it('serializes reauthorization behind an in-flight refresh without losing the new authorization', /** Verify refresh and callback writers on separate transactions cannot restore an older credential pair. */ async () => {
    const { account } = await target();
    await callback(await begin(account.id));
    await prisma.providerAccount.update({
      where: { id: account.id },
      data: { enabled: true, oauthAccessTokenExpiresAt: new Date(0) },
    });
    let release!: (response: Response) => void;
    let started!: () => void;
    const began = new Promise<void>(
      /** Signal when upstream refresh owns the account lock. */ (resolve) => {
        started = resolve;
      },
    );
    providerFetch.mockImplementation(
      /** Distinguish refresh and reauthorization generations deterministically. */ async (url, init) => {
        if (String(url).endsWith('/user')) return Response.json({ id: 42 });
        const grant = new URLSearchParams(init?.body as string).get('grant_type');
        if (grant === 'refresh_token') {
          started();
          return new Promise<Response>(
            /** Hold the refresh until callback exchange has started. */ (resolve) => {
              release = resolve;
            },
          );
        }
        return Response.json({
          access_token: 'reauthorized-access',
          refresh_token: 'reauthorized-refresh',
          token_type: 'bearer',
          created_at: Math.floor(Date.now() / 1000),
          expires_in: 7200,
        });
      },
    );
    const refresh = gitlab.accessToken(account.id);
    await began;
    const completing = callback(await begin(account.id));
    release(
      Response.json({
        access_token: 'rotated-access',
        refresh_token: 'rotated-refresh',
        token_type: 'bearer',
        created_at: Math.floor(Date.now() / 1000),
        expires_in: 7200,
      }),
    );
    await refresh;
    expect((await completing).headers.location).toContain('oauth=connected');
    expect(await gitlab.accessToken(account.id)).toBe('reauthorized-access');
    expect(encryption.decrypt((await stored(account.id)).encryptedRefreshToken!)).toBe('reauthorized-refresh');
  });

  it('preserves initial OAuth creation and returns only safe status metadata through real queries', /** Verify shared DTOs, field selection, and credential exclusion. */ async () => {
    const response = await http.inject({
      method: 'POST',
      url: '/api/v1/provider-accounts/oauth/authorize',
      headers: { authorization: 'Bearer admin' },
      payload: { providerType: 'GITLAB', displayName: 'New OAuth' },
    });
    expect(response.statusCode).toBe(201);
    await callback(new URL(response.json().authorizationUrl).searchParams.get('state')!);
    const safe = await http.inject({
      method: 'GET',
      url: '/api/v1/provider-accounts',
      headers: { authorization: 'Bearer admin' },
      query: { fields: 'id,displayName,authenticationMethod,oauthStatus' },
    });
    expect(safe.statusCode).toBe(200);
    expect(safe.json().items[0]).toMatchObject({
      displayName: 'New OAuth',
      authenticationMethod: 'TOKEN',
      oauthStatus: 'CONNECTED',
    });
    for (const secret of [
      'synthetic-access',
      'synthetic-refresh',
      'encryptedRefreshToken',
      'oauthClientId',
      'gitlabUserId',
      'oauthAuthorizationRevision',
    ]) {
      expect(safe.body).not.toContain(secret);
    }
    for (const field of ['encryptedAccessToken', 'encryptedRefreshToken', 'oauthClientId', 'gitlabUserId']) {
      const invalid = await http.inject({
        method: 'GET',
        url: '/api/v1/provider-accounts',
        headers: { authorization: 'Bearer admin' },
        query: { fields: field },
      });
      expect(invalid.statusCode).toBe(400);
    }
    const document = createApiDocument(http, '/');
    expect(document.paths['/api/v1/provider-accounts/{id}/oauth']?.post).toBeDefined();
    expect(JSON.stringify(document)).toContain('REAUTHORIZATION_REQUIRED');
    expect(JSON.stringify(document)).not.toContain('encryptedRefreshToken');
  });
});
