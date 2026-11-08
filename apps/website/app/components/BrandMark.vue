<template>
  <NuxtLink class="flex min-w-0 items-center gap-3" :to="localePath('/')" :aria-label="config.brandName">
    <img
      v-if="logo"
      class="h-9 max-w-40 shrink-0 object-contain"
      :src="!compact && logo === '/logo.svg' ? wordmark : logo"
      :alt="config.brandName"
    />
    <span v-else class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
      <UIcon name="i-lucide-boxes" class="size-5" />
    </span>
    <span v-if="!compact && logo !== '/logo.svg'" class="truncate text-base font-bold tracking-tight text-highlighted">
      {{ config.brandName }}
    </span>
  </NuxtLink>
</template>

<script setup lang="ts">
defineProps<{ compact?: boolean }>();
const localePath = useLocalePath();
const config = useRuntimeConfig().public;
const mode = useColorMode();
const wordmark = computed(
  /** Return `(mode.value === 'dark' ? '/logo-wordmark-dark.svg' : '/logo-wordmark-light.svg')` when invoked. */ () =>
    mode.value === 'dark' ? '/logo-wordmark-dark.svg' : '/logo-wordmark-light.svg',
);
const logo = computed(
  /** Return `safeUrl( mode.value === 'dark' ? config.brandLogoDark || config.brandLogoLight : config.brandLogoLight || config.brandLogoDark, )` when invoked. */ () =>
    safeUrl(
      mode.value === 'dark'
        ? config.brandLogoDark || config.brandLogoLight
        : config.brandLogoLight || config.brandLogoDark,
    ),
);
</script>
