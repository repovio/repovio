<template>
  <div class="flex flex-wrap items-center justify-center gap-2">
    <UTooltip :text="themeLabel">
      <UButton
        color="neutral"
        size="sm"
        variant="ghost"
        :aria-label="themeLabel"
        :icon="themeIcon"
        @click="setTheme(nextTheme.value)"
      />
    </UTooltip>
    <USelect
      class="w-44 ps-10"
      size="sm"
      :aria-label="$t('layout.language')"
      :avatar="selectedLocale?.avatar"
      :disabled="isChangingLocale"
      :items="selectItems"
      :loading="isChangingLocale"
      :model-value="locale"
      @update:model-value="changeLocale"
    />
  </div>
</template>

<script setup lang="ts">
import { useLocales } from '~/composables/app/locales';
import { useThemes, type Theme } from '~/composables/app/themes';

const { t } = useI18n();
const { handleSelectLocale, locale, selectItems } = useLocales();
const { colorMode, setTheme, themes } = useThemes();
const isChangingLocale = ref(false);
const selectedLocale = computed(() => selectItems.value.find((item) => item.value === locale.value));
const themeIndex = computed(() =>
  Math.max(
    0,
    themes.value.findIndex((item) => item.value === colorMode.preference),
  ),
);
const currentTheme = computed(() => themes.value[themeIndex.value]!);
const nextTheme = computed(() => themes.value[(themeIndex.value + 1) % themes.value.length]!);
const themeIcons: Record<Theme, string> = {
  system: 'i-tabler-device-desktop',
  light: 'i-tabler-sun',
  dark: 'i-tabler-moon',
};
const themeIcon = computed(() => themeIcons[currentTheme.value.value]);
const themeLabel = computed(() =>
  t('layout.themeToggle', { current: currentTheme.value.label, next: nextTheme.value.label }),
);

/** Keep the language control busy until the selected locale has finished loading. */
async function changeLocale(code: typeof locale.value): Promise<void> {
  if (isChangingLocale.value) return;

  isChangingLocale.value = true;
  try {
    await handleSelectLocale(code);
  } finally {
    isChangingLocale.value = false;
  }
}
</script>
