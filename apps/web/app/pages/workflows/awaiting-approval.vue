<template>
  <LayoutPage
    :breadcrumbs="[
      { icon: 'i-lucide-layout-dashboard', label: $t('layout.dashboard'), to: '/' },
      { icon: 'i-lucide-list-tree', label: $t('layout.workflowRuns'), to: '/workflow-runs' },
      { icon: 'i-lucide-shield-alert', label: $t('awaitingApproval.title') },
    ]"
    :description="$t('awaitingApproval.description')"
    :padded="false"
    :title="$t('awaitingApproval.title')"
  >
    <template #actions>
      <UInput
        v-model="search"
        class="w-36 sm:w-56"
        icon="i-lucide-search"
        :aria-label="$t('awaitingApproval.searchPlaceholder')"
        :placeholder="$t('awaitingApproval.searchPlaceholder')"
      />
      <CommonRefreshButton :loading="refreshLoading" @refresh="refreshView" />
    </template>

    <UAlert
      color="warning"
      class="rounded-none ring-0 border-0 [box-shadow:none]"
      data-provider-approval-notice
      icon="i-lucide-info"
      variant="subtle"
      :description="$t('awaitingApproval.providerApprovalDescription')"
      :title="$t('awaitingApproval.providerApprovalTitle')"
    />

    <UAlert
      v-if="loadError"
      class="m-4"
      color="error"
      icon="i-lucide-circle-alert"
      variant="subtle"
      :title="$t('awaitingApproval.loadError')"
    />
    <UTable
      sticky
      class="min-h-0 flex-1 overflow-x-auto"
      data-awaiting-approval-table
      :columns="columns"
      :data="filteredRuns"
      :empty="$t('awaitingApproval.empty')"
      :loading="loading"
      :ui="{
        th: 'first:pl-6 whitespace-nowrap bg-neutral-100 dark:bg-neutral-950/20',
        td: 'first:pl-6 whitespace-nowrap',
      }"
    >
      <template #displayTitle-cell="{ row }">
        <span class="font-medium">{{ row.original.displayTitle }}</span>
      </template>
      <template #repository-cell="{ row }">
        <span>{{ row.original.repository.owner }}/{{ row.original.repository.name }}</span>
      </template>
      <template #provider-cell="{ row }">
        <EnumsProviderTypeBadge variant="subtle" :value="row.original.provider.providerType" />
      </template>
      <template #providerCreatedAt-cell="{ row }">
        <span class="whitespace-nowrap text-sm text-muted">{{ formatDateTime(row.original.providerCreatedAt) }}</span>
      </template>
      <template #actions-header="{ column }">
        <span class="flex justify-end">{{ column.columnDef.header }}</span>
      </template>
      <template #actions-cell="{ row }">
        <div class="flex justify-end gap-2">
          <UTooltip v-if="row.original.reviewUrl" :text="$t('awaitingApproval.openReview')">
            <UButton
              color="neutral"
              icon="i-tabler-external-link"
              rel="noreferrer"
              size="sm"
              target="_blank"
              variant="ghost"
              :aria-label="$t('awaitingApproval.openReview')"
              :label="$t('awaitingApproval.openReview')"
              :to="row.original.reviewUrl"
            />
          </UTooltip>
          <UTooltip :text="$t('awaitingApproval.approveInProvider')">
            <UButton
              color="warning"
              icon="i-tabler-external-link"
              rel="noreferrer"
              size="sm"
              target="_blank"
              variant="soft"
              :aria-label="$t('awaitingApproval.approveInProvider')"
              :label="$t('awaitingApproval.approveInProvider')"
              :to="row.original.url"
            />
          </UTooltip>
        </div>
      </template>
    </UTable>
  </LayoutPage>
</template>

<script setup lang="ts">
import type { TableColumn } from '#ui/types';
import { computed, onMounted, onScopeDispose, ref } from 'vue';
import { useAutoRefresh } from '~/composables/app/auto-refresh';

import { useRepovioApi } from '~/composables/api/repovio-api';
import { useDateTime } from '~/composables/use-date-time';
import type { DashboardWorkflowRun } from '~/types/api/resources';

definePageMeta({ fullWidth: true });

const { t } = useI18n();
const api = useRepovioApi();
const { formatDateTime } = useDateTime();
const loadError = ref(false);
const loading = ref(true);
let requestGeneration = 0;
onScopeDispose(
  /** Invalidate approval responses on navigation or sign-out. */ () => {
    requestGeneration++;
  },
);
const { refresh: refreshView, loading: refreshLoading } = useAutoRefresh(loadRuns, loading);
const runs = ref<DashboardWorkflowRun[]>([]);
const search = ref('');
const columns = computed<TableColumn<DashboardWorkflowRun>[]>(
  /** Derives columns from the current reactive dependencies. */ () => [
    { accessorKey: 'displayTitle', header: t('dashboard.workflow'), id: 'displayTitle' },
    { header: t('repositories.columns.name'), id: 'repository' },
    { header: t('repositories.addSteps.provider'), id: 'provider' },
    { accessorKey: 'providerCreatedAt', header: t('awaitingApproval.waitingSince'), id: 'providerCreatedAt' },
    { header: t('repositories.columns.actions'), id: 'actions' },
  ],
);

useHead({
  title: computed(/** Derives title from the current reactive dependencies. */ () => t('awaitingApproval.title')),
});

const filteredRuns = computed(
  /** Derives filtered runs from the current reactive dependencies. */ () => {
    const value = search.value.trim().toLocaleLowerCase();
    if (!value) return runs.value;
    return runs.value.filter(
      /** Keeps entries matching the filteredRuns predicate. */ (run) =>
        [
          run.displayTitle,
          run.workflowName,
          run.repository.owner,
          run.repository.name,
          run.provider.displayName,
          run.provider.providerType,
        ]
          .join(' ')
          .toLocaleLowerCase()
          .includes(value),
    );
  },
);

/** Load all approval-gated workflow runs visible to the current user. */
async function loadRuns(): Promise<void> {
  const generation = ++requestGeneration;
  loading.value = true;
  loadError.value = false;
  try {
    const response = await api.dashboard.getAwaitingApproval();
    if (generation === requestGeneration) runs.value = response.data;
  } catch {
    if (generation === requestGeneration) loadError.value = true;
  } finally {
    if (generation === requestGeneration) loading.value = false;
  }
}

onMounted(/** Initializes component subscriptions and data after mounting. */ () => void loadRuns());
</script>
