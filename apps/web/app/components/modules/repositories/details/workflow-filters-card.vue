<template>
  <UCard :ui="{ body: 'space-y-4' }">
    <template #header>
      <div>
        <h2 class="font-semibold">{{ $t('repositoryDetails.workflowFilters') }}</h2>
        <p class="text-sm text-muted">{{ $t('repositoryDetails.workflowFiltersDescription') }}</p>
      </div>
    </template>

    <UAlert
      v-if="error"
      color="error"
      icon="i-lucide-circle-alert"
      variant="subtle"
      :title="$t('repositoryDetails.saveError')"
    />
    <UForm
      class="flex flex-col gap-2 sm:flex-row"
      :schema="localizeFormSchema(filterSchema, $t('forms.invalidValue'))"
      :state="form"
      @submit="addWorkflowFilter"
    >
      <UFormField name="mode" :label="$t('repositoryDetails.mode')" :ui="{ label: 'sr-only' }">
        <USelect v-model="form.mode" class="sm:w-36" :items="filterModeOptions" />
      </UFormField>
      <UFormField name="pattern" class="flex-1" :label="$t('repositoryDetails.pattern')" :ui="{ label: 'sr-only' }">
        <UInput v-model="form.pattern" class="w-full" :placeholder="$t('repositoryDetails.filterPlaceholder')" />
      </UFormField>
      <UButton
        icon="i-lucide-plus"
        type="submit"
        :aria-label="$t('repositoryDetails.addFilter')"
        :disabled="adding"
        :loading="adding"
      />
    </UForm>

    <UTable
      sticky
      :column-pinning="{ right: ['actions'] }"
      :columns="columns"
      :data="filters"
      :empty="$t('repositoryDetails.noWorkflowFilters')"
      :loading="loading"
    >
      <template #mode-cell="{ row }">
        <UBadge variant="subtle" :color="row.original.mode === 'DENY' ? 'error' : 'success'">
          {{ row.original.mode === 'DENY' ? $t('repositoryDetails.deny') : $t('repositoryDetails.allow') }}
        </UBadge>
      </template>
      <template #actions-header="{ column }">
        <span class="flex justify-end">{{ column.columnDef.header }}</span>
      </template>
      <template #actions-cell="{ row }">
        <div class="flex justify-end">
          <UTooltip :portal="false" :text="$t('repositoryDetails.delete')">
            <span class="inline-flex">
              <UButton
                color="error"
                icon="i-lucide-trash-2"
                variant="ghost"
                :aria-label="$t('repositoryDetails.delete')"
                :disabled="isPending(row.original.id)"
                :loading="isPending(row.original.id)"
                @click="removeWorkflowFilter(row.original.id)"
              />
            </span>
          </UTooltip>
        </div>
      </template>
    </UTable>
  </UCard>
</template>

<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui';
import { ApiCreateWorkflowFilterSchema, localizeFormSchema } from '@repovio/schemas';
import { computed, onMounted, reactive, ref } from 'vue';
import { z } from 'zod';

import { defineProps } from 'vue';
import { useRepovioApi } from '~/composables/api/repovio-api';
import { usePendingActions } from '~/composables/use-pending-actions';
import type { WorkflowFilter } from '~/types/api/resources';

const props = defineProps<{
  repositoryId: string;
}>();

const { t } = useI18n();
const api = useRepovioApi();
const { isPending, run: runPendingAction } = usePendingActions();
const filters = ref<WorkflowFilter[]>([]);
const loading = ref(true);
const adding = ref(false);
const error = ref(false);
const form = reactive<{ mode: WorkflowFilter['mode']; pattern: string }>({ mode: 'ALLOW', pattern: '' });
const filterSchema = computed(
  /** Derives filter schema from the current reactive dependencies. */ () =>
    ApiCreateWorkflowFilterSchema.extend({
      mode: z.unknown(),
      pattern: z.unknown(),
    }).transform(
      /** Normalizes input using the filterSchema mapping. */ (value, context) => {
        const parsed = ApiCreateWorkflowFilterSchema.safeParse(value, {
          /** Returns the localized validation error for this field. */ error: () => t('forms.invalidValue'),
        });
        if (!parsed.success) {
          for (const issue of parsed.error.issues)
            context.addIssue({ code: 'custom', path: issue.path, message: t('forms.invalidValue') });
          return z.NEVER;
        }
        if (!parsed.data.pattern.trim()) {
          context.addIssue({ code: 'custom', path: ['pattern'], message: t('forms.invalidValue') });
          return z.NEVER;
        }
        return parsed.data;
      },
    ),
);
type WorkflowFilterValues = z.output<typeof filterSchema.value>;
const filterModeOptions = computed(
  /** Derives filter mode options from the current reactive dependencies. */ () => [
    { label: t('repositoryDetails.allow'), value: 'ALLOW' },
    { label: t('repositoryDetails.deny'), value: 'DENY' },
  ],
);
const columns = computed(
  /** Derives columns from the current reactive dependencies. */ () => [
    { accessorKey: 'mode', header: t('repositoryDetails.mode') },
    { accessorKey: 'pattern', header: t('repositoryDetails.pattern') },
    { id: 'actions', header: t('repositoryDetails.actions') },
  ],
);

/** Load filters attached to the displayed repository. */
async function load(): Promise<void> {
  loading.value = true;
  error.value = false;
  try {
    const { data } = await api.repositories.listWorkflowFilters(props.repositoryId);
    filters.value = data;
  } catch {
    error.value = true;
  } finally {
    loading.value = false;
  }
}

/** Validate and create a repository-scoped workflow filter. */
async function addWorkflowFilter(event: FormSubmitEvent<WorkflowFilterValues>): Promise<void> {
  adding.value = true;
  error.value = false;
  try {
    const { data } = await api.repositories.createWorkflowFilter(props.repositoryId, {
      mode: event.data.mode,
      pattern: event.data.pattern,
    });
    filters.value = [...filters.value, data].sort(
      /** Orders entries using `left.pattern.localeCompare(right.pattern)`. */ (left, right) =>
        left.pattern.localeCompare(right.pattern),
    );
    form.pattern = '';
  } catch {
    error.value = true;
  } finally {
    adding.value = false;
  }
}

/** Delete a workflow filter without reloading the unchanged table rows. */
async function removeWorkflowFilter(filterId: string): Promise<void> {
  await runPendingAction(
    filterId,
    /** Performs remove workflow filter while retaining the initiating action’s pending state. */ async () => {
      error.value = false;
      try {
        await api.repositories.deleteWorkflowFilter(props.repositoryId, filterId);
        filters.value = filters.value.filter(
          /** Keeps entries matching `filter.id !== filterId`. */ (filter) => filter.id !== filterId,
        );
      } catch {
        error.value = true;
      }
    },
  );
}

onMounted(/** Initializes component subscriptions and data after mounting. */ () => void load());
</script>
