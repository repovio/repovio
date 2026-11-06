<template>
  <UButton
    id="global-search-trigger"
    aria-haspopup="dialog"
    aria-keyshortcuts="/ Control+K Meta+K"
    class="min-w-0 w-44 max-w-full justify-start sm:w-72"
    color="neutral"
    icon="i-lucide-search"
    variant="outline"
    :aria-expanded="open"
    :aria-label="$t('commandPalette.open')"
    :label="$t('commandPalette.searchPlaceholder')"
    :ui="{ label: 'min-w-0 flex-1 truncate text-left text-muted' }"
    @click="show"
  >
    <template #trailing>
      <span class="hidden shrink-0 items-center gap-0.5 lg:flex">
        <UKbd value="meta" />
        <UKbd>K</UKbd>
      </span>
    </template>
  </UButton>
</template>

<script setup lang="ts">
import { useCommandPalette } from '~/composables/app/command-palette';

const { open, show } = useCommandPalette();
</script>
