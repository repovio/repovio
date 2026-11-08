import { docPath, getDocVersion } from '#shared/docs';
import { resolveDocRedirect } from '#shared/docs-navigation';

/** Redirect combined pages before querying content so legacy URLs do not become missing-page errors. */
export default defineNuxtRouteMiddleware(
  /** Redirect legacy documentation paths while retaining their locale and fragment. */ (to) => {
    const version = getDocVersion(String(to.params.version));
    if (!version) return;
    const replacement = resolveDocRedirect(String(to.params.slug), to.hash);
    if (replacement) {
      return navigateTo(
        { path: useLocalePath()(docPath(version.id, replacement.slug)), query: to.query, hash: replacement.hash },
        { redirectCode: 302 },
      );
    }
  },
);
