<template>
  <LayoutPage
    :breadcrumbs="[
      { icon: 'i-lucide-layout-dashboard', label: $t('layout.dashboard'), to: '/' },
      { icon: 'i-lucide-users', label: $t('layout.users') },
    ]"
    :description="$t('users.description')"
    :padded="false"
    :title="$t('users.title')"
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
    </template>

    <UAlert
      v-if="tableError"
      class="m-4"
      color="error"
      icon="i-lucide-circle-alert"
      variant="subtle"
      :title="$t('users.loadError')"
    />
    <UTable
      sticky
      v-model:column-pinning="columnPinning"
      class="min-h-0 flex-1"
      :columns="columns"
      :data="items"
      :empty="$t('users.empty')"
      :loading="loading"
      :ui="{
        th: 'first:pl-8 bg-neutral-100 dark:bg-neutral-950/20',
        td: 'first:pl-8',
      }"
    >
      <template #username-cell="{ row }">
        <div class="flex items-center gap-2">
          <CommonUserAvatar
            size="xs"
            :avatar-updated-at="row.original.avatarUpdatedAt"
            :first-name="row.original.firstName"
            :last-name="row.original.lastName"
            :user-id="row.original.id"
            :username="row.original.username"
          />
          <div class="min-w-0">
            <p class="truncate font-medium">{{ getUserDisplayName(row.original) }}</p>
            <p v-if="getUserDisplayName(row.original) !== row.original.username" class="truncate text-xs text-muted">
              @{{ row.original.username }}
            </p>
          </div>
        </div>
      </template>
      <template #role-cell="{ row }">
        <UBadge color="neutral" variant="subtle">{{ $t(`roles.${row.original.role}`) }}</UBadge>
      </template>
      <template #authProvider-cell="{ row }">
        <UBadge variant="subtle" :color="row.original.authProvider === 'OIDC' ? 'info' : 'neutral'">
          {{ $t(`users.authProviders.${row.original.authProvider}`) }}
        </UBadge>
      </template>
      <template #createdAt-cell="{ row }">
        <span class="whitespace-nowrap text-sm text-muted">{{ formatTimestamp(row.original.createdAt) }}</span>
      </template>
      <template #updatedAt-cell="{ row }">
        <span class="whitespace-nowrap text-sm text-muted">{{ formatTimestamp(row.original.updatedAt) }}</span>
      </template>
      <template #actions-header="{ column }">
        <span class="flex justify-end">{{ column.columnDef.header }}</span>
      </template>
      <template #actions-cell="{ row }">
        <div class="flex justify-end">
          <UTooltip :text="$t('mcp.manageUserTokens')">
            <UButton
              color="neutral"
              icon="i-lucide-key-round"
              variant="ghost"
              :aria-label="$t('mcp.manageUserTokens')"
              @click="manageTokens(row.original)"
            />
          </UTooltip>
          <UTooltip :text="$t('users.delete')">
            <span class="inline-flex">
              <UButton
                color="error"
                icon="i-lucide-trash-2"
                variant="ghost"
                :aria-label="$t('users.delete')"
                :disabled="row.original.id === auth.user?.id || isPending(row.original.id)"
                :loading="isPending(row.original.id)"
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
  </LayoutPage>

  <ModulesMcpUserTokenDialog v-model:open="tokenDialogOpen" :user="selectedUser" />
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import { FilterFieldType, type FilterField, type SortingField } from '@querry-kit/nuxt-ui/types';
import { useRepovioApi } from '~/composables/api/repovio-api';
import { useTable } from '~/composables/api/table';
import { useDateTime } from '~/composables/use-date-time';
import { usePendingActions } from '~/composables/use-pending-actions';
import { useAuthStore } from '~/store/auth';
import type { User } from '~/types/api/resources';
import type { ColumnDefinition } from '~/types/table';
import { getUserDisplayName } from '~/utils/user-identity';

type UserRole = User['role'];
type UserRow = User & Record<string, unknown>;
type UserTableColumn = ColumnDefinition<UserRow> & { header: string; id: string };

definePageMeta({ fullWidth: true });

const { t } = useI18n();
const { formatDateTime } = useDateTime();
const api = useRepovioApi();
const auth = useAuthStore();
const selectedUser = ref<User | null>(null);
const tokenDialogOpen = ref(false);
const { isPending, run: runPendingAction } = usePendingActions();
const userRoleOptions = computed<Array<{ label: string; value: UserRole }>>(
  /** Derives user role options from the current reactive dependencies. */ () =>
    (['SYSTEM_ADMIN', 'MANAGER', 'VIEWER'] as UserRole[]).map(
      /** Projects each entry using `({ label: t(`roles.${role}`), value: role })`. */ (role) => ({
        label: t(`roles.${role}`),
        value: role,
      }),
    ),
);
const columnDefinition = computed<UserTableColumn[]>(
  /** Derives column definition from the current reactive dependencies. */ () => [
    { accessorKey: 'username', header: t('users.columns.username'), id: 'username' },
    { accessorKey: 'role', header: t('users.columns.role'), id: 'role' },
    { accessorKey: 'authProvider', header: t('users.columns.authProvider'), id: 'authProvider' },
    { accessorKey: 'createdAt', header: t('users.columns.createdAt'), id: 'createdAt' },
    { accessorKey: 'updatedAt', header: t('users.columns.updatedAt'), id: 'updatedAt' },
    { enableHiding: false, header: t('users.columns.actions'), id: 'actions' },
  ],
);
const sortableFields = computed<SortingField[]>(
  /** Derives sortable fields from the current reactive dependencies. */ () => [
    { label: t('users.columns.username'), value: 'username' },
    { label: t('users.columns.role'), value: 'role' },
    { label: t('users.columns.authProvider'), value: 'authProvider' },
    { label: t('users.columns.createdAt'), value: 'createdAt' },
    { label: t('users.columns.updatedAt'), value: 'updatedAt' },
  ],
);
const filterFields = computed<FilterField[]>(
  /** Derives filter fields from the current reactive dependencies. */ () => [
    {
      label: t('users.columns.role'),
      type: FilterFieldType.Enum,
      value: 'role',
      values: userRoleOptions.value,
    },
  ],
);
const userTable = useTable({
  columnDefinition,
  defaultItemsPerPage: 10,
  endpoint: 'users',
  name: 'users',
  staticFields: ['authProvider', 'avatarUpdatedAt', 'firstName', 'id', 'lastName'],
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
} = userTable;
const columnPinning = computed({
  /** Reads the column pinning binding. */
  get: () => ({ left: userTable.columnPinning.value.left, right: userTable.columnPinning.value.right }),
  /** Writes the column pinning binding. */
  set: (value: { left?: string[]; right?: string[] }) => {
    userTable.columnPinning.value = value;
  },
});

useHead({ title: computed(/** Derives title from the current reactive dependencies. */ () => t('users.title')) });

/** Opens token management for the selected user. */
function manageTokens(user: User): void {
  selectedUser.value = user;
  tokenDialogOpen.value = true;
}

/** Format an account timestamp in the active interface locale. */
function formatTimestamp(timestamp: string): string {
  return formatDateTime(timestamp);
}

/** Delete a system user and refresh the current Query Kit page. */
async function remove(id: string): Promise<void> {
  await runPendingAction(
    id,
    /** Performs remove while retaining the initiating action’s pending state. */ async () => {
      await api.users.delete(id);
      await userTable.refresh();
    },
  );
}

onMounted(/** Initializes component subscriptions and data after mounting. */ () => void userTable.initialize());
</script>
