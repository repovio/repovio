<template>
  <div class="min-w-0 space-y-2">
    <label v-if="labeled" class="block text-sm font-medium text-highlighted" :for="searchId">
      {{ $t(kind === 'users' ? 'userGroups.searchUsers' : 'userGroups.searchGroups') }}
    </label>
    <UInput
      v-model="search"
      :id="labeled ? searchId : undefined"
      class="w-full"
      icon="i-lucide-search"
      :aria-label="$t(kind === 'users' ? 'userGroups.searchUsers' : 'userGroups.searchGroups')"
      :placeholder="$t(kind === 'users' ? 'userGroups.searchUsers' : 'userGroups.searchGroups')"
      :disabled="disabled"
    />
    <UAlert v-if="error" color="error" :title="$t('userGroups.loadError')" />
    <label v-if="labeled" class="block text-sm font-medium text-highlighted" :for="selectionId">
      {{ $t(kind === 'users' ? 'userGroups.selectUser' : 'userGroups.selectGroup') }}
    </label>
    <USelect
      v-model="selected"
      :id="labeled ? selectionId : undefined"
      class="w-full"
      value-key="id"
      label-key="label"
      :items="items"
      :aria-label="$t(kind === 'users' ? 'userGroups.selectUser' : 'userGroups.selectGroup')"
      :placeholder="$t(kind === 'users' ? 'userGroups.selectUser' : 'userGroups.selectGroup')"
      :loading="loading"
      :disabled="disabled || loading"
    />
    <div class="flex items-center justify-between gap-2">
      <UButton
        color="neutral"
        variant="ghost"
        icon="i-lucide-chevron-left"
        :aria-label="$t('userGroups.previous')"
        :disabled="page === 1 || loading || disabled"
        @click="page--"
      />
      <span class="text-xs text-muted">{{ $t('userGroups.page', { page }) }}</span>
      <UButton
        color="neutral"
        variant="ghost"
        icon="i-lucide-chevron-right"
        :aria-label="$t('userGroups.next')"
        :disabled="page >= pageCount || loading || disabled"
        @click="page++"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, useId, watch } from 'vue';
import { useRepovioApi } from '~/composables/api/repovio-api';
import { getUserIdentityLabel } from '~/utils/user-identity';
const props = defineProps<{
  kind: 'users' | 'groups';
  disabled?: boolean;
  /** Render associated visible field labels in full-width configuration forms. */
  labeled?: boolean;
}>();
const searchId = useId();
const selectionId = useId();
const selected = defineModel<string>();
const api = useRepovioApi();
const search = ref('');
const page = ref(1);
const pageCount = ref(1);
const items = ref<Array<{ id: string; label: string }>>([]);
const loading = ref(false);
const error = ref(false);
let generation = 0;
watch(
  search,
  /** Restarts a changed search at its first page. */ () => {
    page.value = 1;
  },
);
watch([search, page], load, { immediate: true });

/** Loads a page of candidates and discards stale search responses. */
async function load(): Promise<void> {
  const current = ++generation;
  loading.value = true;
  error.value = false;
  selected.value = undefined;
  try {
    const response =
      props.kind === 'users'
        ? await api.users.search(search.value, page.value)
        : await api.userGroups.search(search.value, page.value);
    if (current !== generation) return;
    items.value = response.data.items.map(
      /** Labels the safe account or group candidate. */ (item) => ({
        id: item.id,
        label: 'username' in item ? getUserIdentityLabel(item) : item.name,
      }),
    );
    pageCount.value = response.data.meta.pageCount;
  } catch {
    if (current === generation) {
      error.value = true;
      items.value = [];
    }
  } finally {
    if (current === generation) loading.value = false;
  }
}
</script>
