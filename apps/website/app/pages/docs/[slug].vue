<template>
  <div />
</template>

<script setup lang="ts">
import { docPath, getDocVersion, stableDocVersion } from '#shared/docs';
import { resolveDocRedirect } from '#shared/docs-navigation';
const route = useRoute();
const slug = String(route.params.slug);
const localePath = useLocalePath();
const isVersion = getDocVersion(slug);
const legacy = resolveDocRedirect(slug, route.hash);
if (!isVersion && !legacy && !getDocVersion(stableDocVersion)!.slugs.includes(slug))
  throw createError({ statusCode: 404, statusMessage: 'Page not found' });
await navigateTo(
  {
    path: localePath(docPath(isVersion ? slug : stableDocVersion, isVersion ? 'overview' : legacy?.slug || slug)),
    query: route.query,
    hash: legacy?.hash ?? route.hash,
  },
  { redirectCode: 302 },
);
</script>
