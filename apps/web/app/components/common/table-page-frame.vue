<template>
  <section v-if="embedded" class="flex min-h-0 min-w-0 flex-1 flex-col" :aria-label="title">
    <div class="flex shrink-0 flex-wrap items-center gap-2 border-b border-default p-4" data-table-toolbar>
      <slot name="actions" />
    </div>
    <slot />
  </section>
  <LayoutPage v-else :breadcrumbs="breadcrumbs" :padded="padded" :title="title">
    <template #actions>
      <slot name="actions" />
    </template>
    <slot />
  </LayoutPage>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    embedded?: boolean;
    breadcrumbs: { icon?: string; label: string; to?: string }[];
    padded?: boolean;
    title: string;
  }>(),
  { embedded: false, padded: false },
);
</script>
