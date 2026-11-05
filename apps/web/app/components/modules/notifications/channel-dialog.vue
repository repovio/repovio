<template>
  <UModal
    v-model:open="open"
    :description="$t('notifications.channels.dialogDescription')"
    :dismissible="!submitting"
    :title="$t(channel ? 'notifications.channels.editTitle' : 'notifications.channels.createTitle')"
  >
    <template #body>
      <UAlert
        v-if="saveError"
        class="mb-4"
        color="error"
        icon="i-lucide-circle-alert"
        variant="subtle"
        :title="$t('notifications.channels.saveError')"
      />
      <UForm
        ref="channelForm"
        class="space-y-5"
        :schema="localizeFormSchema(channelFormSchema, $t('forms.invalidValue'))"
        :state="form"
        @submit="save"
      >
        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField name="name" :label="$t('notifications.fields.name')" required>
            <UInput v-model="form.name" class="w-full" />
          </UFormField>
          <UFormField name="type" :label="$t('notifications.fields.type')" required>
            <USelect v-model="form.type" class="w-full" :disabled="Boolean(channel)" :items="typeOptions" />
          </UFormField>
          <UFormField name="enabled" :label="$t('notifications.fields.enabled')">
            <USwitch v-model="form.enabled" />
          </UFormField>
        </div>

        <UCheckbox
          v-if="channel && form.type !== 'BROWSER_PUSH'"
          v-model="form.replaceConfiguration"
          :label="$t('notifications.channels.replaceConfiguration')"
        />
        <UAlert
          v-if="channel && form.type !== 'BROWSER_PUSH' && !form.replaceConfiguration"
          color="neutral"
          variant="subtle"
          :description="$t('notifications.channels.secretPreserved')"
        />

        <div v-if="showConfiguration" class="space-y-4 rounded-lg border border-default p-4">
          <template v-if="form.type === 'EMAIL'">
            <div class="grid gap-4 sm:grid-cols-2">
              <UFormField name="smtpHost" :label="$t('notifications.fields.smtpHost')" required>
                <UInput v-model="form.smtpHost" class="w-full" placeholder="smtp.example.com" />
              </UFormField>
              <UFormField name="port" :label="$t('notifications.fields.port')">
                <UInput v-model.number="form.port" class="w-full" type="number" min="1" max="65535" />
              </UFormField>
              <UFormField name="security" :label="$t('notifications.fields.security')" required>
                <USelect v-model="form.security" class="w-full" :items="securityOptions" />
              </UFormField>
              <UFormField name="from" :label="$t('notifications.fields.from')" required>
                <UInput v-model="form.from" class="w-full" type="email" />
              </UFormField>
              <UFormField name="username" :label="$t('notifications.fields.username')">
                <UInput v-model="form.username" autocomplete="username" class="w-full" />
              </UFormField>
              <UFormField name="password" :label="$t('notifications.fields.password')">
                <UInput v-model="form.password" autocomplete="new-password" class="w-full" type="password" />
              </UFormField>
            </div>
            <UFormField name="recipients" :label="$t('notifications.fields.recipients')" required>
              <UTextarea
                v-model="form.recipients"
                class="w-full"
                :placeholder="$t('notifications.fields.recipientsPlaceholder')"
              />
            </UFormField>
          </template>

          <template v-else-if="form.type === 'GOTIFY'">
            <UFormField name="serverUrl" :label="$t('notifications.fields.serverUrl')" required>
              <UInput v-model="form.serverUrl" class="w-full" type="url" placeholder="https://gotify.example.com" />
            </UFormField>
            <div class="grid gap-4 sm:grid-cols-2">
              <UFormField name="token" :label="$t('notifications.fields.applicationToken')" required>
                <UInput v-model="form.token" autocomplete="off" class="w-full" type="password" />
              </UFormField>
              <UFormField name="priority" :label="$t('notifications.fields.priority')">
                <USelect v-model="form.priority" class="w-full" :items="gotifyPriorityOptions" />
              </UFormField>
            </div>
          </template>

          <template v-else-if="form.type === 'NTFY'">
            <div class="grid gap-4 sm:grid-cols-2">
              <UFormField name="serverUrl" :label="$t('notifications.fields.serverUrl')">
                <UInput v-model="form.serverUrl" class="w-full" type="url" placeholder="https://ntfy.sh" />
              </UFormField>
              <UFormField name="topic" :label="$t('notifications.fields.topic')" required>
                <UInput v-model="form.topic" class="w-full" />
              </UFormField>
              <UFormField name="username" :label="$t('notifications.fields.username')">
                <UInput v-model="form.username" autocomplete="username" class="w-full" />
              </UFormField>
              <UFormField name="password" :label="$t('notifications.fields.password')">
                <UInput v-model="form.password" autocomplete="new-password" class="w-full" type="password" />
              </UFormField>
              <UFormField name="token" :label="$t('notifications.fields.accessToken')">
                <UInput v-model="form.token" autocomplete="off" class="w-full" type="password" />
              </UFormField>
              <UFormField name="ntfyPriority" :label="$t('notifications.fields.priority')">
                <USelect v-model="form.ntfyPriority" class="w-full" :items="ntfyPriorityOptions" />
              </UFormField>
            </div>
          </template>

          <UFormField
            v-else-if="form.type === 'DISCORD'"
            name="webhookUrl"
            :label="$t('notifications.fields.webhookUrl')"
            required
          >
            <UInput v-model="form.webhookUrl" autocomplete="off" class="w-full" type="url" />
          </UFormField>

          <UFormField
            v-else-if="form.type === 'CUSTOM_APPRISE'"
            name="appriseUrl"
            :label="$t('notifications.fields.appriseUrl')"
            required
          >
            <UInput v-model="form.appriseUrl" autocomplete="off" class="w-full" type="password" />
          </UFormField>
        </div>

        <UAlert
          v-if="form.type === 'BROWSER_PUSH'"
          color="info"
          icon="i-lucide-monitor-smartphone"
          variant="subtle"
          :description="$t('notifications.channels.browserOwnerHint')"
        />
        <UFormField
          v-if="form.type === 'BROWSER_PUSH'"
          name="browserRecipientUserIds"
          :label="$t('notifications.fields.browserRecipients')"
          required
        >
          <USelectMenu
            v-model="form.browserRecipientUserIds"
            multiple
            class="w-full"
            value-key="value"
            :items="userOptions"
          />
        </UFormField>

        <UFormField name="eventStates">
          <div class="space-y-3 rounded-lg border border-default p-4">
            <div>
              <h3 class="font-semibold">{{ $t('notifications.fields.events') }}</h3>
              <p class="text-sm text-muted">{{ $t('notifications.channels.eventsDescription') }}</p>
            </div>
            <div v-for="eventType in eventTypes" :key="eventType" class="space-y-3 rounded-md bg-elevated p-3">
              <UCheckbox
                v-model="eventStates[eventType].selected"
                :id="`notification-event-${eventType}`"
                :label="$t(`notifications.events.${eventType}`)"
              />
              <div v-if="eventStates[eventType].selected" class="grid gap-3 pl-7 sm:grid-cols-2">
                <UFormField
                  :name="`eventStates.${eventType}.repositoryIds`"
                  :label="$t('notifications.fields.repositoryFilters')"
                >
                  <USelectMenu
                    v-model="eventStates[eventType].repositoryIds"
                    multiple
                    class="w-full"
                    value-key="value"
                    :items="repositoryOptions"
                    :placeholder="$t('notifications.fields.allRepositories')"
                  />
                </UFormField>
                <UFormField
                  v-if="eventType.startsWith('WORKFLOW_RUN_')"
                  :name="`eventStates.${eventType}.workflowPatterns`"
                  :label="$t('notifications.fields.workflowPatterns')"
                >
                  <UInput
                    v-model="eventStates[eventType].workflowPatterns"
                    class="w-full"
                    placeholder="ci-*, release-*"
                  />
                </UFormField>
              </div>
            </div>
          </div>
        </UFormField>

        <UAlert
          v-if="previewStatus"
          variant="subtle"
          :color="previewStatus === 'MATCHES' ? 'success' : previewStatus === 'NO_RESULTS' ? 'neutral' : 'warning'"
          :icon="previewStatus === 'MATCHES' ? 'i-lucide-circle-check' : 'i-lucide-triangle-alert'"
          :description="
            $t(`notifications.preview.${previewStatus}.description`, { count: preview?.matches.length ?? 0 })
          "
          :title="$t(`notifications.preview.${previewStatus}.title`)"
        />
        <ul v-if="preview?.matches.length" class="space-y-1 text-sm">
          <li v-for="match in preview.matches" :key="match.id" class="flex min-w-0 items-center gap-2">
            <UIcon class="size-4 shrink-0 text-muted" name="i-lucide-git-branch" aria-hidden="true" />
            <a
              class="truncate text-primary hover:underline"
              rel="noopener noreferrer"
              target="_blank"
              :href="match.url"
            >
              {{ match.repositoryOwner }}/{{ match.repositoryName }} · {{ match.workflowName }}
            </a>
            <span class="shrink-0 text-xs text-muted">{{ $t(`notifications.events.${match.eventType}`) }}</span>
          </li>
        </ul>

        <div class="flex justify-between gap-3 border-t border-default pt-4">
          <UButton
            type="button"
            color="neutral"
            variant="soft"
            :disabled="!canPreview"
            :label="$t('notifications.preview.action')"
            :loading="previewing"
            @click="runPreview"
          />
          <UButton type="submit" :disabled="!canSave" :label="$t('common.save')" :loading="submitting" />
        </div>
      </UForm>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { localizeFormSchema } from '@repovio/schemas';
import type { FormSubmitEvent } from '@nuxt/ui';
import { ApiCreateNotificationChannelSchema, ApiUpdateNotificationChannelSchema } from '@repovio/schemas';
import { isAxiosError } from 'axios';
import { computed, ref, useTemplateRef, watch } from 'vue';
import { z } from 'zod';

import { useRepovioApi } from '~/composables/api/repovio-api';
import type {
  NotificationChannel,
  NotificationChannelConfiguration,
  NotificationChannelType,
  NotificationEventSubscription,
  NotificationEventType,
  NotificationRulePreview,
} from '~/types/api/resources';

const props = defineProps<{
  browserPushAvailable: boolean;
  channel: NotificationChannel | null;
  repositories: Array<{ id: string; name: string; owner: string }>;
  users: Array<{ id: string; username: string }>;
}>();
const open = defineModel<boolean>('open', { required: true });
const emit = defineEmits<{ saved: [] }>();
const { t } = useI18n();
const api = useRepovioApi();
const submitting = ref(false);
const saveError = ref(false);
const channelForm = useTemplateRef('channelForm');
const preview = ref<NotificationRulePreview | null>(null);
const previewStatus = ref<NotificationRulePreview['status'] | 'INSUFFICIENT_PERMISSION' | 'ERROR' | null>(null);
const previewing = ref(false);
const eventTypes: NotificationEventType[] = [
  'WORKFLOW_RUN_SUCCEEDED',
  'WORKFLOW_RUN_FAILED',
  'WORKFLOW_RUN_RECOVERED',
  'PULL_REQUEST_OPENED',
  'PULL_REQUEST_CLOSED',
  'PULL_REQUEST_REOPENED',
  'PULL_REQUEST_MERGED',
  'ISSUE_OPENED',
  'ISSUE_CLOSED',
  'ISSUE_REOPENED',
  'DEPENDENCY_ALERT_OPENED',
  'DEPENDENCY_ALERT_RESOLVED',
  'CODE_ALERT_OPENED',
  'CODE_ALERT_RESOLVED',
  'SECRET_ALERT_OPENED',
  'SECRET_ALERT_RESOLVED',
];
const eventStates = ref(
  Object.fromEntries(
    eventTypes.map((eventType) => [
      eventType,
      { repositoryIds: [] as string[], selected: false, workflowPatterns: '' },
    ]),
  ) as Record<NotificationEventType, { repositoryIds: string[]; selected: boolean; workflowPatterns: string }>,
);
const form = ref({
  appriseUrl: '',
  browserRecipientUserIds: [] as string[],
  enabled: true,
  eventStates: eventStates.value,
  replaceConfiguration: false,
  from: '',
  name: '',
  ntfyPriority: 'default' as 'min' | 'low' | 'default' | 'high' | 'max',
  password: '',
  port: 587,
  priority: 'normal' as 'low' | 'moderate' | 'normal' | 'high',
  recipients: '',
  security: 'STARTTLS' as 'NONE' | 'STARTTLS' | 'TLS',
  serverUrl: '',
  smtpHost: '',
  token: '',
  topic: '',
  type: 'EMAIL' as NotificationChannelType,
  username: '',
  webhookUrl: '',
});
/** Form state keeps editable destination fields separate from the write-only request configuration. */
const channelFormBaseSchema = ApiCreateNotificationChannelSchema.pick({ name: true, enabled: true }).extend({
  appriseUrl: z.string(),
  browserRecipientUserIds: z.array(z.string()),
  enabled: z.boolean(),
  eventStates: z.record(
    z.string(),
    z.object({
      repositoryIds: z.array(z.string()),
      selected: z.boolean(),
      workflowPatterns: z.string(),
    }),
  ),
  from: z.string(),
  name: z.string(),
  ntfyPriority: z.enum(['min', 'low', 'default', 'high', 'max']),
  password: z.string(),
  port: z.number({ error: () => t('forms.invalidValue') }),
  priority: z.enum(['low', 'moderate', 'normal', 'high']),
  recipients: z.string(),
  replaceConfiguration: z.boolean(),
  security: z.enum(['NONE', 'STARTTLS', 'TLS']),
  serverUrl: z.string(),
  smtpHost: z.string(),
  token: z.string(),
  topic: z.string(),
  type: ApiCreateNotificationChannelSchema.shape.type.unwrap(),
  username: z.string(),
  webhookUrl: z.string(),
});
type ChannelForm = z.output<typeof channelFormBaseSchema>;
const channelFormSchema = computed(() =>
  channelFormBaseSchema.superRefine((data, context) => {
    const fail = (path: string): void =>
      context.addIssue({ code: 'custom', message: t('forms.invalidValue'), path: [path] });
    const input = {
      browserRecipientUserIds: data.type === 'BROWSER_PUSH' ? data.browserRecipientUserIds : [],
      configuration: configuration(data),
      enabled: data.enabled,
      eventSubscriptions: eventSubscriptions(data.eventStates),
      name: data.name.trim(),
    };
    const parsed = props.channel
      ? ApiUpdateNotificationChannelSchema.safeParse(input)
      : ApiCreateNotificationChannelSchema.safeParse({ ...input, type: data.type });
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const root = String(issue.path[0] ?? 'name');
        if (root === 'eventSubscriptions') {
          const subscription = input.eventSubscriptions[Number(issue.path[1])];
          const field = issue.path[2];
          fail(subscription && field ? `eventStates.${subscription.eventType}.${String(field)}` : 'eventStates');
        } else if (root === 'configuration') {
          fail(String(issue.path[1] ?? 'type'));
        } else fail(root);
      }
    }
    if (!data.name.trim()) fail('name');
    if (data.type === 'BROWSER_PUSH' && !data.browserRecipientUserIds.length) fail('browserRecipientUserIds');
    if (data.type === 'BROWSER_PUSH' || (props.channel && !data.replaceConfiguration)) return;
    const httpUrl = (value: string): boolean => z.url({ protocol: /^https?$/ }).safeParse(value.trim()).success;
    if (data.type === 'EMAIL') {
      if (!data.smtpHost.trim()) fail('smtpHost');
      if (!z.email().safeParse(data.from.trim()).success) fail('from');
      const recipients = data.recipients
        .split(/[\n,;]/)
        .map((value) => value.trim())
        .filter(Boolean);
      if (!recipients.length || recipients.some((value) => !z.email().safeParse(value).success)) fail('recipients');
      if (!Number.isInteger(data.port) || data.port < 1 || data.port > 65_535) fail('port');
    } else if (data.type === 'GOTIFY') {
      if (!httpUrl(data.serverUrl)) fail('serverUrl');
      if (!data.token.trim()) fail('token');
    } else if (data.type === 'NTFY') {
      if (data.serverUrl.trim() && !httpUrl(data.serverUrl)) fail('serverUrl');
      if (!data.topic.trim()) fail('topic');
    } else if (data.type === 'DISCORD') {
      if (!httpUrl(data.webhookUrl)) fail('webhookUrl');
      else {
        const webhook = new URL(data.webhookUrl.trim());
        if (
          !['discord.com', 'discordapp.com'].some(
            (domain) => webhook.hostname === domain || webhook.hostname.endsWith(`.${domain}`),
          ) ||
          !/\/api\/webhooks\/[^/]+\/[^/]+/.test(webhook.pathname)
        )
          fail('webhookUrl');
      }
    } else if (data.type === 'CUSTOM_APPRISE') {
      if (
        !z.url().safeParse(data.appriseUrl.trim()).success ||
        /\s/.test(data.appriseUrl.trim()) ||
        data.appriseUrl.trim().startsWith('file:')
      )
        fail('appriseUrl');
    }
  }),
);

const repositoryOptions = computed(() =>
  props.repositories.map((repository) => ({ label: `${repository.owner}/${repository.name}`, value: repository.id })),
);
const userOptions = computed(() => props.users.map((user) => ({ label: `@${user.username}`, value: user.id })));
const typeOptions = computed(() =>
  (['EMAIL', 'GOTIFY', 'NTFY', 'DISCORD', 'BROWSER_PUSH', 'CUSTOM_APPRISE'] as NotificationChannelType[]).map(
    (value) => ({
      disabled: value === 'BROWSER_PUSH' && !props.browserPushAvailable,
      label: t(`notifications.channelTypes.${value}`),
      value,
    }),
  ),
);
const securityOptions = computed(() =>
  (['NONE', 'STARTTLS', 'TLS'] as const).map((value) => ({ label: t(`notifications.security.${value}`), value })),
);
const gotifyPriorityOptions = ['low', 'moderate', 'normal', 'high'];
const ntfyPriorityOptions = ['min', 'low', 'default', 'high', 'max'];
const showConfiguration = computed(
  () => form.value.type !== 'BROWSER_PUSH' && (!props.channel || form.value.replaceConfiguration),
);
const canSave = computed(
  () =>
    form.value.name.trim().length > 0 &&
    eventTypes.some((eventType) => eventStates.value[eventType].selected) &&
    (form.value.type !== 'BROWSER_PUSH' || form.value.browserRecipientUserIds.length > 0),
);
const canPreview = computed(() =>
  eventTypes.some((eventType) => eventType.startsWith('WORKFLOW_RUN_') && eventStates.value[eventType].selected),
);

watch(open, (isOpen) => {
  if (!isOpen) return;
  Object.assign(form.value, {
    appriseUrl: '',
    browserRecipientUserIds: props.channel?.browserRecipients.map(({ id }) => id) ?? [],
    enabled: props.channel?.enabled ?? true,
    from: '',
    name: props.channel?.name ?? '',
    ntfyPriority: 'default',
    password: '',
    port: 587,
    priority: 'normal',
    recipients: '',
    security: 'STARTTLS',
    serverUrl: '',
    smtpHost: '',
    token: '',
    topic: '',
    type: props.channel?.type ?? 'EMAIL',
    username: '',
    webhookUrl: '',
  });
  for (const eventType of eventTypes) {
    const subscription = props.channel?.eventSubscriptions.find((item) => item.eventType === eventType);
    Object.assign(eventStates.value[eventType], {
      repositoryIds: subscription?.repositoryIds ?? [],
      selected: Boolean(subscription),
      workflowPatterns: subscription?.workflowPatterns.join(', ') ?? '',
    });
  }
  form.value.replaceConfiguration = false;
  preview.value = null;
  previewStatus.value = null;
  saveError.value = false;
});

watch(
  eventStates,
  () => {
    preview.value = null;
    previewStatus.value = null;
  },
  { deep: true },
);

function eventSubscriptions(states: ChannelForm['eventStates']): NotificationEventSubscription[] {
  return eventTypes
    .filter((eventType) => states[eventType]!.selected)
    .map((eventType) => ({
      eventType,
      repositoryIds: states[eventType]!.repositoryIds,
      workflowPatterns: eventType.startsWith('WORKFLOW_RUN_')
        ? states[eventType]!.workflowPatterns.split(',')
            .map((value) => value.trim())
            .filter(Boolean)
        : [],
    }));
}

async function runPreview(): Promise<void> {
  const data = await channelForm.value?.validate({ silent: true });
  if (!data) return;
  previewing.value = true;
  preview.value = null;
  previewStatus.value = null;
  try {
    preview.value = (await api.notificationChannels.preview(eventSubscriptions(data.eventStates))).data;
    previewStatus.value = preview.value.status;
  } catch (error) {
    previewStatus.value = isAxiosError(error) && error.response?.status === 403 ? 'INSUFFICIENT_PERMISSION' : 'ERROR';
  } finally {
    previewing.value = false;
  }
}

function configuration(data: ChannelForm): NotificationChannelConfiguration | undefined {
  if (data.type === 'BROWSER_PUSH' || (props.channel && !data.replaceConfiguration)) return undefined;
  if (data.type === 'EMAIL') {
    return {
      from: data.from.trim(),
      password: data.password || undefined,
      port: data.port || undefined,
      recipients: data.recipients
        .split(/[\n,;]/)
        .map((value) => value.trim())
        .filter(Boolean),
      security: data.security,
      smtpHost: data.smtpHost.trim(),
      username: data.username.trim() || undefined,
    };
  }
  if (data.type === 'GOTIFY') return { priority: data.priority, serverUrl: data.serverUrl.trim(), token: data.token };
  if (data.type === 'NTFY') {
    return {
      password: data.password || undefined,
      priority: data.ntfyPriority,
      serverUrl: data.serverUrl.trim() || undefined,
      token: data.token || undefined,
      topic: data.topic.trim(),
      username: data.username.trim() || undefined,
    };
  }
  if (data.type === 'DISCORD') return { webhookUrl: data.webhookUrl.trim() };
  if (data.type === 'CUSTOM_APPRISE') return { url: data.appriseUrl.trim() };
  return undefined;
}

async function save(event: FormSubmitEvent<ChannelForm>): Promise<void> {
  const data = event.data;
  submitting.value = true;
  saveError.value = false;
  try {
    const subscriptions = eventSubscriptions(data.eventStates);
    if (props.channel) {
      await api.notificationChannels.update(props.channel.id, {
        browserRecipientUserIds: data.type === 'BROWSER_PUSH' ? data.browserRecipientUserIds : [],
        configuration: configuration(data),
        enabled: data.enabled,
        eventSubscriptions: subscriptions,
        name: data.name.trim(),
      });
    } else {
      await api.notificationChannels.create({
        browserRecipientUserIds: data.type === 'BROWSER_PUSH' ? data.browserRecipientUserIds : [],
        configuration: configuration(data),
        enabled: data.enabled,
        eventSubscriptions: subscriptions,
        name: data.name.trim(),
        type: data.type,
      });
    }
    open.value = false;
    emit('saved');
  } catch {
    saveError.value = true;
  } finally {
    submitting.value = false;
  }
}
</script>
