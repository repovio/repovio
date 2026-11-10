<template>
  <CommonTablePageFrame
    :embedded="embedded"
    :breadcrumbs="[
      { icon: 'i-lucide-layout-dashboard', label: $t('layout.dashboard'), to: '/' },
      { icon: kindIcon, label: pageTitle },
    ]"
    :description="pageDescription"
    :padded="false"
    :title="pageTitle"
  >
    <template #actions>
      <UInput
        v-model="search"
        class="w-full sm:w-56"
        icon="i-lucide-search"
        :aria-label="$t('workItems.search')"
        :placeholder="$t('workItems.searchPlaceholder')"
      />
      <div class="flex flex-wrap items-center gap-2">
        <UButton
          color="neutral"
          icon="i-lucide-refresh-cw"
          variant="soft"
          :aria-label="$t('dashboard.refresh')"
          :loading="loading || summaryLoading"
          @click="refreshAll"
        />
        <QTableSorting v-model:sorting="sorting" :fields="sortableFields" shortcuts>
          <template #trigger="{ active, open, toggle }">
            <CommonTablePopoverTrigger kind="sorting" :active="active" :open="open" :toggle="toggle" />
          </template>
        </QTableSorting>
        <CommonTableFiltering
          v-model:filtering="filtering"
          :fields="visibleFilterFields"
          :specialized-active="selectedLabels.length > 0 || !!updatedFrom || !!updatedTo"
          @clear-specialized="clearSpecializedFilters"
        >
          <USelectMenu
            v-model="selectedLabels"
            multiple
            class="w-full min-w-0 sm:col-span-2"
            :items="filterOptions.labels"
            :placeholder="$t('workItems.labels')"
            :aria-label="$t('workItems.labels')"
          />
          <UFormField class="min-w-0" :label="$t('workItems.updatedFrom')">
            <UInput
              v-model="updatedFrom"
              class="w-full min-w-0"
              type="date"
              :aria-label="$t('workItems.updatedFrom')"
            />
          </UFormField>
          <UFormField class="min-w-0" :label="$t('workItems.updatedTo')">
            <UInput v-model="updatedTo" class="w-full min-w-0" type="date" :aria-label="$t('workItems.updatedTo')" />
          </UFormField>
        </CommonTableFiltering>
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

    <div v-if="!repositoryId" class="p-4 sm:p-6">
      <UButton
        v-if="activeDashboardPreset"
        class="mb-4"
        color="primary"
        icon="i-tabler-filter"
        trailing-icon="i-lucide-x"
        variant="soft"
        :aria-label="activeDashboardPresetLabel"
        :label="activeDashboardPresetLabel"
        @click="clearDashboardPreset"
      />
      <ModulesWorkItemsSummaryCards
        :loading="summaryLoading"
        :metrics="summaryMetrics"
        :title="$t('workItems.summary')"
      />
    </div>
    <UAlert
      v-if="tableError || summaryError"
      class="mx-4 mb-4 sm:mx-6"
      color="error"
      icon="i-lucide-circle-alert"
      variant="subtle"
      :title="$t('workItems.loadError')"
    />
    <UTable
      v-if="!repositoryId || !tableError"
      sticky
      v-model:column-pinning="columnPinning"
      class="min-h-0 flex-1 overflow-x-auto"
      :columns="columns"
      :data="items"
      :empty="$t('workItems.empty')"
      :loading="loading"
      :ui="{
        tr: 'data-[selected]:cursor-pointer',
        th: 'first:pl-6 whitespace-nowrap bg-neutral-100 dark:bg-neutral-950/20',
        td: 'first:pl-6 align-top',
      }"
      @select="selectRow"
    >
      <template #number-cell="{ row }">
        <span class="font-mono text-xs">#{{ row.original.number }}</span>
      </template>
      <template #title-cell="{ row }">
        <NuxtLink class="font-medium hover:underline" :to="`/${endpoint}/${row.original.id}`">
          {{ row.original.title }}
        </NuxtLink>
      </template>
      <template #repositoryName-cell="{ row }">
        {{ row.original.repositoryOwner }}/{{ row.original.repositoryName }}
      </template>
      <template #providerType-cell="{ row }">
        <EnumsProviderTypeBadge variant="subtle" :value="row.original.providerType" />
      </template>
      <template #state-cell="{ row }">
        <UBadge color="neutral" variant="subtle">
          {{ $t(`workItems.states.${row.original.state}`) }}
        </UBadge>
      </template>
      <template #author-cell="{ row }">
        {{ row.original.author?.username ?? '—' }}
      </template>
      <template #labels-cell="{ row }">
        <ModulesWorkItemsLabels :labels="row.original.labels" />
      </template>
      <template #providerUpdatedAt-cell="{ row }">
        <span class="whitespace-nowrap text-sm text-muted">{{ formatDateTime(row.original.providerUpdatedAt) }}</span>
      </template>
      <template #workflowStatus-cell="{ row }">
        <UBadge
          v-if="'workflowStatus' in row.original"
          variant="subtle"
          :color="row.original.workflowStatus === 'FAILED' ? 'error' : 'neutral'"
        >
          {{ $t(`workItems.workflowStatuses.${row.original.workflowStatus}`) }}
        </UBadge>
      </template>
      <template #workflowApprovalRequired-cell="{ row }">
        <UBadge
          v-if="'workflowApprovalRequired' in row.original && row.original.workflowApprovalRequired"
          color="warning"
          variant="subtle"
        >
          {{ $t('pullRequests.approvalRequired') }}
        </UBadge>
        <span v-else>—</span>
      </template>
      <template #actions-cell="{ row }">
        <div class="flex justify-end" data-row-navigation-ignore>
          <UButton
            color="neutral"
            icon="i-tabler-external-link"
            rel="noreferrer"
            target="_blank"
            variant="ghost"
            :aria-label="$t('dashboard.openProvider')"
            :to="row.original.url"
          />
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
import { FilterFieldType, type FilterField, type SortingField } from '@querry-kit/nuxt-ui/types';
import { refDebounced } from '@vueuse/core';
import { defineProps, onScopeDispose } from 'vue';
import { useRepovioApi } from '~/composables/api/repovio-api';
import { useTable } from '~/composables/api/table';
import { useTableRowNavigation } from '~/composables/app/table-row-navigation';
import { useProviderType } from '~/composables/enums/provider-type';
import { useDateTime } from '~/composables/use-date-time';
import {
  providerTypes,
  type Issue,
  type IssueSummary,
  type PullRequest,
  type PullRequestSummary,
  type WorkItemFilterOptions,
} from '~/types/api/resources';
import type { ColumnDefinition } from '~/types/table';
import {
  emptyDashboardFiltering,
  resolveWorkItemDashboardPreset,
  type WorkItemDashboardPresetName,
} from '~/utils/dashboard-table-presets';
import { loadWorkflowRunRepositoryFilterOptions } from '~/utils/workflow-run-filtering';

const props = defineProps<{ kind: 'issue' | 'pull-request'; repositoryId?: string; embedded?: boolean }>();
type WorkItemRow = (Issue | PullRequest) & Record<string, unknown>;
type WorkItemTableColumn = ColumnDefinition<WorkItemRow> & { header: string; id: string };
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const api = useRepovioApi();
const { formatDateTime } = useDateTime();
const { getLabel: getProviderTypeLabel } = useProviderType();
const search = ref('');
const debouncedSearch = refDebounced(search, 250);
const selectedLabels = ref<string[]>([]);
const updatedFrom = ref('');
const updatedTo = ref('');
const initialDashboardPreset = props.repositoryId
  ? null
  : resolveWorkItemDashboardPreset(props.kind, route.query.preset);
const activeDashboardPreset = ref<WorkItemDashboardPresetName | null>(initialDashboardPreset?.name ?? null);
const dashboardPresetStaticFilter = ref<Record<string, unknown> | undefined>(initialDashboardPreset?.staticFilter);
const filterOptions = ref<WorkItemFilterOptions>({ assignees: [], authors: [], labels: [], milestones: [] });
const repositories = ref<Array<{ label: string; value: string }>>([]);
const summary = ref<IssueSummary | PullRequestSummary | null>(null);
const summaryLoading = ref(true);
const summaryError = ref(false);
const selectRow = useTableRowNavigation<{ id: string }>(
  /** Open the existing Work Item detail for this resource family. */ (item) =>
    `/${endpoint}/${encodeURIComponent(item.id)}`,
);
const endpoint: 'issues' | 'pull-requests' = props.kind === 'issue' ? 'issues' : 'pull-requests';
const pageTitle = computed(
  /** Derives page title from the current reactive dependencies. */ () =>
    t(props.kind === 'issue' ? 'issues.title' : 'pullRequests.title'),
);
const pageDescription = computed(
  /** Derives page description from the current reactive dependencies. */ () =>
    t(props.kind === 'issue' ? 'issues.description' : 'pullRequests.description'),
);
const kindIcon = computed(
  /** Derives kind icon from the current reactive dependencies. */ () =>
    props.kind === 'issue' ? 'i-tabler-circle-dot' : 'i-tabler-git-pull-request',
);

const columnDefinition = computed<WorkItemTableColumn[]>(
  /** Derives column definition from the current reactive dependencies. */ () => [
    { accessorKey: 'number', header: t('workItems.columns.number'), id: 'number' },
    { accessorKey: 'title', header: t('workItems.columns.title'), id: 'title' },
    { accessorKey: 'repositoryName', header: t('repositories.columns.name'), id: 'repositoryName' },
    { accessorKey: 'providerType', header: t('repositories.addSteps.provider'), id: 'providerType' },
    { accessorKey: 'state', header: t('workItems.columns.state'), id: 'state' },
    { accessorKey: 'author', header: t('workItems.columns.author'), id: 'author' },
    { accessorKey: 'labels', header: t('workItems.labels'), id: 'labels' },
    ...(props.kind === 'pull-request'
      ? [
          { accessorKey: 'workflowStatus', header: t('pullRequests.workflowStatus'), id: 'workflowStatus' },
          {
            accessorKey: 'workflowApprovalRequired',
            header: t('pullRequests.approval'),
            id: 'workflowApprovalRequired',
          },
        ]
      : []),
    { accessorKey: 'providerUpdatedAt', header: t('workItems.columns.updated'), id: 'providerUpdatedAt' },
    { enableHiding: false, header: t('repositories.columns.actions'), id: 'actions' },
  ],
);
const sortableFields = computed<SortingField[]>(
  /** Derives sortable fields from the current reactive dependencies. */ () => [
    { label: t('workItems.columns.number'), value: 'number' },
    { label: t('workItems.columns.title'), value: 'title' },
    { label: t('workItems.columns.updated'), value: 'providerUpdatedAt' },
  ],
);
const filterFields = computed<FilterField[]>(
  /** Derives filter fields from the current reactive dependencies. */ () => [
    {
      label: t('workItems.columns.state'),
      type: FilterFieldType.Enum,
      value: 'state',
      values: (props.kind === 'issue' ? ['OPEN', 'CLOSED'] : ['OPEN', 'CLOSED', 'MERGED']).map(
        /** Projects each entry using `({ label: t(`workItems.states.${state}`), value: state, })`. */ (state) => ({
          label: t(`workItems.states.${state}`),
          value: state,
        }),
      ),
    },
    { label: t('workItems.repository'), type: FilterFieldType.Enum, value: 'repositoryId', values: repositories.value },
    {
      label: t('workItems.provider'),
      type: FilterFieldType.Enum,
      value: 'repository.providerAccount.providerType',
      values: providerTypes.map(
        /** Projects each entry using `({ label: getProviderTypeLabel(value), value })`. */ (value) => ({
          label: getProviderTypeLabel(value),
          value,
        }),
      ),
    },
    {
      label: t('workItems.columns.author'),
      type: FilterFieldType.Enum,
      value: 'author.username',
      values: filterOptions.value.authors.map(
        /** Projects each entry using `({ label: value, value })`. */ (value) => ({ label: value, value }),
      ),
    },
    {
      label: t('workItems.assignee'),
      type: FilterFieldType.Enum,
      value: 'assignees.some.actor.username',
      values: filterOptions.value.assignees.map(
        /** Projects each entry using `({ label: value, value })`. */ (value) => ({ label: value, value }),
      ),
    },
    ...(props.kind === 'issue'
      ? [
          {
            label: t('workItems.milestone'),
            type: FilterFieldType.Enum,
            value: 'milestone',
            values: filterOptions.value.milestones.map(
              /** Projects each entry using `({ label: value, value })`. */ (value) => ({ label: value, value }),
            ),
          },
        ]
      : [
          { label: t('pullRequests.draft'), type: FilterFieldType.Boolean, value: 'draft' },
          {
            label: t('pullRequests.workflowStatus'),
            type: FilterFieldType.Enum,
            value: 'workflowStatus',
            values: ['PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'CANCELLED', 'UNKNOWN'].map(
              /** Projects each entry using `({ label: t(`workItems.workflowStatuses.${value}`), value, })`. */ (
                value,
              ) => ({
                label: t(`workItems.workflowStatuses.${value}`),
                value,
              }),
            ),
          },
          { label: t('pullRequests.approval'), type: FilterFieldType.Boolean, value: 'workflowApprovalRequired' },
        ]),
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
    const constraints: Record<string, unknown>[] = selectedLabels.value.map(
      /** Projects each entry using `({ labels: { some: { label: { normalizedName: name.toLocaleLowerCase() } } }, })`. */ (
        name,
      ) => ({
        labels: { some: { label: { normalizedName: name.toLocaleLowerCase() } } },
      }),
    );
    if (dashboardPresetStaticFilter.value) constraints.push(dashboardPresetStaticFilter.value);
    const value = debouncedSearch.value.trim();
    if (value)
      constraints.push({ OR: [{ number: { contains: value } }, { title: { contains: value, mode: 'insensitive' } }] });
    if (updatedFrom.value)
      constraints.push({ providerUpdatedAt: { gte: new Date(`${updatedFrom.value}T00:00:00.000Z`).toISOString() } });
    if (updatedTo.value)
      constraints.push({ providerUpdatedAt: { lte: new Date(`${updatedTo.value}T23:59:59.999Z`).toISOString() } });
    return constraints.length > 0 ? { AND: constraints } : undefined;
  },
);
const table = useTable({
  columnDefinition,
  defaultItemsPerPage: 25,
  endpoint,
  name: endpoint,
  repositoryId: props.repositoryId,
  staticFields: ['id', 'repositoryOwner', 'url'],
  staticFilter,
});
const {
  columnOrder,
  columnPinning,
  columnVisibility,
  columns,
  error: tableError,
  filtering,
  initialize,
  items,
  itemsPerPage,
  loading,
  page,
  refresh,
  sorting,
  totalItems,
} = table;
if (initialDashboardPreset) {
  filtering.value = initialDashboardPreset.filtering;
  page.value = 1;
}
const activeDashboardPresetLabel = computed(
  /** Derives active dashboard preset label from the current reactive dependencies. */ () => {
    if (activeDashboardPreset.value === 'open') return t(props.kind === 'issue' ? 'issues.open' : 'pullRequests.open');
    if (activeDashboardPreset.value === 'stale') return t('issues.stale');
    if (activeDashboardPreset.value === 'approval-required') return t('pullRequests.approvalRequired');
    return '';
  },
);
const summaryMetrics = computed(
  /** Derives summary metrics from the current reactive dependencies. */ () =>
    props.kind === 'issue'
      ? [
          ['issues.open', (summary.value as IssueSummary | null)?.open, 'i-tabler-circle-dot'],
          ['issues.recent', (summary.value as IssueSummary | null)?.recentlyUpdated, 'i-lucide-clock'],
          ['issues.assigned', (summary.value as IssueSummary | null)?.assigned, 'i-lucide-user-check'],
          ['issues.stale', (summary.value as IssueSummary | null)?.stale, 'i-lucide-hourglass'],
        ].map(
          /** Projects each entry using `({ icon: String(icon), label: t(String(label)), value: String(value ?? '—') })`. */ ([
            label,
            value,
            icon,
          ]) => ({ icon: String(icon), label: t(String(label)), value: String(value ?? '—') }),
        )
      : [
          ['pullRequests.open', (summary.value as PullRequestSummary | null)?.open, 'i-tabler-git-pull-request'],
          ['pullRequests.drafts', (summary.value as PullRequestSummary | null)?.drafts, 'i-lucide-file-pen'],
          [
            'pullRequests.failed',
            (summary.value as PullRequestSummary | null)?.failedWorkflows,
            'i-lucide-circle-alert',
          ],
          [
            'pullRequests.approvalRequired',
            (summary.value as PullRequestSummary | null)?.workflowApprovalRequired,
            'i-lucide-shield-alert',
          ],
        ].map(
          /** Projects each entry using `({ icon: String(icon), label: t(String(label)), value: String(value ?? '—') })`. */ ([
            label,
            value,
            icon,
          ]) => ({ icon: String(icon), label: t(String(label)), value: String(value ?? '—') }),
        ),
);

let supportingGeneration = 0;
onScopeDispose(
  /** Invalidate supporting responses when leaving this table identity. */ () => {
    supportingGeneration++;
  },
);
/** Loads supporting data. */
async function loadSupportingData(): Promise<void> {
  const generation = ++supportingGeneration;
  summaryLoading.value = true;
  summaryError.value = false;
  const [optionsResult, repositoriesResult, summaryResult] = await Promise.allSettled([
    props.kind === 'issue' ? api.issues.filterOptions() : api.pullRequests.filterOptions(),
    props.repositoryId
      ? Promise.resolve([])
      : loadWorkflowRunRepositoryFilterOptions(
          /** Evaluates `api.repositories.list(page).then((response) => response.data)` when loadWorkflowRunRepositoryFilterOptions invokes this callback. */ (
            page,
          ) =>
            api.repositories
              .list(page)
              .then(
                /** Evaluates `response.data` when api.repositories.list(page).then invokes this callback. */ (
                  response,
                ) => response.data,
              ),
        ),
    props.repositoryId
      ? Promise.resolve({ data: null })
      : props.kind === 'issue'
        ? api.issues.summary()
        : api.pullRequests.summary(),
  ]);
  if (generation !== supportingGeneration) return;
  if (optionsResult.status === 'fulfilled') filterOptions.value = optionsResult.value.data;
  if (repositoriesResult.status === 'fulfilled') repositories.value = repositoriesResult.value;
  if (summaryResult.status === 'fulfilled') summary.value = summaryResult.value.data;
  summaryError.value = [optionsResult, repositoriesResult, summaryResult].some(
    /** Checks whether any entry satisfies `result.status === 'rejected'`. */
    (result) => result.status === 'rejected',
  );
  summaryLoading.value = false;
}
/** Refreshes all. */
async function refreshAll(): Promise<void> {
  await Promise.all([refresh(), loadSupportingData()]);
}

/** Clears feature-owned filters while preserving search and structured filter ownership. */
function clearSpecializedFilters(): void {
  selectedLabels.value = [];
  updatedFrom.value = '';
  updatedTo.value = '';
}

/** Remove a dashboard preset and its table constraints. */
function clearDashboardPreset(): void {
  activeDashboardPreset.value = null;
  dashboardPresetStaticFilter.value = undefined;
  filtering.value = emptyDashboardFiltering();
  selectedLabels.value = [];
  search.value = '';
  updatedFrom.value = '';
  updatedTo.value = '';
  page.value = 1;
  removeDashboardPresetQuery();
}

/** Stop treating the current table state as a dashboard preset after a manual change. */
function releaseDashboardPreset(): void {
  if (!activeDashboardPreset.value) return;
  activeDashboardPreset.value = null;
  dashboardPresetStaticFilter.value = undefined;
  removeDashboardPresetQuery();
}

/** Remove only the preset parameter while preserving unrelated route query state. */
function removeDashboardPresetQuery(): void {
  const query = { ...route.query };
  delete query.preset;
  void router.replace({ query });
}

watch([filtering, search, selectedLabels, updatedFrom, updatedTo], releaseDashboardPreset, { deep: true });
onMounted(
  /** Initializes component subscriptions and data after mounting. */ () =>
    Promise.all([initialize(), loadSupportingData()]),
);
</script>
