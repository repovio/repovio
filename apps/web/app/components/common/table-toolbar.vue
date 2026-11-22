<template>
  <QTableToolbar>
    <template #layout>
      <div
        ref="controls"
        class="flex w-max max-w-[calc(100cqi-2rem)] flex-wrap items-center gap-2 max-sm:w-full"
        data-table-toolbar
        role="toolbar"
        :aria-label="title"
      >
        <slot />
      </div>
    </template>
  </QTableToolbar>
</template>

<script setup lang="ts">
import { useElementSize } from '@vueuse/core';
import { useTemplateRef } from 'vue';

defineProps<{ title: string }>();
const { width } = useElementSize(useTemplateRef('controls'));
defineExpose({ width });
</script>
