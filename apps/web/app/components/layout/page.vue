<template>
  <section class="flex min-h-0 min-w-0 flex-1 flex-col" data-page-shell>
    <UDashboardToolbar
      class="h-auto min-w-0 shrink-0 flex-col items-stretch gap-2 overflow-visible border-b border-default px-4 py-2 sm:flex-row sm:flex-wrap sm:items-center"
      data-page-toolbar
      :ui="{
        left: 'min-w-0 max-w-full',
        right: 'min-w-0 w-full flex-wrap gap-2 sm:w-auto sm:flex-1 sm:justify-end',
      }"
    >
      <template #left>
        <UBreadcrumb class="min-w-0" :items="breadcrumbs" :ui="{ list: 'flex-wrap', item: 'min-w-0' }" />
      </template>

      <template v-if="$slots.actions" #right>
        <slot name="actions" />
      </template>
    </UDashboardToolbar>

    <UDashboardToolbar v-if="$slots.navigation" class="h-auto min-w-0 overflow-visible py-2" data-page-navigation>
      <slot name="navigation" />
    </UDashboardToolbar>

    <div data-page-content :class="contentClasses">
      <h1 class="sr-only">{{ title }}</h1>

      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, defineProps, withDefaults } from 'vue';

interface PageBreadcrumbItem {
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

const contentClasses = computed(() => {
  if (!props.padded) return 'flex min-h-0 min-w-0 w-full flex-1 flex-col overflow-y-auto';

  return [
    'min-h-0 w-full flex-1 space-y-6 overflow-y-auto p-4 sm:p-6 lg:p-8',
    props.fullWidth ? undefined : 'mx-auto max-w-7xl',
  ];
});
</script>
