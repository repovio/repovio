<template>
  <UModal
    v-model:open="open"
    :description="$t('repositories.addDescription')"
    :dismissible="!addingRepository"
    :title="$t('repositories.addDialogTitle')"
    :ui="{ content: 'sm:max-w-3xl' }"
  >
    <template #body>
      <UAlert
        v-if="addingRepositoryError"
        color="error"
        icon="i-lucide-circle-alert"
        variant="subtle"
        :title="$t('repositories.addError')"
      />
      <UAlert
        v-else-if="providerAccountsError"
        color="error"
        icon="i-lucide-circle-alert"
        variant="subtle"
        :title="$t('repositories.providerLoadError')"
      />

      <UForm
        :schema="localizeFormSchema(selectionSchema, $t('forms.invalidValue'))"
        :state="selection"
        @submit="submitSelection"
      >
        <UStepper ref="stepper" class="mt-4" color="neutral" size="sm" :items="stepperItems">
          <template #provider>
            <div class="space-y-4">
              <p class="text-sm text-muted">{{ $t('repositories.providerDescription') }}</p>
              <UFormField name="providerAccountId" :label="$t('repositories.provider')" required>
                <USelectMenu
                  v-model="selectedProviderAccountId"
                  class="w-full"
                  value-key="value"
                  :items="providerOptions"
                  :loading="providerAccountsLoading"
                  :placeholder="$t('repositories.providerPlaceholder')"
                  searchable
                />
              </UFormField>
              <UAlert
                v-if="!providerAccountsLoading && !providerAccountsError && providerOptions.length === 0"
                color="warning"
                :title="$t('repositories.noEnabledProviders')"
              />
            </div>
          </template>

          <template #repository>
            <div class="space-y-4">
              <p class="text-sm text-muted">{{ $t('repositories.repositoryDescription') }}</p>
              <UAlert
                v-if="repositoriesError"
                color="error"
                icon="i-lucide-circle-alert"
                variant="subtle"
                :title="$t('repositories.repositoryLoadError')"
              />
              <UFormField name="providerRepositoryIds" :error="selectionError || undefined">
                <ModulesRepositoriesRepositorySelectionTable
                  :key="selectedProviderAccountId"
                  v-model:selected-repository-ids="selectedProviderRepositoryIds"
                  :loading="repositoriesLoading"
                  :repositories="availableRepositories"
                />
              </UFormField>
              <UAlert
                v-if="
                  !repositoriesLoading &&
                  !repositoriesError &&
                  selectedProviderAccountId &&
                  selectableRepositories.length === 0
                "
                color="info"
                :title="$t('repositories.noAvailableRepositories')"
              />
            </div>
          </template>
        </UStepper>

        <div class="mt-6 flex justify-between border-t border-default pt-4">
          <UButton
            color="neutral"
            icon="i-lucide-arrow-left"
            variant="soft"
            :label="$t('repositories.back')"
            :disabled="addingRepository || !stepper?.hasPrev"
            @click="stepper?.prev()"
          />
          <UButton
            v-if="stepper?.hasNext"
            type="submit"
            color="neutral"
            trailing-icon="i-lucide-arrow-right"
            variant="soft"
            :disabled="!selectedProviderAccountId || providerAccountsLoading || repositoriesLoading"
            :label="$t('repositories.next')"
            :loading="providerAccountsLoading || repositoriesLoading"
          />
          <UButton
            v-else
            type="submit"
            :disabled="selectedProviderRepositoryIds.length === 0 || addingRepository"
            :label="$t('repositories.addSelected', { count: selectedProviderRepositoryIds.length })"
            :loading="addingRepository"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui';
import { ApiCreateTrackedRepositorySchema, localizeFormSchema } from '@repovio/schemas';
import { computed, ref, watch } from 'vue';
import { z } from 'zod';

import { defineEmits, defineModel } from 'vue';
import { useRepovioApi } from '~/composables/api/repovio-api';
import { useProviderType } from '~/composables/enums/provider-type';
import type { ProviderAccount, ProviderRepository } from '~/types/api/resources';

const open = defineModel<boolean>('open', { required: true });
const emit = defineEmits<{
  created: [];
}>();

const { t } = useI18n();
const api = useRepovioApi();
const { getLabel: getProviderTypeLabel } = useProviderType();
const providerAccounts = ref<ProviderAccount[]>([]);
const providerAccountsLoading = ref(false);
const providerAccountsError = ref(false);
const availableRepositories = ref<ProviderRepository[]>([]);
const repositoriesLoading = ref(false);
const repositoriesError = ref(false);
const addingRepository = ref(false);
const addingRepositoryError = ref(false);
const selectedProviderAccountId = ref<string>();
const selectedProviderRepositoryIds = ref<string[]>([]);
const stepper = useTemplateRef('stepper');
const selectionError = ref('');
const selection = computed(
  /** Derives selection from the current reactive dependencies. */ () => ({
    providerAccountId: selectedProviderAccountId.value,
    providerRepositoryIds: selectedProviderRepositoryIds.value,
  }),
);
const selectionSchema = computed(
  /** Derives selection schema from the current reactive dependencies. */ () =>
    z.strictObject({
      providerAccountId: z.string({ error: t('forms.invalidValue') }).min(1, t('forms.invalidValue')),
      providerRepositoryIds: z
        .array(ApiCreateTrackedRepositorySchema.shape.providerRepositoryId)
        .min(stepper.value?.hasNext ? 0 : 1, t('forms.invalidValue')),
    }),
);
/** Validate each wizard stage before navigation or repository enrollment. */
async function submitSelection(
  event: FormSubmitEvent<{ providerAccountId: string; providerRepositoryIds: string[] }>,
): Promise<void> {
  selectionError.value = '';
  if (stepper.value?.hasNext) {
    stepper.value.next();
    return;
  }
  const visibleIds = new Set(
    selectableRepositories.value.map(
      /** Projects each entry using `repository.providerRepositoryId`. */ (repository) =>
        repository.providerRepositoryId,
    ),
  );
  if (
    !event.data.providerRepositoryIds.every(
      /** Checks whether every entry satisfies `visibleIds.has(id)`. */ (id) => visibleIds.has(id),
    )
  ) {
    selectionError.value = t('forms.invalidValue');
    return;
  }
  await addRepositories(event.data);
}

const stepperItems = computed(
  /** Derives stepper items from the current reactive dependencies. */ () => [
    { icon: 'i-lucide-plug-zap', slot: 'provider', title: t('repositories.addSteps.provider') },
    { icon: 'i-lucide-git-branch', slot: 'repository', title: t('repositories.addSteps.repository') },
  ],
);
const providerOptions = computed(
  /** Derives provider options from the current reactive dependencies. */ () =>
    providerAccounts.value.map(
      /** Projects each entry using `({ label: `${account.displayName} (${getProviderTypeLabel(account.providerType)})`, value: account.id, })`. */ (
        account,
      ) => ({
        label: `${account.displayName} (${getProviderTypeLabel(account.providerType)})`,
        value: account.id,
      }),
    ),
);
const selectableRepositories = computed(
  /** Derives selectable repositories from the current reactive dependencies. */ () =>
    availableRepositories.value.filter(
      /** Keeps entries matching `!repository.tracked`. */ (repository) => !repository.tracked,
    ),
);

watch(
  open,
  /** Synchronizes add dialog when the observed state changes. */ (isOpen) => {
    if (isOpen) void initialize();
  },
);

watch(
  selectedProviderAccountId,
  /** Synchronizes add dialog when the observed state changes. */ (providerAccountId) => {
    selectedProviderRepositoryIds.value = [];
    availableRepositories.value = [];
    repositoriesError.value = false;
    if (providerAccountId) void loadAvailableRepositories(providerAccountId);
  },
);

/** Reset the dialog before loading enabled provider accounts. */
async function initialize(): Promise<void> {
  addingRepositoryError.value = false;
  availableRepositories.value = [];
  providerAccountsError.value = false;
  repositoriesError.value = false;
  selectedProviderAccountId.value = undefined;
  selectedProviderRepositoryIds.value = [];
  providerAccountsLoading.value = true;

  try {
    const { data } = await api.providerAccounts.list();
    providerAccounts.value = data.items.filter(
      /** Keeps entries matching `account.enabled`. */ (account) => account.enabled,
    );
  } catch {
    providerAccountsError.value = true;
  } finally {
    providerAccountsLoading.value = false;
  }
}

/** Load the provider-owned repository list for the selected provider account. */
async function loadAvailableRepositories(providerAccountId: string): Promise<void> {
  repositoriesLoading.value = true;
  repositoriesError.value = false;

  try {
    const { data } = await api.providerAccounts.listRepositories(providerAccountId);
    if (selectedProviderAccountId.value === providerAccountId) availableRepositories.value = data;
  } catch {
    if (selectedProviderAccountId.value === providerAccountId) repositoriesError.value = true;
  } finally {
    if (selectedProviderAccountId.value === providerAccountId) repositoriesLoading.value = false;
  }
}

/** Add all selected provider repositories and retain any failed selections for retry. */
async function addRepositories(input: { providerAccountId: string; providerRepositoryIds: string[] }): Promise<void> {
  const providerAccountId = input.providerAccountId;
  const repositoryIds = [...input.providerRepositoryIds];
  if (!providerAccountId || repositoryIds.length === 0) return;

  addingRepository.value = true;
  addingRepositoryError.value = false;
  try {
    const results = await Promise.allSettled(
      repositoryIds.map(
        /** Projects each entry using `api.providerAccounts.addRepository(providerAccountId, providerRepositoryId)`. */ (
          providerRepositoryId,
        ) => api.providerAccounts.addRepository(providerAccountId, providerRepositoryId),
      ),
    );
    const successfulIds = new Set(
      repositoryIds.filter(
        /** Keeps entries matching `results[index]?.status === 'fulfilled'`. */ (_, index) =>
          results[index]?.status === 'fulfilled',
      ),
    );
    const failedIds = repositoryIds.filter(
      /** Keeps entries matching `results[index]?.status === 'rejected'`. */ (_, index) =>
        results[index]?.status === 'rejected',
    );

    if (successfulIds.size > 0) {
      availableRepositories.value = availableRepositories.value.map(
        /** Projects each entry using `successfulIds.has(repository.providerRepositoryId) ? { ...repository, tracked: true } : repository`. */ (
          repository,
        ) => (successfulIds.has(repository.providerRepositoryId) ? { ...repository, tracked: true } : repository),
      );
      emit('created');
    }
    if (failedIds.length > 0) {
      selectedProviderRepositoryIds.value = failedIds;
      addingRepositoryError.value = true;
      return;
    }

    open.value = false;
  } finally {
    addingRepository.value = false;
  }
}
</script>
