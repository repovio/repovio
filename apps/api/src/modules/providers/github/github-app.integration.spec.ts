import { jest } from '@jest/globals';
import { BadRequestException, ConflictException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { generateKeyPairSync, verify } from 'node:crypto';

import { createHmac } from 'node:crypto';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { TestDatabaseService } from '../../../prisma/test-database.service.js';
import { CredentialEncryptionService } from '../../../security/credential-encryption.service.js';
import { GitHubAppWebhookService } from '../../webhooks/github-app-webhook.service.js';
import { ProviderCredentialService } from '../provider-credential.service.js';
import { ProviderSyncQueueService } from '../sync-queue.service.js';
import { GitHubActionsAdapter } from './github-actions.adapter.js';
import { GitHubAppService } from './github-app.service.js';

const keys = generateKeyPairSync('rsa', { modulusLength: 2048 });
const privateKey = keys.privateKey.export({ format: 'pem', type: 'pkcs8' }).toString();
const secret = 'synthetic-app-webhook-secret';
const admin = { id: 'admin', username: 'admin', authProvider: 'LOCAL' as const, role: 'SYSTEM_ADMIN' as const };
const viewer = { ...admin, role: 'VIEWER' as const };
const installation = {
  id: 42,
  app_id: 12,
  account: { login: 'example' },
  suspended_at: null,
  permissions: {
    actions: 'write',
    issues: 'read',
    pull_requests: 'read',
    metadata: 'read',
    security_events: 'read',
    administration: 'write',
  },
};

describe('GitHub App persistence, authentication and webhook integration', () => {
  const prisma = new PrismaService();
  const encryption = new CredentialEncryptionService();
  const fetchFn = jest.fn<typeof fetch>();
  let app: GitHubAppService;
  const realQueue = new ProviderSyncQueueService(prisma, {} as never, {} as never);
  const queue = realQueue;
  const enqueueWebhook = jest.spyOn(queue, 'enqueueWebhookRepository');
  let webhooks: GitHubAppWebhookService;

  beforeAll(async () => prisma.onModuleInit());
  afterAll(async () => prisma.onModuleDestroy());
  beforeEach(async () => {
    await new TestDatabaseService(prisma).cleanup();
    fetchFn.mockReset();
    enqueueWebhook.mockClear();
    fetchFn.mockImplementation(async (url, init) => {
      const path = String(url).replace('https://api.github.com', '');
      expect(String(url)).toMatch(/^https:\/\/api\.github\.com\//);
      if (init?.method === 'POST') {
        expect(path).toBe('/app/installations/42/access_tokens');
        return Response.json({
          token: 'installation-token',
          expires_at: new Date(Date.now() + 3600_000).toISOString(),
        });
      }
      if (path === '/app') return Response.json({ id: 12, slug: 'repovio-test' });
      if (path === '/app/installations/42') return Response.json(installation);
      if (path.startsWith('/app/installations?')) return Response.json([installation]);
      throw new Error(`Unexpected provider request: ${path}`);
    });
    app = new GitHubAppService(prisma, encryption, fetchFn);
    webhooks = new GitHubAppWebhookService(prisma, app, encryption, queue as never);
  });

  async function configure() {
    return app.save(admin, { appId: '12', slug: 'repovio-test', privateKey, webhookSecret: secret });
  }
  async function connect() {
    await configure();
    return app.connect(admin, { installationId: '42', displayName: 'Example' });
  }
  async function tracked() {
    const account = await connect();
    const repository = await prisma.repository.create({
      data: {
        name: 'test',
        owner: 'example',
        providerAccountId: account.id,
        providerRepositoryId: '101',
        url: 'https://github.com/example/test',
      },
    });
    return { account, repository };
  }
  function request(event: string, data: object, deliveryId = 'delivery-1') {
    const payload = Buffer.from(JSON.stringify(data));
    return {
      payload,
      headers: {
        'x-github-event': event,
        'x-github-delivery': deliveryId,
        'x-hub-signature-256': `sha256=${createHmac('sha256', secret).update(payload).digest('hex')}`,
      },
    };
  }

  it('encrypts credentials, validates App JWTs and never returns secrets', async () => {
    const safe = await configure();
    expect(safe).toMatchObject({ configured: true, appId: '12', slug: 'repovio-test' });
    expect(JSON.stringify(safe)).not.toContain(secret);
    expect(JSON.stringify(safe)).not.toContain('PRIVATE KEY');
    const stored = await prisma.gitHubAppConfiguration.findUniqueOrThrow({ where: { id: 'default' } });
    expect(stored.encryptedPrivateKey).not.toContain('PRIVATE KEY');
    expect(encryption.decrypt(stored.encryptedPrivateKey)).toBe(privateKey);
    const headers = fetchFn.mock.calls[0]![1]!.headers as Record<string, string>;
    const jwt = headers.Authorization!.slice('Bearer '.length);
    const [header, claims, signature] = jwt.split('.');
    expect(
      verify('RSA-SHA256', Buffer.from(`${header}.${claims}`), keys.publicKey, Buffer.from(signature!, 'base64url')),
    ).toBe(true);
    const payload = JSON.parse(Buffer.from(claims!, 'base64url').toString()) as {
      iss: string;
      exp: number;
      iat: number;
    };
    expect(payload.iss).toBe('12');
    expect(payload.exp - payload.iat).toBeLessThanOrEqual(600);
  });

  it('denies every administration operation to non-administrators', async () => {
    await expect(app.configuration(viewer)).rejects.toThrow(ForbiddenException);
    await expect(app.save(viewer, { appId: '12', slug: 'test' })).rejects.toThrow(ForbiddenException);
    await expect(app.installations(viewer)).rejects.toThrow(ForbiddenException);
    await expect(app.connect(viewer, { installationId: '42', displayName: 'test' })).rejects.toThrow(
      ForbiddenException,
    );
    await expect(app.remove(viewer)).rejects.toThrow(ForbiddenException);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('retains omitted secrets, rotates credentials and blocks deletion with connected accounts', async () => {
    await configure();
    const rotated = 'replacement-webhook-secret';
    await app.save(admin, { appId: '12', slug: 'repovio-test', webhookSecret: rotated });
    const row = await prisma.gitHubAppConfiguration.findUniqueOrThrow({ where: { id: 'default' } });
    expect(encryption.decrypt(row.encryptedPrivateKey)).toBe(privateKey);
    expect(encryption.decrypt(row.encryptedWebhookSecret)).toBe(rotated);
    await app.connect(admin, { installationId: '42', displayName: 'test' });
    await expect(app.remove(admin)).rejects.toThrow(ConflictException);
    await expect(app.save(admin, { appId: '13', slug: 'other', privateKey })).rejects.toThrow(ConflictException);
  });

  it('rejects missing or invalid keys and mismatched App identities', async () => {
    await expect(app.save(admin, { appId: '12', slug: 'repovio-test' })).rejects.toThrow(BadRequestException);
    await expect(
      app.save(admin, { appId: '12', slug: 'repovio-test', privateKey: 'invalid', webhookSecret: secret }),
    ).rejects.toThrow(BadRequestException);
    await expect(app.save(admin, { appId: '13', slug: 'wrong', privateKey, webhookSecret: secret })).rejects.toThrow(
      BadRequestException,
    );
    expect(await prisma.gitHubAppConfiguration.count()).toBe(0);
  });

  it('revalidates installation ownership and rejects duplicate connections', async () => {
    await connect();
    await expect(app.connect(admin, { installationId: '42', displayName: 'Again' })).rejects.toThrow(ConflictException);
    fetchFn.mockResolvedValueOnce(Response.json({ ...installation, app_id: 999 }));
    await expect(app.connect(admin, { installationId: '43', displayName: 'Foreign' })).rejects.toThrow(
      BadRequestException,
    );
    expect(await prisma.providerAccount.count()).toBe(1);
  });

  it('coalesces refreshes and caches expiring tokens with only read permissions', async () => {
    const account = await connect();
    const credentials = new ProviderCredentialService(encryption, app);
    const tokens = await Promise.all(Array.from({ length: 8 }, () => credentials.accessToken(account)));
    expect(tokens).toEqual(Array(8).fill('installation-token'));
    const posts = fetchFn.mock.calls.filter(([, init]) => init?.method === 'POST');
    expect(posts).toHaveLength(1);
    expect(JSON.parse(posts[0]![1]!.body as string)).toEqual({
      permissions: {
        actions: 'read',
        issues: 'read',
        pull_requests: 'read',
        metadata: 'read',
        security_events: 'read',
      },
    });
    await credentials.accessToken(account);
    expect(fetchFn.mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(1);
    const clock = jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 3590_000);
    try {
      await credentials.accessToken(account);
    } finally {
      clock.mockRestore();
    }
    expect(fetchFn.mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(2);
  });

  it('invalidates tokens across workers after credential rotation and excludes unused permissions', async () => {
    await connect();
    const secondWorker = new GitHubAppService(prisma, encryption, fetchFn);
    await secondWorker.accessToken('42');
    const replacementKey = generateKeyPairSync('rsa', { modulusLength: 2048 })
      .privateKey.export({ format: 'pem', type: 'pkcs8' })
      .toString();
    await app.save(admin, { appId: '12', slug: 'repovio-test', privateKey: replacementKey });
    const stored = await prisma.gitHubAppConfiguration.findUniqueOrThrow({ where: { id: 'default' } });
    expect(encryption.decrypt(stored.encryptedPrivateKey)).toBe(replacementKey);
    fetchFn.mockResolvedValueOnce(
      Response.json({
        ...installation,
        permissions: { ...installation.permissions, checks: 'write', contents: 'write' },
      }),
    );
    await secondWorker.accessToken('42');
    const posts = fetchFn.mock.calls.filter(([, init]) => init?.method === 'POST');
    expect(posts).toHaveLength(2);
    const requestBody = JSON.parse(posts[1]![1]!.body as string) as { permissions: Record<string, string> };
    expect(requestBody.permissions).not.toHaveProperty('administration');
    expect(requestBody.permissions).not.toHaveProperty('checks');
    expect(requestBody.permissions).not.toHaveProperty('contents');
  });

  it('paginates installation discovery and marks lost installations unavailable', async () => {
    await connect();
    fetchFn.mockResolvedValueOnce(
      Response.json(Array.from({ length: 100 }, (_, i) => ({ ...installation, id: 1000 + i }))),
    );
    fetchFn.mockResolvedValueOnce(Response.json([{ ...installation, id: 2000 }]));
    const choices = await app.installations(admin);
    expect(choices).toHaveLength(101);
    expect(await prisma.providerAccount.findFirst()).toMatchObject({ githubInstallationState: 'REMOVED' });
    await expect(app.accessToken('42')).rejects.toThrow(BadRequestException);
  });

  it('paginates installation repositories without using user-token endpoints', async () => {
    const fetchRepositories = jest.fn<typeof fetch>();
    const repository = {
      id: 1,
      name: 'test',
      owner: { login: 'example' },
      html_url: 'https://github.com/example/test',
    };
    fetchRepositories.mockResolvedValueOnce(
      Response.json({ repositories: Array.from({ length: 100 }, (_, i) => ({ ...repository, id: i + 1 })) }),
    );
    fetchRepositories.mockResolvedValueOnce(Response.json({ repositories: [{ ...repository, id: 101 }] }));
    const result = await new GitHubActionsAdapter(fetchRepositories).listRepositories({
      authenticationMethod: 'GITHUB_APP',
      accessToken: 'token',
      baseUrl: null,
      providerAccountId: 'account',
    });
    expect(result).toHaveLength(101);
    expect(fetchRepositories.mock.calls.map(([url]) => String(url))).toEqual([
      'https://api.github.com/installation/repositories?per_page=100&page=1',
      'https://api.github.com/installation/repositories?per_page=100&page=2',
    ]);
  });

  it('deduplicates signed events with durable repository jobs and rejects changed bytes', async () => {
    const { repository } = await tracked();
    const delivery = request('workflow_run', { installation: { id: 42 }, repository: { id: 101 } });
    await expect(webhooks.receive(delivery)).resolves.toEqual({ accepted: true, duplicate: false });
    await expect(webhooks.receive(delivery)).resolves.toEqual({ accepted: true, duplicate: true });
    expect(await prisma.repositorySyncRequest.findUnique({ where: { repositoryId: repository.id } })).toMatchObject({
      status: 'PENDING',
    });
    expect(queue.enqueueWebhookRepository).toHaveBeenCalledTimes(1);
    await expect(webhooks.receive({ ...delivery, payload: Buffer.from('{}') })).rejects.toThrow(UnauthorizedException);
  });

  it('never schedules work for unknown installations or untracked repositories', async () => {
    await tracked();
    await webhooks.receive(request('workflow_run', { installation: { id: 999 }, repository: { id: 101 } }));
    await webhooks.receive(request('workflow_run', { installation: { id: 42 }, repository: { id: 999 } }, 'other'));
    expect(queue.enqueueWebhookRepository).not.toHaveBeenCalled();
  });

  it('preserves historical records through suspend, resume and removal', async () => {
    const { account, repository } = await tracked();
    await webhooks.receive(request('installation', { action: 'suspend', installation: { id: 42 } }));
    await expect(app.accessToken('42')).rejects.toThrow(BadRequestException);
    await webhooks.receive(request('installation', { action: 'unsuspend', installation: { id: 42 } }, 'resume'));
    await expect(app.accessToken('42')).resolves.toBe('installation-token');
    await webhooks.receive(request('installation', { action: 'deleted', installation: { id: 42 } }, 'delete'));
    expect(await prisma.providerAccount.findUnique({ where: { id: account.id } })).toMatchObject({
      githubInstallationState: 'REMOVED',
    });
    expect(await prisma.repository.findUnique({ where: { id: repository.id } })).not.toBeNull();
    await expect(app.accessToken('42')).rejects.toThrow(BadRequestException);
  });

  it('rolls back delivery deduplication if queue persistence fails, allowing retry', async () => {
    await tracked();
    enqueueWebhook.mockRejectedValueOnce(new Error('queue unavailable'));
    const delivery = request('issues', { installation: { id: 42 }, repository: { id: 101 } });
    await expect(webhooks.receive(delivery)).rejects.toThrow('queue unavailable');
    expect(await prisma.gitHubAppDelivery.count()).toBe(0);
    await expect(webhooks.receive(delivery)).resolves.toEqual({ accepted: true, duplicate: false });
  });

  it('keeps encrypted PAT credentials compatible and deletes only disconnected configuration', async () => {
    await configure();
    const account = await prisma.providerAccount.create({
      data: { providerType: 'GITHUB', displayName: 'PAT', encryptedAccessToken: encryption.encrypt('pat-token') },
    });
    await expect(new ProviderCredentialService(encryption, app).accessToken(account)).resolves.toBe('pat-token');
    await app.remove(admin);
    expect(await prisma.providerAccount.count()).toBe(1);
  });
});
