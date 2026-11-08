<template>
  <UDropdownMenu :items="items" :content="{ align: 'end' }" :ui="{ content: 'w-48 max-h-80 overflow-y-auto' }">
    <template #item-leading="{ item }">
      <span aria-hidden="true" class="shrink-0 text-base" data-testid="language-flag">{{ item.flag }}</span>
    </template>
    <UButton
      icon="i-lucide-languages"
      color="neutral"
      variant="ghost"
      data-testid="language-switch"
      :aria-label="t('language')"
      :disabled="!hydrated || changing"
      :loading="changing"
    />
  </UDropdownMenu>
</template>

<script setup lang="ts">
import { getLocale, type LocaleCode } from '#shared/locales';
import { languageOptions } from '~/utils/locales';
const { locale, setLocale, setLocaleCookie, t } = useI18n();
const hydrated = ref(false);
const changing = ref(false);
onMounted(
  /** Enable browser-only language selection after hydration. */ () => {
    hydrated.value = true;
  },
);
/** Define change locale behavior. */
async function changeLocale(value: LocaleCode) {
  changing.value = true;
  try {
    setLocaleCookie(value);
    await setLocale(value);
  } finally {
    changing.value = false;
  }
}
const items = computed(
  /** Return `languageOptions.map((option) => ({ label: option.label, flag: getLocale(option.value).flag, type: 'checkbox' as const, checked: locale.value` when invoked. */ () =>
    languageOptions.map(
      /** Map each entry to `({ label: option.label, flag: getLocale(option.value).flag, type: 'checkbox' as const, checked: locale.value === option.value, onSelect: () `. */ (
        option,
      ) => ({
        label: option.label,
        flag: getLocale(option.value).flag,
        type: 'checkbox' as const,
        checked: locale.value === option.value,
        /** Return `changeLocale(option.value)` when invoked. */
        onSelect: () => changeLocale(option.value),
      }),
    ),
);
</script>
