import { Injectable, Optional } from '@nestjs/common';

import type { ProviderAccount } from '../../generated/prisma/client.js';
import { CredentialEncryptionService } from '../../security/credential-encryption.service.js';
import { GitHubAppService } from './github/github-app.service.js';
import { GitLabOAuthService } from './gitlab/gitlab-oauth.service.js';

/** Encrypts provider credentials at rest using Repovio's shared credential service. */
@Injectable()
export class ProviderCredentialService {
  /**
   * Initialize ProviderCredentialService with its required dependencies.
   *
   * @param credentials - Service encrypting and decrypting persisted credentials.
   * @param gitlabOAuth - Optional GitLab resolver for managed OAuth credential generations.
   * @param githubApp - Optional installation-token issuer; required for App accounts.
   */
  constructor(
    private readonly credentials: CredentialEncryptionService,
    @Optional() private readonly githubApp?: GitHubAppService,
    @Optional() private readonly gitlabOAuth?: GitLabOAuthService,
  ) {}

  /**
   * Resolve a server-only credential for either a token or GitHub App account.
   * @param account - Persisted account authentication metadata.
   * @returns An existing decrypted token or automatically renewed installation token.
   * @throws Error - App credentials are unavailable or stored credentials are invalid.
   */
  async accessToken(
    account: Pick<ProviderAccount, 'encryptedAccessToken'> &
      Partial<
        Pick<ProviderAccount, 'id' | 'providerType' | 'oauthStatus' | 'authenticationMethod' | 'githubInstallationId'>
      >,
  ): Promise<string> {
    if (account.providerType === 'GITLAB' && account.id && this.gitlabOAuth) {
      return this.gitlabOAuth.accessToken(account.id);
    }
    if (account.oauthStatus && account.oauthStatus !== 'NONE')
      throw new Error('GitLab OAuth credentials are unavailable.');
    if (account.authenticationMethod === 'GITHUB_APP') {
      if (!this.githubApp || !account.githubInstallationId) throw new Error('GitHub App credentials are unavailable.');
      return this.githubApp.accessToken(account.githubInstallationId);
    }
    return this.decrypt(account.encryptedAccessToken);
  }

  /**
   * Encrypt a provider credential without retaining or logging its plaintext.
   *
   * @param plaintext - Secret value to encrypt without retaining or logging it.
   * @returns A versionless IV, authentication-tag, and ciphertext envelope encoded with base64url.
   */
  encrypt(plaintext: string): string {
    return this.credentials.encrypt(plaintext);
  }

  /**
   * Decrypt a credential stored by {@link encrypt}.
   *
   * @param encrypted - Authenticated encrypted credential envelope stored by the application.
   * @returns The authenticated plaintext credential.
   * @throws Error - When the encrypted envelope is malformed or fails authentication with the configured key.
   */
  decrypt(encrypted: string): string {
    return this.credentials.decrypt(encrypted);
  }
}
