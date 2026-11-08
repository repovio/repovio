import { jest } from '@jest/globals';
import { BadGatewayException, BadRequestException, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service.js';
import { TestDatabaseService } from '../../../prisma/test-database.service.js';
import { CredentialEncryptionService } from '../../../security/credential-encryption.service.js';
import { ProviderAccountsService } from '../provider-accounts.service.js';
import { ProviderCredentialService } from '../provider-credential.service.js';
import { ProviderRequestError } from '../provider-request.error.js';
import { GitLabOAuthService, normalizeGitLabUrl, parseGitLabTokenPair } from './gitlab-oauth.service.js';

const configuration = {
  baseUrl: 'https://gitlab.example.test',
  clientId: 'synthetic-client',
  clientSecret: 'synthetic-secret',
  redirectUri: 'http://localhost:3001/api/v1/provider-accounts/oauth/callback',
};
const admin = { id: 'admin', role: 'SYSTEM_ADMIN' as const, authProvider: 'LOCAL' as const, username: 'admin' };

/** Build a complete synthetic GitLab token generation using real epoch-second metadata. */
function payload(access = 'new-access', refresh = 'new-refresh') {
  return {
    access_token: access,
    refresh_token: refresh,
    token_type: 'Bearer',
    created_at: Math.floor(Date.now() / 1000),
    expires_in: 7200,
  };
}

describe('GitLab OAuth credential persistence and locking', /** Exercise real PostgreSQL with synthetic provider HTTP responses. */ () => {
  const prisma = new PrismaService();
  const otherPrisma = new PrismaService();
  const encryption = new CredentialEncryptionService();
  const fetch = jest.fn<typeof globalThis.fetch>();
  const service = new GitLabOAuthService(prisma, encryption, fetch);
  const other = new GitLabOAuthService(otherPrisma, encryption, fetch);
  const accounts = new ProviderAccountsService(
    otherPrisma,
    new ProviderCredentialService(encryption),
    {} as never,
    {} as never,
  );

  beforeAll(
    /** Open two independent database connections for cross-worker locking. */ async () => {
      await prisma.onModuleInit();
      await otherPrisma.onModuleInit();
    },
  );
  afterAll(
    /** Release both connection pools. */ async () => {
      await prisma.onModuleDestroy();
      await otherPrisma.onModuleDestroy();
    },
  );
  beforeEach(
    /** Reset synthetic records and inject installation-owned configuration. */ async () => {
      await new TestDatabaseService(prisma).cleanup();
      fetch.mockReset().mockResolvedValue(Response.json(payload()));
      jest.spyOn(service, 'configuration').mockReturnValue(configuration);
      jest.spyOn(other, 'configuration').mockReturnValue(configuration);
    },
  );

  /** Persist a synthetic account with either current or expiring OAuth credentials. */
  async function account(remaining = 0) {
    return prisma.providerAccount.create({
      data: {
        displayName: 'GitLab',
        providerType: 'GITLAB',
        baseUrl: configuration.baseUrl,
        encryptedAccessToken: encryption.encrypt('old-access'),
        encryptedRefreshToken: encryption.encrypt('old-refresh'),
        oauthStatus: 'CONNECTED',
        oauthClientId: configuration.clientId,
        oauthRedirectUri: configuration.redirectUri,
        gitlabUserId: '42',
        oauthAccessTokenExpiresAt: new Date(Date.now() + remaining),
      },
    });
  }

  it('encrypts a complete initial generation and validates numeric identity', /** Verify initial exchange never writes or exposes plaintext credentials. */ async () => {
    fetch
      .mockResolvedValueOnce(Response.json(payload()))
      .mockResolvedValueOnce(Response.json({ id: 42, username: 'mutable' }));
    const credentials = await service.exchangeCode('synthetic-code');
    expect(encryption.decrypt(credentials.encryptedAccessToken)).toBe('new-access');
    expect(encryption.decrypt(credentials.encryptedRefreshToken)).toBe('new-refresh');
    expect(credentials.gitlabUserId).toBe('42');
    expect(JSON.stringify(credentials)).not.toContain('new-access');
    expect(fetch.mock.calls[0]![1]).toMatchObject({
      method: 'POST',
      redirect: 'error',
      signal: expect.any(AbortSignal),
    });
    expect(new URLSearchParams(fetch.mock.calls[0]![1]!.body as string).get('client_secret')).toBe(
      configuration.clientSecret,
    );
    expect(await prisma.providerAccount.count()).toBe(0);
  });

  it('reuses valid tokens and reads the persisted generation instead of a caller snapshot', /** Verify central resolution sees newly persisted credentials. */ async () => {
    const row = await account(120_000);
    const resolver = new ProviderCredentialService(encryption, undefined, service);
    await prisma.providerAccount.update({
      where: { id: row.id },
      data: { encryptedAccessToken: encryption.encrypt('latest') },
    });
    expect(await resolver.accessToken(row)).toBe('latest');
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([60_000, 0, -60_000])(
    'rotates tokens with %i milliseconds remaining',
    /** Verify expiry window and encrypted pair persistence. */ async (remaining) => {
      const row = await account(remaining);
      expect(await service.accessToken(row.id)).toBe('new-access');
      const stored = await prisma.providerAccount.findUniqueOrThrow({ where: { id: row.id } });
      expect(encryption.decrypt(stored.encryptedRefreshToken!)).toBe('new-refresh');
      expect(stored.encryptedAccessToken).not.toContain('new-access');
      expect(await other.accessToken(row.id)).toBe('new-access');
      expect(fetch).toHaveBeenCalledTimes(1);
    },
  );

  it('serializes independent workers and rechecks expiry after acquiring the row lock', /** Verify one upstream rotation for simultaneous callers. */ async () => {
    const row = await account();
    expect(
      await Promise.all([service.accessToken(row.id), other.accessToken(row.id), service.accessToken(row.id)]),
    ).toEqual(['new-access', 'new-access', 'new-access']);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('commits invalid_grant recovery status and suppresses subsequent automatic attempts', /** Verify failure status survives the caller rejection. */ async () => {
    const row = await account();
    fetch.mockResolvedValueOnce(
      Response.json({ error: 'invalid_grant', error_description: 'synthetic-secret' }, { status: 400 }),
    );
    await expect(service.accessToken(row.id)).rejects.toThrow('Reauthorize');
    await expect(other.accessToken(row.id)).rejects.toThrow('Reauthorize');
    const stored = await prisma.providerAccount.findUniqueOrThrow({ where: { id: row.id } });
    expect(stored.oauthStatus).toBe('REAUTHORIZATION_REQUIRED');
    expect(stored.encryptedRefreshToken).toBe(row.encryptedRefreshToken);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it.each([429, 500, 503])(
    'preserves credentials and retry metadata after HTTP %i',
    /** Verify retryable failures do not latch reauthorization. */ async (status) => {
      const row = await account();
      fetch.mockResolvedValueOnce(
        Response.json({ error: 'synthetic-secret' }, { status, headers: { 'retry-after': '30' } }),
      );
      await expect(service.accessToken(row.id)).rejects.toMatchObject({
        status,
        retryAt: expect.any(Date),
        message: expect.not.stringContaining('synthetic-secret'),
      });
      expect(await prisma.providerAccount.findUniqueOrThrow({ where: { id: row.id } })).toMatchObject({
        oauthStatus: 'CONNECTED',
        encryptedRefreshToken: row.encryptedRefreshToken,
      });
      expect(await service.accessToken(row.id)).toBe('new-access');
    },
  );

  it.each([new Error('old-refresh'), new DOMException('old-refresh', 'TimeoutError')])(
    'sanitizes transport and timeout failures',
    /** Verify thrown transport data never escapes and expired tokens are not returned. */ async (error) => {
      const row = await account();
      fetch.mockRejectedValueOnce(error);
      await expect(service.accessToken(row.id)).rejects.toThrow(ProviderRequestError);
      expect((await prisma.providerAccount.findUniqueOrThrow({ where: { id: row.id } })).encryptedAccessToken).toBe(
        row.encryptedAccessToken,
      );
    },
  );

  it.each(['encryptedRefreshToken', 'oauthAccessTokenExpiresAt', 'gitlabUserId'] as const)(
    'requires reauthorization when %s is missing',
    /** Verify incomplete managed accounts cannot silently become PAT accounts. */ async (field) => {
      const row = await account(120_000);
      await prisma.providerAccount.update({ where: { id: row.id }, data: { [field]: null } });
      await expect(service.accessToken(row.id)).rejects.toThrow('Reauthorize');
      expect(fetch).not.toHaveBeenCalled();
    },
  );

  it('rejects changed clients and mismatched instances without sending credentials', /** Verify configuration binding before any HTTP request. */ async () => {
    const row = await account();
    jest.spyOn(service, 'configuration').mockReturnValue({ ...configuration, clientId: 'changed-client' });
    await expect(service.accessToken(row.id)).rejects.toThrow('Reauthorize');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('sanitizes missing client configuration without modifying stored credentials', /** Verify configuration errors do not consume refresh tokens. */ async () => {
    const row = await account();
    jest.spyOn(service, 'configuration').mockImplementation(
      /** Simulate unavailable deployment configuration. */ () => {
        throw new BadRequestException('GitLab OAuth is not configured.');
      },
    );
    await expect(service.accessToken(row.id)).rejects.toThrow('not configured');
    expect(fetch).not.toHaveBeenCalled();
    expect((await prisma.providerAccount.findUniqueOrThrow({ where: { id: row.id } })).oauthStatus).toBe('CONNECTED');
  });

  it('does not revive a disabled or deleted connection', /** Verify fresh persisted state overrides stale caller knowledge. */ async () => {
    const row = await account();
    await accounts.update(admin, row.id, { enabled: false });
    await expect(service.accessToken(row.id)).rejects.toThrow('disabled');
    await accounts.remove(admin, row.id);
    await expect(service.accessToken(row.id)).rejects.toThrow(NotFoundException);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('coordinates disable and deletion with an in-flight refresh', /** Verify queued mutations operate on the committed generation without restoring enabled state. */ async () => {
    const row = await account();
    let release!: (response: Response) => void;
    let started!: () => void;
    const began = new Promise<void>(
      /** Expose the exact instant the refresh owns the row lock. */ (resolve) => {
        started = resolve;
      },
    );
    fetch.mockImplementationOnce(
      /** Hold the provider response while another connection queues a mutation. */ () => {
        started();
        return new Promise<Response>(
          /** Allow the test to release the in-flight response. */ (resolve) => {
            release = resolve;
          },
        );
      },
    );
    const refresh = service.accessToken(row.id);
    await began;
    const disable = accounts.update(admin, row.id, { enabled: false });
    release(Response.json(payload()));
    await refresh;
    await disable;
    const stored = await prisma.providerAccount.findUniqueOrThrow({ where: { id: row.id } });
    expect(stored.enabled).toBe(false);
    expect(encryption.decrypt(stored.encryptedRefreshToken!)).toBe('new-refresh');
  });

  it('preserves legacy GitLab PAT accounts without fabricating OAuth metadata', /** Verify old records keep their original authentication semantics. */ async () => {
    const row = await prisma.providerAccount.create({
      data: { displayName: 'Legacy', providerType: 'GITLAB', encryptedAccessToken: encryption.encrypt('pat') },
    });
    expect(await service.accessToken(row.id)).toBe('pat');
    expect(fetch).not.toHaveBeenCalled();
    expect(row).toMatchObject({ oauthStatus: 'NONE', encryptedRefreshToken: null, authenticationMethod: 'TOKEN' });
  });

  it.each([
    {},
    { ...payload(), refresh_token: '' },
    { ...payload(), token_type: 'other' },
    { ...payload(), expires_in: -1 },
    { ...payload(), created_at: 1 },
    { ...payload(), expires_in: Infinity },
  ])(
    'rejects malformed token generations',
    /** Verify complete validation before either token is persisted. */ async (value) => {
      const row = await account();
      fetch.mockResolvedValueOnce(Response.json(value));
      await expect(service.accessToken(row.id)).rejects.toThrow(BadGatewayException);
      expect((await prisma.providerAccount.findUniqueOrThrow({ where: { id: row.id } })).encryptedRefreshToken).toBe(
        row.encryptedRefreshToken,
      );
    },
  );

  it('rejects nonnumeric identity and malformed JSON with sanitized errors', /** Verify invalid exchange data cannot create a managed account. */ async () => {
    fetch.mockResolvedValueOnce(Response.json(payload())).mockResolvedValueOnce(Response.json({ id: '42' }));
    await expect(service.exchangeCode('code')).rejects.toThrow('identity');
    fetch.mockResolvedValueOnce(new Response('synthetic-secret'));
    await expect(service.exchangeCode('code')).rejects.toThrow('invalid OAuth response');
  });

  it('sanitizes transaction failures that could contain encrypted write arguments', /** Verify persistence errors cannot leak Prisma invocation data through errors or logs. */ async () => {
    const database = {
      $transaction: jest.fn().mockRejectedValue(new Error('synthetic-encrypted-write-argument') as never),
    };
    const broken = new GitLabOAuthService(database as never, encryption, fetch);
    const error = await broken
      .accessToken('synthetic-id')
      .catch(/** Inspect only the sanitized public failure. */ (failure: unknown) => failure);
    expect(error).toBeInstanceOf(BadGatewayException);
    expect(String(error)).not.toContain('synthetic-encrypted-write-argument');
    expect((error as Error).cause).toBeUndefined();
  });

  it('normalizes only safe instance URLs and rejects tokenless payloads', /** Verify URL canonicalization and direct parser rejection. */ () => {
    expect(normalizeGitLabUrl('https://GITLAB.example.test/prefix/')).toBe('https://gitlab.example.test/prefix');
    expect(/** Reject embedded URL credentials. */ () => normalizeGitLabUrl('https://secret@example.test')).toThrow(
      BadRequestException,
    );
    expect(/** Reject a missing token pair. */ () => parseGitLabTokenPair(null)).toThrow(BadGatewayException);
    expect(new ProviderRequestError('GitLab', 429, null).rateLimited).toBe(true);
  });
});
