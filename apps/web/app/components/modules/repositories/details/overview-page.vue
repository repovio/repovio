<template>
  <div v-if="repository" class="space-y-6 p-4 sm:p-6 lg:p-8">
    <ModulesRepositoriesDetailsGeneralCard :editable="false" :repository="repository" />
    <ModulesRepositoriesDetailsSyncStatusCard :repository="repository" />

    <div class="grid gap-6 xl:grid-cols-3">
      <ModulesRepositoriesDetailsActivitySection kind="workflowRuns" :repository-id="repository.id" />
      <ModulesRepositoriesDetailsActivitySection kind="issues" :repository-id="repository.id" />
      <ModulesRepositoriesDetailsActivitySection kind="pullRequests" :repository-id="repository.id" />
      <ModulesRepositoriesDetailsActivitySection
        v-if="canViewAlerts"
        kind="securityAlerts"
        :repository-id="repository.id"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRepositoryDetail } from '~/composables/api/repository-detail';
import { useAuthStore } from '~/store/auth';
const { repository } = useRepositoryDetail();
const auth = useAuthStore();
const canViewAlerts = computed(
  /** Preserve Security Alert visibility in Overview previews. */ () =>
    ['MANAGER', 'SYSTEM_ADMIN'].includes(auth.user?.role ?? ''),
);
</script>
