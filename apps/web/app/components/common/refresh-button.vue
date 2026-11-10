<template>
  <UTooltip :text="$t('dashboard.refresh')">
    <UButton
      square
      data-manual-refresh
      color="neutral"
      icon="i-lucide-refresh-cw"
      size="md"
      variant="ghost"
      :aria-label="$t('dashboard.refresh')"
      :aria-busy="loading"
      :disabled="loading"
      :loading="loading"
      @click="emit('refresh')"
    />
  </UTooltip>
</template>

<script setup lang="ts">
/** Parent-owned pending state covers every read participating in the visible view refresh. */
withDefaults(defineProps<{ loading?: boolean }>(), { loading: false });
const emit = defineEmits<{ refresh: [] }>();
</script>
