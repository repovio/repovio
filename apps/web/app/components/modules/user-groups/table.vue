<template>
  <QTableToolbar
    v-model:sorting="sorting"
    v-model:search="search"
    class="border-b border-default p-4"
    :sortable-fields="sortableFields"
    shortcuts
  >
    <template #new>
      <UButton icon="i-lucide-plus" :label="$t('userGroups.create')" @click="edit(null)" />
    </template>
  </QTableToolbar>
  <UAlert
    v-if="error || actionError"
    class="m-4"
    color="error"
    :title="$t(actionError ? 'userGroups.saveError' : 'userGroups.loadError')"
  />
  <UTable class="min-h-0 flex-1" :columns="columns" :data="items" :loading="loading" :empty="$t('userGroups.empty')">
    <template #createdAt-cell="{ row }">
      {{ formatDateTime(row.original.createdAt) }}
    </template>
    <template #actions-cell="{ row }">
      <div class="flex justify-end gap-1">
        <UButton
          color="neutral"
          icon="i-lucide-users"
          variant="ghost"
          :aria-label="$t('userGroups.members')"
          :disabled="!!pending"
          @click="showMembers(row.original)"
        />
        <UButton
          color="neutral"
          icon="i-lucide-pencil"
          variant="ghost"
          :aria-label="$t('userGroups.rename')"
          :disabled="!!pending"
          @click="edit(row.original)"
        />
        <UButton
          color="error"
          icon="i-lucide-trash-2"
          variant="ghost"
          :aria-label="$t('users.delete')"
          :disabled="!!pending"
          :loading="pending === row.original.id"
          @click="remove(row.original)"
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
  <ModulesUserGroupsEditDialog v-model:open="editOpen" :group="selectedGroup" :refresh="table.refresh" />
  <ModulesUserGroupsMembersDialog v-model:open="membersOpen" :group="selectedGroup" />
</template>

<script setup lang="ts">
import { type SortingField } from '@querry-kit/nuxt-ui/types';
import { computed, onMounted, ref } from 'vue';
import { useRepovioApi } from '~/composables/api/repovio-api';
import { useTable } from '~/composables/api/table';
import { useDateTime } from '~/composables/use-date-time';
import type { UserGroup } from '~/types/api/resources';
import type { ColumnDefinition } from '~/types/table';
const { t } = useI18n();
const { formatDateTime } = useDateTime();
const api = useRepovioApi();
const columnDefinition = computed<ColumnDefinition<UserGroup & Record<string, unknown>>[]>(
  /** Localizes the group table columns. */ () => [
    { accessorKey: 'name', id: 'name', header: t('userGroups.name') },
    { accessorKey: 'createdAt', id: 'createdAt', header: t('users.columns.createdAt') },
    { id: 'actions', header: t('users.columns.actions'), enableHiding: false },
  ],
);
const sortableFields = computed<SortingField[]>(
  /** Provides sortable public group fields. */ () => [
    { value: 'name', label: t('userGroups.name') },
    { value: 'createdAt', label: t('users.columns.createdAt') },
  ],
);
const search = ref('');
const staticFilter = computed<Record<string, unknown> | undefined>(
  /** Restricts the server query to matching group names. */ () =>
    search.value ? { name: { contains: search.value, mode: 'insensitive' } } : undefined,
);
const table = useTable({
  staticFilter,
  endpoint: 'user-groups',
  name: 'user-groups',
  columnDefinition,
  staticFields: ['id', 'name', 'createdAt', 'updatedAt'],
});
const { columns, items, loading, error, sorting, page, itemsPerPage, totalItems } = table;
const selectedGroup = ref<UserGroup | null>(null);
const editOpen = ref(false);
const membersOpen = ref(false);
const pending = ref('');
const actionError = ref(false);
onMounted(/** Initializes persisted Query Kit state and the first group page. */ () => void table.initialize());

/** Opens a new-group or rename dialog. */
function edit(group: UserGroup | null): void {
  selectedGroup.value = group;
  editOpen.value = true;
}
/** Opens paginated membership management for one group. */
function showMembers(group: UserGroup): void {
  selectedGroup.value = group;
  membersOpen.value = true;
}
/** Deletes one confirmed group and awaits the dependent table refresh. */
async function remove(group: UserGroup): Promise<void> {
  if (pending.value || !window.confirm(t('userGroups.deleteConfirm', { name: group.name }))) return;
  pending.value = group.id;
  actionError.value = false;
  try {
    await api.userGroups.delete(group.id);
    await table.refresh();
  } catch {
    actionError.value = true;
  } finally {
    pending.value = '';
  }
}
</script>
