<template>
  <div class="min-w-64 max-w-96 space-y-2 whitespace-normal">
    <p class="text-xs text-warning">
      {{ warningLabel }}
    </p>
    <UModal :description="$t('jobs.diagnostics.description')" :title="$t('jobs.diagnostics.title')">
      <UButton
        color="neutral"
        size="xs"
        variant="outline"
        :aria-label="$t('jobs.diagnostics.detailsFor', { repository: repositoryLabel })"
        :label="$t('jobs.diagnostics.details')"
      />
      <template #body>
        <div class="space-y-4 whitespace-normal">
          <dl class="space-y-2 text-sm">
            <div>
              <dt class="font-medium">
                {{ $t('jobs.columns.repository') }}
              </dt>
              <dd class="break-words">
                {{ repositoryLabel }}
              </dd>
            </div>
            <div>
              <dt class="font-medium">
                {{ $t('jobs.columns.provider') }}
              </dt>
              <dd class="break-words">
                {{ job.providerName }} ({{ job.providerType }})
              </dd>
            </div>
          </dl>
          <UAlert color="warning" icon="i-lucide-triangle-alert" :title="warningLabel" />
          <p class="text-sm">
            {{ $t('jobs.diagnostics.otherScopes') }}
          </p>
          <h3 class="font-medium">
            {{ $t('jobs.diagnostics.nextSteps') }}
          </h3>
          <ol class="list-decimal space-y-2 pl-5 text-sm">
            <template v-if="job.providerType === 'GITHUB'">
              <li>
                {{ $t('jobs.diagnostics.githubPermissions', { kinds: kindLabels }) }}
              </li>
              <li>
                {{ $t('jobs.diagnostics.githubApp') }}
              </li>
              <li>
                {{ $t('jobs.diagnostics.githubToken') }}
              </li>
              <li>
                {{ $t('jobs.diagnostics.githubFeature') }}
              </li>
            </template>
            <template v-else-if="job.providerType === 'GITLAB'">
              <li>
                {{ $t('jobs.diagnostics.gitlabAccess') }}
              </li>
              <li>
                {{ $t('jobs.diagnostics.gitlabFeature') }}
              </li>
            </template>
            <li v-else>
              {{ $t('jobs.diagnostics.providerAccess') }}
            </li>
            <li>
              {{ $t('jobs.diagnostics.retry') }}
            </li>
          </ol>
          <UButton v-if="isAdmin" color="neutral" to="/admin/providers" variant="outline">
            {{ $t('jobs.diagnostics.providerAccounts') }}
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { useAuthStore } from '~/store/auth';
import type { RepositorySyncJob } from '~/types/api/resources';

const props = defineProps<{ job: RepositorySyncJob }>();
const { t } = useI18n();
const auth = useAuthStore();
const isAdmin = computed(
  /** Restricts provider administration navigation to system administrators. */ () =>
    auth.user?.role === 'SYSTEM_ADMIN',
);
const repositoryLabel = computed(
  /** Identifies the repository whose alert synchronization needs attention. */ () =>
    `${props.job.repositoryOwner}/${props.job.repositoryName}`,
);
const kindLabels = computed(
  /** Localizes the alert categories reported as unavailable by the job. */ () =>
    props.job.warningKinds
      .map(/** Names one unavailable alert category. */ (kind) => t(`securityAlerts.kindTitles.${kind}`))
      .join(', '),
);
const warningLabel = computed(
  /** Summarizes unavailable alert categories without claiming a specific provider-side cause. */ () =>
    t('jobs.warningKinds', { kinds: kindLabels.value }),
);
</script>
