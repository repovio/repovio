<template>
  <UCard :ui="{ body: 'space-y-4' }">
    <template #header>
      <h2 class="font-semibold">
        {{ $t('userGroups.repositoryTitle') }}
      </h2>
      <p class="text-sm text-muted">
        {{ $t('userGroups.repositoryDescription') }}
      </p>
    </template>
    <UAlert v-if="error" color="error" :title="$t('userGroups.saveError')" />
    <ModulesUserGroupsResourcePicker v-model="selected" kind="groups" :disabled="!!pending" />
    <div class="flex flex-wrap gap-2">
      <USelect v-model="role" :items="roles" :aria-label="$t('users.columns.role')" :disabled="!!pending" />
      <UButton
        icon="i-lucide-plus"
        :label="$t('userGroups.assign')"
        :disabled="!selected || !!pending"
        :loading="pending === 'add'"
        @click="add"
      />
    </div>
    <p v-if="loading" class="text-sm text-muted">
      {{ $t('userGroups.loading') }}
    </p>
    <p v-else-if="!grants.length" class="text-sm text-muted">
      {{ $t('userGroups.noGrants') }}
    </p>
    <ul v-else class="divide-y divide-default">
      <li v-for="grant in grants" :key="grant.id" class="flex flex-wrap items-center justify-between gap-2 py-2">
        <span class="min-w-0 truncate">{{ grant.group.name }}</span>
        <div class="flex items-center gap-2">
          <USelect
            :model-value="grant.role"
            :loading="pending === grant.groupId"
            :items="roles"
            :aria-label="$t('userGroups.groupRole', { name: grant.group.name })"
            :disabled="!!pending"
            @update:model-value="update(grant.groupId, $event)"
          />
          <UIcon v-if="pending === grant.groupId" class="animate-spin" name="i-lucide-loader-circle" />
          <UButton
            color="error"
            icon="i-lucide-trash-2"
            variant="ghost"
            :aria-label="$t('userGroups.removeGrant', { name: grant.group.name })"
            :disabled="!!pending"
            :loading="pending === `remove:${grant.groupId}`"
            @click="remove(grant.groupId)"
          />
        </div>
      </li>
    </ul>
  </UCard>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRepovioApi } from '~/composables/api/repovio-api';
import { useDestructiveAction } from '~/composables/app/destructive-action';
import type { RepositoryGroup } from '~/types/api/resources';
const { confirmDestructiveAction } = useDestructiveAction();
const props = defineProps<{ repositoryId: string }>();
const api = useRepovioApi();
const { t } = useI18n();
const selected = ref<string>();
const role = ref<RepositoryGroup['role']>('VIEWER');
const grants = ref<RepositoryGroup[]>([]);
const loading = ref(false);
const pending = ref('');
const error = ref(false);
let generation = 0;
const roles = computed(
  /** Localizes the two existing repository roles. */ () =>
    (['VIEWER', 'MANAGER'] as const).map(
      /** Labels a repository role. */ (value) => ({ value, label: t(`roles.${value}`) }),
    ),
);
watch(
  /** Observes repository changes without retaining grants from another detail route. */ () => props.repositoryId,
  load,
  { immediate: true },
);

/** Loads repository group assignments and ignores stale detail responses. */
async function load(): Promise<void> {
  const current = ++generation;
  loading.value = true;
  error.value = false;
  try {
    const response = await api.userGroups.repositoryGrants(props.repositoryId);
    if (current === generation) grants.value = response.data;
  } catch {
    if (current === generation) {
      error.value = true;
      grants.value = [];
    }
  } finally {
    if (current === generation) loading.value = false;
  }
}
/** Adds the selected group's repository grant. */
async function add(): Promise<void> {
  if (selected.value) await update(selected.value, role.value, 'add');
}
/** Persists one inherited role and awaits the grant list refresh. */
async function update(groupId: string, nextRole: RepositoryGroup['role'], key = groupId): Promise<void> {
  if (pending.value) return;
  pending.value = key;
  error.value = false;
  try {
    await api.userGroups.setRepositoryGrant(props.repositoryId, groupId, nextRole);
    selected.value = undefined;
    await load();
  } catch {
    error.value = true;
  } finally {
    pending.value = '';
  }
}
/** Removes only the selected group's repository grant. */
async function remove(groupId: string): Promise<void> {
  await confirmDestructiveAction(
    grants.value.find(/** Find the affected grant. */ (grant) => grant.groupId === groupId)?.group.name ?? groupId,
    /** Perform the confirmed action and await its dependent UI updates. */ async () => {
      if (pending.value) return;
      pending.value = `remove:${groupId}`;
      error.value = false;
      try {
        await api.userGroups.removeRepositoryGrant(props.repositoryId, groupId);
        await load();
      } catch (cause) {
        error.value = true;
        throw cause;
      } finally {
        pending.value = '';
      }
    },
  );
}
</script>
