<template>
  <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
    <NuxtLink
      v-for="feature in productFeatures"
      :key="feature.slug"
      class="group rounded-2xl border border-default bg-default p-7 transition hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-primary"
      :to="localePath(`/features/${feature.slug}`)"
    >
      <UIcon class="size-7 text-primary" :name="feature.icon" />
      <h2 class="mt-5 flex items-center justify-between gap-3 text-lg font-semibold">
        <span>{{ t(feature.titleKey) }}</span>
        <UIcon name="i-lucide-arrow-right" class="size-4 shrink-0 text-primary" />
      </h2>
      <p class="mt-3 text-sm leading-7 text-muted">
        {{ t(feature.descriptionKey) }}
      </p>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import { productFeatures } from '#shared/product';
const { t } = useI18n();
const localePath = useLocalePath();
</script>
