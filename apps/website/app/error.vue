<template>
  <UApp>
    <div class="flex min-h-screen items-center justify-center bg-default px-6">
      <div class="max-w-lg text-center">
        <BrandMark class="mb-8 justify-center" />
        <p class="eyebrow mb-4">
          {{ error.statusCode }}
        </p>
        <h1 class="text-4xl font-bold tracking-tight">
          {{ t('notFound') }}
        </h1>
        <p class="mt-5 leading-7 text-muted">
          {{ t('notFoundText') }}
        </p>
        <UButton class="mt-8" @click="clearError({ redirect: localePath('/') })">
          {{ t('backHome') }}
        </UButton>
      </div>
    </div>
  </UApp>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app';
defineProps<{ error: NuxtError }>();
const { t } = useI18n();
const localePath = useLocalePath();
</script>
