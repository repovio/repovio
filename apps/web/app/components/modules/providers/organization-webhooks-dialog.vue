<template>
  <UModal
    v-model:open="open"
    :description="$t('organizationWebhooks.description', { provider: provider.displayName })"
    :dismissible="!pending"
    :close="!pending"
    :title="$t('organizationWebhooks.title')"
  >
    <template #body>
      <div class="space-y-5" :aria-busy="pending">
        <UAlert v-if="error" color="error" role="alert" :title="$t('organizationWebhooks.error')" />
        <UButton v-if="!loaded" :loading="pending" @click="load">
          {{ $t('organizationWebhooks.load') }}
        </UButton>
        <template v-else>
          <UAlert
            color="info"
            :description="$t(`organizationWebhooks.instructions.${provider.providerType}`)"
            :title="$t('repositories.webhook.providerSetup')"
          />
          <UAlert
            v-if="provider.providerType === 'GITLAB'"
            color="warning"
            :title="$t('organizationWebhooks.gitlabTier')"
          />
          <p class="text-sm text-muted">
            {{ $t('organizationWebhooks.localConfiguration') }}
          </p>
          <p v-if="!configurations.length" class="text-sm text-muted">
            {{ $t('organizationWebhooks.empty') }}
          </p>
          <ul v-else class="space-y-3">
            <li v-for="hook in configurations" :key="hook.id" class="space-y-2 rounded-lg border border-default p-3">
              <div class="flex items-center justify-between gap-3">
                <span class="min-w-0 truncate font-medium">{{ hook.scope }}</span>
                <UButton color="neutral" size="sm" variant="soft" :disabled="pending" @click="edit(hook)">
                  {{ $t('organizationWebhooks.edit') }}
                </UButton>
              </div>
              <UFormField :label="$t('repositories.webhook.callbackUrl')">
                <UInput class="w-full font-mono" readonly :model-value="hook.callbackUrl">
                  <template #trailing>
                    <UButton
                      color="neutral"
                      size="xs"
                      variant="ghost"
                      icon="i-lucide-copy"
                      :aria-label="$t('repositories.webhook.copyUrl')"
                      @click="copy(hook.callbackUrl)"
                    />
                  </template>
                </UInput>
              </UFormField>
              <p class="text-sm text-muted">
                {{ deliveryLabel(hook) }}
              </p>
            </li>
          </ul>
          <UForm
            class="space-y-4 border-t border-default pt-4"
            :schema="localizeFormSchema(ApiCreateOrganizationWebhookSchema, $t('forms.invalidValue'))"
            :state="form"
            @submit="save"
          >
            <h3 class="font-semibold">
              {{ $t(editingId ? 'organizationWebhooks.rotate' : 'organizationWebhooks.add') }}
            </h3>
            <UFormField name="scope" :label="scopeLabel" required>
              <UInput v-model="form.scope" class="w-full" :disabled="pending" :readonly="!!editingId" />
            </UFormField>
            <UFormField
              :help="callbackUrl ? undefined : $t('organizationWebhooks.callbackAvailableAfterSave')"
              :label="$t('repositories.webhook.callbackUrl')"
            >
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
                    :aria-label="
                      $t(revealSecret ? 'repositories.webhook.hideSecret' : 'repositories.webhook.showSecret')
                    "
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
                :disabled="pending || (!!editingId && !rotationConfirmed)"
              >
                {{ $t(editingId ? 'organizationWebhooks.rotate' : 'organizationWebhooks.add') }}
              </UButton>
              <UButton v-if="editingId" color="neutral" variant="soft" :disabled="pending" @click="reset">
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
        </template>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ApiCreateOrganizationWebhookSchema, localizeFormSchema } from '@repovio/schemas';
import { computed, reactive, ref, watch } from 'vue';
import { useOrganizationWebhooks } from '~/composables/api/organization-webhooks';
import { useDestructiveAction } from '~/composables/app/destructive-action';
import { useDateTime } from '~/composables/use-date-time';
import type { OrganizationWebhook, ProviderAccount } from '~/types/api/resources';

const props = defineProps<{ provider: ProviderAccount }>();
const open = defineModel<boolean>('open', { required: true });
const {
  configurations,
  pending,
  error,
  loaded,
  load,
  save: persist,
  remove: deleteConfiguration,
} = useOrganizationWebhooks(props.provider.id);
const { confirmDestructiveAction } = useDestructiveAction();
const { formatDateTime } = useDateTime();
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
      ?.callbackUrl ?? '',
);
const revealSecret = ref(false);
const rotationConfirmed = ref(false);
const action = ref<'save' | 'remove'>();

/** Format receipt metadata without implying that provider registration has been verified. */
function deliveryLabel(hook: OrganizationWebhook): string {
  return t('organizationWebhooks.lastDelivery', {
    value: hook.lastDeliveryAt ? formatDateTime(hook.lastDeliveryAt) : t('repositories.webhook.neverDelivered'),
  });
}

watch(
  /** Load on entry and discard plaintext on dismissal. */ () => open.value,
  /** Synchronize dialog lifecycle. */ (value) => {
    reset();
    if (value) void load();
  },
  { immediate: true },
);

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
  if (pending.value || (editingId.value && !rotationConfirmed.value)) return;
  action.value = 'save';
  const saved = await persist({ ...form }, editingId.value);
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
      reset();
    },
  );
}
</script>
