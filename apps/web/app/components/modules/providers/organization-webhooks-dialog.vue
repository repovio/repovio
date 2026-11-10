<template>
  <UModal
    v-model:open="open"
    :description="$t('organizationWebhooks.description', { provider: provider.displayName })"
    :dismissible="!pending"
    :close="!pending"
    :title="$t('organizationWebhooks.title')"
    :ui="{ content: 'sm:max-w-2xl max-h-[calc(100dvh-2rem)]', body: 'min-h-0 overflow-y-auto' }"
  >
    <template #body>
      <div class="min-w-0 space-y-6" :aria-busy="pending">
        <UAlert v-if="error" color="error" role="alert" :title="$t('organizationWebhooks.error')" />

        <UForm
          class="min-w-0 space-y-4"
          :schema="localizeFormSchema(ApiCreateOrganizationWebhookSchema, $t('forms.invalidValue'))"
          :state="form"
          @submit="save"
        >
          <UAlert
            v-if="draftError && !editingId"
            color="error"
            role="alert"
            :title="$t('organizationWebhooks.draftError')"
          />
          <UButton
            v-if="!editingId && !draft"
            color="neutral"
            variant="soft"
            :loading="draftPending"
            @click="loadDraft"
          >
            {{ $t('organizationWebhooks.retryDraft') }}
          </UButton>
          <h3 class="font-semibold">
            {{ $t(editingId ? 'organizationWebhooks.rotate' : 'organizationWebhooks.add') }}
          </h3>
          <UFormField :help="callbackHelp" :label="$t('repositories.webhook.callbackUrl')">
            <UInput class="w-full font-mono" readonly :model-value="callbackUrl" :ui="{ base: 'pe-10' }">
              <template #trailing>
                <UButton
                  type="button"
                  color="neutral"
                  size="xs"
                  variant="ghost"
                  icon="i-lucide-copy"
                  :disabled="!callbackUrl"
                  :aria-label="$t('repositories.webhook.copyUrl')"
                  @click="copy(callbackUrl)"
                />
              </template>
            </UInput>
          </UFormField>
          <UFormField name="scope" :label="scopeLabel" required>
            <UInput v-model="form.scope" class="w-full" :disabled="pending" :readonly="!!editingId" />
          </UFormField>
          <UFormField
            name="webhookSecret"
            :help="$t('organizationWebhooks.secretHelp')"
            :label="$t('repositories.webhook.secret')"
            required
          >
            <UInput
              v-model="form.webhookSecret"
              autocomplete="new-password"
              class="w-full font-mono"
              :ui="{ base: 'pe-20' }"
              :type="revealSecret ? 'text' : 'password'"
              :disabled="pending"
            >
              <template #trailing>
                <UButton
                  color="neutral"
                  size="xs"
                  variant="ghost"
                  :icon="revealSecret ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                  :aria-label="$t(revealSecret ? 'repositories.webhook.hideSecret' : 'repositories.webhook.showSecret')"
                  @click="revealSecret = !revealSecret"
                />
                <UButton
                  color="neutral"
                  size="xs"
                  variant="ghost"
                  icon="i-lucide-copy"
                  :disabled="!form.webhookSecret"
                  :aria-label="$t('repositories.webhook.copySecret')"
                  @click="copy(form.webhookSecret)"
                />
              </template>
            </UInput>
          </UFormField>
          <UButton color="neutral" variant="soft" :disabled="pending" @click="generateSecret">
            {{ $t('repositories.webhook.generateSecret') }}
          </UButton>
          <div class="space-y-2 rounded-lg bg-elevated/50 p-3 text-sm">
            <h4 class="font-medium">
              {{ $t('repositories.webhook.providerSetup') }}
            </h4>
            <p class="text-muted">
              {{ $t(`organizationWebhooks.instructions.${provider.providerType}`) }}
            </p>
            <p class="text-muted">
              {{ $t('organizationWebhooks.localConfiguration') }}
            </p>
          </div>
          <UAlert
            v-if="provider.providerType === 'GITLAB'"
            color="warning"
            variant="subtle"
            :title="$t('organizationWebhooks.gitlabTier')"
          />
          <UCheckbox
            v-if="editingId"
            v-model="rotationConfirmed"
            :disabled="pending"
            :label="$t('organizationWebhooks.rotationConfirm')"
          />
          <div class="flex flex-wrap gap-2">
            <UButton
              type="submit"
              :loading="pending && action === 'save'"
              :disabled="pending || (!editingId && !draft) || (!!editingId && !rotationConfirmed)"
            >
              {{ $t(editingId ? 'organizationWebhooks.rotate' : 'organizationWebhooks.add') }}
            </UButton>
            <UButton v-if="editingId" color="neutral" variant="soft" :disabled="pending" @click="startDraft">
              {{ $t('organizationWebhooks.addAnother') }}
            </UButton>
            <UButton
              v-if="editingId"
              color="error"
              variant="soft"
              :loading="pending && action === 'remove'"
              :disabled="pending"
              @click="remove"
            >
              {{ $t('repositories.webhook.remove') }}
            </UButton>
          </div>
        </UForm>
        <UAlert v-if="listError" color="error" role="alert" :title="$t('organizationWebhooks.error')" />
        <UButton v-if="!loaded" :loading="listPending" @click="load">
          {{ $t('organizationWebhooks.load') }}
        </UButton>
        <ModulesProvidersOrganizationWebhookConfigurations
          v-if="loaded"
          :configurations="configurations"
          :pending="pending"
          @edit="edit"
          @copy="copy"
        />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ApiCreateOrganizationWebhookSchema, localizeFormSchema } from '@repovio/schemas';
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { useOrganizationWebhooks } from '~/composables/api/organization-webhooks';
import { useDestructiveAction } from '~/composables/app/destructive-action';
import type { OrganizationWebhook, ProviderAccount } from '~/types/api/resources';

const props = defineProps<{ provider: ProviderAccount }>();
const open = defineModel<boolean>('open', { required: true });
const {
  configurations,
  draft,
  draftPending,
  draftError,
  listPending,
  listError,
  loadDraft,
  discard,
  pending,
  error,
  loaded,
  load,
  save: persist,
  remove: deleteConfiguration,
} = useOrganizationWebhooks(props.provider.id);
const { confirmDestructiveAction } = useDestructiveAction();
const { t } = useI18n();
const toast = useToast();
const scopeLabel = computed(
  /** Describe the provider's organization or group namespace. */ () =>
    t(
      props.provider.providerType === 'GITLAB' ? 'organizationWebhooks.groupPath' : 'organizationWebhooks.organization',
    ),
);
const form = reactive({ scope: '', webhookSecret: '' });
const editingId = ref<string>();
const callbackUrl = computed(
  /** Resolve only the selected configuration's server-provided callback address. */ () =>
    configurations.value.find(/** Match the active form selection. */ (hook) => hook.id === editingId.value)
      ?.callbackUrl ?? (!editingId.value ? (draft.value?.callbackUrl ?? '') : ''),
);
const callbackHelp = computed(
  /** Explain preview readiness without implying provider registration or delivery acceptance. */ () =>
    editingId.value
      ? undefined
      : t(draftPending.value ? 'organizationWebhooks.loadingCallback' : 'organizationWebhooks.unsavedCallback'),
);
const revealSecret = ref(false);
const rotationConfirmed = ref(false);
const action = ref<'save' | 'remove'>();

watch(
  /** Load on entry and discard plaintext on dismissal. */ () => open.value,
  /** Synchronize dialog lifecycle. */ (value) => {
    reset();
    discard();
    if (value) {
      void load();
      void loadDraft();
    }
  },
  { immediate: true, flush: 'sync' },
);

onBeforeUnmount(
  /** Discard transient plaintext and invalidate requests when switching provider accounts. */ () => {
    reset();
    discard();
  },
);

/** Start another unsaved setup with a fresh identity, clearing previous plaintext first. */
function startDraft(): void {
  reset();
  void loadDraft();
}

/** Reset transient input, including plaintext signing secrets. */
function reset(): void {
  editingId.value = undefined;
  form.scope = '';
  form.webhookSecret = '';
  revealSecret.value = false;
  rotationConfirmed.value = false;
}

/** Select a hook for rotation while never fetching its stored secret. */
function edit(hook: OrganizationWebhook): void {
  reset();
  editingId.value = hook.id;
  form.scope = hook.scope;
}

/** Generate a signing secret locally with browser cryptographic randomness. */
function generateSecret(): void {
  form.webhookSecret = Array.from(
    crypto.getRandomValues(new Uint8Array(32)),
    /** Encode each random byte. */ (byte) => byte.toString(16).padStart(2, '0'),
  ).join('');
  revealSecret.value = true;
}

/** Copy only explicitly requested setup data, reporting clipboard denial. */
async function copy(value: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    toast.add({ color: 'error', title: t('repositories.webhook.copyError') });
  }
}

/** Persist configuration and retain transient input so the administrator can copy the provider secret. */
async function save(): Promise<void> {
  if (pending.value || (!editingId.value && !draft.value) || (editingId.value && !rotationConfirmed.value)) return;
  action.value = 'save';
  const saved = await persist(
    { ...form, ...(!editingId.value && draft.value ? { id: draft.value.id } : {}) },
    editingId.value,
  );
  if (saved) {
    editingId.value = saved.id;
    form.scope = saved.scope;
    rotationConfirmed.value = false;
    toast.add({ color: 'success', title: t('repositories.webhook.saved') });
  }
}

/** Remove local configuration after the existing destructive-action confirmation. */
async function remove(): Promise<void> {
  const webhookId = editingId.value;
  if (!webhookId || pending.value) return;
  await confirmDestructiveAction(
    form.scope,
    /** Delete only the selected configuration and retain failures for retry. */ async () => {
      action.value = 'remove';
      if (!(await deleteConfiguration(webhookId))) throw new Error(t('organizationWebhooks.error'));
      startDraft();
    },
  );
}
</script>
