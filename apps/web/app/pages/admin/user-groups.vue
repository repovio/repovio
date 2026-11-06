<template>
  <LayoutPage
    :breadcrumbs="[
      { icon: 'i-lucide-layout-dashboard', label: $t('layout.dashboard'), to: '/' },
      { icon: 'i-lucide-users-round', label: $t('userGroups.title') },
    ]"
    :description="$t('userGroups.description')"
    :padded="false"
    :title="$t('userGroups.title')"
  >
    <ModulesUserGroupsTable />
  </LayoutPage>
</template>

<script setup lang="ts">
import { computed } from 'vue';
definePageMeta({ fullWidth: true, middleware: 'admin' });
const { t } = useI18n();
useHead({ title: computed(/** Localizes the administration page title. */ () => t('userGroups.title')) });
</script>
