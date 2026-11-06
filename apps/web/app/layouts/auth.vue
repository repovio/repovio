<template>
  <div class="flex min-h-screen flex-1 flex-col items-center justify-center gap-4 bg-default p-4">
    <NuxtLink
      to="/auth/signin"
      aria-label="Repovio"
      class="mt-auto flex items-center gap-2 font-display text-2xl font-bold"
    >
      <img src="/logo-wordmark-light.svg" alt="" class="h-10 w-auto dark:hidden" />
      <img src="/logo-wordmark-dark.svg" alt="" class="hidden h-10 w-auto dark:block" />
    </NuxtLink>

    <UPageCard class="w-full max-w-md">
      <slot />
    </UPageCard>

    <LayoutAuthPreferences />

    <div class="mb-auto flex flex-col items-center gap-2 text-center text-sm text-muted">
      <p>{{ $t('layout.readOnlyStatus') }}</p>
      <p>{{ $t('layout.copyright', { year: currentYear }) }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const currentYear = new Date().getFullYear();
</script>
