<template>
  <div class="flex flex-wrap items-center justify-center gap-2">
    <UDropdownMenu :items="themeItems">
      <UButton color="neutral" icon="i-tabler-palette" size="sm" variant="ghost" :label="$t('layout.theme')" />
    </UDropdownMenu>
    <UDropdownMenu :items="localeItems">
      <UButton color="neutral" icon="i-tabler-language" size="sm" variant="ghost" :label="$t('layout.language')" />
    </UDropdownMenu>
  </div>
</template>

<script setup lang="ts">
import { useLocales } from '~/composables/app/locales';
import { useThemes } from '~/composables/app/themes';

const { dropdownMenuItems: localeItems } = useLocales();
const { dropdownMenuItems: themeItems } = useThemes();
</script>
