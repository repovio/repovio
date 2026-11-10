<template>
  <div class="flex justify-end">
    <UDropdownMenu :items="items" :content="{ align: 'end', onCloseAutoFocus: openWebhookDialog }">
      <UButton
        ref="trigger"
        color="neutral"
        icon="i-lucide-ellipsis-vertical"
        variant="ghost"
        :aria-label="$t('providers.actionsFor', { name: provider.displayName })"
        :disabled="pending"
        :loading="pending || oauthPending || togglePending || deletePending"
      />
    </UDropdownMenu>
  </div>
</template>

<script setup lang="ts">
import type { DropdownMenuItem } from '#ui/types';
import { computed, nextTick, ref, useTemplateRef } from 'vue';
import type { ProviderAccount } from '~/types/api/resources';

const props = defineProps<{
  provider: ProviderAccount;
  pending: boolean;
  oauthAvailable: boolean;
  oauthPending: boolean;
  togglePending: boolean;
  deletePending: boolean;
}>();
const emit = defineEmits<{ oauth: []; toggle: []; delete: []; organizationWebhooks: [] }>();
const { t } = useI18n();
const trigger = useTemplateRef('trigger');
const webhookRequested = ref(false);

/** Restore row focus before opening the modal so dismissal returns to a live element. */
function openWebhookDialog(event: Event): void {
  if (!webhookRequested.value) return;
  event.preventDefault();
  trigger.value?.$el?.focus();
  webhookRequested.value = false;
  void nextTick(/** Open after the dropdown releases focus ownership. */ () => emit('organizationWebhooks'));
}

const oauthLabel = computed(
  /** Choose conversion or reauthorization text from the explicit OAuth status. */ () =>
    props.provider.oauthStatus && props.provider.oauthStatus !== 'NONE'
      ? t('providers.reauthorize')
      : t('providers.connectGitLabOAuth'),
);

const items = computed<DropdownMenuItem[][]>(
  /** Retain row-specific capabilities while presenting one compact action menu. */ () => [
    [
      {
        label: t('organizationWebhooks.title'),
        icon: 'i-lucide-webhook',
        disabled: props.pending,
        /** Open configuration for this account only. */
        onSelect: () => {
          webhookRequested.value = true;
        },
      },
      ...(props.provider.providerType === 'GITLAB'
        ? [
            {
              label: oauthLabel.value,
              description: props.oauthAvailable ? undefined : t('providers.oauthUnavailable'),
              icon: 'i-lucide-key-round',
              disabled: props.pending || !props.oauthAvailable,
              /** Start the existing connection's OAuth flow. */
              onSelect: () => emit('oauth'),
            },
          ]
        : []),
      {
        label: t(props.provider.enabled ? 'providers.disable' : 'providers.enable'),
        icon: props.provider.enabled ? 'i-lucide-pause' : 'i-lucide-play',
        disabled: props.pending,
        /** Toggle this account through the existing guarded handler. */
        onSelect: () => emit('toggle'),
      },
    ],
    [
      {
        label: t('providers.delete'),
        icon: 'i-lucide-trash-2',
        color: 'error',
        disabled: props.pending,
        /** Keep the existing destructive confirmation before deletion. */
        onSelect: () => emit('delete'),
      },
    ],
  ],
);
</script>
