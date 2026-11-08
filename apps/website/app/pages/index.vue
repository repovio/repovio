<template>
  <div>
    <LandingHero />
    <LandingPreview />
    <LandingFeatures />
    <section class="page-width grid gap-8 py-24 lg:grid-cols-2 lg:items-center">
      <div>
        <h2 class="section-title">
          {{ t('installTitle') }}
        </h2>
        <p class="mt-6 text-base leading-8 text-muted">
          {{ t('installDescription') }}
        </p>
        <UButton class="mt-6" trailing-icon="i-lucide-arrow-right" :to="installation">
          {{ t('installAction') }}
        </UButton>
      </div>
      <div class="rounded-2xl border border-default bg-muted/30 p-8">
        <CommandBlock
          code="docker compose pull
docker compose up -d"
        />
        <p class="mt-4 text-sm leading-7 text-muted">
          {{ t('installNote') }}
        </p>
      </div>
    </section>
    <section class="page-width pb-24">
      <div class="rounded-2xl border border-primary/20 bg-primary/5 p-8 sm:p-12">
        <h2 class="text-2xl font-semibold">
          {{ t('readOnlyTitle') }}
        </h2>
        <p class="mt-4 max-w-3xl leading-8 text-muted">
          {{ t('readOnlyText') }}
        </p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { docPath, stableDocVersion } from '#shared/docs';
import LandingFeatures from '~/components/modules/landing/features.vue';
import LandingHero from '~/components/modules/landing/hero.vue';
import LandingPreview from '~/components/modules/landing/preview.vue';
const { t } = useI18n();
const localePath = useLocalePath();
const installation = computed(
  /** Return `localePath(docPath(stableDocVersion, 'installation'))` when invoked. */ () =>
    localePath(docPath(stableDocVersion, 'installation')),
);
useSeoMeta({
  title: 'Repovio',
  description: /** Resolve the description in the active locale. */ () => t('metaDescription'),
});
</script>
