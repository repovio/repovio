<template>
  <div>
    <ProductHero :title="t(feature.titleKey)" :description="t(feature.descriptionKey)" :icon="feature.icon">
      <UButton color="neutral" variant="outline" size="lg" :to="localePath(docPath(stableDocVersion, feature.docs[0]))">
        {{ t('docs') }}
      </UButton>
    </ProductHero>
    <section class="page-width grid gap-8 py-16 lg:grid-cols-2">
      <div>
        <h2 class="text-2xl font-semibold">
          {{ t('product_useCase') }}
        </h2>
        <p class="mt-4 leading-8 text-muted">
          {{ t(`product_details_${feature.slug}_useCase`) }}
        </p>
      </div>
      <div class="rounded-2xl border border-default bg-muted/25 p-7">
        <h2 class="text-xl font-semibold">
          {{ t('product_limitations') }}
        </h2>
        <p class="mt-4 leading-8 text-muted">
          {{ t(`product_details_${feature.slug}_limit`) }}
        </p>
      </div>
    </section>
    <section class="page-width pb-16">
      <ProductScreenshot v-if="feature.screenshot" :name="feature.screenshot" :alt="t(feature.titleKey)" />
      <ProductMcpFlow v-else />
    </section>
    <section class="border-t border-default bg-muted/25 py-16">
      <div class="page-width">
        <h2 class="text-2xl font-semibold">
          {{ t('product_learnMore') }}
        </h2>
        <div class="mt-6 flex flex-wrap gap-3">
          <UButton
            v-for="slug in feature.docs"
            :key="slug"
            color="neutral"
            variant="outline"
            trailing-icon="i-lucide-arrow-right"
            :to="localePath(docPath(stableDocVersion, slug))"
          >
            {{ t(slug) }}
          </UButton>
        </div>
        <NuxtLink class="mt-8 inline-flex text-sm font-medium text-primary" :to="localePath('/features')">
          {{ t('product_allFeatures') }}
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { docPath, stableDocVersion } from '#shared/docs';
import type { productFeatures } from '#shared/product';
import ProductHero from './hero.vue';
import ProductMcpFlow from './mcp-flow.vue';
import ProductScreenshot from './screenshot.vue';
defineProps<{ feature: (typeof productFeatures)[number] }>();
const { t } = useI18n();
const localePath = useLocalePath();
</script>
