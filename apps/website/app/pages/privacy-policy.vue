<template>
  <article class="page-width max-w-3xl py-20">
    <h1 class="text-4xl font-semibold">
      {{ t('privacyPolicy') }}
    </h1>
    <UAlert class="mt-8" color="warning" :title="t('legalDraftTitle')" :description="t('legalDraftText')" />
    <p class="mt-8 leading-8 text-muted">
      {{ t('privacyText') }}
    </p>
  </article>
</template>

<script setup lang="ts">
const { t } = useI18n();
useHead(
  /** Return `({ title: t('privacyPolicy'), meta: [{ name: 'robots', content: 'noindex, nofollow' }] })` when invoked. */ () => ({
    title: t('privacyPolicy'),
    meta: [{ name: 'robots', content: 'noindex, nofollow' }],
  }),
);
</script>
