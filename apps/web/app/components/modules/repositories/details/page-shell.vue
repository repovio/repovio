<template>
  <LayoutPage :breadcrumbs="breadcrumbs" :padded="false" :title="repositoryName">
    <template #actions>
      <ModulesRepositoriesDeleteButton
        v-if="isAdmin && repository"
        :key="repository.id"
        :repository="repository"
        :disabled="refreshing || syncing"
        :after-delete="handleRepositoryDeleted"
      />
      <UButton
        v-if="isAdmin && repository"
        color="neutral"
        icon="i-lucide-refresh-cw"
        variant="soft"
        :label="$t('repositoryDetails.refresh')"
        :loading="refreshing"
        @click="refreshRepository"
      />
      <UButton
        v-if="isAdmin && repository"
        icon="i-lucide-download"
        :label="$t('repositoryDetails.syncWorkflowRuns')"
        :loading="syncing"
        @click="syncRepository"
      />
      <UButton
        v-if="repository"
        color="neutral"
        icon="i-tabler-external-link"
        rel="noreferrer"
        target="_blank"
        variant="soft"
        :label="$t('dashboard.openProvider')"
        :to="repository.url"
      />
    </template>

    <template #navigation>
      <nav class="min-w-0 w-full overflow-x-auto" :aria-label="$t('repositoryDetails.navigation')">
        <UNavigationMenu
          highlight
          class="w-max min-w-full"
          :items="navigation"
          :ui="{ list: 'flex-nowrap', link: 'whitespace-nowrap' }"
        />
      </nav>
    </template>
    <div v-if="loading" class="space-y-6 p-4 sm:p-6">
      <USkeleton class="h-44 w-full" />
      <USkeleton class="h-48 w-full" />
      <div class="grid gap-6 xl:grid-cols-3">
        <USkeleton v-for="index in 3" :key="index" class="h-72 w-full" />
      </div>
    </div>
    <div v-else-if="loadError" class="space-y-4 p-4">
      <UAlert
        color="error"
        icon="i-lucide-circle-alert"
        variant="subtle"
        :title="$t(forbidden ? 'repositoryDetails.unauthorized' : 'repositoryDetails.loadError')"
      />
      <UButton v-if="!forbidden" color="neutral" :label="$t('dashboard.refresh')" @click="reload" />
    </div>
    <slot v-else-if="repository" />
  </LayoutPage>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRepositoryDetail } from '~/composables/api/repository-detail';
import { useAuthStore } from '~/store/auth';
const {
  repositoryId,
  repository,
  loading,
  loadError,
  forbidden,
  refreshing,
  syncing,
  refreshRepository,
  syncRepository,
  reload,
} = useRepositoryDetail();
const { t } = useI18n();
const auth = useAuthStore();
const isAdmin = computed(
  /** Derives is admin from the current reactive dependencies. */ () => auth.user?.role === 'SYSTEM_ADMIN',
);
const canViewAlerts = computed(
  /** Derives can view alerts from the current reactive dependencies. */ () =>
    ['MANAGER', 'SYSTEM_ADMIN'].includes(auth.user?.role ?? ''),
);
const repositoryName = computed(
  /** Derives repository name from the current reactive dependencies. */ () =>
    repository.value ? `${repository.value.owner}/${repository.value.name}` : t('repositoryDetails.title'),
);
const breadcrumbs = computed(
  /** Keep Repository identity visible across child sections. */ () => [
    { icon: 'i-lucide-layout-dashboard', label: t('layout.dashboard'), to: '/' },
    { icon: 'i-lucide-git-branch', label: t('layout.repositories'), to: '/repositories' },
    { label: repositoryName.value, to: `/repositories/${encodeURIComponent(repositoryId.value)}` },
  ],
);
const navigation = computed(
  /** Expose only sections allowed by the existing global role. */ () => {
    const path = `/repositories/${encodeURIComponent(repositoryId.value)}`;
    return [
      { label: t('repositoryDetails.overview'), icon: 'i-lucide-layout-dashboard', to: path, exact: true },
      { label: t('repositoryDetails.activity.workflowRuns'), icon: 'i-lucide-workflow', to: `${path}/workflow-runs` },
      { label: t('repositoryDetails.activity.issues'), icon: 'i-lucide-circle-dot', to: `${path}/issues` },
      {
        label: t('repositoryDetails.activity.pullRequests'),
        icon: 'i-lucide-git-pull-request',
        to: `${path}/pull-requests`,
      },
      ...(canViewAlerts.value
        ? [
            {
              label: t('securityAlerts.title'),
              icon: 'i-lucide-shield-alert',
              to: `${path}/security-alerts`,
            },
          ]
        : []),
      ...(isAdmin.value
        ? [{ label: t('repositoryDetails.settings'), icon: 'i-lucide-settings', to: `${path}/settings` }]
        : []),
    ];
  },
);
useHead({ title: repositoryName });
/** Return to a fresh repository list after permanent local deletion. */
async function handleRepositoryDeleted(): Promise<void> {
  await navigateTo('/repositories');
}
</script>
