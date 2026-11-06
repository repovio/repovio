import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import type { ConnectGitHubApp, GitHubAppConfiguration, GitHubAppInstallation, SaveGitHubApp } from '@repovio/schemas';
import { createPrivateKey, randomUUID, sign } from 'node:crypto';

import { ENV } from '../../../config/env.js';
import type {
  GitHubAppConfiguration as Configuration,
  Prisma,
  ProviderAccount,
} from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CredentialEncryptionService } from '../../../security/credential-encryption.service.js';
import type { AuthenticatedUser } from '../../auth/types.js';
import { PROVIDER_FETCH } from '../provider-adapter.js';
import { providerRequestError, ProviderRequestError } from '../provider-request.error.js';

interface Installation {
  id: number;
  app_id: number;
  account: { login: string };
  suspended_at: string | null;
  permissions: Record<string, string>;
}
const readPermissions = [
  'actions',
  'metadata',
  'issues',
  'pull_requests',
  'dependabot_alerts',
  'security_events',
  'secret_scanning_alerts',
];

/** Owns deployment App configuration, verified installations and short-lived installation credentials. */
@Injectable()
export class GitHubAppService {
  private readonly tokens = new Map<string, { value: string; expiresAt: number }>();
  private readonly pending = new Map<string, Promise<string>>();

  /**
   * Initialize App authentication without sharing private keys with provider adapters.
   * @param prisma - Configuration, account and transaction storage.
   * @param encryption - Deployment credential encryption.
   * @param fetchFn - Provider HTTP transport.
   */
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: CredentialEncryptionService,
    @Inject(PROVIDER_FETCH) private readonly fetchFn: typeof fetch,
  ) {}

  /**
   * Return public setup metadata only to administrators.
   * @param user - Requesting administrator.
   * @returns Safe configuration and setup URLs.
   * @throws ForbiddenException - Administrator privileges are required.
   */
  async configuration(user: AuthenticatedUser): Promise<GitHubAppConfiguration> {
    this.assertAdmin(user);
    return this.safe(await this.prisma.gitHubAppConfiguration.findUnique({ where: { id: 'default' } }));
  }

  /**
   * Validate the App identity and atomically save encrypted secrets.
   * @param user - Requesting administrator.
   * @param input - Identity and optional replacement credentials.
   * @returns Safe saved configuration.
   * @throws BadRequestException - Credentials or App identity are invalid.
   * @throws ConflictException - A connected App cannot be replaced.
   * @throws ForbiddenException - Administrator privileges are required.
   */
  async save(user: AuthenticatedUser, input: SaveGitHubApp): Promise<GitHubAppConfiguration> {
    this.assertAdmin(user);
    const previous = await this.prisma.gitHubAppConfiguration.findUnique({ where: { id: 'default' } });
    if (
      (!previous && (!input.privateKey || !input.webhookSecret)) ||
      (previous?.appId !== input.appId && !input.privateKey)
    )
      throw new BadRequestException('Private key and webhook secret are required for a new GitHub App.');
    if (
      previous &&
      previous.appId !== input.appId &&
      (await this.prisma.providerAccount.count({ where: { authenticationMethod: 'GITHUB_APP' } }))
    )
      throw new ConflictException('Disconnect GitHub App accounts before replacing the App.');
    const privateKey = input.privateKey ?? this.encryption.decrypt(previous!.encryptedPrivateKey);
    let jwt: string;
    try {
      jwt = this.jwt(input.appId, privateKey);
    } catch {
      throw new BadRequestException('The GitHub App private key is invalid.');
    }
    const identity = await this.request<{ id: number; slug: string }>('/app', jwt);
    if (String(identity.id) !== input.appId || identity.slug !== input.slug)
      throw new BadRequestException('The GitHub App ID and slug must match the private key.');
    return this.prisma.transaction(
      /** Locks and replaces encrypted App configuration only if its observed revision remains current. */ async (
        tx,
      ) => {
        await this.lock(tx);
        const current = await tx.gitHubAppConfiguration.findUnique({ where: { id: 'default' } });
        if (current?.updatedAt.getTime() !== previous?.updatedAt.getTime())
          throw new ConflictException('GitHub App configuration changed. Refresh and try again.');
        if (
          current &&
          current.appId !== input.appId &&
          (await tx.providerAccount.count({ where: { authenticationMethod: 'GITHUB_APP' } }))
        )
          throw new ConflictException('Disconnect GitHub App accounts before replacing the App.');
        const data = {
          appId: input.appId,
          slug: input.slug,
          encryptedPrivateKey: this.encryption.encrypt(privateKey),
          encryptedWebhookSecret: input.webhookSecret
            ? this.encryption.encrypt(input.webhookSecret)
            : previous!.encryptedWebhookSecret,
        };
        const saved = await tx.gitHubAppConfiguration.upsert({
          where: { id: 'default' },
          create: { id: 'default', ...data },
          update: data,
        });
        this.tokens.clear();
        return this.safe(saved);
      },
    );
  }

  /**
   * Delete configuration only after all installation accounts have been disconnected.
   * @param user - Requesting administrator.
   * @returns Completion of local deletion.
   * @throws ConflictException - Connected accounts still exist.
   * @throws ForbiddenException - Administrator privileges are required.
   */
  async remove(user: AuthenticatedUser): Promise<void> {
    this.assertAdmin(user);
    await this.prisma.transaction(
      /** Locks configuration, rejects connected accounts, and clears persisted credentials and token caches. */ async (
        tx,
      ) => {
        await this.lock(tx);
        if (await tx.providerAccount.count({ where: { authenticationMethod: 'GITHUB_APP' } }))
          throw new ConflictException('Disconnect GitHub App accounts before deleting configuration.');
        await tx.gitHubAppConfiguration.deleteMany({ where: { id: 'default' } });
        this.tokens.clear();
      },
    );
  }

  /**
   * Discover every installation owned by the configured App and refresh local availability.
   * @param user - Requesting administrator.
   * @returns Paginated remote installations with local connection indicators.
   * @throws BadRequestException - No App is configured.
   * @throws ForbiddenException - Administrator privileges are required.
   */
  async installations(user: AuthenticatedUser): Promise<GitHubAppInstallation[]> {
    this.assertAdmin(user);
    const config = await this.requireConfiguration();
    const token = this.jwt(config.appId, this.encryption.decrypt(config.encryptedPrivateKey));
    const installations: Installation[] = [];
    for (let page = 1; ; page++) {
      const rows = await this.request<Installation[]>(`/app/installations?per_page=100&page=${page}`, token);
      installations.push(...rows);
      if (rows.length < 100) break;
    }
    const connected = await this.prisma.providerAccount.findMany({ where: { authenticationMethod: 'GITHUB_APP' } });
    for (const account of connected) {
      const remote = installations.find(
        /** Finds the first entry matching `String(row.id) === account.githubInstallationId`. */ (row) =>
          String(row.id) === account.githubInstallationId,
      );
      await this.prisma.providerAccount.update({
        where: { id: account.id },
        data: {
          githubInstallationState: !remote ? 'REMOVED' : remote.suspended_at ? 'SUSPENDED' : 'ACTIVE',
        },
      });
    }
    return installations.map(
      /** Projects each entry using the installations mapping. */ (row) => ({
        installationId: String(row.id),
        account: row.account.login,
        suspended: Boolean(row.suspended_at),
        connected: connected.some(
          /** Checks whether any entry satisfies `account.githubInstallationId === String(row.id)`. */ (account) =>
            account.githubInstallationId === String(row.id),
        ),
      }),
    );
  }

  /**
   * Create an installation account after an authenticated App ownership check.
   * @param user - Requesting administrator.
   * @param input - Installation and local display name.
   * @returns Persisted account with no long-lived provider token.
   * @throws ConflictException - Configuration changed or the installation is already connected.
   * @throws BadRequestException - Installation ownership, availability or permissions are invalid.
   * @throws ForbiddenException - Administrator privileges are required.
   */
  async connect(user: AuthenticatedUser, input: ConnectGitHubApp): Promise<ProviderAccount> {
    this.assertAdmin(user);
    const config = await this.requireConfiguration();
    const installation = await this.installation(config, input.installationId);
    this.validateInstallation(config, installation);
    return this.prisma.transaction(
      /** Atomically verifies configuration and creates an account for an unconnected installation. */ async (tx) => {
        await this.lock(tx);
        const current = await tx.gitHubAppConfiguration.findUnique({ where: { id: 'default' } });
        if (!current || current.updatedAt.getTime() !== config.updatedAt.getTime())
          throw new ConflictException('GitHub App configuration changed. Refresh and try again.');
        if (await tx.providerAccount.findUnique({ where: { githubInstallationId: input.installationId } }))
          throw new ConflictException('This GitHub App installation is already connected.');
        return tx.providerAccount.create({
          data: {
            id: randomUUID(),
            providerType: 'GITHUB',
            displayName: input.displayName,
            authenticationMethod: 'GITHUB_APP',
            githubInstallationId: input.installationId,
            githubInstallationState: 'ACTIVE',
            encryptedAccessToken: '',
          },
        });
      },
    );
  }

  /**
   * Resolve an enabled installation's least-privilege token with coalesced renewal.
   * @param installationId - Remote installation identity.
   * @returns A short-lived server-only bearer token.
   * @throws BadRequestException - Installation is unavailable.
   */
  async accessToken(installationId: string): Promise<string> {
    const config = await this.requireConfiguration();
    const account = await this.prisma.providerAccount.findUnique({ where: { githubInstallationId: installationId } });
    if (!account?.enabled || account.githubInstallationState !== 'ACTIVE')
      throw new BadRequestException('GitHub App installation is unavailable. Refresh installations or reconnect.');
    const cacheKey = `${config.updatedAt.getTime()}:${installationId}`;
    for (const [key, token] of this.tokens) {
      if (!key.startsWith(`${config.updatedAt.getTime()}:`) || token.expiresAt <= Date.now() + 60_000)
        this.tokens.delete(key);
    }
    const cached = this.tokens.get(cacheKey);
    if (cached && cached.expiresAt > Date.now() + 60_000) return cached.value;
    const inflight = this.pending.get(cacheKey);
    if (inflight) return inflight;
    const promise = this.issueToken(config, installationId, cacheKey).finally(
      /** Evaluates `this.pending.delete(cacheKey)` when this.issueToken(config, installationId, cacheKey).finally invokes this callback. */ () =>
        this.pending.delete(cacheKey),
    );
    this.pending.set(cacheKey, promise);
    return promise;
  }

  /**
   * Load the encrypted server-only configuration for webhook verification.
   * @returns Configured App record.
   * @throws BadRequestException - No App is configured.
   */
  async requireConfiguration(): Promise<Configuration> {
    const config = await this.prisma.gitHubAppConfiguration.findUnique({ where: { id: 'default' } });
    if (!config) throw new BadRequestException('GitHub App is not configured.');
    return config;
  }

  /**
   * Serialize configuration without ever returning private credentials.
   * @param config - Stored App configuration or an unconfigured deployment.
   * @returns Safe identity and setup URLs.
   */
  private safe(config: Configuration | null): GitHubAppConfiguration {
    return {
      configured: Boolean(config),
      appId: config?.appId ?? null,
      slug: config?.slug ?? null,
      installationUrl: config ? `https://github.com/apps/${config.slug}/installations/new` : null,
      webhookUrl: new URL('/api/v1/webhooks/github-app', ENV.PUBLIC_URL).toString(),
    };
  }

  /**
   * Sign an RS256 JWT with a bounded lifetime and clock-skew allowance.
   * @param appId - GitHub App identity used as the JWT issuer.
   * @param privateKey - Decrypted RSA private key in PEM format.
   * @returns Signed short-lived App JWT.
   * @throws Error - The private key is invalid or is not an RSA key.
   */
  private jwt(appId: string, privateKey: string): string {
    const key = createPrivateKey(privateKey);
    if (key.asymmetricKeyType !== 'rsa') throw new Error('An RSA private key is required.');
    const now = Math.floor(Date.now() / 1000);
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const claims = Buffer.from(JSON.stringify({ iat: now - 60, exp: now + 540, iss: appId })).toString('base64url');
    const message = `${header}.${claims}`;
    return `${message}.${sign('RSA-SHA256', Buffer.from(message), key).toString('base64url')}`;
  }

  /**
   * Read an installation using the configured App's own identity.
   * @param config - Deployment-owned App configuration.
   * @param id - Remote installation identifier.
   * @returns Installation owned by the authenticated App.
   * @throws ProviderRequestError - GitHub rejects the installation request.
   */
  private async installation(config: Configuration, id: string): Promise<Installation> {
    return this.request<Installation>(
      `/app/installations/${id}`,
      this.jwt(config.appId, this.encryption.decrypt(config.encryptedPrivateKey)),
    );
  }

  /**
   * Require ownership, availability and the core read permissions.
   * @param config - Configured App identity.
   * @param row - GitHub installation response.
   * @returns No return value.
   * @throws BadRequestException - The installation is foreign, suspended or missing required permissions.
   */
  private validateInstallation(config: Configuration, row: Installation): void {
    if (
      String(row.app_id) !== config.appId ||
      row.suspended_at ||
      ['actions', 'issues', 'pull_requests'].some(
        /** Checks whether any entry satisfies `!['read', 'write'].includes(row.permissions[permission] ?? '')`. */
        (permission) => !['read', 'write'].includes(row.permissions[permission] ?? ''),
      )
    )
      throw new BadRequestException('GitHub App installation is unavailable or missing required read permissions.');
  }

  /**
   * Issue only read permissions, and avoid caching failures or malformed token responses.
   * @param config - Configured App credentials.
   * @param id - Installation receiving the read-only token.
   * @param cacheKey - Configuration-versioned installation cache key.
   * @returns Valid server-only installation bearer token.
   * @throws ProviderRequestError - GitHub rejects installation lookup or token issuance.
   * @throws BadGatewayException - GitHub returns malformed or already expiring credentials.
   * @throws BadRequestException - Installation is unavailable or missing required permissions.
   */
  private async issueToken(config: Configuration, id: string, cacheKey: string): Promise<string> {
    let row: Installation;
    try {
      row = await this.installation(config, id);
    } catch (error) {
      if (error instanceof ProviderRequestError && error.status === 404)
        await this.prisma.providerAccount.updateMany({
          where: { githubInstallationId: id },
          data: { githubInstallationState: 'REMOVED' },
        });
      throw error;
    }
    if (row.suspended_at)
      await this.prisma.providerAccount.updateMany({
        where: { githubInstallationId: id },
        data: { githubInstallationState: 'SUSPENDED' },
      });
    this.validateInstallation(config, row);
    const permissions = Object.fromEntries(
      readPermissions
        .filter(
          /** Keeps entries matching `row.permissions[permission]`. */ (permission) => row.permissions[permission],
        )
        .map(/** Projects each entry using `[permission, 'read']`. */ (permission) => [permission, 'read']),
    );
    const token = await this.request<{ token: string; expires_at: string }>(
      `/app/installations/${id}/access_tokens`,
      this.jwt(config.appId, this.encryption.decrypt(config.encryptedPrivateKey)),
      permissions,
    );
    const expiresAt = Date.parse(token.expires_at);
    if (!token.token || !Number.isFinite(expiresAt) || expiresAt <= Date.now() + 60_000)
      throw new BadGatewayException('GitHub returned an invalid installation token.');
    this.tokens.set(cacheKey, { value: token.token, expiresAt });
    return token.token;
  }

  /**
   * Perform read requests or the sole authentication-only token issuance POST.
   * @typeParam T - Decoded provider response shape.
   * @param path - GitHub API path under the fixed trusted origin.
   * @param bearer - Server-only App JWT.
   * @param permissions - Optional read permissions; present only for installation-token issuance.
   * @returns Decoded provider response.
   * @throws ProviderRequestError - GitHub returns an unsuccessful status.
   */
  private async request<T>(path: string, bearer: string, permissions?: Record<string, string>): Promise<T> {
    const response = await this.fetchFn(`https://api.github.com${path}`, {
      signal: AbortSignal.timeout(15_000),
      headers: {
        Authorization: `Bearer ${bearer}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'Repovio',
        'Content-Type': 'application/json',
      },
      ...(permissions ? { method: 'POST', body: JSON.stringify({ permissions }) } : {}),
    });
    if (!response.ok) {
      // Provider payloads may contain sensitive data; use the existing sanitized error classifier.
      throw providerRequestError('GitHub', response);
    }
    return (await response.json()) as T;
  }

  /**
   * Serialize configuration replacement, deletion and installation connection across workers.
   * @param tx - Transaction whose lifetime bounds the advisory lock.
   * @returns Completion after this transaction acquires the lock.
   */
  private async lock(tx: Prisma.TransactionClient): Promise<void> {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(173209, 22)::text`;
  }

  /**
   * Restrict configuration and installation administration to system administrators.
   * @param user - Authenticated requester.
   * @returns No return value.
   * @throws ForbiddenException - The requester is not a system administrator.
   */
  private assertAdmin(user: AuthenticatedUser): void {
    if (user.role !== 'SYSTEM_ADMIN') throw new ForbiddenException('System administrator access is required.');
  }
}
