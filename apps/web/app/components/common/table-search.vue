<template>
  <UInput
    ref="field"
    v-model="search"
    class="w-full sm:w-56"
    icon="i-lucide-search"
    aria-keyshortcuts="Control+F Meta+F"
    :aria-label="label ?? placeholder ?? $t('querrykit.table.search.placeholder')"
    :placeholder="placeholder ?? $t('querrykit.table.search.placeholder')"
  />
</template>

<script setup lang="ts">
import { useEventListener } from '@vueuse/core';
import { useTemplateRef } from 'vue';

defineProps<{ label?: string; placeholder?: string }>();
const search = defineModel<string>({ required: true });
const field = useTemplateRef('field');
useEventListener(
  'keydown',
  /** Keep browser find available outside a visible table or inside an unrelated dialog. */ (event) => {
    if (
      event.defaultPrevented ||
      !(event.ctrlKey || event.metaKey) ||
      event.altKey ||
      event.shiftKey ||
      event.key.toLowerCase() !== 'f'
    )
      return;
    const input = field.value?.inputRef;
    if (!input?.getClientRects().length || input.closest('[inert], [aria-hidden="true"]')) return;
    if (document.querySelector('[role="dialog"][data-state="open"]') && !input.closest('[role="dialog"]')) return;
    event.preventDefault();
    input.focus();
    input.select();
  },
);
</script>
