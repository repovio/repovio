<template>
  <ModulesWorkItemsTablePage kind="pull-request" />
</template>

<script setup lang="ts">
definePageMeta({ fullWidth: true });

const { t } = useI18n();
useHead({
  title: computed(/** Derives title from the current reactive dependencies. */ () => t('pullRequests.title')),
});
</script>
