<template>
  <NuxtPage />
</template>

<script setup lang="ts">
import { computed } from 'vue';
definePageMeta({ fullWidth: true });
const { t } = useI18n();
useHead({
  title: computed(/** Derives title from the current reactive dependencies. */ () => t('notifications.title')),
});
</script>
