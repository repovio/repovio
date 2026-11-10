<template>
  <ModulesRepositoriesDetailsWebhookCard
    v-if="repository"
    :configuration="webhookConfiguration"
    :load-error="webhookConfigurationError"
    :loading="webhookConfigurationLoading"
    :repository-id="repository.id"
    @updated="webhookConfiguration = $event"
  />
</template>

<script setup lang="ts">
import { onMounted, onScopeDispose, ref } from 'vue';
import { useRepositoryDetail } from '~/composables/api/repository-detail';
import { useRepovioApi } from '~/composables/api/repovio-api';
import type { RepositoryWebhookConfiguration } from '~/types/api/resources';
const { repositoryId, repository } = useRepositoryDetail();
const api = useRepovioApi();
const webhookConfiguration = ref<RepositoryWebhookConfiguration>();
const webhookConfigurationLoading = ref(true);
const webhookConfigurationError = ref(false);
let active = true;
onScopeDispose(
  /** Ignore metadata that completes after leaving Settings. */ () => {
    active = false;
  },
);
/** Load safe webhook status separately so failures do not hide repository activity. */
async function loadWebhookConfiguration(): Promise<void> {
  try {
    const { data } = await api.repositories.webhookConfigurations();
    if (active)
      webhookConfiguration.value = data.find(
        /** Select only this Repository's safe metadata. */ (configuration) =>
          configuration.repositoryId === repositoryId.value,
      );
  } catch {
    if (active) webhookConfigurationError.value = true;
  } finally {
    if (active) webhookConfigurationLoading.value = false;
  }
}
onMounted(loadWebhookConfiguration);
</script>
