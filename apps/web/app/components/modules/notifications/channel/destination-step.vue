<template>
  <div class="space-y-4">
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
  </div>
</template>

<script setup lang="ts">
import type { ChannelForm } from '~/composables/app/notification-channel-draft';
const form = defineModel<ChannelForm>('form', { required: true });
defineProps<{
  channel: unknown;
  showConfiguration: boolean;
  securityOptions: Array<{ label: string; value: string }>;
  gotifyPriorityOptions: string[];
  ntfyPriorityOptions: string[];
  userOptions: Array<{ label: string; value: string }>;
}>();
</script>
