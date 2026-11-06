<template>
  <UCard class="lg:col-span-2" :ui="{ body: 'space-y-4' }">
    <template #header>
      <div>
        <h2 class="font-semibold">{{ repository.owner }}/{{ repository.name }}</h2>
        <p class="text-sm text-muted">
          {{ editable ? $t('repositoryDetails.generalDescription') : $t('repositories.description') }}
        </p>
      </div>
    </template>

    <dl v-if="!editable" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <div>
        <dt class="text-xs font-medium uppercase tracking-wide text-muted">{{ $t('repositories.columns.status') }}</dt>
        <dd class="mt-1">
          <UBadge variant="subtle" :color="repository.enabled ? 'success' : 'neutral'">
            {{ repository.enabled ? $t('repositories.enabled') : $t('repositories.disabled') }}
          </UBadge>
        </dd>
      </div>
      <div>
        <dt class="text-xs font-medium uppercase tracking-wide text-muted">
          {{ $t('repositories.columns.retention') }}
        </dt>
        <dd class="mt-1 text-sm">
          {{ repository.workflowRunRetentionDays ?? $t('repositories.default') }}
        </dd>
      </div>
      <div>
        <dt class="text-xs font-medium uppercase tracking-wide text-muted">
          {{ $t('repositoryDetails.issueRetention') }}
        </dt>
        <dd class="mt-1 text-sm">{{ repository.issueRetentionDays ?? $t('repositories.default') }}</dd>
      </div>
      <div>
        <dt class="text-xs font-medium uppercase tracking-wide text-muted">
          {{ $t('repositoryDetails.pullRequestRetention') }}
        </dt>
        <dd class="mt-1 text-sm">{{ repository.pullRequestRetentionDays ?? $t('repositories.default') }}</dd>
      </div>
      <div>
        <dt class="text-xs font-medium uppercase tracking-wide text-muted">
          {{ $t('repositories.columns.lastSync') }}
        </dt>
        <dd class="mt-1 text-sm">{{ formatLastSync(repository.lastSyncAt) }}</dd>
      </div>
    </dl>

    <UAlert
      v-if="saveError"
      color="error"
      icon="i-lucide-circle-alert"
      variant="subtle"
      :title="$t('repositoryDetails.saveError')"
    />
    <UForm
      v-if="editable"
      class="grid gap-4 lg:grid-cols-3"
      :schema="localizeFormSchema(retentionSchema, $t('forms.invalidValue'))"
      :state="retentionDays"
      @submit="saveRetention"
    >
      <UFormField
        name="workflowRunRetentionDays"
        :help="$t('repositoryDetails.retentionHelp')"
        :label="$t('repositoryDetails.retention')"
      >
        <UInput v-model="retentionDays.workflowRunRetentionDays" max="3650" min="1" type="number" :disabled="saving" />
      </UFormField>
      <UFormField
        name="issueRetentionDays"
        :help="$t('repositoryDetails.retentionHelp')"
        :label="$t('repositoryDetails.issueRetention')"
      >
        <UInput v-model="retentionDays.issueRetentionDays" max="3650" min="1" type="number" :disabled="saving" />
      </UFormField>
      <UFormField
        name="pullRequestRetentionDays"
        :help="$t('repositoryDetails.retentionHelp')"
        :label="$t('repositoryDetails.pullRequestRetention')"
      >
        <UInput v-model="retentionDays.pullRequestRetentionDays" max="3650" min="1" type="number" :disabled="saving" />
      </UFormField>
      <div class="flex justify-end lg:col-span-3">
        <UButton type="submit" :disabled="saving" :label="$t('repositoryDetails.save')" :loading="saving" />
      </div>
    </UForm>
  </UCard>
</template>

<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui';
import { ApiUpdateRepositorySchema, localizeFormSchema } from '@repovio/schemas';
import { computed, reactive, ref, watch } from 'vue';
import { z } from 'zod';

import { defineEmits, defineProps } from 'vue';
import { useRepovioApi } from '~/composables/api/repovio-api';
import { useDateTime } from '~/composables/use-date-time';
import type { Repository } from '~/types/api/resources';

const props = defineProps<{
  editable: boolean;
  repository: Repository;
}>();
const emit = defineEmits<{
  updated: [repository: Repository];
}>();

const { t } = useI18n();
const api = useRepovioApi();
const { formatDateTime } = useDateTime();
const retentionDays = reactive({ issueRetentionDays: '', pullRequestRetentionDays: '', workflowRunRetentionDays: '' });
/** Normalize form controls before validating the shared nullable retention contract. */
function retentionValue() {
  return z.unknown().transform(
    /** Normalizes input using the retentionValue mapping. */ (value, context) => {
      const normalized = typeof value === 'string' ? (value.trim() === '' ? null : Number(value)) : value;
      const parsed = ApiUpdateRepositorySchema.shape.issueRetentionDays.unwrap().safeParse(normalized);
      if (!parsed.success) {
        context.addIssue({ code: 'custom', message: t('forms.invalidValue') });
        return z.NEVER;
      }
      return parsed.data;
    },
  );
}
const retentionSchema = computed(
  /** Derives retention schema from the current reactive dependencies. */ () =>
    ApiUpdateRepositorySchema.pick({
      issueRetentionDays: true,
      pullRequestRetentionDays: true,
      workflowRunRetentionDays: true,
    }).extend({
      issueRetentionDays: retentionValue(),
      pullRequestRetentionDays: retentionValue(),
      workflowRunRetentionDays: retentionValue(),
    }),
);
type RetentionValues = z.output<typeof retentionSchema.value>;
const saving = ref(false);
const saveError = ref(false);

watch(
  /** Reads the reactive dependencies observed by this watcher. */
  () => props.repository,
  /** Synchronizes general card when the observed state changes. */
  (repository) => {
    retentionDays.issueRetentionDays = repository.issueRetentionDays?.toString() ?? '';
    retentionDays.pullRequestRetentionDays = repository.pullRequestRetentionDays?.toString() ?? '';
    retentionDays.workflowRunRetentionDays = repository.workflowRunRetentionDays?.toString() ?? '';
  },
  { immediate: true },
);

/** Format the last successful synchronization using the active interface locale. */
function formatLastSync(lastSyncAt: string | null): string {
  return lastSyncAt ? formatDateTime(lastSyncAt) : t('repositories.neverSynced');
}

/** Persist a valid explicit retention override or restore the provider default. */
async function saveRetention(event: FormSubmitEvent<RetentionValues>): Promise<void> {
  const { issueRetentionDays, pullRequestRetentionDays, workflowRunRetentionDays } = event.data;

  saving.value = true;
  saveError.value = false;
  try {
    await api.repositories.update(props.repository.id, {
      enabled: props.repository.enabled,
      issueRetentionDays,
      pullRequestRetentionDays,
      workflowRunRetentionDays,
    });
    emit('updated', { ...props.repository, issueRetentionDays, pullRequestRetentionDays, workflowRunRetentionDays });
  } catch {
    saveError.value = true;
  } finally {
    saving.value = false;
  }
}
</script>
