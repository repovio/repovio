<template>
  <CommonTablePageFrame :embedded="embedded" :breadcrumbs="breadcrumbs" :padded="false" :title="title">
    <template #actions>
      <UInput
        v-if="searchable"
        v-model="search"
        class="w-full sm:w-56"
        icon="i-lucide-search"
        :aria-label="$t('workflowRuns.search')"
        :placeholder="$t('workflowRuns.searchPlaceholder')"
      />
      <div class="flex flex-wrap items-center gap-2">
        <UButton
          color="neutral"
          icon="i-lucide-refresh-cw"
          variant="soft"
          :aria-label="$t('dashboard.refresh')"
          :loading="refreshLoading"
          @click="refreshView"
        />
        <QTableSorting v-model:sorting="sorting" :fields="sortableFields" shortcuts>
          <template #trigger="{ active, open, toggle }">
            <CommonTablePopoverTrigger kind="sorting" :active="active" :open="open" :toggle="toggle" />
          </template>
        </QTableSorting>
        <QTableFiltering v-model:filtering="filtering" :fields="visibleFilterFields" shortcuts>
          <template #trigger="{ active, open, toggle }">
            <CommonTablePopoverTrigger kind="filtering" :active="active" :open="open" :toggle="toggle" />
          </template>
        </QTableFiltering>
        <QTableOptions
          v-model:column-order="columnOrder"
          v-model:column-pinning="columnPinning"
          v-model:invisible-columns="columnVisibility"
          :columns="columnDefinition"
          shortcuts
        >
          <template #trigger="{ open, toggle }">
            <CommonTablePopoverTrigger kind="options" :open="open" :toggle="toggle" />
          </template>
        </QTableOptions>
      </div>
    </template>

    <UAlert
      v-if="tableError"
      class="m-4"
      color="error"
      icon="i-lucide-circle-alert"
      variant="subtle"
      :title="loadError"
    />
    <div v-if="activeDashboardPreset" class="mx-4 mb-4">
      <UButton
        color="primary"
        icon="i-tabler-filter"
        trailing-icon="i-lucide-x"
        variant="soft"
        :aria-label="$t('dashboard.activeRuns')"
        :label="$t('dashboard.activeRuns')"
        @click="clearDashboardPreset"
      />
    </div>
    <UTable
      v-if="!repositoryId || !tableError"
      sticky
      v-model:column-pinning="columnPinning"
      class="min-h-0 flex-1 overflow-x-auto"
      :columns="columns"
      :data="items"
      :empty="empty"
      :loading="loading"
      :ui="{
        th: 'first:ps-6 whitespace-nowrap bg-neutral-100 data-[pinned=right]:bg-neutral-100 dark:bg-neutral-950/20 dark:data-[pinned=right]:bg-neutral-950',
        td: 'first:ps-6 whitespace-nowrap',
      }"
    >
      <template #displayTitle-cell="{ row }">
        <bdi class="font-medium" dir="auto">
          {{ row.original.displayTitle }}
        </bdi>
      </template>
      <template #workflowName-cell="{ row }">
        <bdi class="text-sm text-muted" dir="auto">
          {{ row.original.workflowName }}
        </bdi>
        <ModulesWorkflowRunsLifecycleBadge
          :checked-at="row.original.workflowLifecycleCheckedAt"
          :state="row.original.workflowLifecycleState"
        />
      </template>
      <template #repositoryName-cell="{ row }">
        <bdi dir="ltr">
          {{ row.original.repositoryOwner }}/{{ row.original.repositoryName }}
        </bdi>
      </template>
      <template #providerType-cell="{ row }">
        <EnumsProviderTypeBadge variant="subtle" :value="row.original.providerType" />
      </template>
      <template #status-cell="{ row }">
        <UBadge variant="subtle" :color="statusColor(row.original.status)">
          {{ $t(`workflowStatus.${row.original.status}`) }}
        </UBadge>
      </template>
      <template #providerCreatedAt-cell="{ row }">
        <span class="whitespace-nowrap text-sm text-muted">{{ formatTimestamp(row.original.providerCreatedAt) }}</span>
      </template>
      <template #startedAt-cell="{ row }">
        <span class="whitespace-nowrap text-sm text-muted">{{ formatTimestamp(row.original.startedAt) }}</span>
      </template>
      <template #completedAt-cell="{ row }">
        <span class="whitespace-nowrap text-sm text-muted">
          {{ formatTimestamp(workflowRunTiming(row.original).completedAt) }}
        </span>
      </template>
      <template #durationMs-cell="{ row }">
        <span class="whitespace-nowrap text-sm text-muted">
          {{ formatDuration(workflowRunTiming(row.original).durationMs) }}
        </span>
      </template>
      <template #actions-header="{ column }">
        <span class="flex justify-end">{{ column.columnDef.header }}</span>
      </template>
      <template #actions-cell="{ row }">
        <div class="flex justify-end">
          <UTooltip :text="$t('dashboard.openProvider')">
            <UButton
              color="neutral"
              icon="i-tabler-external-link"
              rel="noreferrer"
              target="_blank"
              variant="ghost"
              :aria-label="$t('dashboard.openProvider')"
              :to="row.original.url"
            />
          </UTooltip>
        </div>
      </template>
    </UTable>
    <QTablePagination
      v-model:items-per-page="itemsPerPage"
      v-model:page="page"
      class="border-t border-default"
      :total-items="totalItems"
      shortcuts
    />
  </CommonTablePageFrame>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

import { FilterFieldType, type FilterField, type Filtering, type SortingField } from '@querry-kit/nuxt-ui/types';
import { refDebounced } from '@vueuse/core';
import { defineProps } from 'vue';
import { useRepovioApi } from '~/composables/api/repovio-api';
import { useSystemStatusState } from '~/composables/api/system-status';
import { useTable } from '~/composables/api/table';
import { useAutoRefresh } from '~/composables/app/auto-refresh';
import { useProviderType } from '~/composables/enums/provider-type';
import { useDateTime } from '~/composables/use-date-time';
import { providerTypes, type WorkflowRun, type WorkflowRunStatus } from '~/types/api/resources';
import type { ColumnDefinition } from '~/types/table';
import {
  emptyDashboardFiltering,
  resolveWorkflowRunDashboardPreset,
  type WorkflowRunDashboardPresetName,
} from '~/utils/dashboard-table-presets';
import {
  durationFilteringToMilliseconds,
  durationFilteringToSeconds,
  loadWorkflowRunRepositoryFilterOptions,
  type WorkflowRunRepositoryFilterOption,
} from '~/utils/workflow-run-filtering';
import { workflowRunTiming } from '~/utils/workflow-run-timing';

interface BreadcrumbItem {
  icon: string;
  label: string;
  to?: string;
}

type WorkflowRunRow = WorkflowRun & Record<string, unknown>;
type WorkflowRunTableColumn = ColumnDefinition<WorkflowRunRow> & { header: string; id: string };

const props = defineProps<{
  breadcrumbs: BreadcrumbItem[];
  repositoryId?: string;
  embedded?: boolean;
  detailedTimestamps?: boolean;
  empty: string;
  endpoint: 'workflow-runs' | 'workflow-runs/needs-attention';
  loadError: string;
  name: string;
  searchable?: boolean;
  title: string;
}>();

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { formatDateTime } = useDateTime();
const api = useRepovioApi();
const toast = useToast();
const { snapshot: systemStatus } = useSystemStatusState();
const { getLabel: getProviderTypeLabel } = useProviderType();
const search = ref('');
const debouncedSearch = refDebounced(search, 250);
const initialDashboardPreset = props.repositoryId ? null : resolveWorkflowRunDashboardPreset(route.query.preset);
const activeDashboardPreset = ref<WorkflowRunDashboardPresetName | null>(initialDashboardPreset?.name ?? null);
const repositoryFilterLoading = ref(true);
const repositoryFilterOptions = ref<WorkflowRunRepositoryFilterOption[]>([]);
const workflowStatuses: WorkflowRunStatus[] = [
  'QUEUED',
  'RUNNING',
  'SUCCESS',
  'FAILED',
  'CANCELLED',
  'SKIPPED',
  'UNKNOWN',
];
const columnDefinition = computed<WorkflowRunTableColumn[]>(
  /** Derives column definition from the current reactive dependencies. */ () => [
    { accessorKey: 'displayTitle', header: t('workflowRuns.columns.title'), id: 'displayTitle' },
    { accessorKey: 'workflowName', header: t('workflowRuns.columns.workflow'), id: 'workflowName' },
    { accessorKey: 'repositoryName', header: t('repositories.columns.name'), id: 'repositoryName' },
    { accessorKey: 'providerType', header: t('repositories.addSteps.provider'), id: 'providerType' },
    { accessorKey: 'status', header: t('workflowRuns.columns.status'), id: 'status' },
    ...(props.detailedTimestamps
      ? [
          { accessorKey: 'providerCreatedAt', header: t('workflowRuns.columns.created'), id: 'providerCreatedAt' },
          { accessorKey: 'startedAt', header: t('workflowRuns.columns.started'), id: 'startedAt' },
        ]
      : []),
    { accessorKey: 'durationMs', header: t('workflowRuns.columns.duration'), id: 'durationMs' },
    { accessorKey: 'completedAt', header: t('workflowRuns.columns.completed'), id: 'completedAt' },
    { enableHiding: false, header: t('repositories.columns.actions'), id: 'actions' },
  ],
);
const sortableFields = computed<SortingField[]>(
  /** Derives sortable fields from the current reactive dependencies. */ () => [
    { label: t('workflowRuns.columns.title'), value: 'displayTitle' },
    { label: t('workflowRuns.columns.workflow'), value: 'workflowName' },
    { label: t('workflowRuns.columns.status'), value: 'status' },
    ...(props.detailedTimestamps
      ? [
          { label: t('workflowRuns.columns.created'), value: 'providerCreatedAt' },
          { label: t('workflowRuns.columns.started'), value: 'startedAt' },
        ]
      : []),
    { label: t('workflowRuns.columns.duration'), value: 'durationMs' },
    { label: t('workflowRuns.columns.completed'), value: 'completedAt' },
  ],
);
const filterFields = computed<FilterField[]>(
  /** Derives filter fields from the current reactive dependencies. */ () => [
    {
      label: t('workflowRuns.columns.status'),
      type: FilterFieldType.Enum,
      value: 'status',
      values: workflowStatuses.map(
        /** Projects each entry using `({ label: t(`workflowStatus.${status}`), value: status })`. */ (status) => ({
          label: t(`workflowStatus.${status}`),
          value: status,
        }),
      ),
    },
    {
      disabled: repositoryFilterLoading.value || repositoryFilterOptions.value.length === 0,
      label: t('workflowRuns.filters.repository'),
      type: FilterFieldType.Enum,
      value: 'repositoryId',
      values: repositoryFilterOptions.value,
    },
    {
      label: t('workflowRuns.filters.provider'),
      type: FilterFieldType.Enum,
      value: 'repository.providerAccount.providerType',
      values: providerTypes.map(
        /** Projects each entry using `({ label: getProviderTypeLabel(providerType), value: providerType })`. */ (
          providerType,
        ) => ({ label: getProviderTypeLabel(providerType), value: providerType }),
      ),
    },
    {
      label: t('workflowRuns.filters.durationSeconds'),
      type: FilterFieldType.Number,
      value: 'durationMs',
    },
  ],
);
const visibleFilterFields = computed(
  /** Scoped views cannot switch Repository or Provider through a filter control. */ () =>
    filterFields.value.filter(
      /** Preserve all other field metadata. */ (field) =>
        !props.repositoryId || !['repositoryId', 'repository.providerAccount.providerType'].includes(field.value),
    ),
);
const staticFilter = computed(
  /** Derives static filter from the current reactive dependencies. */ () => {
    const value = debouncedSearch.value.trim();
    if (!props.searchable || !value) return undefined;
    const contains = { contains: value, mode: 'insensitive' };
    return {
      OR: [
        { displayTitle: contains },
        { workflowName: contains },
        { repository: { name: contains } },
        { repository: { owner: contains } },
      ],
    };
  },
);
const workflowRunTable = useTable({
  serializeReads: true,
  columnDefinition,
  defaultItemsPerPage: 25,
  endpoint: props.endpoint,
  name: props.name,
  repositoryId: props.repositoryId,
  staticFields: ['id', 'repositoryOwner', 'url', 'workflowLifecycleState', 'workflowLifecycleCheckedAt'],
  staticFilter,
});
const {
  columnOrder,
  columnVisibility,
  columns,
  error: tableError,
  filtering: queryFiltering,
  items,
  itemsPerPage,
  loading,
  page,
  refresh,
  sorting,
  totalItems,
} = workflowRunTable;
const { refresh: refreshView, loading: refreshLoading } = useAutoRefresh(refresh, loading);
if (initialDashboardPreset) {
  queryFiltering.value = initialDashboardPreset.filtering;
  page.value = 1;
}
const filtering = computed<Filtering>({
  /** Reads the filtering binding. */
  get: () => durationFilteringToSeconds(queryFiltering.value),
  /** Writes the filtering binding. */
  set: (value) => {
    queryFiltering.value = durationFilteringToMilliseconds(value);
  },
});
const columnPinning = computed({
  /** Reads the column pinning binding. */
  get: () => ({ left: workflowRunTable.columnPinning.value.left, right: workflowRunTable.columnPinning.value.right }),
  /** Writes the column pinning binding. */
  set: (value: { left?: string[]; right?: string[] }) => {
    workflowRunTable.columnPinning.value = value;
  },
});
let observedProviderSync = false;
let refreshAfterSyncTimer: ReturnType<typeof setTimeout> | undefined;

watch(
  debouncedSearch,
  /** Synchronizes table page when the observed state changes. */ () => {
    page.value = 1;
  },
);
watch(
  queryFiltering,
  /** Synchronizes table page when the observed state changes. */
  () => {
    page.value = 1;
    releaseDashboardPreset();
  },
  { deep: true },
);
watch(search, releaseDashboardPreset);
watch(
  /** Reads the reactive dependencies observed by this watcher. */
  () => systemStatus.value.activity,
  /** Synchronizes table page when the observed state changes. */
  (activity) => {
    if (activity) {
      observedProviderSync = true;
      if (refreshAfterSyncTimer) clearTimeout(refreshAfterSyncTimer);
      refreshAfterSyncTimer = undefined;
      return;
    }
    if (!observedProviderSync) return;
    observedProviderSync = false;
    refreshAfterSyncTimer = setTimeout(
      /** Completes the deferred table page operation after its delay. */ () => {
        refreshAfterSyncTimer = undefined;
        void refreshView();
      },
      500,
    );
  },
);

/** Load all repositories visible to the current user for the repository filter. */
async function loadRepositoryFilterOptions(): Promise<void> {
  repositoryFilterLoading.value = true;
  try {
    repositoryFilterOptions.value = await loadWorkflowRunRepositoryFilterOptions(
      /** Fetches the next repository-options page for the workflow filter. */ async (repositoryPage) => {
        const response = await api.repositories.list(repositoryPage);
        return response.data;
      },
    );
  } catch {
    repositoryFilterOptions.value = [];
    toast.add({ color: 'error', title: t('workflowRuns.repositoryFilterLoadError') });
  } finally {
    repositoryFilterLoading.value = false;
  }
}

/** Remove the active dashboard preset and its workflow status filter. */
function clearDashboardPreset(): void {
  activeDashboardPreset.value = null;
  queryFiltering.value = emptyDashboardFiltering();
  search.value = '';
  page.value = 1;
  removeDashboardPresetQuery();
}

/** Stop treating the current filters as a dashboard preset after a manual change. */
function releaseDashboardPreset(): void {
  if (!activeDashboardPreset.value) return;
  activeDashboardPreset.value = null;
  removeDashboardPresetQuery();
}

/** Remove only the preset parameter while preserving unrelated route query state. */
function removeDashboardPresetQuery(): void {
  const query = { ...route.query };
  delete query.preset;
  void router.replace({ query });
}

/** Format a provider timestamp in the active interface locale. */
function formatTimestamp(timestamp: string | null): string {
  if (!timestamp) return t('workflowRuns.notAvailable');
  return formatDateTime(timestamp);
}

/** Format a persisted duration as a compact, readable minutes-and-seconds value. */
function formatDuration(durationMs: number | null): string {
  if (durationMs === null) return t('workflowRuns.notAvailable');
  const seconds = Math.floor(durationMs / 1_000);
  return t('workflowRuns.durationValue', { minutes: Math.floor(seconds / 60), seconds: seconds % 60 });
}

/** Choose a compact semantic badge color for every normalized workflow status. */
function statusColor(status: WorkflowRunStatus): 'error' | 'info' | 'neutral' | 'success' | 'warning' {
  if (status === 'SUCCESS') return 'success';
  if (status === 'FAILED') return 'error';
  if (status === 'RUNNING' || status === 'QUEUED') return 'info';
  if (status === 'CANCELLED' || status === 'SKIPPED') return 'warning';
  return 'neutral';
}

onMounted(
  /** Initializes component subscriptions and data after mounting. */ () => {
    void workflowRunTable.initialize();
    if (!props.repositoryId) void loadRepositoryFilterOptions();
  },
);
onBeforeUnmount(
  /** Releases component resources and subscriptions before disposal. */ () => {
    if (refreshAfterSyncTimer) clearTimeout(refreshAfterSyncTimer);
  },
);
</script>
