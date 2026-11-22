<template>
  <slot v-if="!grouped" />
  <div v-else class="min-h-0 flex-1 space-y-2 overflow-auto p-4" :aria-busy="loading">
    <UAlert v-if="failed" color="error" :title="$t('querrykit.table.grouping.error')">
      <template #actions>
        <UButton :label="$t('querrykit.table.grouping.retry')" @click="$emit('retry')" />
      </template>
    </UAlert>
    <p v-else-if="!groups.length" role="status">
      {{ $t(loading ? 'querrykit.table.grouping.loading' : 'querrykit.table.grouping.noGroups') }}
    </p>
    <QTableGroup
      v-for="group in groups"
      :key="group.value"
      :count="group.count"
      :expanded="selected === group.value"
      :label="$t(`${labelPrefix}.${group.value}`)"
      @toggle="$emit('toggle', group.value)"
    >
      <slot v-if="selected === group.value" />
    </QTableGroup>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  failed: boolean;
  grouped: boolean;
  groups: Array<{ value: string; count: number }>;
  labelPrefix: string;
  loading: boolean;
  selected?: string;
}>();
defineEmits<{ retry: []; toggle: [value: string] }>();
</script>
