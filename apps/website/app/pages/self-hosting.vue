<template>
  <div>
    <ProductHero icon="i-lucide-server" :title="t('product_selfHosting')" :description="t('installDescription')" />
    <section class="page-width grid gap-8 py-16 lg:grid-cols-2">
      <article>
        <h2 class="text-2xl font-semibold">
          {{ t('product_prerequisites') }}
        </h2>
        <p class="mt-4 leading-8 text-muted">
          {{ t('product_requirements') }}
        </p>
        <p class="mt-4 leading-8 text-muted">
          {{ t('installNote') }}
        </p>
        <UButton
          class="mt-6"
          color="neutral"
          variant="outline"
          trailing-icon="i-lucide-arrow-right"
          :to="localePath(docPath(stableDocVersion, 'deployment'))"
        >
          {{ t('deployment') }}
        </UButton>
      </article>
      <article class="rounded-2xl border border-primary/20 bg-primary/5 p-7">
        <UIcon name="i-lucide-shield-check" class="size-7 text-primary" />
        <h2 class="mt-4 text-2xl font-semibold">
          {{ t('readOnlyTitle') }}
        </h2>
        <p class="mt-4 leading-8 text-muted">
          {{ t('readOnlyText') }}
        </p>
        <p class="mt-4 leading-8 text-muted">
          {{ t('featurePermissionsText') }}
        </p>
        <UButton class="mt-6" color="neutral" variant="outline" :to="localePath('/features/access-control')">
          {{ t('featurePermissionsTitle') }}
        </UButton>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import { docPath, stableDocVersion } from '#shared/docs';
import ProductHero from '~/components/modules/product/hero.vue';
import { useProductSeo } from '~/composables/app/product-seo';
const { t } = useI18n();
const localePath = useLocalePath();
useProductSeo(
  /** Return `t('product_selfHosting')` when invoked. */ () => t('product_selfHosting'),
  /** Return `t('installDescription')` when invoked. */ () => t('installDescription'),
);
</script>
