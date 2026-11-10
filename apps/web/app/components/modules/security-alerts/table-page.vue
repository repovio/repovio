<template>
  <CommonTablePageFrame
    :embedded="embedded"
    :breadcrumbs="[
      { icon: 'i-lucide-layout-dashboard', label: $t('layout.dashboard'), to: '/' },
      { icon: 'i-lucide-shield-alert', label: $t('securityAlerts.title') },
      { icon: kindIcon, label: pageTitle },
    ]"
    :description="$t('securityAlerts.description')"
    :padded="false"
    :title="pageTitle"
  >
    <template #actions>
      <UInput
        v-model="search"
        class="w-full sm:w-56"
        icon="i-lucide-search"
        :aria-label="$t('securityAlerts.search')"
        :placeholder="$t('securityAlerts.search')"
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
        <CommonTableFiltering
          v-model:filtering="filtering"
          :fields="visibleFilterFields"
          :specialized-active="!!selectedPath || !!updatedFrom || !!updatedTo"
          @clear-specialized="clearSpecializedFilters"
        >
          <USelectMenu
            v-if="kind === 'CODE'"
            v-model="selectedPath"
            class="w-full min-w-0 sm:col-span-2"
            :aria-label="$t('securityAlerts.columns.path')"
            :items="filterOptions.paths"
            :placeholder="$t('securityAlerts.columns.path')"
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

    <div class="space-y-4 p-4 sm:p-6">
      <UAlert
        v-if="unavailableCount > 0"
        color="warning"
        icon="i-lucide-triangle-alert"
        variant="subtle"
        :description="$t('securityAlerts.unavailableDescription', { count: unavailableCount })"
        :title="$t('securityAlerts.unavailable')"
      />
      <UAlert
        v-if="unknownAvailability"
        color="neutral"
        variant="subtle"
        :title="$t('securityAlerts.unknownAvailability')"
      />
      <ModulesWorkItemsSummaryCards
        v-if="!repositoryId"
        :loading="supportingLoading"
        :metrics="summaryMetrics"
        :title="$t('securityAlerts.openSummary')"
      />
    </div>

    <UAlert
      v-if="tableError || supportingError"
      class="mx-4 mb-4 sm:mx-6"
      color="error"
      icon="i-lucide-circle-alert"
      variant="subtle"
      :title="$t('securityAlerts.loadError')"
    />
    <UTable
      v-if="!repositoryId || !tableError"
      sticky
      v-model:column-pinning="columnPinning"
      class="min-h-0 flex-1 overflow-x-auto"
      :columns="columns"
      :data="items"
      :empty="scopedEmpty"
      :loading="loading"
      :ui="{
        tr: 'data-[selected]:cursor-pointer',
        th: 'first:pl-6 whitespace-nowrap bg-neutral-100 dark:bg-neutral-950/20',
        td: 'first:pl-6 align-top',
      }"
      @select="selectRow"
    >
      <template #title-cell="{ row }">
        <NuxtLink class="font-medium hover:underline" :to="`/alerts/${row.original.id}`">
          {{ row.original.title }}
        </NuxtLink>
      </template>
      <template #repositoryName-cell="{ row }">
        {{ row.original.repositoryOwner }}/{{ row.original.repositoryName }}
      </template>
      <template #providerType-cell="{ row }">
        <EnumsProviderTypeBadge variant="subtle" :value="row.original.providerType" />
      </template>
      <template #severity-cell="{ row }">
        <UBadge variant="subtle" :color="severityColor(row.original.severity)">
          {{ $t(`securityAlerts.severities.${row.original.severity}`) }}
        </UBadge>
      </template>
      <template #state-cell="{ row }">
        <UBadge color="neutral" variant="subtle">
          {{ $t(`securityAlerts.states.${row.original.state}`) }}
        </UBadge>
      </template>
      <template #providerUpdatedAt-cell="{ row }">
        <span class="whitespace-nowrap text-sm text-muted">{{ formatDateTime(row.original.providerUpdatedAt) }}</span>
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
            :to="row.original.providerUrl"
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
import { useTableRowNavigation } from '~/composables/app/table-row-navigation';

import { defineProps, onScopeDispose } from 'vue';
import { useRepovioApi } from '~/composables/api/repovio-api';
import { useTable } from '~/composables/api/table';
import { useAutoRefresh } from '~/composables/app/auto-refresh';
import { useProviderType } from '~/composables/enums/provider-type';
import { useDateTime } from '~/composables/use-date-time';
import type {
  ProviderType,
  SecurityAlert,
  SecurityAlertFilterOptions,
  SecurityAlertKind,
  SecurityAlertSeverity,
  SecurityAlertSummary,
} from '~/types/api/resources';
import { providerTypes } from '~/types/api/resources';
import type { ColumnDefinition } from '~/types/table';

const props = defineProps<{ kind: SecurityAlertKind; repositoryId?: string; embedded?: boolean }>();
type AlertRow = SecurityAlert & Record<string, unknown>;
type AlertColumn = ColumnDefinition<AlertRow> & { header: string; id: string };
const selectRow = useTableRowNavigation<{ id: string }>(
  /** Open the existing Security Alert detail. */ (item) => `/alerts/${encodeURIComponent(item.id)}`,
);
const { t } = useI18n();
const api = useRepovioApi();
const route = useRoute();
const { formatDateTime } = useDateTime();
const { getLabel: getProviderTypeLabel } = useProviderType();
const search = ref('');
const selectedPath = ref<string>();
const updatedFrom = ref('');
const updatedTo = ref('');
const debouncedSearch = refDebounced(search, 250);
const summary = ref<SecurityAlertSummary | null>(null);
const filterOptions = ref<SecurityAlertFilterOptions>({
  availability: [],
  ecosystems: [],
  manifests: [],
  packages: [],
  paths: [],
  repositories: [],
  rules: [],
  scanners: [],
  secretProviders: [],
  secretTypes: [],
});
const supportingLoading = ref(true);
const supportingError = ref(false);
const pageTitle = computed(
  /** Derives page title from the current reactive dependencies. */ () => t(`securityAlerts.kindTitles.${props.kind}`),
);
const kindIcon = computed(
  /** Derives kind icon from the current reactive dependencies. */
  () =>
    ({ DEPENDENCY: 'i-lucide-package-search', CODE: 'i-lucide-file-search-2', SECRET: 'i-lucide-key-round' })[
      props.kind
    ],
);
const unavailableCount = computed(
  /** Derives unavailable count from the current reactive dependencies. */
  () =>
    filterOptions.value.availability.filter(
      /** Keeps unavailable entries for the current category and optional Repository scope. */
      ({ availability, kind, repositoryId }) =>
        (availability === 'UNAVAILABLE' || (!!props.repositoryId && availability === 'UNSUPPORTED')) &&
        kind === props.kind &&
        (!props.repositoryId || repositoryId === props.repositoryId),
    ).length,
);
const unknownAvailability = computed(
  /** Missing metadata must not be interpreted as successful zero findings. */ () =>
    !!props.repositoryId &&
    !supportingLoading.value &&
    !supportingError.value &&
    !filterOptions.value.availability.some(
      /** Match availability to this Repository/category pair. */ (item) =>
        item.repositoryId === props.repositoryId &&
        item.kind === props.kind &&
        ['AVAILABLE', 'UNAVAILABLE', 'UNSUPPORTED'].includes(item.availability),
    ),
);
const scopedEmpty = computed(
  /** Do not label unsupported or unknown security coverage as no findings. */ () =>
    t(
      props.repositoryId && supportingError.value
        ? 'securityAlerts.loadError'
        : props.repositoryId && unavailableCount.value > 0
          ? 'securityAlerts.unavailable'
          : unknownAvailability.value
            ? 'securityAlerts.unknownAvailability'
            : 'securityAlerts.empty',
    ),
);
const columnDefinition = computed<AlertColumn[]>(
  /** Derives column definition from the current reactive dependencies. */ () => [
    { accessorKey: 'title', header: t('securityAlerts.columns.title'), id: 'title' },
    { accessorKey: 'repositoryName', header: t('securityAlerts.columns.repository'), id: 'repositoryName' },
    { accessorKey: 'providerType', header: t('workItems.provider'), id: 'providerType' },
    { accessorKey: 'severity', header: t('securityAlerts.columns.severity'), id: 'severity' },
    { accessorKey: 'state', header: t('securityAlerts.columns.state'), id: 'state' },
    ...(props.kind === 'DEPENDENCY'
      ? [{ accessorKey: 'packageName', header: t('securityAlerts.columns.package'), id: 'packageName' }]
      : []),
    ...(props.kind === 'CODE'
      ? [{ accessorKey: 'scanner', header: t('securityAlerts.columns.scanner'), id: 'scanner' }]
      : []),
    ...(props.kind === 'SECRET'
      ? [{ accessorKey: 'secretType', header: t('securityAlerts.columns.secretType'), id: 'secretType' }]
      : []),
    { accessorKey: 'providerUpdatedAt', header: t('securityAlerts.columns.updated'), id: 'providerUpdatedAt' },
    { enableHiding: false, header: t('repositories.columns.actions'), id: 'actions' },
  ],
);
const sortableFields = computed<SortingField[]>(
  /** Derives sortable fields from the current reactive dependencies. */ () => [
    { label: t('securityAlerts.columns.title'), value: 'title' },
    { label: t('securityAlerts.columns.severity'), value: 'severity' },
    { label: t('securityAlerts.columns.updated'), value: 'providerUpdatedAt' },
  ],
);
const filterFields = computed<FilterField[]>(
  /** Derives filter fields from the current reactive dependencies. */ () => [
    {
      label: t('securityAlerts.columns.state'),
      type: FilterFieldType.Enum,
      value: 'state',
      values: ['OPEN', 'RESOLVED', 'DISMISSED'].map(
        /** Projects each entry using `({ label: t(`securityAlerts.states.${value}`), value })`. */ (value) => ({
          label: t(`securityAlerts.states.${value}`),
          value,
        }),
      ),
    },
    {
      label: t('securityAlerts.columns.severity'),
      type: FilterFieldType.Enum,
      value: 'severity',
      values: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO', 'UNKNOWN'].map(
        /** Projects each entry using `({ label: t(`securityAlerts.severities.${value}`), value, })`. */ (value) => ({
          label: t(`securityAlerts.severities.${value}`),
          value,
        }),
      ),
    },
    {
      label: t('securityAlerts.columns.repository'),
      type: FilterFieldType.Enum,
      value: 'repositoryId',
      values: filterOptions.value.repositories.map(
        /** Projects each entry using `({ label: `${owner}/${name}`, value: id })`. */ ({ id, name, owner }) => ({
          label: `${owner}/${name}`,
          value: id,
        }),
      ),
    },
    {
      label: t('workItems.provider'),
      type: FilterFieldType.Enum,
      value: 'repository.providerAccount.providerType',
      values: providerTypes.map(
        /** Projects each entry using `({ label: getProviderTypeLabel(value), value })`. */ (value: ProviderType) => ({
          label: getProviderTypeLabel(value),
          value,
        }),
      ),
    },
    ...(props.kind === 'DEPENDENCY'
      ? [
          {
            label: t('securityAlerts.columns.ecosystem'),
            type: FilterFieldType.Enum,
            value: 'ecosystem',
            values: filterOptions.value.ecosystems.map(
              /** Projects each entry using `({ label: value, value })`. */ (value) => ({ label: value, value }),
            ),
          },
          {
            label: t('securityAlerts.columns.package'),
            type: FilterFieldType.Enum,
            value: 'packageName',
            values: filterOptions.value.packages.map(
              /** Projects each entry using `({ label: value, value })`. */ (value) => ({ label: value, value }),
            ),
          },
          {
            label: t('securityAlerts.columns.manifest'),
            type: FilterFieldType.Enum,
            value: 'manifest',
            values: filterOptions.value.manifests.map(
              /** Projects each entry using `({ label: value, value })`. */ (value) => ({ label: value, value }),
            ),
          },
        ]
      : props.kind === 'CODE'
        ? [
            {
              label: t('securityAlerts.columns.scanner'),
              type: FilterFieldType.Enum,
              value: 'scanner',
              values: filterOptions.value.scanners.map(
                /** Projects each entry using `({ label: value, value })`. */ (value) => ({ label: value, value }),
              ),
            },
            {
              label: t('securityAlerts.columns.rule'),
              type: FilterFieldType.Enum,
              value: 'ruleId',
              values: filterOptions.value.rules.map(
                /** Projects each entry using `({ label: value, value })`. */ (value) => ({ label: value, value }),
              ),
            },
          ]
        : [
            {
              label: t('securityAlerts.columns.secretType'),
              type: FilterFieldType.Enum,
              value: 'secretType',
              values: filterOptions.value.secretTypes.map(
                /** Projects each entry using `({ label: value, value })`. */ (value) => ({ label: value, value }),
              ),
            },
            {
              label: t('securityAlerts.columns.secretProvider'),
              type: FilterFieldType.Enum,
              value: 'secretProvider',
              values: filterOptions.value.secretProviders.map(
                /** Projects each entry using `({ label: value, value })`. */ (value) => ({ label: value, value }),
              ),
            },
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
/** Clears only the alert-specific criteria; search and mandatory scope remain unchanged. */
function clearSpecializedFilters(): void {
  selectedPath.value = undefined;
  updatedFrom.value = '';
  updatedTo.value = '';
}

const staticFilter = computed(
  /** Derives static filter from the current reactive dependencies. */ () => ({
    AND: [
      { kind: props.kind },
      ...(!props.repositoryId && typeof route.query.repositoryId === 'string'
        ? [{ repositoryId: route.query.repositoryId }]
        : []),
      ...(selectedPath.value ? [{ location: { path: ['path'], equals: selectedPath.value } }] : []),
      ...(updatedFrom.value
        ? [{ providerUpdatedAt: { gte: new Date(`${updatedFrom.value}T00:00:00.000Z`).toISOString() } }]
        : []),
      ...(updatedTo.value
        ? [{ providerUpdatedAt: { lte: new Date(`${updatedTo.value}T23:59:59.999Z`).toISOString() } }]
        : []),
      ...(debouncedSearch.value.trim()
        ? [
            {
              OR: [
                { title: { contains: debouncedSearch.value.trim(), mode: 'insensitive' } },
                { packageName: { contains: debouncedSearch.value.trim(), mode: 'insensitive' } },
                { ruleId: { contains: debouncedSearch.value.trim(), mode: 'insensitive' } },
                { secretType: { contains: debouncedSearch.value.trim(), mode: 'insensitive' } },
              ],
            },
          ]
        : []),
    ],
  }),
);
const table = useTable({
  serializeReads: true,
  columnDefinition,
  defaultItemsPerPage: 25,
  endpoint: 'security-alerts',
  name: `security-alerts-${props.kind.toLocaleLowerCase()}`,
  repositoryId: props.repositoryId,
  scopeKind: props.kind,
  staticFields: ['id', 'repositoryOwner', 'providerUrl'],
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
const { refresh: refreshView, loading: refreshLoading } = useAutoRefresh(
  refreshAll,
  /** Include table and supporting read lifetimes. */ () => loading.value || supportingLoading.value,
);
const summaryMetrics = computed(
  /** Derives summary metrics from the current reactive dependencies. */ () => [
    { icon: kindIcon.value, label: t('securityAlerts.open'), value: String(summary.value?.open[props.kind] ?? '—') },
    {
      icon: 'i-lucide-octagon-alert',
      label: t('securityAlerts.severities.CRITICAL'),
      value: String(summary.value?.severity.CRITICAL ?? '—'),
    },
    {
      icon: 'i-lucide-triangle-alert',
      label: t('securityAlerts.severities.HIGH'),
      value: String(summary.value?.severity.HIGH ?? '—'),
    },
    {
      icon: 'i-lucide-circle-alert',
      label: t('securityAlerts.unavailable'),
      value: String(summary.value?.unavailableRepositories ?? '—'),
    },
  ],
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
  supportingLoading.value = true;
  const [summaryResult, optionsResult] = await Promise.allSettled([
    props.repositoryId ? Promise.resolve({ data: null }) : api.securityAlerts.summary(),
    api.securityAlerts.filterOptions(),
  ]);
  if (generation !== supportingGeneration) return;
  if (summaryResult.status === 'fulfilled') summary.value = summaryResult.value.data;
  if (optionsResult.status === 'fulfilled') filterOptions.value = optionsResult.value.data;
  supportingError.value = summaryResult.status === 'rejected' || optionsResult.status === 'rejected';
  supportingLoading.value = false;
}
/** Refreshes all. */
async function refreshAll(): Promise<void> {
  await Promise.allSettled([refresh(), loadSupportingData()]);
}
/** Maps alert severity to the corresponding UI color. */
function severityColor(severity: SecurityAlertSeverity): 'error' | 'warning' | 'info' | 'neutral' {
  if (severity === 'CRITICAL' || severity === 'HIGH') return 'error';
  if (severity === 'MEDIUM') return 'warning';
  if (severity === 'LOW' || severity === 'INFO') return 'info';
  return 'neutral';
}
onMounted(
  /** Initializes component subscriptions and data after mounting. */ () => {
    void initialize();
    void loadSupportingData();
  },
);
</script>
