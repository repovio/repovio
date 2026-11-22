<template>
  <section ref="shell" class="@container flex min-h-0 min-w-0 flex-1 flex-col" data-page-shell>
    <UDashboardToolbar
      class="h-auto min-w-0 shrink-0 flex-col items-stretch gap-2 overflow-visible border-b border-default px-4 py-2 sm:flex-row sm:flex-wrap sm:items-center"
      data-page-toolbar
      :class="{ 'flex-row flex-wrap items-center': $slots.summary }"
      :ui="{
        left: 'min-w-0 max-w-full',
        right: $slots.summary
          ? 'ms-auto min-w-0 flex-wrap justify-end gap-2'
          : 'min-w-0 w-full flex-wrap gap-2 sm:w-auto sm:flex-1 sm:justify-end',
      }"
    >
      <template #left>
        <div ref="breadcrumb" class="w-max max-w-full">
          <UBreadcrumb class="min-w-0" :items="breadcrumbs" :ui="{ list: 'flex-wrap', item: 'min-w-0' }" />
        </div>
      </template>

      <template v-if="$slots.actions || $slots.summary || $slots['table-actions']" #right>
        <div v-if="$slots['table-actions']" ref="mergeTarget" class="empty:hidden" />
        <div
          v-if="$slots.actions || $slots.summary"
          ref="pageActions"
          class="ms-auto flex max-w-full flex-wrap items-center justify-end gap-2"
        >
          <slot name="actions" />
          <UButton
            v-if="$slots.summary"
            color="neutral"
            icon="i-lucide-chevron-down"
            variant="ghost"
            :aria-controls="summaryId"
            :aria-expanded="expanded"
            :aria-label="$t('layout.toggleMetrics')"
            :ui="{ leadingIcon: ['transition-transform motion-reduce:transition-none', expanded && 'rotate-180'] }"
            @click="toggleSummary"
          />
        </div>
      </template>
    </UDashboardToolbar>

    <UDashboardToolbar v-if="$slots.navigation" class="h-auto min-w-0 overflow-visible" data-page-navigation>
      <slot name="navigation" />
    </UDashboardToolbar>

    <LayoutPageSummary
      v-if="$slots.summary && !padded"
      :id="summaryId"
      class="max-h-[50dvh]"
      :expanded="expanded"
      @collapsed="collapsing = false"
    >
      <slot name="summary" />
    </LayoutPageSummary>
    <slot name="before-table" />
    <div
      v-if="$slots['table-actions']"
      class="shrink-0 border-b border-default px-4 py-2"
      :class="{ hidden: mergeTable() }"
    >
      <Teleport :to="mergeTarget ?? 'body'" :disabled="!mergeTable()">
        <CommonTableToolbar ref="tableToolbar" :title="title">
          <slot name="table-actions" />
        </CommonTableToolbar>
      </Teleport>
    </div>

    <div data-page-content :class="contentClasses">
      <h1 class="sr-only">
        {{ title }}
      </h1>

      <LayoutPageSummary v-if="$slots.summary && padded" :id="summaryId" :expanded="expanded">
        <slot name="summary" />
      </LayoutPageSummary>
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
import { useElementSize } from '@vueuse/core';
import { computed, defineProps, ref, useId, useSlots, useTemplateRef, withDefaults } from 'vue';

interface PageBreadcrumbItem {
  /** Bound long item labels through the existing Nuxt UI breadcrumb class contract. */
  class?: string;
  icon?: string;
  label: string;
  to?: string;
}

const props = withDefaults(
  defineProps<{
    breadcrumbs: PageBreadcrumbItem[];
    fullWidth?: boolean;
    padded?: boolean;
    title: string;
  }>(),
  { fullWidth: false, padded: true },
);
const summaryId = useId();
const expanded = ref(true);
const collapsing = ref(false);
/** Keep the table below the metrics until the shrinking region has finished its transition. */
function toggleSummary(): void {
  collapsing.value = expanded.value;
  expanded.value = !expanded.value;
}
const slots = useSlots();
const mergeTarget = useTemplateRef('mergeTarget');
const tableToolbar = useTemplateRef('tableToolbar');
const { width: shellWidth } = useElementSize(useTemplateRef('shell'));
const { width: breadcrumbWidth } = useElementSize(useTemplateRef('breadcrumb'));
const { width: actionsWidth } = useElementSize(useTemplateRef('pageActions'));

/** Read current conditional slots on each render; never move or duplicate query state. */
function mergeTable(): boolean {
  if (
    !mergeTarget.value ||
    slots.navigation ||
    slots['before-table'] ||
    (slots.summary && (expanded.value || collapsing.value))
  )
    return false;
  const controls = tableToolbar.value?.width ?? 0;
  // Include toolbar padding and gaps between the three groups, in addition to their measured widths.
  return controls > 0 && shellWidth.value >= Math.max(640, breadcrumbWidth.value + actionsWidth.value + controls + 56);
}

const contentClasses = computed(
  /** Derives content classes from the current reactive dependencies. */ () => {
    if (!props.padded) return 'flex min-h-0 min-w-0 w-full flex-1 flex-col overflow-y-auto';

    return [
      'min-h-0 w-full flex-1 space-y-6 overflow-y-auto p-4 sm:p-6 lg:p-8',
      props.fullWidth ? undefined : 'mx-auto max-w-7xl',
    ];
  },
);
</script>
