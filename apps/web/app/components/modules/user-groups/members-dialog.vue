<template>
  <UModal
    v-model:open="open"
    :title="$t('userGroups.membersTitle', { name: group?.name })"
    :dismissible="!pending"
    :close="!pending"
  >
    <template #body>
      <div class="space-y-4">
        <UAlert v-if="error" color="error" :title="$t('userGroups.saveError')" />
        <ModulesUserGroupsResourcePicker v-if="open" v-model="selected" kind="users" :disabled="!!pending" />
        <UButton
          icon="i-lucide-user-plus"
          :label="$t('userGroups.addMember')"
          :disabled="!selected || !!pending"
          :loading="pending === 'add'"
          @click="add"
        />
        <p v-if="loading" class="text-sm text-muted">
          {{ $t('userGroups.loading') }}
        </p>
        <p v-else-if="!members.length" class="text-sm text-muted">
          {{ $t('userGroups.noMembers') }}
        </p>
        <ul v-else class="divide-y divide-default">
          <li v-for="member in members" :key="member.id" class="flex items-center justify-between gap-3 py-2">
            <span class="truncate">{{ member.username }}</span>
            <UButton
              color="error"
              icon="i-lucide-user-minus"
              variant="ghost"
              :aria-label="$t('userGroups.removeMember', { username: member.username })"
              :disabled="!!pending"
              :loading="pending === member.id"
              @click="remove(member.id)"
            />
          </li>
        </ul>
        <div class="flex items-center justify-between">
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-chevron-left"
            :aria-label="$t('userGroups.previous')"
            :disabled="page === 1 || loading || !!pending"
            @click="page--"
          />
          <span class="text-xs text-muted">{{ $t('userGroups.page', { page }) }}</span>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-chevron-right"
            :aria-label="$t('userGroups.next')"
            :disabled="page >= pageCount || loading || !!pending"
            @click="page++"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRepovioApi } from '~/composables/api/repovio-api';
import { useDestructiveAction } from '~/composables/app/destructive-action';
import type { User, UserGroup } from '~/types/api/resources';
const { confirmDestructiveAction } = useDestructiveAction();
const open = defineModel<boolean>('open', { required: true });
const props = defineProps<{ group: UserGroup | null }>();
const api = useRepovioApi();
const selected = ref<string>();
const members = ref<User[]>([]);
const page = ref(1);
const pageCount = ref(1);
const loading = ref(false);
const pending = ref('');
const error = ref(false);
let generation = 0;
watch(
  open,
  /** Resets paging and loads only the current dialog's group. */ (value) => {
    generation++;
    members.value = [];
    selected.value = undefined;
    page.value = 1;
    error.value = false;
    if (value) void load();
  },
);
watch(
  page,
  /** Refreshes the current member page. */ () => {
    if (open.value) void load();
  },
);

/** Loads current memberships while discarding responses from previously selected groups. */
async function load(): Promise<void> {
  if (!props.group) return;
  const current = ++generation;
  loading.value = true;
  try {
    const { data } = await api.userGroups.members(props.group.id, page.value);
    if (current !== generation) return;
    members.value = data.items;
    pageCount.value = data.meta.pageCount;
    if (!data.items.length && page.value > 1) page.value--;
  } catch {
    if (current === generation) error.value = true;
  } finally {
    if (current === generation) loading.value = false;
  }
}

/** Adds the selected candidate and retains pending state through the membership refresh. */
async function add(): Promise<void> {
  if (!props.group || !selected.value || pending.value) return;
  pending.value = 'add';
  error.value = false;
  try {
    await api.userGroups.addMember(props.group.id, selected.value);
    selected.value = undefined;
    await load();
  } catch {
    error.value = true;
  } finally {
    pending.value = '';
  }
}

/** Removes a member while preserving their direct and other-group assignments. */
async function remove(id: string): Promise<void> {
  await confirmDestructiveAction(
    members.value.find(/** Find the affected member. */ (member) => member.id === id)?.username ?? id,
    /** Perform the confirmed action and await its dependent UI updates. */ async () => {
      if (!props.group || pending.value) return;
      pending.value = id;
      error.value = false;
      try {
        await api.userGroups.removeMember(props.group.id, id);
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
