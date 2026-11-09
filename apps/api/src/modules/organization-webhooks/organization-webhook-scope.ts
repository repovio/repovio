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

/**
 * Select the most specific configured group, or the exact organization match.
 * @param providerType - Forge whose namespace rules apply.
 * @param owner - Repository owner or full GitLab namespace.
 * @param configurations - Configurations belonging to this repository's provider account.
 * @returns The matching configuration with the longest scope, if any.
 * @typeParam T - Configuration metadata retained by the result.
 */
export function selectOrganizationWebhook<T extends { scope: string }>(
  providerType: ProviderType,
  owner: string,
  configurations: T[],
): T | undefined {
  return configurations
    .filter(
      /** Retain scopes containing this namespace. */ (configuration) =>
        matchesOrganizationScope(providerType, configuration.scope, owner),
    )
    .sort(
      /** Prefer the deepest configured GitLab group. */ (left, right) => right.scope.length - left.scope.length,
    )[0];
}
