<template>
  <div class="flex min-h-screen flex-1 flex-col items-center justify-center gap-4 bg-default p-4">
    <LayoutBrandLogo to="/auth/signin" large class="mt-auto text-2xl" />

    <UPageCard class="w-full max-w-md">
      <slot />
    </UPageCard>

    <LayoutAuthPreferences />

    <div class="mb-auto flex flex-col items-center gap-2 text-center text-sm text-muted">
      <p>
        {{ $t('layout.readOnlyStatus') }}
      </p>
      <NuxtLink
        v-if="branding.brandProductUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="hover:text-primary"
        :to="branding.brandProductUrl"
      >
        {{ branding.brandName }}
      </NuxtLink>
      <p>
        {{ $t('layout.copyright', { year: currentYear }) }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBranding } from '~/composables/app/branding';

const branding = useBranding();
const currentYear = new Date().getFullYear();
</script>
