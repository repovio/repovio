<template>
  <div class="space-y-4">
    <UFormField name="eventStates">
      <div class="space-y-3 rounded-lg border border-default p-4">
        <div>
          <h3 class="font-semibold">
            {{ $t('notifications.fields.events') }}
          </h3>
          <p class="text-sm text-muted">
            {{ $t('notifications.channels.eventsDescription') }}
          </p>
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
              <UInput v-model="eventStates[eventType].workflowPatterns" class="w-full" placeholder="ci-*, release-*" />
            </UFormField>
          </div>
        </div>
      </div>
    </UFormField>
  </div>
</template>

<script setup lang="ts">
import type { ChannelForm } from '~/composables/app/notification-channel-draft';
const form = defineModel<ChannelForm>('form', { required: true });
defineProps<{
  eventTypes: Array<keyof ChannelForm['eventStates']>;
  repositoryOptions: Array<{ label: string; value: string }>;
}>();
const eventStates = computed(/** Read the shared event selection model. */ () => form.value.eventStates);
</script>
