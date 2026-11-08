<template>
  <section class="page-width py-20 sm:py-24">
    <div class="mb-9 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
      <h2 class="section-title max-w-2xl">
        <NuxtLink class="hover:text-primary" :to="localePath('/features/dashboard')">
          {{ t('previewTitle') }}
        </NuxtLink>
      </h2>
      <p class="max-w-md text-sm leading-7 text-muted">
        {{ t('previewDescription') }}
      </p>
    </div>
    <div class="overflow-hidden rounded-2xl border border-default shadow-2xl shadow-primary/5">
      <img
        class="preview-light w-full"
        width="1440"
        height="1000"
        loading="lazy"
        :src="`/images/product/dashboard-${screenshotLocale}-light.png`"
        :alt="t('screenshotAlt')"
      />
      <img
        class="preview-dark w-full"
        width="1440"
        height="1000"
        loading="lazy"
        :src="`/images/product/dashboard-${screenshotLocale}-dark.png`"
        :alt="t('screenshotAlt')"
      />
    </div>
    <p class="mt-4 text-center text-xs text-dimmed">
      {{ t('screenshotNote') }}
      <span v-if="locale !== screenshotLocale" class="block" data-testid="screenshot-language-note">
        {{ t('screenshotLanguageNote') }}
      </span>
    </p>
  </section>
</template>

<script setup lang="ts">
const { t, locale } = useI18n();
const localePath = useLocalePath();
const screenshotLocale = computed(
  /** Return `(locale.value === 'de' ? 'de' : 'en')` when invoked. */ () => (locale.value === 'de' ? 'de' : 'en'),
);
</script>
