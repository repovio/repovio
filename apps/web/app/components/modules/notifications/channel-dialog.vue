<template>
  <UModal
    v-model:open="open"
    :description="$t('notifications.channels.dialogDescription')"
    :dismissible="!submitting"
    :close="!submitting"
    :ui="{ body: 'min-h-0', header: 'shrink-0', footer: 'shrink-0 justify-between gap-3' }"
    :title="$t(channel ? 'notifications.channels.editTitle' : 'notifications.channels.createTitle')"
  >
    <template #body>
      <UStepper
        class="mb-5 w-full"
        data-channel-stepper
        :aria-label="$t('notifications.wizard.steps')"
        :items="stepItems"
        :model-value="step"
        :linear="false"
        :disabled="submitting || persisted || previewing"
        :ui="{ item: 'min-w-0', title: 'text-xs whitespace-normal text-center' }"
        @update:model-value="requestStep"
      />
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
      </UForm>
    </template>
    <template #footer>
      <UButton
        v-if="step > 0"
        type="button"
        color="neutral"
        variant="soft"
        :label="$t('notifications.wizard.back')"
        :disabled="submitting || persisted || previewing"
        @click="back"
      />
      <span v-else />
      <UButton
        v-if="step < 3"
        type="button"
        :label="$t('notifications.wizard.next')"
        :disabled="submitting || persisted || previewing"
        @click="nextStep"
      />
      <UButton
        v-else
        type="button"
        :disabled="!canSave || previewing"
        :label="$t(persisted ? 'notifications.navbar.retry' : 'common.save')"
        :loading="submitting"
        @click="channelForm?.submit()"
      />
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { StepperItem } from '@nuxt/ui';
import { localizeFormSchema } from '@repovio/schemas';
import { computed, nextTick, ref, watch } from 'vue';
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
  requestStep,
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
const stepItems = computed<StepperItem[]>(
  /** Keep explicit step values and localized titles in the same order as draft validation. */ () =>
    ['identity', 'destination', 'events', 'review'].map(
      /** Disable jumps past the next validated transition. */ (name, value) => ({
        title: t(`notifications.wizard.${name}`),
        value,
        disabled: value > step.value + 1,
      }),
    ),
);
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
