<template>
  <div class="space-y-4">
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
    <div
      v-if="pushAvailability && (pushAvailability !== 'available' || pushRefreshing)"
      class="space-y-2"
      aria-live="polite"
    >
      <p class="text-sm text-muted">
        {{
          $t(
            `notifications.pushAvailability.${pushRefreshing || pushAvailability === 'idle' || pushAvailability === 'loading' ? 'checking' : pushAvailability === 'server-unconfigured' ? 'unconfigured' : 'failed'}`,
          )
        }}
      </p>
      <UButton
        type="button"
        color="neutral"
        variant="soft"
        :label="$t('notifications.navbar.retry')"
        :disabled="pushRefreshing || pushAvailability === 'idle' || pushAvailability === 'loading'"
        :loading="pushRefreshing"
        @click="emit('retry')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BrowserPushAvailability } from '~/composables/app/browser-push-state';
import type { ChannelForm } from '~/composables/app/notification-channel-draft';
const form = defineModel<ChannelForm>('form', { required: true });
defineProps<{
  channel: unknown;
  typeOptions: Array<{ disabled: boolean; label: string; value: string }>;
  pushAvailability?: BrowserPushAvailability;
  pushRefreshing?: boolean;
}>();
const emit = defineEmits<{ retry: [] }>();
</script>
