<template>
  <UModal
    v-model:open="open"
    :description="$t('notifications.channels.dialogDescription')"
    :dismissible="!submitting"
    :title="$t(channel ? 'notifications.channels.editTitle' : 'notifications.channels.createTitle')"
  >
    <template #body>
      <ol class="mb-5 flex flex-wrap gap-3" :aria-label="$t('notifications.wizard.steps')">
        <li
          v-for="(name, index) in ['identity', 'destination', 'events', 'review']"
          :key="name"
          :aria-current="step === index ? 'step' : undefined"
          :class="step === index ? 'font-semibold text-primary' : 'text-muted'"
        >
          {{ index + 1 }}. {{ $t(`notifications.wizard.${name}`) }}
        </li>
      </ol>
      <UAlert
        v-if="saveError"
        class="mb-4"
        color="error"
        icon="i-lucide-circle-alert"
        variant="subtle"
        :title="$t(persisted ? 'notifications.loadError' : 'notifications.channels.saveError')"
      />
      <UForm
        ref="channelForm"
        class="space-y-5"
        :schema="localizeFormSchema(channelFormSchema, $t('forms.invalidValue'))"
        :state="form"
        @submit="submit"
      >
        <div ref="stepContent" tabindex="-1" :inert="submitting || persisted">
          <ModulesNotificationsChannelIdentityStep
            v-if="step === 0"
            v-model:form="form"
            :channel="channel"
            :type-options="typeOptions"
            :push-availability="browserPushAvailability"
            :push-refreshing="browserPushRefreshing"
            @retry="props.onRefreshBrowserPush?.()"
          />
          <ModulesNotificationsChannelDestinationStep
            v-else-if="step === 1"
            v-model:form="form"
            :channel="channel"
            :show-configuration="showConfiguration"
            :security-options="securityOptions"
            :gotify-priority-options="gotifyPriorityOptions"
            :ntfy-priority-options="ntfyPriorityOptions"
            :user-options="userOptions"
          />
          <ModulesNotificationsChannelEventsStep
            v-else-if="step === 2"
            v-model:form="form"
            :event-types="eventTypes"
            :repository-options="repositoryOptions"
          />
          <ModulesNotificationsChannelReviewStep
            v-else
            :form="form"
            :preview="preview"
            :preview-status="previewStatus"
            :previewing="previewing"
            :can-preview="canPreview"
            @preview="runPreview"
          />
        </div>
        <div class="flex justify-between gap-3 border-t border-default pt-4">
          <UButton
            v-if="step > 0"
            type="button"
            color="neutral"
            variant="soft"
            :label="$t('notifications.wizard.back')"
            :disabled="submitting || persisted"
            @click="back"
          />
          <span v-else />
          <UButton v-if="step < 3" type="button" :label="$t('notifications.wizard.next')" @click="nextStep" />
          <UButton
            v-else
            type="submit"
            :disabled="!canSave || previewing"
            :label="$t(persisted ? 'notifications.navbar.retry' : 'common.save')"
            :loading="submitting"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { localizeFormSchema } from '@repovio/schemas';
import { nextTick, ref, watch } from 'vue';
import { useRepovioApi } from '~/composables/api/repovio-api';
import { useNotificationChannelDraft, type ChannelDraftProps } from '~/composables/app/notification-channel-draft';
const props = defineProps<ChannelDraftProps>();
const open = defineModel<boolean>('open', { required: true });
const { t } = useI18n();
const {
  form,
  eventTypes,
  channelForm,
  channelFormSchema,
  step,
  nextStep,
  back,
  submit,
  preview,
  previewStatus,
  previewing,
  runPreview,
  submitting,
  saveError,
  persisted,
  canSave,
  canPreview,
  typeOptions,
  repositoryOptions,
  userOptions,
  securityOptions,
  gotifyPriorityOptions,
  ntfyPriorityOptions,
  showConfiguration,
} = useNotificationChannelDraft(props, open, t, useRepovioApi());
const stepContent = ref<HTMLElement | null>(null);
watch(
  step,
  /** Move keyboard focus into the new visible step. */ async () => {
    await nextTick();
    (
      stepContent.value?.querySelector<HTMLElement>(
        'input:not([disabled]), button:not([disabled]), select:not([disabled])',
      ) ?? stepContent.value
    )?.focus();
  },
);
</script>
