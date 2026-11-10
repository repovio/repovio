/** Redirect legacy administration URLs to the canonical repository routes. */
export default defineNuxtRouteMiddleware(
  /** Redirects legacy repository URLs while retaining query parameters and fragments. */ (to) => {
    const legacyAdminMatch = /^\/admin\/repositories(?:\/([^/]+))?$/.exec(to.path);
    if (!legacyAdminMatch) {
      if (to.path !== '/repositories' || typeof to.query.repository !== 'string' || !to.query.repository) return;
      const { repository, ...query } = to.query;
      return navigateTo(
        { path: `/repositories/${encodeURIComponent(repository)}`, query, hash: to.hash },
        { replace: true },
      );
    }

    const repositoryId = legacyAdminMatch[1];
    return navigateTo(
      { hash: to.hash, path: repositoryId ? `/repositories/${repositoryId}` : '/repositories', query: to.query },
      { redirectCode: 301, replace: true },
    );
  },
);
