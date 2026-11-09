import type { ProviderType } from '../../generated/prisma/client.js';

/**
 * Match organization logins exactly, allowing only slash-delimited GitLab descendants.
 * @param providerType - Forge whose namespace rules apply.
 * @param scope - Normalized organization login or full group path.
 * @param owner - Repository owner or full GitLab namespace from provider discovery.
 * @returns Whether the repository belongs to the configured organization or group.
 */
export function matchesOrganizationScope(providerType: ProviderType, scope: string, owner: string): boolean {
  const normalizedOwner = owner.toLocaleLowerCase('en-US');
  return normalizedOwner === scope || (providerType === 'GITLAB' && normalizedOwner.startsWith(`${scope}/`));
}
