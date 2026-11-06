/** Redirect legacy administration URLs to the canonical repository routes. */
export default defineNuxtRouteMiddleware(
  /** Redirects legacy repository URLs while retaining query parameters and fragments. */ (to) => {
    const legacyAdminMatch = /^\/admin\/repositories(?:\/([^/]+))?$/.exec(to.path);
    if (!legacyAdminMatch) return;

    const repositoryId = legacyAdminMatch[1];
    return navigateTo(
      { hash: to.hash, path: repositoryId ? `/repositories/${repositoryId}` : '/repositories', query: to.query },
      { redirectCode: 301, replace: true },
    );
  },
);
