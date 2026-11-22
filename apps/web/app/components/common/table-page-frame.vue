<template>
  <section v-if="embedded" class="@container flex min-h-0 min-w-0 flex-1 flex-col" :aria-label="title">
    <slot name="before-table" />
    <div class="shrink-0 border-b border-default px-4 py-2">
      <CommonTableToolbar :title="title">
        <slot name="actions" />
      </CommonTableToolbar>
    </div>
    <slot />
  </section>
  <LayoutPage v-else :breadcrumbs="breadcrumbs" :padded="padded" :title="title">
    <template v-if="$slots.summary" #summary>
      <slot name="summary" />
    </template>
    <template v-if="$slots['before-table']" #before-table>
      <slot name="before-table" />
    </template>
    <template #table-actions>
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
