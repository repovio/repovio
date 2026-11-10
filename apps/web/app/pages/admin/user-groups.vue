<template>
  <ModulesUserGroupsTable />
</template>

<script setup lang="ts">
import { computed } from 'vue';
definePageMeta({ fullWidth: true, middleware: 'admin' });
const { t } = useI18n();
useHead({ title: computed(/** Localizes the administration page title. */ () => t('userGroups.title')) });
</script>
