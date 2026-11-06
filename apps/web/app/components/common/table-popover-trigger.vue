<template>
  <UTooltip :disabled="kind !== 'options'" :text="label">
    <UButton
      ref="trigger"
      aria-haspopup="dialog"
      variant="ghost"
      :aria-expanded="open"
      :aria-label="label"
      :color="active ? 'primary' : 'neutral'"
      :icon="icons[kind]"
      @click="toggle"
    />
  </UTooltip>
</template>

<script setup lang="ts">
import { useEventListener } from '@vueuse/core';
import { computed, nextTick, ref, watch } from 'vue';

const props = defineProps<{
  active?: boolean;
  kind: 'sorting' | 'filtering' | 'options';
  open: boolean;
  toggle: () => void;
}>();

const { t } = useI18n();
const label = computed(
  /** Derives label from the current reactive dependencies. */ () => t(`querrykit.table.${props.kind}.title`),
);
const icons = {
  sorting: 'i-tabler-arrows-sort',
  filtering: 'i-tabler-filter',
  options: 'i-tabler-adjustments',
};
const trigger = ref<{ $el: HTMLButtonElement } | null>(null);
let restoreFocusOnClose = false;

// Query Kit owns the popover but supplies no Reka trigger to receive focus on Escape.
useEventListener(
  'keydown',
  /** Records Escape dismissal so the popover trigger can regain focus. */
  (event) => {
    if (props.open) restoreFocusOnClose = event.key === 'Escape';
  },
  { capture: true },
);
useEventListener(
  'pointerdown',
  /** Cancels keyboard focus restoration after a pointer interaction. */
  () => {
    restoreFocusOnClose = false;
  },
  { capture: true },
);

watch(
  /** Reads the reactive dependencies observed by this watcher. */
  () => props.open,
  /** Synchronizes table popover trigger when the observed state changes. */
  async (open, wasOpen) => {
    const shouldRestore = wasOpen && !open && restoreFocusOnClose;
    restoreFocusOnClose = false;
    if (!shouldRestore) return;

    // Wait until Reka has removed the focus scope; nested popovers leave this one open.
    await nextTick();
    if (trigger.value?.$el.isConnected) trigger.value.$el.focus({ preventScroll: true });
  },
  { flush: 'post' },
);
</script>
