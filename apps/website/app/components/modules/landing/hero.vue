<template>
  <section class="relative overflow-hidden border-b border-default py-20 sm:py-28">
    <div class="hero-grid pointer-events-none absolute inset-0" aria-hidden="true" />
    <div class="page-width relative text-center">
      <UBadge class="mb-8 rounded-full px-4 py-2" variant="soft">
        {{ t('badge') }}
      </UBadge>
      <h1 class="hero-title">
        <span>{{ t('heroA') }}</span>
        <br />
        <span class="text-primary">{{ t('heroB') }}</span>
      </h1>
      <p class="mx-auto mt-8 max-w-2xl text-lg leading-8 text-muted">
        {{ t('heroDescription') }}
      </p>
      <div class="mt-9 flex flex-wrap justify-center gap-3">
        <UButton
          size="xl"
          trailing-icon="i-lucide-arrow-right"
          :to="localePath(docPath(stableDocVersion, 'installation'))"
        >
          {{ t('getStarted') }}
        </UButton>
        <UButton size="xl" color="neutral" variant="outline" :to="localePath(docPath(stableDocVersion))">
          {{ t('docs') }}
        </UButton>
      </div>
      <p class="mt-6 text-sm text-dimmed">
        {{ t('heroNote') }}
      </p>
      <div class="mt-12 flex flex-wrap justify-center gap-6 text-sm font-medium text-muted">
        <span v-for="provider in ['GitHub', 'GitLab', 'Forgejo', 'Gitea']" :key="provider">{{ provider }}</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { docPath, stableDocVersion } from '#shared/docs';
const { t } = useI18n();
const localePath = useLocalePath();
</script>
