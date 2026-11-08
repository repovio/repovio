<template>
  <article class="page-width max-w-3xl py-20">
    <h1 class="text-4xl font-semibold">
      {{ t('imprint') }}
    </h1>
    <UAlert class="mt-8" color="warning" :title="t('legalDraftTitle')" :description="t('legalDraftText')" />
    <p class="mt-8 leading-8 text-muted">
      {{ t('legalDraftText') }}
    </p>
  </article>
</template>

<script setup lang="ts">
const { t } = useI18n();
useHead(
  /** Return `({ title: t('imprint'), meta: [{ name: 'robots', content: 'noindex, nofollow' }] })` when invoked. */ () => ({
    title: t('imprint'),
    meta: [{ name: 'robots', content: 'noindex, nofollow' }],
  }),
);
</script>
