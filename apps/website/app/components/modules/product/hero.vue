<template>
  <section class="relative overflow-hidden border-b border-default py-16 sm:py-24">
    <div class="hero-grid pointer-events-none absolute inset-0" aria-hidden="true" />
    <div class="page-width relative">
      <NuxtLink class="eyebrow inline-flex items-center gap-2 hover:text-primary" :to="localePath('/features')">
        <UIcon class="size-4" :name="icon" />
        <span>{{ t('features') }}</span>
      </NuxtLink>
      <h1 class="section-title mt-6 max-w-4xl">
        {{ title }}
      </h1>
      <p class="mt-6 max-w-3xl text-lg leading-8 text-muted">
        {{ description }}
      </p>
      <div class="mt-8 flex flex-wrap gap-3">
        <UButton
          trailing-icon="i-lucide-arrow-right"
          size="lg"
          :to="localePath(docPath(stableDocVersion, 'installation'))"
        >
          {{ t('getStarted') }}
        </UButton>
        <slot />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { docPath, stableDocVersion } from '#shared/docs';
defineProps<{ title: string; description: string; icon: string }>();
const { t } = useI18n();
const localePath = useLocalePath();
</script>
