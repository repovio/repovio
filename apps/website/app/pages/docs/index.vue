<template>
  <div />
</template>

<script setup lang="ts">
import { docPath, stableDocVersion } from '#shared/docs';
const route = useRoute();
await navigateTo(
  { path: useLocalePath()(docPath(stableDocVersion)), query: route.query, hash: route.hash },
  { redirectCode: 302 },
);
</script>
