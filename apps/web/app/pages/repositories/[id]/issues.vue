<template>
  <ModulesWorkItemsTablePage :key="repositoryId" embedded kind="issue" :repository-id="repositoryId" />
</template>

<script setup lang="ts">
import { useRepositoryDetail } from '~/composables/api/repository-detail';
definePageMeta({ fullWidth: true });
const { repositoryId } = useRepositoryDetail();
</script>
