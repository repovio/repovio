<template>
  <div class="space-y-2">
    <UAlert v-if="error" color="error" :title="$t('userGroups.loadError')" />
    <USelectMenu
      v-model="selected"
      v-model:search-term="search"
      multiple
      ignore-filter
      class="w-full"
      value-key="value"
      :items="options"
      :loading="loading"
    >
      <template #content-bottom>
        <div class="flex items-center justify-between gap-2 p-2">
          <UButton
            icon="i-lucide-chevron-left"
            :aria-label="$t('userGroups.previous')"
            :disabled="page <= 1 || loading"
            @click.stop="page--"
          />
          <span>{{ $t('userGroups.page', { page }) }}</span>
          <UButton
            icon="i-lucide-chevron-right"
            :aria-label="$t('userGroups.next')"
            :disabled="page >= pageCount || loading"
            @click.stop="page++"
          />
        </div>
      </template>
    </USelectMenu>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRepovioApi } from '~/composables/api/repovio-api';
import { getUserIdentityLabel } from '~/utils/user-identity';
const props = defineProps<{ initialOptions: Array<{ label: string; value: string }> }>();
const selected = defineModel<string[]>({ required: true });
const api = useRepovioApi();
const search = ref('');
const page = ref(1);
const pageCount = ref(1);
const loading = ref(false);
const error = ref(false);
const currentOptions = ref<Array<{ label: string; value: string }>>([]);
const known = new Map<string, { label: string; value: string }>();
let generation = 0;
const options = computed(
  /** Keep selected identities visible outside the current search page. */ () => {
    const choices = new Map(
      props.initialOptions.map(/** Index configured safe labels. */ (item) => [item.value, item]),
    );
    for (const item of known.values()) choices.set(item.value, item);
    return [
      ...currentOptions.value,
      ...selected.value
        .filter(
          /** Retain selected Users absent from the page. */ (id) =>
            !currentOptions.value.some(/** Check current-page membership. */ (item) => item.value === id),
        )
        .map(
          /** Restore configured or previously discovered identity labels. */ (id) =>
            choices.get(id) ?? { value: id, label: id },
        ),
    ];
  },
);
watch(
  search,
  /** Restart a changed name search on its first page. */ () => {
    page.value = 1;
  },
);
watch([search, page], load, { immediate: true });

/** Fetch authorized candidates, keeping selected identities and rejecting stale responses. */
async function load(): Promise<void> {
  const request = ++generation;
  loading.value = true;
  error.value = false;
  try {
    const { data } = await api.users.search(search.value, page.value);
    if (request !== generation) return;
    currentOptions.value = data.items.map(
      /** Format the safe identity supplied by User discovery. */ (user) => ({
        value: user.id,
        label: getUserIdentityLabel(user),
      }),
    );
    for (const item of currentOptions.value) known.set(item.value, item);
    for (const id of known.keys())
      if (
        !selected.value.includes(id) &&
        !currentOptions.value.some(
          /** Bound cached labels to current or selected identities. */ (item) => item.value === id,
        )
      )
        known.delete(id);
    pageCount.value = data.meta.pageCount;
  } catch {
    if (request === generation) {
      error.value = true;
      currentOptions.value = [];
    }
  } finally {
    if (request === generation) loading.value = false;
  }
}
</script>
