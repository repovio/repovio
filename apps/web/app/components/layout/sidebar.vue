<template>
  <UDashboardSidebar
    id="repovio"
    collapsible
    resizable
    class="bg-elevated/25"
    role="complementary"
    :default-size="16"
    :aria-label="t('layout.sidebarNavigation')"
    :ui="{ footer: 'flex-col items-stretch' }"
  >
    <template #header="{ collapsed }">
      <NuxtLink
        to="/"
        aria-label="Repovio"
        class="flex items-center gap-2 font-display text-xl font-bold"
        :class="collapsed ? 'mx-auto' : undefined"
      >
        <img v-if="collapsed" src="/logo.svg" alt="" class="size-7 shrink-0" />
        <template v-else>
          <img src="/logo-wordmark-light.svg" alt="" class="h-8 w-auto dark:hidden" />
          <img src="/logo-wordmark-dark.svg" alt="" class="hidden h-8 w-auto dark:block" />
        </template>
      </NuxtLink>
    </template>

    <template #default="{ collapsed }">
      <UNavigationMenu
        orientation="vertical"
        :aria-label="t('layout.primaryNavigation')"
        :collapsed="collapsed"
        :items="navigationItems"
        popover
        tooltip
      />
    </template>

    <template #footer="{ collapsed }">
      <LayoutSidebarFooter :collapsed="collapsed" />
    </template>
  </UDashboardSidebar>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';

import { useModuleApi } from '~/composables/api/module-api';
import { useRepovioApi } from '~/composables/api/repovio-api';
import { useSystemStatusState } from '~/composables/api/system-status';
import { useNavigationItems } from '~/composables/app/navigation-items';

const { t } = useI18n();
const route = useRoute();
const api = useRepovioApi();
const { snapshot: systemStatus } = useSystemStatusState();
const needsAttentionApi = useModuleApi('workflow-runs/needs-attention');
const awaitingApprovalCount = ref<number | null>(null);
const needsAttentionCount = ref<number | null>(null);
const { navigationItems } = useNavigationItems({
  awaitingApproval: awaitingApprovalCount,
  needsAttention: needsAttentionCount,
});

/** Load permission-scoped workflow attention counters without blocking the application shell. */
async function loadAttentionCounts(): Promise<void> {
  const [awaitingApprovalResult, needsAttentionResult] = await Promise.allSettled([
    api.dashboard.getAwaitingApproval(),
    needsAttentionApi.query({ fields: 'id', page: 1, perPage: 1 }),
  ]);

  awaitingApprovalCount.value =
    awaitingApprovalResult.status === 'fulfilled' ? awaitingApprovalResult.value.data.length : null;
  needsAttentionCount.value =
    needsAttentionResult.status === 'fulfilled' ? needsAttentionResult.value.data.meta.itemCount : null;
}

onMounted(/** Initializes component subscriptions and data after mounting. */ () => void loadAttentionCounts());
watch(/** Reads the reactive dependencies observed by this watcher. */ () => route.fullPath, loadAttentionCounts);

let observedProviderSync = false;
watch(
  /** Reads the reactive dependencies observed by this watcher. */
  () => systemStatus.value.activity,
  /** Synchronizes sidebar when the observed state changes. */
  (activity) => {
    if (activity) {
      observedProviderSync = true;
      return;
    }
    if (!observedProviderSync) return;
    observedProviderSync = false;
    void loadAttentionCounts();
  },
);
</script>
