import type { Form, FormSubmitEvent } from '@nuxt/ui';
import { ApiCreateNotificationChannelSchema, ApiUpdateNotificationChannelSchema } from '@repovio/schemas';
import { isAxiosError } from 'axios';
import { computed, ref, watch, type Ref } from 'vue';
import { z } from 'zod';
import { getUserIdentityLabel, type UserIdentity } from '../../utils/user-identity';

import type { BrowserPushAvailability } from './browser-push-state';

import type { useRepovioApi } from '~/composables/api/repovio-api';
import type {
  NotificationChannel,
  NotificationChannelConfiguration,
  NotificationChannelType,
  NotificationEventSubscription,
  NotificationEventType,
  NotificationRulePreview,
} from '~/types/api/resources';

/** Reactive input for a channel draft; stored credentials are never read back. */
export interface ChannelDraftProps {
  browserPushAvailable: boolean;
  browserPushAvailability?: BrowserPushAvailability;
  browserPushRefreshing?: boolean;
  onRefreshBrowserPush?: () => Promise<void>;
  channel: NotificationChannel | null;
  repositories: Array<{ id: string; name: string; owner: string }>;
  users?: Array<UserIdentity & { id: string }>;
  onSaved?: () => Promise<void>;
}

/**
 * Coordinate in-memory wizard state, shared validation, preview, and persistence.
 * @param props Current channel and authorized destination choices.
 * @param open Dialog visibility controlling draft lifetime.
 * @param t Localized message lookup.
 * @param api Typed notification API transport.
 * @returns Wizard state, validation, and asynchronous operations.
 */
export function useNotificationChannelDraft(
  props: ChannelDraftProps,
  open: Ref<boolean>,
  t: (key: string) => string,
  api: ReturnType<typeof useRepovioApi>,
) {
  const submitting = ref(false);
  const saveError = ref(false);
  const persisted = ref(false);
  const channelForm = ref<Form<ChannelForm> | null>(null);
  const step = ref(0);
  let previewRevision = 0;
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
      eventTypes.map(
        /** Projects each entry using `[ eventType, { repositoryIds: [] as string[], selected: false, workflowPatterns: '' }, ]`. */ (
          eventType,
        ) => [eventType, { repositoryIds: [] as string[], selected: false, workflowPatterns: '' }],
      ),
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
    port: z.number({
      /** Returns the localized validation error for this field. */ error: () => t('forms.invalidValue'),
    }),
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
  const channelFormSchema = computed(
    /** Derives channel form schema from the current reactive dependencies. */ () =>
      channelFormBaseSchema.superRefine(
        /** Validates input against the channelFormSchema predicate. */ (data, context) => {
          /** Adds a localized validation issue at the specified form path. */
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
          /** Accepts only valid absolute HTTP or HTTPS URLs after trimming. */
          const httpUrl = (value: string): boolean => z.url({ protocol: /^https?$/ }).safeParse(value.trim()).success;
          if (data.type === 'EMAIL') {
            if (!data.smtpHost.trim()) fail('smtpHost');
            if (!z.email().safeParse(data.from.trim()).success) fail('from');
            const recipients = data.recipients
              .split(/[\n,;]/)
              .map(/** Projects each entry using `value.trim()`. */ (value) => value.trim())
              .filter(Boolean);
            if (
              !recipients.length ||
              recipients.some(
                /** Checks whether any entry satisfies `!z.email().safeParse(value).success`. */ (value) =>
                  !z.email().safeParse(value).success,
              )
            )
              fail('recipients');
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
                  /** Checks whether any entry satisfies `webhook.hostname === domain || webhook.hostname.endsWith(`.${domain}`)`. */
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
        },
      ),
  );

  const repositoryOptions = computed(
    /** Derives repository options from the current reactive dependencies. */ () =>
      props.repositories.map(
        /** Projects each entry using `({ label: `${repository.owner}/${repository.name}`, value: repository.id })`. */ (
          repository,
        ) => ({ label: `${repository.owner}/${repository.name}`, value: repository.id }),
      ),
  );
  const userOptions = computed(
    /** Derives user options from the current reactive dependencies. */ () =>
      [...(props.users ?? []), ...(props.channel?.browserRecipients ?? [])].map(
        /** Formats each available or configured recipient identity. */ (user) => ({
          label: getUserIdentityLabel(user),
          value: user.id,
        }),
      ),
  );
  const typeOptions = computed(
    /** Derives type options from the current reactive dependencies. */ () =>
      (['EMAIL', 'GOTIFY', 'NTFY', 'DISCORD', 'BROWSER_PUSH', 'CUSTOM_APPRISE'] as NotificationChannelType[]).map(
        /** Projects each entry using `({ disabled: value === 'BROWSER_PUSH' && !props.browserPushAvailable, label: t(`notifications.channelTypes.${value}`), value, })`. */
        (value) => ({
          disabled: value === 'BROWSER_PUSH' && !props.browserPushAvailable,
          label: t(`notifications.channelTypes.${value}`),
          value,
        }),
      ),
  );
  const securityOptions = computed(
    /** Derives security options from the current reactive dependencies. */ () =>
      (['NONE', 'STARTTLS', 'TLS'] as const).map(
        /** Projects each entry using `({ label: t(`notifications.security.${value}`), value })`. */ (value) => ({
          label: t(`notifications.security.${value}`),
          value,
        }),
      ),
  );
  const gotifyPriorityOptions = ['low', 'moderate', 'normal', 'high'];
  const ntfyPriorityOptions = ['min', 'low', 'default', 'high', 'max'];
  const showConfiguration = computed(
    /** Derives show configuration from the current reactive dependencies. */
    () => form.value.type !== 'BROWSER_PUSH' && (!props.channel || form.value.replaceConfiguration),
  );
  const canSave = computed(
    /** Derives can save from the current reactive dependencies. */
    () =>
      form.value.name.trim().length > 0 &&
      eventTypes.some(
        /** Checks whether any entry satisfies `eventStates.value[eventType].selected`. */ (eventType) =>
          eventStates.value[eventType].selected,
      ) &&
      (form.value.type !== 'BROWSER_PUSH' || form.value.browserRecipientUserIds.length > 0),
  );
  const canPreview = computed(
    /** Derives can preview from the current reactive dependencies. */ () =>
      eventTypes.some(
        /** Checks whether any entry satisfies `eventType.startsWith('WORKFLOW_RUN_') && eventStates.value[eventType].selected`. */ (
          eventType,
        ) => eventType.startsWith('WORKFLOW_RUN_') && eventStates.value[eventType].selected,
      ),
  );

  watch(
    open,
    /** Synchronizes channel dialog when the observed state changes. */ (isOpen) => {
      step.value = 0;
      persisted.value = false;
      previewRevision++;
      previewing.value = false;
      if (!isOpen) {
        clearSecrets();
        return;
      }
      Object.assign(form.value, {
        appriseUrl: '',
        browserRecipientUserIds:
          props.channel?.browserRecipients.map(/** Projects each entry using `id`. */ ({ id }) => id) ?? [],
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
        const subscription = props.channel?.eventSubscriptions.find(
          /** Finds the first entry matching `item.eventType === eventType`. */ (item) => item.eventType === eventType,
        );
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
    },
  );

  watch(
    eventStates,
    /** Synchronizes channel dialog when the observed state changes. */
    () => {
      previewRevision++;
      previewing.value = false;
      preview.value = null;
      previewStatus.value = null;
    },
    { deep: true },
  );

  /** Converts selected event controls into notification subscription contracts. */
  function eventSubscriptions(states: ChannelForm['eventStates']): NotificationEventSubscription[] {
    return eventTypes
      .filter(/** Keeps entries matching `states[eventType]!.selected`. */ (eventType) => states[eventType]!.selected)
      .map(
        /** Projects each entry using the eventSubscriptions mapping. */ (eventType) => ({
          eventType,
          repositoryIds: states[eventType]!.repositoryIds,
          workflowPatterns: eventType.startsWith('WORKFLOW_RUN_')
            ? states[eventType]!.workflowPatterns.split(',')
                .map(/** Projects each entry using `value.trim()`. */ (value) => value.trim())
                .filter(Boolean)
            : [],
        }),
      );
  }

  /** Runs preview. */
  async function runPreview(): Promise<void> {
    const revision = ++previewRevision;
    const data = channelFormSchema.value.safeParse(form.value);
    if (!data.success) return;
    const validated = data.data;
    previewing.value = true;
    preview.value = null;
    previewStatus.value = null;
    try {
      const result = (
        await api.notificationChannels.preview(
          eventSubscriptions(validated.eventStates).filter(
            /** Preview supports historical workflow events only. */ (event) =>
              event.eventType.startsWith('WORKFLOW_RUN_'),
          ),
        )
      ).data;
      if (revision !== previewRevision) return;
      preview.value = result;
      previewStatus.value = result.status;
    } catch (error) {
      if (revision !== previewRevision) return;
      previewStatus.value = isAxiosError(error) && error.response?.status === 403 ? 'INSUFFICIENT_PERMISSION' : 'ERROR';
    } finally {
      if (revision === previewRevision) previewing.value = false;
    }
  }

  /** Builds channel-specific credentials and options, omitting unchanged configuration. */
  function configuration(data: ChannelForm): NotificationChannelConfiguration | undefined {
    if (data.type === 'BROWSER_PUSH' || (props.channel && !data.replaceConfiguration)) return undefined;
    if (data.type === 'EMAIL') {
      return {
        from: data.from.trim(),
        password: data.password || undefined,
        port: data.port || undefined,
        recipients: data.recipients
          .split(/[\n,;]/)
          .map(/** Projects each entry using `value.trim()`. */ (value) => value.trim())
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

  /** Saves channel dialog. */
  async function save(event: FormSubmitEvent<ChannelForm>): Promise<void> {
    const data = event.data;
    submitting.value = true;
    saveError.value = false;
    try {
      const subscriptions = eventSubscriptions(data.eventStates);
      if (!persisted.value && props.channel) {
        await api.notificationChannels.update(props.channel.id, {
          browserRecipientUserIds: data.type === 'BROWSER_PUSH' ? data.browserRecipientUserIds : [],
          configuration: configuration(data),
          enabled: data.enabled,
          eventSubscriptions: subscriptions,
          name: data.name.trim(),
        });
      } else if (!persisted.value) {
        await api.notificationChannels.create({
          browserRecipientUserIds: data.type === 'BROWSER_PUSH' ? data.browserRecipientUserIds : [],
          configuration: configuration(data),
          enabled: data.enabled,
          eventSubscriptions: subscriptions,
          name: data.name.trim(),
          type: data.type,
        });
      }
      persisted.value = true;
      await props.onSaved?.();
      open.value = false;
    } catch {
      saveError.value = true;
    } finally {
      submitting.value = false;
    }
  }

  /** Clear destination secrets when type ownership or dialog lifetime changes. */
  function clearSecrets(): void {
    Object.assign(form.value, {
      appriseUrl: '',
      port: 587,
      security: 'STARTTLS',
      priority: 'normal',
      ntfyPriority: 'default',
      password: '',
      token: '',
      webhookUrl: '',
      username: '',
      serverUrl: '',
      smtpHost: '',
      from: '',
      recipients: '',
      topic: '',
      browserRecipientUserIds: [],
    });
  }
  watch(
    /** Observe transport changes. */ () => form.value.type,
    /** Remove incompatible destination state. */ () => {
      if (!props.channel) clearSecrets();
      previewRevision++;
      previewing.value = false;
      preview.value = null;
      previewStatus.value = null;
    },
  );

  /** Validate only the visible step before advancing; full validation still runs on save. */
  function nextStep(): boolean {
    if (!open.value || submitting.value || persisted.value || previewing.value || step.value >= 3) return false;
    const result = channelFormSchema.value.safeParse(form.value);
    const identity = ['name', 'type', 'enabled'];
    const errors = result.success
      ? []
      : result.error.issues
          .filter(
            /** Select errors belonging to this step. */ (issue) => {
              const field = String(issue.path[0]);
              return step.value === 0
                ? identity.includes(field)
                : step.value === 2
                  ? field.startsWith('eventStates')
                  : !identity.includes(field) && !field.startsWith('eventStates');
            },
          )
          .map(
            /** Adapt shared validation to form controls. */ (issue) => ({
              name: issue.path.join('.'),
              message: issue.message,
            }),
          );
    channelForm.value?.setErrors(errors);
    if (errors.length) return false;
    step.value = Math.min(step.value + 1, 3);
    return true;
  }

  /** Return to the previous step without clearing valid draft values. */
  function back(): void {
    if (!open.value || submitting.value || persisted.value || previewing.value) return;
    step.value = Math.max(0, step.value - 1);
  }

  /** Validate controlled stepper requests without skipping future steps or pending operations. */
  function requestStep(value: unknown): boolean {
    if (!open.value || submitting.value || persisted.value || previewing.value) return false;
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > 3 || value > step.value + 1)
      return false;
    if (value > step.value) return nextStep();
    step.value = value;
    return true;
  }

  /** Handle Enter without allowing early persistence or duplicate submissions. */
  async function submit(event: FormSubmitEvent<ChannelForm>): Promise<void> {
    if (step.value !== 3) {
      nextStep();
      return;
    }
    if (!submitting.value) await save(event);
  }

  return {
    form,
    eventStates,
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
  };
}

/** Typed form model shared by wizard presentation sections. */
export type ChannelForm = ReturnType<typeof useNotificationChannelDraft>['form']['value'];
