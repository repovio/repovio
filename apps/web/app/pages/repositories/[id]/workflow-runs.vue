<template>
  <ModulesWorkflowRunsTablePage
    :key="repositoryId"
    embedded
    endpoint="workflow-runs"
    name="workflow-runs"
    searchable
    :repository-id="repositoryId"
    :breadcrumbs="[]"
    :title="$t('workflowRuns.title')"
    :empty="$t('workflowRuns.empty')"
    :load-error="$t('workflowRuns.loadError')"
  />
</template>

<script setup lang="ts">
import { useRepositoryDetail } from '~/composables/api/repository-detail';
definePageMeta({ fullWidth: true });
const { repositoryId } = useRepositoryDetail();
</script>
