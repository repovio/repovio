<template>
  <UTooltip :disabled="kind !== 'options' || open" :text="label">
    <UButton
      ref="trigger"
      aria-haspopup="dialog"
      variant="ghost"
      :aria-expanded="open"
      :aria-label="label"
      :color="active ? 'primary' : 'neutral'"
      :icon="icons[kind]"
      @click="openPopover"
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
/** The mobile Querry-Kit modal provides its own trigger; only toggle a standalone popover here. */
function openPopover(): void {
  if (!window.matchMedia('(width < 640px)').matches) props.toggle();
}
let restoreFocusOnClose = false;

// Query Kit owns the popover but supplies no Reka trigger to receive focus on Escape.
useEventListener(
  'keydown',
  /** Records Escape dismissal so the popover trigger can regain focus. */
  (event) => {
    if (props.open) restoreFocusOnClose = event.key === 'Escape';
    // The initially focused Reset button opens a tooltip that otherwise consumes the first Escape.
    if (
      props.open &&
      props.kind === 'options' &&
      event.key === 'Escape' &&
      event.target instanceof HTMLElement &&
      event.target.closest('[role="dialog"]')?.matches('.qk-table-options-popover, .qk-table-toolbar-dialog') &&
      !event.target.closest('[role="menu"], [role="listbox"], [aria-expanded="true"]')
    ) {
      event.preventDefault();
      event.stopPropagation();
      props.toggle();
    }
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
