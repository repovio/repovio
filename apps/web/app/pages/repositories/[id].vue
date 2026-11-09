<template>
  <ModulesRepositoriesDetailsPageShell>
    <NuxtPage :page-key="childKey" />
  </ModulesRepositoriesDetailsPageShell>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import type { RouteLocationNormalizedLoaded } from 'vue-router';
import { provideRepositoryDetail } from '~/composables/api/repository-detail';
definePageMeta({
  fullWidth: true,
  key: /** Keep the parent alive between sections of one Repository. */ (route) => String(route.params.id),
});
const route = useRoute();
const repositoryId = computed(
  /** Derives repository id from the current reactive dependencies. */ () => String(route.params.id),
);
provideRepositoryDetail(repositoryId);
/** Remount child state for identity/category changes, never for ordinary pagination. */
function childKey(child: RouteLocationNormalizedLoaded): string {
  return `${child.path}:${child.path.endsWith('/security-alerts') ? String(child.query.kind ?? 'DEPENDENCY') : ''}`;
}
watch(
  /** Observe same-document legacy anchor navigation as well as direct entry. */ () => route.hash,
  /** Forward the old Settings anchor through the existing child route guard. */ (hash) => {
    if (hash === '#settings')
      void navigateTo(`/repositories/${encodeURIComponent(repositoryId.value)}/settings`, { replace: true });
  },
  { immediate: true },
);
</script>
