import {
  BadGatewayException,
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ENV } from '../../config/env.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { AuthenticatedUser } from '../auth/types.js';
import type { ProviderOAuthAuthorizationDto, StartProviderOAuthDto } from './dto/provider-oauth.dto.js';
import { GitLabOAuthService, normalizeGitLabUrl } from './gitlab/gitlab-oauth.service.js';
import { withProviderAccountLock } from './provider-account-lock.js';
import { ProviderAccountsService } from './provider-accounts.service.js';
import { PROVIDER_FETCH } from './provider-adapter.js';
import { ProviderOAuthStateService } from './provider-oauth-state.service.js';

type ProviderType = StartProviderOAuthDto['providerType'];
type ProviderFetch = typeof fetch;

/** Provider-specific OAuth endpoints and confidential client configuration. */
export interface ProviderOAuthConfiguration {
  accountBaseUrl?: string;
  authorizationUrl: string;
  clientId: string;
  clientSecret: string;
  scopes: string;
  tokenUrl: string;
  redirectUri?: string;
}

interface OAuthTokenResponse {
  access_token?: unknown;
}

/** Coordinates browser-based provider authorization without exposing OAuth client secrets. */
@Injectable()
export class ProviderOAuthService {
  /**
   * Initialize ProviderOAuthService with its required dependencies.
   *
   * @param accounts - Service managing local provider accounts and repository discovery.
   * @param fetch - Fetch implementation used for provider OAuth requests.
   * @param prisma - Database client used for persisted application state.
   * @param gitlab - GitLab code exchange and verified credential service.
   * @param states - Service encrypting and validating short-lived OAuth authorization context.
   */
  constructor(
    private readonly accounts: ProviderAccountsService,
    @Inject(PROVIDER_FETCH) private readonly fetch: ProviderFetch,
    private readonly prisma: PrismaService,
    private readonly states: ProviderOAuthStateService,
    private readonly gitlab: GitLabOAuthService,
  ) {}

  /**
   * Builds an authorization URL for a system administrator.
   *
   * @param user - The signed-in administrator starting the authorization.
   * @param input - Provider account metadata.
   * @returns The provider authorization URL.
   * @throws ForbiddenException - System administrator access is required.
   * @throws BadRequestException - OAuth is not configured for this provider.
   */
  start(user: AuthenticatedUser, input: StartProviderOAuthDto): ProviderOAuthAuthorizationDto {
    this.accounts.assertAdmin(user);

    const configuration = this.getConfiguration(input.providerType);
    if (
      input.providerType === 'GITLAB' &&
      input.baseUrl &&
      normalizeGitLabUrl(input.baseUrl) !== configuration.accountBaseUrl
    ) {
      throw new BadRequestException('The account must use the configured GitLab OAuth instance.');
    }
    const state = this.states.create({
      baseUrl: input.providerType === 'GITLAB' ? configuration.accountBaseUrl : input.baseUrl,
      ...(input.providerType === 'GITLAB'
        ? {
            gitlabConfiguration: {
              baseUrl: configuration.accountBaseUrl!,
              clientId: configuration.clientId,
              redirectUri: configuration.redirectUri ?? ENV.OAUTH_CALLBACK_URL,
            },
          }
        : {}),
      displayName: input.displayName,
      providerType: input.providerType,
      userId: user.id,
    });
    const authorizationUrl = new URL(configuration.authorizationUrl);
    authorizationUrl.search = new URLSearchParams({
      client_id: configuration.clientId,
      redirect_uri: configuration.redirectUri ?? ENV.OAUTH_CALLBACK_URL,
      response_type: 'code',
      scope: configuration.scopes,
      state,
    }).toString();

    return { authorizationUrl: authorizationUrl.toString() };
  }

  /**
   * Start conversion or reauthorization using only server-owned target metadata.
   * @param user - Administrator initiating the authorization.
   * @param id - Existing GitLab Provider Account identifier.
   * @returns The provider authorization URL with the protected target and revision.
   * @throws ForbiddenException - The initiating user is not an administrator.
   * @throws NotFoundException - The target does not exist.
   * @throws BadRequestException - The target type, instance, or configuration is invalid.
   */
  async startExisting(user: AuthenticatedUser, id: string): Promise<ProviderOAuthAuthorizationDto> {
    this.accounts.assertAdmin(user);
    const target = await this.prisma.providerAccount.findUnique({ where: { id } });
    if (!target) throw new NotFoundException('Provider account not found.');
    if (target.providerType !== 'GITLAB') throw new BadRequestException('GitLab account required.');
    const configuration = this.getConfiguration('GITLAB');
    const baseUrl = normalizeGitLabUrl(target.baseUrl ?? 'https://gitlab.com');
    if (baseUrl !== configuration.accountBaseUrl)
      throw new BadRequestException('The account must use the configured GitLab OAuth instance.');
    const state = this.states.create({
      baseUrl,
      displayName: target.displayName,
      providerType: 'GITLAB',
      userId: user.id,
      targetAccountId: target.id,
      authorizationRevision: target.oauthAuthorizationRevision,
      gitlabConfiguration: {
        baseUrl,
        clientId: configuration.clientId,
        redirectUri: configuration.redirectUri ?? ENV.OAUTH_CALLBACK_URL,
      },
    });
    const authorizationUrl = new URL(configuration.authorizationUrl);
    authorizationUrl.search = new URLSearchParams({
      client_id: configuration.clientId,
      redirect_uri: configuration.redirectUri ?? ENV.OAUTH_CALLBACK_URL,
      response_type: 'code',
      scope: configuration.scopes,
      state,
    }).toString();
    return { authorizationUrl: authorizationUrl.toString() };
  }

  /**
   * Returns providers whose OAuth client credentials are configured in this installation.
   *
   * @returns The supported providers with complete OAuth configuration.
   */
  availableProviderTypes(): ProviderType[] {
    return (['GITHUB', 'GITLAB', 'FORGEJO'] as const).filter(
      /** Keeps entries matching the availableProviderTypes predicate. */ (providerType) => {
        const configuration = getProviderOAuthConfiguration(providerType);
        return Boolean(configuration.clientId && configuration.clientSecret);
      },
    );
  }

  /**
   * Exchanges a provider authorization code and creates the encrypted account record.
   *
   * @param stateValue - The protected state value returned by the provider.
   * @param code - The one-time provider authorization code.
   * @returns A promise that resolves when the operation completes.
   * @throws BadGatewayException - When the provider rejects the code or returns no token.
   * @throws ForbiddenException - When the initiating user no longer exists or no longer has the system administrator
   * role.
   * @throws BadRequestException - When the state is malformed, modified, or expired.
   * @throws Error - When the encrypted envelope is malformed or fails authentication with the configured key.
   * @throws ProviderRequestError - When a provider read fails, including rate limiting; status and retry metadata are
   * preserved.
   * @throws TypeError - When the provider request fails at the network layer.
   */
  async complete(stateValue: string, code: string): Promise<void> {
    const state = this.states.consume(stateValue);
    const user = await this.prisma.user.findUnique({
      where: { id: state.userId },
      select: { authProvider: true, id: true, role: true, username: true },
    });

    if (!user || user.role !== 'SYSTEM_ADMIN') {
      throw new ForbiddenException('The administrator that started this OAuth authorization is no longer available.');
    }

    const configuration = this.getConfiguration(state.providerType);
    if (state.providerType === 'GITLAB') {
      const snapshot = state.gitlabConfiguration;
      if (
        !snapshot ||
        snapshot.baseUrl !== configuration.accountBaseUrl ||
        snapshot.clientId !== configuration.clientId ||
        snapshot.redirectUri !== (configuration.redirectUri ?? ENV.OAUTH_CALLBACK_URL)
      ) {
        throw new BadRequestException('The GitLab OAuth configuration changed. Start authorization again.');
      }
      if (state.targetAccountId) {
        const target = await this.prisma.providerAccount.findUnique({ where: { id: state.targetAccountId } });
        if (
          !target ||
          target.providerType !== 'GITLAB' ||
          normalizeGitLabUrl(target.baseUrl ?? 'https://gitlab.com') !== snapshot.baseUrl ||
          target.oauthAuthorizationRevision !== state.authorizationRevision
        ) {
          throw new BadRequestException('The GitLab authorization target changed. Start authorization again.');
        }
      }
      const oauthCredentials = await this.gitlab.exchangeCode(code);
      if (state.targetAccountId) {
        await withProviderAccountLock(
          this.prisma,
          state.targetAccountId,
          /** Replace only credentials after rechecking the current target, administrator, and authorization generation. */
          async (transaction, target) => {
            const administrator = await transaction.user.findUnique({ where: { id: state.userId } });
            if (administrator?.role !== 'SYSTEM_ADMIN')
              throw new ForbiddenException('System administrator access is required.');
            if (
              target.providerType !== 'GITLAB' ||
              normalizeGitLabUrl(target.baseUrl ?? 'https://gitlab.com') !== snapshot.baseUrl ||
              target.oauthAuthorizationRevision !== state.authorizationRevision ||
              (target.gitlabUserId !== null && target.gitlabUserId !== oauthCredentials.gitlabUserId)
            ) {
              throw new BadRequestException('The GitLab authorization target or identity changed.');
            }
            await transaction.providerAccount.update({
              where: { id: target.id },
              data: {
                ...oauthCredentials,
                oauthAuthorizationRevision: { increment: 1 },
              },
            });
          },
        );
      } else {
        const administrator = await this.prisma.user.findUnique({ where: { id: state.userId } });
        if (administrator?.role !== 'SYSTEM_ADMIN')
          throw new ForbiddenException('System administrator access is required.');
        await this.accounts.createFromOAuth(user, {
          providerType: 'GITLAB',
          displayName: state.displayName,
          baseUrl: configuration.accountBaseUrl,
          accessToken: '',
          oauthCredentials,
        });
      }
      return;
    }
    const response = await this.fetch(configuration.tokenUrl, {
      body: new URLSearchParams({
        client_id: configuration.clientId,
        client_secret: configuration.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: ENV.OAUTH_CALLBACK_URL,
      }).toString(),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      method: 'POST',
    });

    if (!response.ok) {
      throw new BadGatewayException('The provider rejected the OAuth authorization.');
    }

    const token = (await response.json()) as OAuthTokenResponse;
    if (typeof token.access_token !== 'string' || !token.access_token) {
      throw new BadGatewayException('The provider did not return an access token.');
    }

    await this.accounts.createFromOAuth(user, {
      accessToken: token.access_token,
      baseUrl: state.baseUrl ?? configuration.accountBaseUrl,
      displayName: state.displayName,
      providerType: state.providerType,
    });
  }

  /**
   * Resolve the configured OAuth endpoints and client credentials for a provider.
   *
   * @param providerType - Provider implementation selected for the operation.
   * @returns Configured OAuth endpoints, scopes, and client credentials.
   * @throws BadRequestException - OAuth is not configured for this provider.
   */
  private getConfiguration(providerType: ProviderType): ProviderOAuthConfiguration {
    const gitlab = providerType === 'GITLAB' ? this.gitlab.configuration() : undefined;
    const configuration = gitlab
      ? {
          accountBaseUrl: gitlab.baseUrl,
          authorizationUrl: `${gitlab.baseUrl}/oauth/authorize`,
          clientId: gitlab.clientId,
          clientSecret: gitlab.clientSecret,
          redirectUri: gitlab.redirectUri,
          scopes: 'read_api read_user',
          tokenUrl: `${gitlab.baseUrl}/oauth/token`,
        }
      : getProviderOAuthConfiguration(providerType);
    if (!configuration.clientId || !configuration.clientSecret) {
      throw new BadRequestException('OAuth is not configured for this provider.');
    }

    return configuration;
  }
}

/**
 * Build OAuth endpoints and scopes from the configured provider instance.
 *
 * @param providerType - Provider implementation selected for the operation.
 * @returns Provider-specific OAuth endpoints, scopes, and client credentials.
 */
function getProviderOAuthConfiguration(providerType: ProviderType): ProviderOAuthConfiguration {
  switch (providerType) {
    case 'GITHUB':
      return {
        authorizationUrl: 'https://github.com/login/oauth/authorize',
        clientId: ENV.GITHUB_OAUTH_CLIENT_ID,
        clientSecret: ENV.GITHUB_OAUTH_CLIENT_SECRET,
        scopes: 'repo security_events',
        tokenUrl: 'https://github.com/login/oauth/access_token',
      };
    case 'GITLAB': {
      const baseUrl = normalizeGitLabUrl(ENV.GITLAB_OAUTH_BASE_URL);
      return {
        accountBaseUrl: baseUrl,
        authorizationUrl: `${baseUrl}/oauth/authorize`,
        clientId: ENV.GITLAB_OAUTH_CLIENT_ID,
        clientSecret: ENV.GITLAB_OAUTH_CLIENT_SECRET,
        scopes: 'read_api read_user',
        tokenUrl: `${baseUrl}/oauth/token`,
      };
    }
    case 'FORGEJO': {
      const baseUrl = withoutTrailingSlash(ENV.FORGEJO_OAUTH_BASE_URL);
      return {
        accountBaseUrl: baseUrl,
        authorizationUrl: `${baseUrl}/login/oauth/authorize`,
        clientId: ENV.FORGEJO_OAUTH_CLIENT_ID,
        clientSecret: ENV.FORGEJO_OAUTH_CLIENT_SECRET,
        scopes: 'read:repository',
        tokenUrl: `${baseUrl}/login/oauth/access_token`,
      };
    }
  }
}

/**
 * Remove the final slash from a provider base URL.
 *
 * @param value - Value to parse, validate, or normalize.
 * @returns The URL with one trailing slash removed.
 */
function withoutTrailingSlash(value: string): string {
  return value.replace(/\/$/, '');
}
