import { BadGatewayException, BadRequestException, Inject, Injectable } from '@nestjs/common';

import { ENV } from '../../../config/env.js';
import type { ProviderAccount } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CredentialEncryptionService } from '../../../security/credential-encryption.service.js';
import { withProviderAccountLock } from '../provider-account-lock.js';
import { PROVIDER_FETCH } from '../provider-adapter.js';
import { ProviderRequestError, providerRequestError } from '../provider-request.error.js';

/** Server-only encrypted credential generation returned by a verified GitLab authorization. */
export interface GitLabOAuthCredentials {
  encryptedAccessToken: string;
  encryptedRefreshToken: string;
  oauthAccessTokenExpiresAt: Date;
  oauthClientId: string;
  oauthRedirectUri: string;
  gitlabUserId: string;
  oauthStatus: 'CONNECTED';
}

/** Confidential OAuth configuration for the single deployment-owned GitLab instance. */
export interface GitLabOAuthConfiguration {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

/** Normalize an instance URL without permitting credentials, query parameters, or fragments.
 * @param value - Configured or account instance URL.
 * @returns A canonical instance URL, retaining a self-hosted path prefix.
 * @throws BadRequestException - The instance URL is invalid.
 */
export function normalizeGitLabUrl(value: string): string {
  try {
    const url = new URL(value);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
      throw new Error('Invalid instance');
    }
    return url.toString().replace(/\/+$/, '');
  } catch {
    throw new BadRequestException('The GitLab instance URL is invalid.');
  }
}

/** Resolve confidential client configuration without accepting browser-supplied endpoints.
 * @returns The configured GitLab instance and confidential client.
 * @throws BadRequestException - GitLab OAuth configuration is unavailable.
 */
export function gitLabOAuthConfiguration(): GitLabOAuthConfiguration {
  if (!ENV.GITLAB_OAUTH_CLIENT_ID || !ENV.GITLAB_OAUTH_CLIENT_SECRET) {
    throw new BadRequestException('GitLab OAuth is not configured.');
  }
  return {
    baseUrl: normalizeGitLabUrl(ENV.GITLAB_OAUTH_BASE_URL),
    clientId: ENV.GITLAB_OAUTH_CLIENT_ID,
    clientSecret: ENV.GITLAB_OAUTH_CLIENT_SECRET,
    redirectUri: ENV.OAUTH_CALLBACK_URL,
  };
}

/** Validate a complete token generation without retaining raw provider responses.
 * @param value - Untrusted JSON from the configured token endpoint.
 * @returns Validated token pair and its absolute expiry.
 * @throws BadGatewayException - Token or expiry metadata is malformed or already expired.
 */
export function parseGitLabTokenPair(value: unknown): TokenPair {
  const data = value as Record<string, unknown> | null;
  if (
    !data ||
    typeof data !== 'object' ||
    typeof data.access_token !== 'string' ||
    !data.access_token.trim() ||
    typeof data.refresh_token !== 'string' ||
    !data.refresh_token.trim() ||
    typeof data.token_type !== 'string' ||
    data.token_type.toLowerCase() !== 'bearer' ||
    typeof data.created_at !== 'number' ||
    !Number.isSafeInteger(data.created_at) ||
    data.created_at <= 0 ||
    typeof data.expires_in !== 'number' ||
    !Number.isSafeInteger(data.expires_in) ||
    data.expires_in <= 0
  )
    throw new BadGatewayException('GitLab returned invalid OAuth credentials.');
  const expiresAt = new Date((data.created_at + data.expires_in) * 1000);
  if (!Number.isFinite(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
    throw new BadGatewayException('GitLab returned invalid OAuth expiry metadata.');
  }
  return { accessToken: data.access_token, refreshToken: data.refresh_token, expiresAt };
}

/** Performs GitLab authentication operations and cross-process serialized token rotation. */
@Injectable()
export class GitLabOAuthService {
  /**
   * Create the credential resolver without account/orchestration service dependencies.
   * @param prisma - Database client used for persisted credential generations.
   * @param encryption - Credential encryption shared with other provider integrations.
   * @param fetch - Injectable HTTP transport; requests never follow redirects.
   */
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: CredentialEncryptionService,
    @Inject(PROVIDER_FETCH) private readonly fetch: typeof globalThis.fetch,
  ) {}

  /** Return the configured application for authorization and refresh consistency checks.
   * @returns Confidential deployment configuration; server-only, never serialize it.
   * @throws BadRequestException - Required client configuration is missing.
   */
  configuration(): GitLabOAuthConfiguration {
    return gitLabOAuthConfiguration();
  }

  /**
   * Exchange a code and verify the stable numeric GitLab identity before any local write.
   * @param code - One-time authorization code received by the callback.
   * @returns Encrypted credentials bound to the configured application and verified identity.
   * @throws BadGatewayException - The exchange or identity response is invalid.
   * @throws BadRequestException - GitLab OAuth is not configured.
   * @throws ProviderRequestError - GitLab rejected the authentication/read request.
   */
  async exchangeCode(code: string): Promise<GitLabOAuthCredentials> {
    const configuration = this.configuration();
    const response = await this.tokenRequest(configuration, { code, grant_type: 'authorization_code' });
    if (!response.ok) throw providerRequestError('GitLab OAuth', response);
    const pair = parseGitLabTokenPair(await this.json(response));
    const identityResponse = await this.request(`${configuration.baseUrl}/api/v4/user`, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${pair.accessToken}` },
    });
    if (!identityResponse.ok) throw providerRequestError('GitLab', identityResponse);
    const identity = (await this.json(identityResponse)) as { id?: unknown } | null;
    if (!identity || typeof identity.id !== 'number' || !Number.isSafeInteger(identity.id) || identity.id <= 0) {
      throw new BadGatewayException('GitLab returned an invalid account identity.');
    }
    return {
      ...this.encryptPair(pair),
      oauthClientId: configuration.clientId,
      oauthRedirectUri: configuration.redirectUri,
      gitlabUserId: String(identity.id),
      oauthStatus: 'CONNECTED',
    };
  }

  /**
   * Resolve the latest credential, rotating only once per persisted generation across workers.
   * @param id - Provider Account identifier, never an untrusted instance URL.
   * @returns A current decrypted token after any replacement pair has committed.
   * @throws BadRequestException - The account is disabled, requires reauthorization, or configuration changed.
   * @throws BadGatewayException - GitLab returned unusable credentials or the request failed.
   * @throws NotFoundException - The account was deleted.
   * @throws ProviderRequestError - GitLab rejected the refresh; retry metadata is retained.
   */
  async accessToken(id: string): Promise<string> {
    const result = await withProviderAccountLock(
      this.prisma,
      id,
      /** Recheck the locked generation before issuing a potentially destructive upstream rotation. */
      async (transaction, account): Promise<{ token?: string; reauthorize?: boolean }> => {
        if (!account.enabled) throw new BadRequestException('Provider account is disabled.');
        if (account.providerType !== 'GITLAB') throw new BadRequestException('GitLab account required.');
        if (account.oauthStatus === 'NONE') return { token: this.encryption.decrypt(account.encryptedAccessToken) };
        if (account.oauthStatus === 'REAUTHORIZATION_REQUIRED') return { reauthorize: true };
        const configuration = this.configuration();
        if (!this.metadataMatches(account, configuration)) {
          await transaction.providerAccount.update({
            where: { id },
            data: { oauthStatus: 'REAUTHORIZATION_REQUIRED' },
          });
          return { reauthorize: true };
        }
        if (account.oauthAccessTokenExpiresAt!.getTime() > Date.now() + 60_000) {
          return { token: this.encryption.decrypt(account.encryptedAccessToken) };
        }
        const response = await this.tokenRequest(configuration, {
          grant_type: 'refresh_token',
          refresh_token: this.encryption.decrypt(account.encryptedRefreshToken!),
        });
        if (!response.ok) {
          if (response.status === 400) {
            const error = (await this.json(response).catch(
              /** Ignore malformed OAuth error JSON while preserving retryable body-transport failures. */ (
                failure: unknown,
              ) => {
                if (failure instanceof ProviderRequestError) throw failure;
                return null;
              },
            )) as { error?: unknown } | null;
            if (error?.error === 'invalid_grant') {
              await transaction.providerAccount.update({
                where: { id },
                data: { oauthStatus: 'REAUTHORIZATION_REQUIRED' },
              });
              return { reauthorize: true };
            }
          }
          throw providerRequestError('GitLab OAuth', response);
        }
        const pair = parseGitLabTokenPair(await this.json(response));
        await transaction.providerAccount.update({ where: { id }, data: this.encryptPair(pair) });
        return { token: pair.accessToken };
      },
    );
    if (result.reauthorize) throw new BadRequestException('Reauthorize this GitLab OAuth connection.');
    return result.token!;
  }

  /** Compare stored metadata to the current application without exporting internal fields.
   * @param account - Locked persisted account.
   * @param configuration - Current deployment-owned client configuration.
   * @returns Whether the stored credential generation can be refreshed with this client.
   */
  private metadataMatches(account: ProviderAccount, configuration: GitLabOAuthConfiguration): boolean {
    return Boolean(
      account.encryptedRefreshToken &&
      account.oauthAccessTokenExpiresAt &&
      account.gitlabUserId &&
      account.oauthClientId === configuration.clientId &&
      account.oauthRedirectUri === configuration.redirectUri &&
      normalizeGitLabUrl(account.baseUrl ?? 'https://gitlab.com') === configuration.baseUrl,
    );
  }

  /** Encrypt both members of a rotated pair together.
   * @param pair - Validated plaintext token generation.
   * @returns Fields suitable for a single database write.
   */
  private encryptPair(pair: TokenPair) {
    return {
      encryptedAccessToken: this.encryption.encrypt(pair.accessToken),
      encryptedRefreshToken: this.encryption.encrypt(pair.refreshToken),
      oauthAccessTokenExpiresAt: pair.expiresAt,
    };
  }

  /** Send a confidential token request only to the configured instance.
   * @param configuration - Deployment-owned endpoint and client credentials.
   * @param grant - Code or refresh-token grant parameters.
   * @returns A bounded HTTP response without retaining request secrets.
   * @throws ProviderRequestError - The request failed or timed out.
   */
  private tokenRequest(configuration: GitLabOAuthConfiguration, grant: Record<string, string>): Promise<Response> {
    return this.request(`${configuration.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: configuration.clientId,
        client_secret: configuration.clientSecret,
        redirect_uri: configuration.redirectUri,
        ...grant,
      }).toString(),
    });
  }

  /** Apply timeout and redirect policy while sanitizing transport failures.
   * @param url - Trusted endpoint built from installation configuration.
   * @param init - Server-owned request parameters, possibly containing credentials.
   * @returns The provider response.
   * @throws ProviderRequestError - Sanitized retryable network, redirect, or timeout failure.
   */
  private async request(url: string, init: RequestInit): Promise<Response> {
    try {
      return await this.fetch(url, { ...init, redirect: 'error', signal: AbortSignal.timeout(10_000) });
    } catch {
      throw new ProviderRequestError('GitLab OAuth', 503, null);
    }
  }

  /** Decode JSON without allowing response bodies or parse errors to escape.
   * @param response - Untrusted provider response.
   * @returns Parsed provider data for immediate validation.
   * @throws BadGatewayException - The response is not valid JSON.
   * @throws ProviderRequestError - Response streaming failed or timed out; the failure remains retryable.
   */
  private async json(response: Response): Promise<unknown> {
    try {
      return await response.json();
    } catch (error) {
      if (
        error instanceof TypeError ||
        (error instanceof DOMException && ['AbortError', 'TimeoutError'].includes(error.name))
      ) {
        throw new ProviderRequestError('GitLab OAuth', 503, null);
      }
      throw new BadGatewayException('GitLab returned an invalid OAuth response.');
    }
  }
}
