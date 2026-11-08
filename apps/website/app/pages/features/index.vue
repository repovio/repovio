<template>
  <div>
    <ProductHero icon="i-lucide-grid-2x2" :title="t('features')" :description="t('featuresTitle')" />
    <section class="page-width py-16">
      <FeatureGrid />
    </section>
  </div>
</template>

<script setup lang="ts">
import FeatureGrid from '~/components/modules/product/feature-grid.vue';
import ProductHero from '~/components/modules/product/hero.vue';
import { useProductSeo } from '~/composables/app/product-seo';
const { t } = useI18n();
useProductSeo(
  /** Return `t('features')` when invoked. */ () => t('features'),
  /** Return `t('metaDescription')` when invoked. */ () => t('metaDescription'),
);
</script>
