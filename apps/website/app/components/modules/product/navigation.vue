<template>
  <nav
    data-testid="product-navigation"
    class="hidden min-w-0 items-center gap-5 text-sm font-medium 2xl:flex"
    :aria-label="t('navigation')"
  >
    <UDropdownMenu :items="featureItems" :content="{ align: 'start' }">
      <UButton
        color="neutral"
        variant="ghost"
        trailing-icon="i-lucide-chevron-down"
        data-testid="features-menu"
        :label="t('features')"
        :disabled="!hydrated"
        :class="isFeature ? 'text-primary' : 'text-muted'"
        :aria-current="isFeature ? 'true' : undefined"
      />
    </UDropdownMenu>
    <NuxtLink
      v-for="link in links"
      :key="link.to"
      class="whitespace-nowrap transition hover:text-primary"
      :to="link.to"
      :class="isActive(link.to) ? 'text-primary' : 'text-muted'"
      :aria-current="isActive(link.to) ? (route.path === link.to ? 'page' : 'true') : undefined"
    >
      {{ link.label }}
    </NuxtLink>
  </nav>
</template>

<script setup lang="ts">
import { isProductSectionActive, productFeatures } from '#shared/product';
defineProps<{ links: { label: string; to: string }[] }>();
const { t } = useI18n();
const localePath = useLocalePath();
const route = useRoute();
const hydrated = ref(false);
onMounted(
  /** Enable interactive product navigation after hydration. */ () => {
    hydrated.value = true;
  },
);
const isFeature = computed(
  /** Return `route.path === localePath('/features') || route.path.startsWith(localePath('/features') + '/')` when invoked. */ () =>
    route.path === localePath('/features') || route.path.startsWith(localePath('/features') + '/'),
);
/** Compute `isActive` as `isProductSectionActive(route.path, path, localePath('/docs'))`. */
const isActive = (path: string): boolean => isProductSectionActive(route.path, path, localePath('/docs'));
const featureItems = computed(
  /** Return `[ [{ label: t('product_allFeatures'), to: localePath('/features'), active: route.path === localePath('/features') }], productFeatures.map((f` when invoked. */ () => [
    [{ label: t('product_allFeatures'), to: localePath('/features'), active: route.path === localePath('/features') }],
    productFeatures.map(
      /** Map each entry to `({ label: t(feature.titleKey), icon: feature.icon, to: localePath(`/features/${feature.slug}`), active: route.path === localePath(`/features`. */ (
        feature,
      ) => ({
        label: t(feature.titleKey),
        icon: feature.icon,
        to: localePath(`/features/${feature.slug}`),
        active: route.path === localePath(`/features/${feature.slug}`),
      }),
    ),
  ],
);
</script>
