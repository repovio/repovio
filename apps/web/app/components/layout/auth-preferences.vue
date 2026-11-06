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
const selectedLocale = computed(
  /** Derives selected locale from the current reactive dependencies. */ () =>
    selectItems.value.find(
      /** Finds the first entry matching `item.value === locale.value`. */ (item) => item.value === locale.value,
    ),
);
const themeIndex = computed(
  /** Derives theme index from the current reactive dependencies. */ () =>
    Math.max(
      0,
      themes.value.findIndex(
        /** Locates the first entry matching `item.value === colorMode.preference`. */ (item) =>
          item.value === colorMode.preference,
      ),
    ),
);
const currentTheme = computed(
  /** Derives current theme from the current reactive dependencies. */ () => themes.value[themeIndex.value]!,
);
const nextTheme = computed(
  /** Derives next theme from the current reactive dependencies. */ () =>
    themes.value[(themeIndex.value + 1) % themes.value.length]!,
);
const themeIcons: Record<Theme, string> = {
  system: 'i-tabler-device-desktop',
  light: 'i-tabler-sun',
  dark: 'i-tabler-moon',
};
const themeIcon = computed(
  /** Derives theme icon from the current reactive dependencies. */ () => themeIcons[currentTheme.value.value],
);
const themeLabel = computed(
  /** Derives theme label from the current reactive dependencies. */ () =>
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
