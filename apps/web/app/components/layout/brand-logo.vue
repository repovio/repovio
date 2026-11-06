<template>
  <NuxtLink
    class="flex min-w-0 max-w-full items-center gap-2 font-display font-bold"
    :to="to"
    :aria-label="branding.brandName"
  >
    <img v-if="compact" alt="" class="size-7 shrink-0 object-contain" :src="branding.brandLogoCompact" />
    <template v-else>
      <img
        alt=""
        class="max-w-full object-contain dark:hidden"
        :class="large ? 'h-10' : 'h-8'"
        :src="branding.brandLogoLight"
      />
      <img
        alt=""
        class="hidden max-w-full object-contain dark:block"
        :class="large ? 'h-10' : 'h-8'"
        :src="branding.brandLogoDark"
      />
    </template>
  </NuxtLink>
</template>

<script setup lang="ts">
import { useBranding } from '~/composables/app/branding';

defineProps<{ to: string; compact?: boolean; large?: boolean }>();
const branding = useBranding();
</script>
