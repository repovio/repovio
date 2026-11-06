<template>
  <UModal
    v-model:open="open"
    :description="$t('githubApp.description')"
    :dismissible="!pending"
    :title="$t('githubApp.title')"
  >
    <template #body>
      <div class="space-y-6" :aria-busy="pending">
        <UAlert v-if="error" color="error" role="alert" :title="$t('githubApp.error')" />
        <UButton v-if="!configuration" :loading="pending" @click="load">{{ $t('githubApp.load') }}</UButton>
        <template v-else>
          <UAlert color="info" :description="$t('githubApp.setupHelp')" :title="$t('githubApp.setup')" />
          <UForm
            class="space-y-4"
            :schema="localizeFormSchema(formSchema, $t('forms.invalidValue'))"
            :state="form"
            @submit="saveConfiguration"
          >
            <div class="grid gap-4 sm:grid-cols-2">
              <UFormField name="appId" :label="$t('githubApp.appId')" required>
                <UInput v-model="form.appId" class="w-full" inputmode="numeric" :disabled="pending" />
              </UFormField>
              <UFormField name="slug" :label="$t('githubApp.slug')" required>
                <UInput v-model="form.slug" class="w-full" :disabled="pending" />
              </UFormField>
            </div>
            <UFormField
              name="privateKey"
              :description="configuration.configured ? $t('githubApp.keepSecret') : undefined"
              :label="$t('githubApp.privateKey')"
              :required="!configuration.configured"
            >
              <UTextarea
                v-model="form.privateKey"
                autocomplete="off"
                class="w-full font-mono"
                :disabled="pending"
                :rows="3"
              />
            </UFormField>
            <UFormField
              name="webhookSecret"
              :description="configuration.configured ? $t('githubApp.keepSecret') : undefined"
              :label="$t('githubApp.webhookSecret')"
              :required="!configuration.configured"
            >
              <UInput
                v-model="form.webhookSecret"
                autocomplete="new-password"
                class="w-full"
                type="password"
                :disabled="pending"
              />
            </UFormField>
            <UFormField :label="$t('githubApp.webhookUrl')">
              <UInput class="w-full" readonly :model-value="configuration.webhookUrl" />
            </UFormField>
            <div class="flex flex-wrap gap-2">
              <UButton type="submit" :disabled="pending" :loading="pending && action === 'save'">
                {{ $t('githubApp.save') }}
              </UButton>
              <UButton
                v-if="configuration.configured"
                color="error"
                variant="outline"
                :disabled="pending"
                :loading="pending && action === 'remove'"
                @click="removeConfiguration"
              >
                {{ $t('githubApp.remove') }}
              </UButton>
            </div>
          </UForm>
          <section v-if="configuration.configured" class="space-y-4 border-t border-default pt-4">
            <h3 class="font-semibold">{{ $t('githubApp.installations') }}</h3>
            <p class="text-sm text-muted">{{ $t('githubApp.installHelp') }}</p>
            <div class="flex flex-wrap gap-2">
              <UButton
                color="neutral"
                target="_blank"
                rel="noopener noreferrer"
                variant="outline"
                :to="configuration.installationUrl!"
              >
                {{ $t('githubApp.install') }}
              </UButton>
              <UButton
                color="neutral"
                variant="outline"
                :disabled="pending"
                :loading="pending && action === 'refresh'"
                @click="refreshInstallations"
              >
                {{ $t('githubApp.refresh') }}
              </UButton>
            </div>
            <p v-if="refreshed && !installations.length" class="text-sm text-muted">{{ $t('githubApp.empty') }}</p>
            <ul class="space-y-3">
              <li
                v-for="installation in installations"
                :key="installation.installationId"
                class="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-default p-3"
              >
                <div class="min-w-0 flex-1 space-y-2">
                  <span class="break-all font-medium">{{ installation.account }}</span>
                  <UFormField :label="`${$t('providers.name')} (${installation.account})`">
                    <UInput
                      v-model="displayNames[installation.installationId]"
                      class="w-full"
                      :disabled="pending || installation.connected"
                    />
                  </UFormField>
                </div>
                <UBadge v-if="installation.suspended" color="warning">{{ $t('githubApp.states.SUSPENDED') }}</UBadge>
                <UButton
                  :disabled="
                    pending ||
                    installation.connected ||
                    installation.suspended ||
                    !displayNames[installation.installationId]?.trim()
                  "
                  :loading="pending && action === installation.installationId"
                  @click="connectInstallation(installation)"
                >
                  {{ $t(installation.connected ? 'githubApp.connected' : 'githubApp.connect') }}
                </UButton>
              </li>
            </ul>
          </section>
        </template>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { SaveGitHubAppSchema, localizeFormSchema, type GitHubAppInstallation } from '@repovio/schemas';
import { reactive, ref, watch } from 'vue';
import { z } from 'zod';
import { useGitHubApp } from '~/composables/api/github-app';

const open = defineModel<boolean>('open', { default: false });
const props = defineProps<{ refreshAccounts: () => Promise<void> }>();
const { configuration, installations, pending, error, load, save, refresh, remove, connect } = useGitHubApp();
const action = ref('');
const refreshed = ref(false);
const displayNames = reactive<Record<string, string>>({});
watch(installations, (rows) => {
  for (const row of rows) displayNames[row.installationId] ??= row.account;
});
const formSchema = SaveGitHubAppSchema.extend({
  privateKey: z.preprocess((value) => (value === '' ? undefined : value), SaveGitHubAppSchema.shape.privateKey),
  webhookSecret: z.preprocess((value) => (value === '' ? undefined : value), SaveGitHubAppSchema.shape.webhookSecret),
});
const form = reactive({ appId: '', slug: '', privateKey: '', webhookSecret: '' });

watch(configuration, (value) => {
  form.appId = value?.appId ?? '';
  form.slug = value?.slug ?? '';
});
watch(open, async (value) => {
  form.privateKey = '';
  form.webhookSecret = '';
  if (value) await load();
});

/** Save or rotate credentials, clearing plaintext fields as soon as persistence succeeds. */
async function saveConfiguration(): Promise<void> {
  action.value = 'save';
  await save(
    {
      appId: form.appId,
      slug: form.slug,
      privateKey: form.privateKey || undefined,
      webhookSecret: form.webhookSecret || undefined,
    },
    () => {
      form.privateKey = '';
      form.webhookSecret = '';
      refreshed.value = false;
    },
  );
}

/** Refresh installation choices after the administrator installs the App on GitHub. */
async function refreshInstallations(): Promise<void> {
  action.value = 'refresh';
  await refresh();
  if (!error.value) refreshed.value = true;
}

/** Disconnect unused local App configuration; the server rejects connected installations. */
async function removeConfiguration(): Promise<void> {
  action.value = 'remove';
  await remove();
}

/** Connect a verified choice and refresh the parent provider table. */
async function connectInstallation(installation: GitHubAppInstallation): Promise<void> {
  action.value = installation.installationId;
  await connect(installation.installationId, displayNames[installation.installationId]!.trim(), props.refreshAccounts);
}
</script>
