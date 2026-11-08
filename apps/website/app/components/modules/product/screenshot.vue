<template>
  <figure>
    <div class="overflow-hidden rounded-2xl border border-default bg-muted/30 shadow-xl shadow-primary/5">
      <img
        v-for="mode in ['light', 'dark']"
        :key="mode"
        width="1440"
        height="1000"
        loading="lazy"
        :class="mode === 'light' ? 'preview-light w-full' : 'preview-dark w-full'"
        :src="`/images/product/${name}-${screenshotLocale}-${mode}.png`"
        :alt="alt"
      />
    </div>
    <figcaption class="mt-4 text-center text-xs leading-6 text-muted">
      {{ t('screenshotNote') }}
      <span v-if="locale !== screenshotLocale" class="block" data-testid="screenshot-language-note">
        {{ t('screenshotLanguageNote') }}
      </span>
    </figcaption>
  </figure>
</template>

<script setup lang="ts">
defineProps<{ name: string; alt: string }>();
const { t, locale } = useI18n();
const screenshotLocale = computed(
  /** Return `(locale.value === 'de' ? 'de' : 'en')` when invoked. */ () => (locale.value === 'de' ? 'de' : 'en'),
);
</script>
