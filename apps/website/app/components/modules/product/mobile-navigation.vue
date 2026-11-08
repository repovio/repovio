<template>
  <nav class="space-y-5" data-testid="mobile-product-navigation" :aria-label="t('navigation')">
    <UCollapsible v-model:open="featuresOpen">
      <UButton
        color="neutral"
        variant="ghost"
        trailing-icon="i-lucide-chevron-down"
        class="w-full justify-between text-base"
        data-testid="mobile-features-menu"
        :label="t('features')"
        :class="isFeature ? 'text-primary' : ''"
      />
      <template #content>
        <div class="mt-3 space-y-1 border-s border-default ps-4">
          <NuxtLink
            v-for="link in featureLinks"
            :key="link.to"
            class="block rounded-lg px-3 py-2 text-sm hover:bg-muted"
            :to="link.to"
            :class="route.path === link.to ? 'text-primary' : ''"
            :aria-current="route.path === link.to ? 'page' : undefined"
            @click="emit('navigate')"
          >
            {{ link.label }}
          </NuxtLink>
        </div>
      </template>
    </UCollapsible>
    <NuxtLink
      v-for="link in links"
      :key="link.to"
      class="block px-3 text-base font-medium"
      :to="link.to"
      :class="isActive(link.to) ? 'text-primary' : ''"
      :aria-current="isActive(link.to) ? (route.path === link.to ? 'page' : 'true') : undefined"
      @click="emit('navigate')"
    >
      {{ link.label }}
    </NuxtLink>
    <UButton
      class="w-full justify-center"
      trailing-icon="i-lucide-arrow-right"
      :to="localePath(docPath(stableDocVersion, 'installation'))"
      @click="emit('navigate')"
    >
      {{ t('getStarted') }}
    </UButton>
  </nav>
</template>

<script setup lang="ts">
import { docPath, stableDocVersion } from '#shared/docs';
import { isProductSectionActive, productFeatures } from '#shared/product';
defineProps<{ links: { label: string; to: string }[] }>();
const emit = defineEmits<{ navigate: [] }>();
const { t } = useI18n();
const localePath = useLocalePath();
const route = useRoute();
const isFeature = computed(
  /** Return `route.path === localePath('/features') || route.path.startsWith(localePath('/features') + '/')` when invoked. */ () =>
    route.path === localePath('/features') || route.path.startsWith(localePath('/features') + '/'),
);
const featuresOpen = ref(isFeature.value);
/** Compute `isActive` as `isProductSectionActive(route.path, path, localePath('/docs'))`. */
const isActive = (path: string): boolean => isProductSectionActive(route.path, path, localePath('/docs'));
const featureLinks = computed(
  /** Return `[ { label: t('product_allFeatures'), to: localePath('/features') }, ...productFeatures.map((feature) => ({ label: t(feature.titleKey), to: l` when invoked. */ () => [
    { label: t('product_allFeatures'), to: localePath('/features') },
    ...productFeatures.map(
      /** Map each entry to `({ label: t(feature.titleKey), to: localePath(`/features/${feature.slug}`) })`. */ (
        feature,
      ) => ({ label: t(feature.titleKey), to: localePath(`/features/${feature.slug}`) }),
    ),
  ],
);
</script>
