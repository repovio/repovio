<template>
  <div class="space-y-4">
    <dl class="grid grid-cols-2 gap-2 rounded-lg border border-default p-4 text-sm">
      <dt>
        {{ $t('notifications.fields.name') }}
      </dt>
      <dd>
        {{ form.name }}
      </dd>
      <dt>
        {{ $t('notifications.fields.type') }}
      </dt>
      <dd>
        {{ $t(`notifications.channelTypes.${form.type}`) }}
      </dd>
      <dt>
        {{ $t('notifications.wizard.destination') }}
      </dt>
      <dd>
        {{ destinationSummary }}
      </dd>
      <dt>
        {{ $t('notifications.fields.events') }}
      </dt>
      <dd>
        {{ Object.values(form.eventStates).filter((event) => event.selected).length }}
      </dd>
      <dt>
        {{ $t('notifications.fields.enabled') }}
      </dt>
      <dd>
        {{ $t(form.enabled ? 'notifications.enabled' : 'notifications.disabled') }}
      </dd>
    </dl>
    <p class="text-xs text-muted">
      {{ $t('notifications.wizard.credentialsHidden') }}
    </p>
    <ul class="space-y-1 text-sm">
      <li v-for="event in selectedEvents" :key="event.type">
        <span>{{ $t(`notifications.events.${event.type}`) }} · {{ event.repositories }} · {{ event.patterns }}</span>
      </li>
    </ul>
    <p class="text-sm text-muted">
      {{ $t('notifications.wizard.previewHint') }}
    </p>
    <UAlert
      v-if="previewStatus"
      variant="subtle"
      :color="previewStatus === 'MATCHES' ? 'success' : previewStatus === 'NO_RESULTS' ? 'neutral' : 'warning'"
      :icon="previewStatus === 'MATCHES' ? 'i-lucide-circle-check' : 'i-lucide-triangle-alert'"
      :description="$t(`notifications.preview.${previewStatus}.description`, { count: preview?.matches.length ?? 0 })"
      :title="$t(`notifications.preview.${previewStatus}.title`)"
    />
    <ul v-if="preview?.matches.length" class="space-y-1 text-sm">
      <li v-for="match in preview.matches" :key="match.id" class="flex min-w-0 items-center gap-2">
        <UIcon class="size-4 shrink-0 text-muted" name="i-lucide-git-branch" aria-hidden="true" />
        <a class="truncate text-primary hover:underline" rel="noopener noreferrer" target="_blank" :href="match.url">
          {{ match.repositoryOwner }}/{{ match.repositoryName }} · {{ match.workflowName }}
        </a>
        <span class="shrink-0 text-xs text-muted">{{ $t(`notifications.events.${match.eventType}`) }}</span>
      </li>
    </ul>

    <UButton
      v-if="canPreview"
      color="neutral"
      variant="soft"
      :label="$t('notifications.preview.action')"
      :loading="previewing"
      @click="$emit('preview')"
    />
  </div>
</template>

<script setup lang="ts">
import type { ChannelForm } from '~/composables/app/notification-channel-draft';
import type { NotificationRulePreview } from '~/types/api/resources';
const props = defineProps<{
  form: ChannelForm;
  canPreview: boolean;
  previewing: boolean;
  preview: NotificationRulePreview | null;
  previewStatus: NotificationRulePreview['status'] | 'INSUFFICIENT_PERMISSION' | 'ERROR' | null;
}>();
defineEmits<{ preview: [] }>();
const { t } = useI18n();
const destinationSummary = computed(
  /** Show only non-secret destination details. */ () => {
    const form = props.form;
    if (form.type === 'EMAIL')
      return `${form.smtpHost || t('notifications.channels.secretPreserved')}${form.smtpHost ? `:${form.port} · ${form.security}` : ''}`;
    if (form.type === 'BROWSER_PUSH')
      return t('notifications.wizard.recipientCount', { count: form.browserRecipientUserIds.length });
    if (form.type === 'GOTIFY' || form.type === 'NTFY') {
      if (!form.serverUrl && form.type === 'NTFY') return 'https://ntfy.sh';
      try {
        return new URL(form.serverUrl).origin;
      } catch {
        return t('notifications.channels.secretPreserved');
      }
    }
    return t('notifications.wizard.credentialsHidden');
  },
);
const selectedEvents = computed(
  /** Summarize selected rules without destination secrets. */ () =>
    Object.entries(props.form.eventStates)
      .filter(/** Show only selected event rules. */ ([, state]) => state.selected)
      .map(
        /** Render visible rule scopes. */ ([type, state]) => ({
          type,
          repositories: state.repositoryIds.length
            ? t('notifications.wizard.repositoryCount', { count: state.repositoryIds.length })
            : t('notifications.fields.allRepositories'),
          patterns: state.workflowPatterns || '—',
        }),
      ),
);
</script>
