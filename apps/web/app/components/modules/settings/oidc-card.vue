<template>
  <UCard :ui="{ body: 'space-y-6' }">
    <template #header>
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="font-semibold">
            {{ $t('settings.oidc.title') }}
          </h2>
          <p class="text-sm text-muted">
            {{ $t('settings.oidc.description') }}
          </p>
        </div>
        <UBadge variant="subtle" :color="config?.enabled ? 'success' : 'neutral'">
          {{ config?.enabled ? $t('settings.oidc.enabled') : $t('settings.oidc.disabled') }}
        </UBadge>
      </div>
    </template>

    <UAlert
      v-if="loadError"
      color="error"
      icon="i-lucide-circle-alert"
      variant="subtle"
      :title="$t('settings.oidc.loadError')"
    />
    <div v-else-if="loading" class="space-y-4">
      <USkeleton class="h-12 w-full" />
      <USkeleton class="h-24 w-full" />
      <USkeleton class="h-24 w-full" />
    </div>
    <UForm
      v-else
      ref="oidcForm"
      class="space-y-6"
      :schema="localizeFormSchema(oidcFormSchema, $t('forms.invalidValue'))"
      :state="form"
      @submit="save"
    >
      <UAlert
        v-if="config?.clientSecretConfigured && !config.secretDecryptable"
        color="error"
        icon="i-lucide-shield-alert"
        variant="subtle"
        :title="$t('settings.oidc.secretUnavailable')"
      />
      <UAlert
        v-if="saveError"
        color="error"
        icon="i-lucide-circle-alert"
        variant="subtle"
        :title="$t('settings.oidc.saveError')"
      />
      <UAlert
        v-else-if="saved"
        color="success"
        icon="i-lucide-circle-check"
        variant="subtle"
        :title="$t('settings.oidc.saved')"
      />

      <div class="flex items-center justify-between gap-4 rounded-md bg-elevated p-4">
        <div>
          <p class="font-medium">
            {{ $t('settings.oidc.enable') }}
          </p>
          <p class="text-sm text-muted">
            {{ $t('settings.oidc.enableHelp') }}
          </p>
        </div>
        <USwitch v-model="form.enabled" :disabled="saving" />
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField name="providerName" :label="$t('settings.oidc.providerName')">
          <UInput v-model="form.providerName" class="w-full" :disabled="saving" />
        </UFormField>
        <UFormField name="clientId" :label="$t('settings.oidc.clientId')" required>
          <UInput v-model="form.clientId" class="w-full" autocomplete="off" :disabled="saving" />
        </UFormField>
      </div>

      <UFormField name="issuer" :help="$t('settings.oidc.issuerHelp')" :label="$t('settings.oidc.issuer')" required>
        <UInput
          v-model="form.issuer"
          class="w-full"
          placeholder="https://auth.example.com/application/o/repovio/"
          :disabled="saving"
        />
      </UFormField>

      <UFormField name="callbackUrl" :help="$t('settings.oidc.callbackHelp')" :label="$t('settings.oidc.callbackUrl')">
        <UInput class="w-full font-mono" :model-value="config?.callbackUrl" readonly>
          <template #trailing>
            <UButton
              type="button"
              color="neutral"
              icon="i-lucide-copy"
              size="xs"
              variant="ghost"
              :aria-label="$t('settings.oidc.copy')"
              @click="copyCallback"
            />
          </template>
        </UInput>
      </UFormField>

      <UFormField name="clientSecret" :help="secretHelp" :label="$t('settings.oidc.clientSecret')">
        <UInput
          v-model="form.clientSecret"
          class="w-full"
          autocomplete="new-password"
          type="password"
          :disabled="saving || form.clientSecretClear"
        />
      </UFormField>
      <UCheckbox
        v-model="form.clientSecretClear"
        :disabled="saving || !config?.clientSecretConfigured"
        :label="$t('settings.oidc.clearSecret')"
      />

      <UFormField name="scopes" :help="$t('settings.oidc.scopesHelp')" :label="$t('settings.oidc.scopes')">
        <UInput v-model="form.scopes" class="w-full" :disabled="saving" />
      </UFormField>
      <UFormField
        name="groupsClaim"
        :help="$t('settings.oidc.groupsClaimHelp')"
        :label="$t('settings.oidc.groupsClaim')"
      >
        <UInput v-model="form.groupsClaim" class="w-full" :disabled="saving" />
      </UFormField>

      <div class="grid gap-4 lg:grid-cols-3">
        <UFormField name="systemAdministratorGroups" :label="$t('settings.oidc.systemAdministratorGroups')">
          <UTextarea v-model="form.systemAdministratorGroups" class="w-full" :disabled="saving" :rows="4" />
        </UFormField>
        <UFormField name="managerGroups" :label="$t('settings.oidc.managerGroups')">
          <UTextarea v-model="form.managerGroups" class="w-full" :disabled="saving" :rows="4" />
        </UFormField>
        <UFormField name="viewerGroups" :label="$t('settings.oidc.viewerGroups')">
          <UTextarea v-model="form.viewerGroups" class="w-full" :disabled="saving" :rows="4" />
        </UFormField>
      </div>

      <div v-if="config?.observedGroups.length" class="space-y-2">
        <p class="text-sm font-medium">
          {{ $t('settings.oidc.observedGroups') }}
        </p>
        <div class="flex flex-wrap gap-2">
          <UBadge v-for="group in config.observedGroups" :key="group" color="neutral" variant="subtle">
            {{ group }}
          </UBadge>
        </div>
      </div>

      <UCheckbox
        v-model="form.allowUnmatchedViewer"
        :disabled="saving"
        :label="$t('settings.oidc.allowUnmatchedViewer')"
      />
      <UCheckbox v-model="form.allowHttpIssuer" :disabled="saving" :label="$t('settings.oidc.allowHttpIssuer')" />
      <UAlert
        v-if="form.allowHttpIssuer"
        color="warning"
        icon="i-lucide-triangle-alert"
        variant="subtle"
        :title="$t('settings.oidc.httpWarning')"
      />

      <UAlert
        v-if="checkResult"
        variant="subtle"
        :color="checkResult.ok ? 'success' : 'error'"
        :icon="checkResult.ok ? 'i-lucide-circle-check' : 'i-lucide-circle-alert'"
        :title="checkResult.ok ? $t('settings.oidc.checkSuccess') : $t('settings.oidc.checkFailed')"
        :description="checkResult.ok ? checkDetails : checkResult.code"
      />

      <div class="flex flex-wrap justify-end gap-2 border-t border-default pt-6">
        <UButton
          type="button"
          color="neutral"
          variant="outline"
          :disabled="dirty"
          :label="$t('settings.oidc.check')"
          :loading="checking"
          @click="check"
        />
        <UButton type="submit" icon="i-lucide-save" :label="$t('settings.save')" :loading="saving" />
      </div>
    </UForm>
  </UCard>
</template>

<script setup lang="ts">
import { localizeFormSchema } from '@repovio/schemas';
import type { FormSubmitEvent } from '@nuxt/ui';
import { ApiUpdateOidcConfigSchema } from '@repovio/schemas';
import { computed, onMounted, reactive, ref, useTemplateRef } from 'vue';
import { z } from 'zod';

import { useRepovioApi } from '~/composables/api/repovio-api';
import type { OidcCheckResult, OidcConfig, UpdateOidcConfig } from '~/types/api/auth';

const api = useRepovioApi();
const oidcForm = useTemplateRef('oidcForm');
const { t } = useI18n();
const toast = useToast();
const config = ref<OidcConfig | null>(null);
const loading = ref(true);
const loadError = ref(false);
const saving = ref(false);
const saveError = ref(false);
const saved = ref(false);
const checking = ref(false);
const checkResult = ref<OidcCheckResult | null>(null);
const baseline = ref('');
const form = reactive({
  allowHttpIssuer: false,
  allowUnmatchedViewer: false,
  clientId: '',
  clientSecret: '',
  clientSecretClear: false,
  enabled: false,
  groupsClaim: 'groups',
  issuer: '',
  managerGroups: '',
  providerName: '',
  scopes: 'openid profile email',
  systemAdministratorGroups: '',
  viewerGroups: '',
});
/** Editable text values are normalized into the shared OIDC request contract before submission. */
const oidcFormBaseSchema = ApiUpdateOidcConfigSchema.pick({
  allowHttpIssuer: true,
  allowUnmatchedViewer: true,
  clientSecretClear: true,
  enabled: true,
}).extend({
  allowHttpIssuer: z.boolean(),
  allowUnmatchedViewer: z.boolean(),
  clientId: z.string(),
  clientSecret: z.string(),
  clientSecretClear: z.boolean(),
  enabled: z.boolean(),
  groupsClaim: z.string(),
  issuer: z.string(),
  managerGroups: z.string(),
  providerName: z.string(),
  scopes: z.string(),
  systemAdministratorGroups: z.string(),
  viewerGroups: z.string(),
});
type OidcForm = z.output<typeof oidcFormBaseSchema>;
const oidcFormSchema = computed(
  /** Derives oidc form schema from the current reactive dependencies. */ () =>
    oidcFormBaseSchema.superRefine(
      /** Validates input against the oidcFormSchema predicate. */ (data, context) => {
        /** Adds a localized validation issue at the specified form path. */
        const fail = (path: string): void =>
          context.addIssue({ code: 'custom', message: t('forms.invalidValue'), path: [path] });
        const parsed = ApiUpdateOidcConfigSchema.safeParse(oidcInput(data));
        if (!parsed.success) {
          for (const issue of parsed.error.issues) fail(String(issue.path[0] ?? 'issuer'));
        }
        if (data.enabled) {
          if (!data.clientId.trim()) fail('clientId');
          if (!data.issuer.trim()) fail('issuer');
        }
        if (data.issuer.trim()) {
          const issuer = z
            .url({ protocol: data.allowHttpIssuer ? /^https?$/ : /^https$/ })
            .safeParse(data.issuer.trim());
          if (!issuer.success) fail('issuer');
        }
      },
    ),
);

/** Build the write-only request without sending an unchanged stored client secret. */
function oidcInput(data: OidcForm): UpdateOidcConfig {
  const input: UpdateOidcConfig = {
    allowHttpIssuer: data.allowHttpIssuer,
    allowUnmatchedViewer: data.allowUnmatchedViewer,
    clientId: data.clientId.trim() || null,
    enabled: data.enabled,
    groupsClaim: data.groupsClaim.trim(),
    issuer: data.issuer.trim() || null,
    managerGroups: lines(data.managerGroups),
    providerName: data.providerName.trim() || null,
    scopes: data.scopes.split(/\s+/).filter(Boolean),
    systemAdministratorGroups: lines(data.systemAdministratorGroups),
    viewerGroups: lines(data.viewerGroups),
  };
  if (data.clientSecretClear) input.clientSecretClear = true;
  else if (data.clientSecret) input.clientSecret = data.clientSecret;
  return input;
}

const serialized = computed(
  /** Derives serialized from the current reactive dependencies. */ () => JSON.stringify(form),
);
const dirty = computed(
  /** Derives dirty from the current reactive dependencies. */ () => serialized.value !== baseline.value,
);
const secretHelp = computed(
  /** Derives secret help from the current reactive dependencies. */ () =>
    config.value?.clientSecretConfigured ? t('settings.oidc.secretConfigured') : t('settings.oidc.secretOptional'),
);
const checkDetails = computed(
  /** Derives check details from the current reactive dependencies. */ () =>
    checkResult.value?.ok
      ? [checkResult.value.idTokenAlgorithm, checkResult.value.tokenEndpointAuthenticationMethod]
          .filter(Boolean)
          .join(' · ')
      : '',
);

/** Copies persisted OpenID Connect settings into the editable form. */
function apply(value: OidcConfig): void {
  config.value = value;
  Object.assign(form, {
    allowHttpIssuer: value.allowHttpIssuer,
    allowUnmatchedViewer: value.allowUnmatchedViewer,
    clientId: value.clientId ?? '',
    clientSecret: '',
    clientSecretClear: false,
    enabled: value.enabled,
    groupsClaim: value.groupsClaim,
    issuer: value.issuer ?? '',
    managerGroups: value.managerGroups.join('\n'),
    providerName: value.providerName ?? '',
    scopes: value.scopes.join(' '),
    systemAdministratorGroups: value.systemAdministratorGroups.join('\n'),
    viewerGroups: value.viewerGroups.join('\n'),
  });
  baseline.value = JSON.stringify(form);
}

/** Splits and trims multiline form input, discarding empty entries. */
function lines(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map(/** Projects each entry using `item.trim()`. */ (item) => item.trim())
    .filter(Boolean);
}

/** Loads oidc card. */
async function load(): Promise<void> {
  loading.value = true;
  loadError.value = false;
  try {
    apply((await api.oidc.config()).data);
  } catch {
    loadError.value = true;
  } finally {
    loading.value = false;
  }
}

/** Saves oidc card. */
async function save(event: FormSubmitEvent<OidcForm>): Promise<void> {
  saving.value = true;
  saveError.value = false;
  saved.value = false;
  checkResult.value = null;
  const input = oidcInput(event.data);
  try {
    apply((await api.oidc.update(input)).data);
    saved.value = true;
  } catch {
    saveError.value = true;
  } finally {
    saving.value = false;
  }
}

/** Checks oidc card. */
async function check(): Promise<void> {
  if (!(await oidcForm.value?.validate({ silent: true }))) return;
  checking.value = true;
  checkResult.value = null;
  try {
    checkResult.value = (await api.oidc.check()).data;
  } catch {
    checkResult.value = { code: 'request_failed', ok: false };
  } finally {
    checking.value = false;
  }
}

/** Copies the configured OpenID Connect callback URL to the clipboard. */
async function copyCallback(): Promise<void> {
  if (!config.value?.callbackUrl) return;
  await navigator.clipboard.writeText(config.value.callbackUrl);
  toast.add({ color: 'success', title: t('settings.oidc.copied') });
}

onMounted(/** Initializes component subscriptions and data after mounting. */ () => void load());
</script>
