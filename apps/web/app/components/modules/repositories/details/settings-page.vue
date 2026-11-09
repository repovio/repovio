<template>
  <section v-if="repository" class="space-y-4 p-4 sm:p-6 lg:p-8">
    <div>
      <h2 class="text-lg font-semibold">
        {{ $t('repositoryDetails.settings') }}
      </h2>
      <p class="text-sm text-muted">
        {{ $t('repositoryDetails.generalDescription') }}
      </p>
    </div>
    <ModulesRepositoriesDetailsGeneralCard
      :editable="true"
      :repository="repository"
      @updated="handleRepositoryUpdated"
    />
    <ModulesRepositoriesDetailsWebhookCard
      :configuration="webhookConfiguration"
      :load-error="webhookConfigurationError"
      :loading="webhookConfigurationLoading"
      :repository-id="repository.id"
      @updated="webhookConfiguration = $event"
    />
    <div class="grid gap-6 lg:grid-cols-2">
      <ModulesRepositoriesDetailsWorkflowFiltersCard :repository-id="repository.id" />
      <ModulesRepositoriesDetailsMembersCard :repository-id="repository.id" />
      <ModulesRepositoriesDetailsGroupsCard :repository-id="repository.id" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, onScopeDispose, ref } from 'vue';
import { useRepositoryDetail } from '~/composables/api/repository-detail';
import { useRepovioApi } from '~/composables/api/repovio-api';
import type { RepositoryWebhookConfiguration } from '~/types/api/resources';
const { repositoryId, repository, handleRepositoryUpdated } = useRepositoryDetail();
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
