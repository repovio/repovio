<template>
  <UModal
    v-model:open="open"
    :description="$t('providers.connectDescription')"
    :dismissible="!busy"
    :title="$t('providers.addDialogTitle')"
  >
    <template #body>
      <UAlert
        v-if="connectionError"
        color="error"
        icon="i-lucide-circle-alert"
        variant="subtle"
        :title="$t(usePat ? 'providers.credentialsError' : 'providers.oauthError')"
      />
      <UForm
        class="mt-4 space-y-6"
        :schema="localizeFormSchema(providerFormSchema, $t('forms.invalidValue'))"
        :state="form"
        @submit="addProvider"
      >
        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField name="displayName" :label="$t('providers.name')">
            <UInput v-model="form.displayName" class="w-full" :placeholder="$t('providers.namePlaceholder')" />
          </UFormField>
          <UFormField name="providerType" :label="$t('providers.type')">
            <EnumsProviderTypeSelect
              v-model="form.providerType"
              class="w-full"
              :placeholder="$t('providers.typePlaceholder')"
            />
          </UFormField>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField v-if="oauthAvailable" :label="$t('providers.authentication')">
            <USelect v-model="authenticationMethod" class="w-full" :items="authenticationOptions" />
          </UFormField>
          <UFormField v-if="usePat" name="accessToken" :label="$t('providers.accessToken')">
            <UInput
              v-model="form.accessToken"
              autocomplete="off"
              class="w-full"
              type="password"
              :placeholder="$t('providers.accessTokenPlaceholder')"
            />
          </UFormField>
          <UFormField name="baseUrl" :label="$t('providers.baseUrl')" :required="requiresBaseUrl">
            <UInput
              v-model="form.baseUrl"
              autocomplete="url"
              class="w-full"
              inputmode="url"
              type="url"
              :placeholder="$t('providers.baseUrlPlaceholder')"
            />
          </UFormField>
        </div>

        <div class="flex justify-end border-t border-default pt-4">
          <UButton
            type="submit"
            :disabled="busy"
            :label="usePat ? $t('providers.addAndVerify') : $t('providers.connect')"
            :loading="busy"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui';
import { ApiCreateProviderAccountSchema, ApiStartProviderOAuthSchema, localizeFormSchema } from '@repovio/schemas';
import { computed, reactive, ref, watch } from 'vue';
import { z } from 'zod';

import { defineEmits, defineModel } from 'vue';
import { useRepovioApi } from '~/composables/api/repovio-api';
import { useUnsavedChangesGuard } from '~/composables/use-unsaved-changes-guard';
import { providerOAuthFormSchema, providerPatFormSchema, type ProviderType } from '~/types/api/resources';

type AuthenticationMethod = 'OAUTH' | 'PAT';

const open = defineModel<boolean>('open', { required: true });
const emit = defineEmits<{
  created: [];
}>();

const { t } = useI18n();
const api = useRepovioApi();
const submitting = ref(false);
const loadingAuthenticationOptions = ref(false);
const connectionError = ref(false);
const oauthProviderTypes = ref<ProviderType[]>([]);
const authenticationMethod = ref<AuthenticationMethod>('PAT');
const form = reactive({ accessToken: '', baseUrl: '', displayName: '', providerType: 'GITHUB' as ProviderType });
const { reset: resetDirtyState } = useUnsavedChangesGuard(form);
const oauthAvailable = computed(
  /** Derives oauth available from the current reactive dependencies. */ () =>
    oauthProviderTypes.value.includes(form.providerType),
);
const usePat = computed(
  /** Derives use pat from the current reactive dependencies. */ () =>
    !oauthAvailable.value || authenticationMethod.value === 'PAT',
);
const requiresBaseUrl = computed(
  /** Derives requires base url from the current reactive dependencies. */ () => form.providerType === 'GITEA',
);
const providerFormSchema = computed(
  /** Derives provider form schema from the current reactive dependencies. */ () =>
    usePat.value ? providerPatFormSchema : providerOAuthFormSchema,
);
const busy = computed(
  /** Derives busy from the current reactive dependencies. */ () =>
    submitting.value || loadingAuthenticationOptions.value,
);
const authenticationOptions = computed(
  /** Derives authentication options from the current reactive dependencies. */ () => [
    { icon: 'i-tabler-key', label: t('providers.authenticationOAuth'), value: 'OAUTH' },
    { icon: 'i-tabler-password', label: t('providers.authenticationPat'), value: 'PAT' },
  ],
);

watch(
  open,
  /** Synchronizes add dialog when the observed state changes. */ async (isOpen) => {
    if (!isOpen) return;

    Object.assign(form, { accessToken: '', baseUrl: '', displayName: '', providerType: 'GITHUB' });
    connectionError.value = false;
    resetDirtyState();
    loadingAuthenticationOptions.value = true;

    try {
      const { data } = await api.providerAccounts.authenticationOptions();
      oauthProviderTypes.value = data.oauthProviderTypes;
      authenticationMethod.value = oauthProviderTypes.value.includes('GITHUB') ? 'OAUTH' : 'PAT';
    } catch {
      oauthProviderTypes.value = [];
      authenticationMethod.value = 'PAT';
    } finally {
      loadingAuthenticationOptions.value = false;
    }
  },
);

/** Validate and persist a PAT account, or begin the provider-controlled OAuth flow. */
async function addProvider(
  event: FormSubmitEvent<z.output<typeof providerPatFormSchema> | z.output<typeof providerOAuthFormSchema>>,
): Promise<void> {
  submitting.value = true;
  connectionError.value = false;
  try {
    if (usePat.value) {
      await api.providerAccounts.create({
        ...ApiCreateProviderAccountSchema.parse({ ...event.data, baseUrl: event.data.baseUrl?.trim() || undefined }),
      });
      open.value = false;
      resetDirtyState();
      emit('created');
      return;
    }

    const { data } = await api.providerAccounts.authorize(
      ApiStartProviderOAuthSchema.parse({
        baseUrl: event.data.baseUrl?.trim() || undefined,
        displayName: event.data.displayName,
        providerType: event.data.providerType,
      }),
    );
    resetDirtyState();
    window.location.assign(data.authorizationUrl);
  } catch {
    connectionError.value = true;
  } finally {
    submitting.value = false;
  }
}
</script>
