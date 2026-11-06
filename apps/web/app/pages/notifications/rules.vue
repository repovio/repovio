<template>
  <div />
</template>

<script setup lang="ts">
definePageMeta({
  /** Redirects the legacy notification-rules route to channel management. */ middleware: () =>
    navigateTo('/notifications', { replace: true }),
});
</script>
