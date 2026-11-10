<template>
  <QTableFiltering v-model:filtering="filtering" :fields="fields" :shortcuts="shortcuts">
    <template #trigger="{ active, open, toggle }">
      <CommonTablePopoverTrigger kind="filtering" :active="active || specializedActive" :open="open" :toggle="toggle" />
    </template>
    <template #header="{ clear, toggleMode }">
      <div class="mb-4 flex items-center justify-between gap-2">
        <span class="flex items-center gap-2">
          <UIcon name="i-tabler-filter" />
          {{ $t('querrykit.table.filtering.title') }}
        </span>
        <div class="flex gap-1">
          <UButton
            color="neutral"
            size="xs"
            variant="outline"
            :aria-label="$t('querrykit.table.filtering.mode')"
            :icon="
              filtering.operator === FilteringMode.Intersect ? 'i-tabler-layers-intersect-2' : 'i-tabler-layers-union'
            "
            @click="toggleMode"
          />
          <UButton
            v-if="filtering.filters.length || specializedActive"
            color="error"
            icon="i-lucide-trash-2"
            size="xs"
            variant="outline"
            :aria-label="$t('querrykit.table.filtering.clear')"
            @click="clearAll(clear)"
          />
        </div>
      </div>
      <div class="mb-4 grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2" data-specialized-filters>
        <slot />
      </div>
    </template>
  </QTableFiltering>
</template>

<script setup lang="ts">
import { FilteringMode, type FilterField, type Filtering } from '@querry-kit/nuxt-ui/types';

/** Additional criteria remain owned by the feature table and AND-combined with structured filtering. */
withDefaults(defineProps<{ fields: FilterField[]; specializedActive: boolean; shortcuts?: boolean }>(), {
  shortcuts: true,
});
const filtering = defineModel<Filtering>('filtering', { required: true });
const emit = defineEmits<{ clearSpecialized: [] }>();

/** Clears structured and feature-owned criteria together without changing search or popover visibility. */
function clearAll(clear: () => void): void {
  clear();
  emit('clearSpecialized');
}
</script>
