<template>
  <FeatureDetail v-if="feature" :feature="feature" />
</template>

<script setup lang="ts">
import { getProductFeature } from '#shared/product';
import FeatureDetail from '~/components/modules/product/feature-detail.vue';
import { useProductSeo } from '~/composables/app/product-seo';
definePageMeta({
  /** Return `Boolean(getProductFeature(String(route.params.slug)))` when invoked. */
  validate: (route) => Boolean(getProductFeature(String(route.params.slug))),
});
const route = useRoute();
const feature = computed(
  /** Return `getProductFeature(String(route.params.slug))` when invoked. */ () =>
    getProductFeature(String(route.params.slug)),
);
const { t } = useI18n();
useProductSeo(
  /** Return `(feature.value ? t(feature.value.titleKey) : '')` when invoked. */ () =>
    feature.value ? t(feature.value.titleKey) : '',
  /** Return `(feature.value ? t(feature.value.descriptionKey) : '')` when invoked. */ () =>
    feature.value ? t(feature.value.descriptionKey) : '',
);
</script>
