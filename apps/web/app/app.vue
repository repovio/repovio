<template>
  <UApp :locale="getUiLocale(locale)">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <CommonPwaUpdatePrompt />
  </UApp>
</template>

<script setup lang="ts">
import { getAppLocale } from '../shared/locales';
import { getUiLocale } from './utils/locales';

const { locale } = useI18n();

useHead(
  /** Keep language and direction reactive through locale changes, including teleported overlays. */
  () => ({
    htmlAttrs: { lang: getAppLocale(locale.value).language, dir: getAppLocale(locale.value).dir },
  }),
);
</script>
