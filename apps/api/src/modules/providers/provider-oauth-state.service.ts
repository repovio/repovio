import { BadRequestException, Injectable } from '@nestjs/common';

import { ProviderCredentialService } from './provider-credential.service.js';

type ProviderType = 'GITHUB' | 'GITLAB' | 'FORGEJO';

interface ProviderOAuthState {
  baseUrl?: string;
  targetAccountId?: string;
  authorizationRevision?: number;
  gitlabConfiguration?: { baseUrl: string; clientId: string; redirectUri: string };
  displayName: string;
  expiresAt: number;
  providerType: ProviderType;
  userId: string;
}

/** Creates and validates encrypted, short-lived OAuth state values. */
@Injectable()
export class ProviderOAuthStateService {
  /**
   * Initialize ProviderOAuthStateService with its required dependencies.
   *
   * @param credentials - Service encrypting and decrypting persisted credentials.
   */
  constructor(private readonly credentials: ProviderCredentialService) {}

  /**
   * Encrypts authorization context so it can be returned by the provider without a database write.
   *
   * @param input - The administrator and provider metadata associated with this authorization.
   * @returns An authenticated opaque state value safe to include in the authorization URL.
   */
  create(input: Omit<ProviderOAuthState, 'expiresAt'>): string {
    return this.credentials.encrypt(JSON.stringify({ ...input, expiresAt: Date.now() + 10 * 60 * 1000 }));
  }

  /**
   * Decrypts and validates authorization context returned by a provider.
   *
   * @param value - The state parameter returned by the provider.
   * @returns The verified authorization context.
   * @throws BadRequestException - When the state is malformed, modified, or expired.
   * @throws Error - When the encrypted envelope is malformed or fails authentication with the configured key.
   */
  consume(value: string): ProviderOAuthState {
    try {
      const state = JSON.parse(this.credentials.decrypt(value)) as Partial<ProviderOAuthState>;

      if (
        typeof state.displayName !== 'string' ||
        typeof state.expiresAt !== 'number' ||
        state.expiresAt <= Date.now() ||
        !isProviderType(state.providerType) ||
        (state.baseUrl !== undefined && typeof state.baseUrl !== 'string') ||
        typeof state.userId !== 'string' ||
        !state.userId ||
        (state.targetAccountId !== undefined &&
          (typeof state.targetAccountId !== 'string' ||
            !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(state.targetAccountId) ||
            state.providerType !== 'GITLAB' ||
            !Number.isSafeInteger(state.authorizationRevision) ||
            state.authorizationRevision! < 0)) ||
        (state.gitlabConfiguration !== undefined &&
          (!state.gitlabConfiguration ||
            typeof state.gitlabConfiguration.baseUrl !== 'string' ||
            typeof state.gitlabConfiguration.clientId !== 'string' ||
            typeof state.gitlabConfiguration.redirectUri !== 'string'))
      ) {
        throw new Error('Invalid OAuth state');
      }

      return state as ProviderOAuthState;
    } catch {
      throw new BadRequestException('The OAuth session is invalid or expired.');
    }
  }
}

/**
 * Narrow an unknown value to a provider supporting OAuth authorization.
 *
 * @param value - Value to parse, validate, or normalize.
 * @returns Whether the value is GitHub, GitLab, or Forgejo.
 */
function isProviderType(value: unknown): value is ProviderType {
  return value === 'GITHUB' || value === 'GITLAB' || value === 'FORGEJO';
}
