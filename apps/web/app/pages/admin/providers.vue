<template>
  <LayoutPage
    :breadcrumbs="[
      { icon: 'i-lucide-layout-dashboard', label: $t('layout.dashboard'), to: '/' },
      { icon: 'i-lucide-plug-zap', label: $t('layout.providers') },
    ]"
    :description="$t('providers.description')"
    :padded="false"
    :title="$t('providers.title')"
  >
    <template #actions>
      <QTableSorting v-model:sorting="sorting" :fields="sortableFields" shortcuts>
        <template #trigger="{ active, open, toggle }">
          <CommonTablePopoverTrigger kind="sorting" :active="active" :open="open" :toggle="toggle" />
        </template>
      </QTableSorting>
      <QTableFiltering v-model:filtering="filtering" :fields="filterFields" shortcuts>
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
      <UButton
        color="neutral"
        icon="i-simple-icons-github"
        variant="outline"
        :aria-label="$t('githubApp.title')"
        @click="githubAppOpen = true"
      >
        <span class="hidden sm:inline">{{ $t('githubApp.title') }}</span>
      </UButton>
      <UButton icon="i-lucide-plus" :aria-label="$t('providers.add')" @click="openAddDialog">
        <span class="hidden sm:inline">{{ $t('providers.add') }}</span>
      </UButton>
    </template>

    <UAlert
      v-if="oauthStatus === 'connected'"
      class="mx-4 mt-4"
      color="success"
      :title="$t('providers.oauthConnected')"
    />
    <UAlert
      v-else-if="oauthStatus === 'failed'"
      class="mx-4 mt-4"
      color="error"
      icon="i-lucide-circle-alert"
      variant="subtle"
      :title="$t('providers.oauthError')"
    />

    <UAlert
      v-if="tableError"
      class="m-4"
      color="error"
      icon="i-lucide-circle-alert"
      variant="subtle"
      :title="$t('providers.loadError')"
    />
    <UTable
      sticky
      v-model:column-pinning="columnPinning"
      class="min-h-0 flex-1"
      :columns="columns"
      :data="items"
      :empty="$t('providers.empty')"
      :loading="loading"
      :ui="{
        th: 'first:pl-8 bg-neutral-100 dark:bg-neutral-950/20',
        td: 'first:pl-8',
      }"
    >
      <template #providerType-cell="{ row }">
        <EnumsProviderTypeBadge variant="subtle" :value="row.original.providerType" />
      </template>
      <template #authenticationMethod-cell="{ row }">
        <div class="flex flex-col items-start gap-1">
          <UBadge variant="subtle">
            {{ row.original.authenticationMethod === 'GITHUB_APP' ? $t('githubApp.title') : $t('githubApp.token') }}
          </UBadge>
          <UBadge
            v-if="row.original.githubInstallationState && row.original.githubInstallationState !== 'ACTIVE'"
            color="warning"
            variant="subtle"
          >
            {{ $t(`githubApp.states.${row.original.githubInstallationState}`) }}
          </UBadge>
        </div>
      </template>
      <template #baseUrl-cell="{ row }">
        <span class="break-all text-sm text-muted">{{ row.original.baseUrl ?? $t('providers.defaultUrl') }}</span>
      </template>
      <template #enabled-cell="{ row }">
        <UBadge variant="subtle" :color="row.original.enabled ? 'success' : 'neutral'">
          {{ row.original.enabled ? $t('providers.enabled') : $t('providers.disabled') }}
        </UBadge>
      </template>
      <template #lastSyncAt-cell="{ row }">
        <span class="whitespace-nowrap text-sm text-muted">{{ formatLastSync(row.original.lastSyncAt) }}</span>
      </template>
      <template #actions-header="{ column }">
        <span class="flex justify-end">{{ column.columnDef.header }}</span>
      </template>
      <template #actions-cell="{ row }">
        <div class="flex justify-end gap-1">
          <UTooltip :text="row.original.enabled ? $t('providers.disable') : $t('providers.enable')">
            <span class="inline-flex">
              <UButton
                color="neutral"
                variant="ghost"
                :aria-label="row.original.enabled ? $t('providers.disable') : $t('providers.enable')"
                :disabled="isProviderPending(row.original.id)"
                :icon="row.original.enabled ? 'i-lucide-pause' : 'i-lucide-play'"
                :loading="isPending(providerActionKey('toggle', row.original.id))"
                @click="toggle(row.original)"
              />
            </span>
          </UTooltip>
          <UTooltip :text="$t('providers.delete')">
            <span class="inline-flex">
              <UButton
                color="error"
                icon="i-lucide-trash-2"
                variant="ghost"
                :aria-label="$t('providers.delete')"
                :disabled="isProviderPending(row.original.id)"
                :loading="isPending(providerActionKey('delete', row.original.id))"
                @click="remove(row.original.id)"
              />
            </span>
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
    <ModulesProvidersGithubAppDialog v-model:open="githubAppOpen" :refresh-accounts="handleProviderCreated" />
    <ModulesProvidersAddDialog v-model:open="dialogOpen" @created="handleProviderCreated" />
  </LayoutPage>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useDestructiveAction } from '~/composables/app/destructive-action';

import { FilterFieldType, type FilterField, type SortingField } from '@querry-kit/nuxt-ui/types';
import { useRepovioApi } from '~/composables/api/repovio-api';
import { useTable } from '~/composables/api/table';
import { useProviderType } from '~/composables/enums/provider-type';
import { useDateTime } from '~/composables/use-date-time';
import { usePendingActions } from '~/composables/use-pending-actions';
import { providerTypes, type ProviderAccount } from '~/types/api/resources';
import type { ColumnDefinition } from '~/types/table';

type ProviderAccountRow = ProviderAccount & Record<string, unknown>;
type ProviderTableColumn = ColumnDefinition<ProviderAccountRow> & { header: string; id: string };

definePageMeta({ fullWidth: true });

const { confirmDestructiveAction } = useDestructiveAction();
const { t } = useI18n();
const { formatDateTime } = useDateTime();
const api = useRepovioApi();
const route = useRoute();
const dialogOpen = ref(false);
const githubAppOpen = ref(false);
const { isPending, run: runPendingAction } = usePendingActions();
const oauthStatus = computed(
  /** Derives oauth status from the current reactive dependencies. */ () => route.query.oauth,
);
const { getLabel: getProviderTypeLabel } = useProviderType();
const providerTypeOptions = computed(
  /** Derives provider type options from the current reactive dependencies. */ () =>
    providerTypes.map(
      /** Projects each entry using `({ label: getProviderTypeLabel(providerType), value: providerType })`. */ (
        providerType,
      ) => ({ label: getProviderTypeLabel(providerType), value: providerType }),
    ),
);
const columnDefinition = computed<ProviderTableColumn[]>(
  /** Derives column definition from the current reactive dependencies. */ () => [
    { accessorKey: 'displayName', header: t('providers.columns.name'), id: 'displayName' },
    { accessorKey: 'providerType', header: t('providers.columns.type'), id: 'providerType' },
    { accessorKey: 'authenticationMethod', header: t('providers.authentication'), id: 'authenticationMethod' },
    { accessorKey: 'baseUrl', header: t('providers.columns.baseUrl'), id: 'baseUrl' },
    { accessorKey: 'enabled', header: t('providers.columns.status'), id: 'enabled' },
    { accessorKey: 'lastSyncAt', header: t('providers.columns.lastSync'), id: 'lastSyncAt' },
    { enableHiding: false, header: t('providers.columns.actions'), id: 'actions' },
  ],
);
const sortableFields = computed<SortingField[]>(
  /** Derives sortable fields from the current reactive dependencies. */ () => [
    { label: t('providers.columns.name'), value: 'displayName' },
    { label: t('providers.columns.type'), value: 'providerType' },
    { label: t('providers.columns.status'), value: 'enabled' },
    { label: t('providers.columns.lastSync'), value: 'lastSyncAt' },
  ],
);
const filterFields = computed<FilterField[]>(
  /** Derives filter fields from the current reactive dependencies. */ () => [
    {
      label: t('providers.columns.type'),
      type: FilterFieldType.Enum,
      value: 'providerType',
      values: providerTypeOptions.value.map(
        /** Projects each entry using `({ label, value })`. */ ({ label, value }) => ({ label, value }),
      ),
    },
    { label: t('providers.columns.status'), type: FilterFieldType.Boolean, value: 'enabled' },
  ],
);
const providerTable = useTable({
  columnDefinition,
  defaultItemsPerPage: 10,
  endpoint: 'provider-accounts',
  name: 'provider-accounts',
  staticFields: ['id', 'enabled', 'githubInstallationState'],
});
const {
  columnOrder,
  columnVisibility,
  columns,
  error: tableError,
  filtering,
  items,
  itemsPerPage,
  loading,
  page,
  sorting,
  totalItems,
} = providerTable;
const columnPinning = computed({
  /** Reads the column pinning binding. */
  get: () => ({ left: providerTable.columnPinning.value.left, right: providerTable.columnPinning.value.right }),
  /** Writes the column pinning binding. */
  set: (value: { left?: string[]; right?: string[] }) => {
    providerTable.columnPinning.value = value;
  },
});

useHead({ title: computed(/** Derives title from the current reactive dependencies. */ () => t('providers.title')) });

/** Format a provider's last successful synchronization in the active interface locale. */
function formatLastSync(lastSyncAt: string | null): string {
  if (!lastSyncAt) return t('providers.neverSynced');
  return formatDateTime(lastSyncAt);
}

/** Opens add dialog. */
function openAddDialog(): void {
  dialogOpen.value = true;
}

/** Build a unique pending-state key for one provider action. */
function providerActionKey(action: 'delete' | 'toggle', providerId: string): string {
  return `${action}:${providerId}`;
}

/** Return whether any mutation is active for a provider row. */
function isProviderPending(providerId: string): boolean {
  return isPending(providerActionKey('delete', providerId)) || isPending(providerActionKey('toggle', providerId));
}

defineShortcuts({
  /** Opens the create dialog when its keyboard shortcut is allowed. */
  shift_n: () => openAddDialog(),
});

/** Refresh the list from its first page after the dialog creates an account. */
async function handleProviderCreated(): Promise<void> {
  page.value = 1;
  await providerTable.refresh();
}

/** Remove a provider account and refresh the current Query Kit page. */
async function remove(id: string): Promise<void> {
  await confirmDestructiveAction(
    items.value.find(/** Find the affected provider. */ (provider) => provider.id === id)?.displayName ?? id,
    /** Perform the confirmed action and await its dependent UI updates. */ async () => {
      await runPendingAction(
        providerActionKey('delete', id),
        /** Performs remove while retaining the initiating action’s pending state. */ async () => {
          await api.providerAccounts.delete(id);
          await providerTable.refresh();
        },
      );
    },
  );
}

/** Enable or disable a provider account without changing its stored credentials. */
async function toggle(provider: ProviderAccount): Promise<void> {
  await runPendingAction(
    providerActionKey('toggle', provider.id),
    /** Performs toggle while retaining the initiating action’s pending state. */ async () => {
      await api.providerAccounts.update(provider.id, { enabled: !provider.enabled });
      await providerTable.refresh();
    },
  );
}

onMounted(/** Initializes component subscriptions and data after mounting. */ () => void providerTable.initialize());
</script>
