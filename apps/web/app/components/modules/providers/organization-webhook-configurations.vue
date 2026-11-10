<template>
  <section class="min-w-0 space-y-4 border-t border-default pt-5">
    <h3 class="font-semibold">
      {{ $t('organizationWebhooks.savedConfigurations') }}
    </h3>
    <p v-if="!configurations.length" class="text-sm text-muted">
      {{ $t('organizationWebhooks.empty') }}
    </p>
    <ul v-if="configurations.length" class="space-y-3">
      <li v-for="hook in configurations" :key="hook.id" class="space-y-2 rounded-lg border border-default p-3">
        <div class="flex items-center justify-between gap-3">
          <span class="min-w-0 truncate font-medium">{{ hook.scope }}</span>
          <UButton color="neutral" size="sm" variant="soft" :disabled="pending" @click="emit('edit', hook)">
            {{ $t('organizationWebhooks.edit') }}
          </UButton>
        </div>
        <UFormField :label="$t('repositories.webhook.callbackUrl')">
          <UInput class="w-full font-mono" readonly :model-value="hook.callbackUrl">
            <template #trailing>
              <UButton
                color="neutral"
                size="xs"
                variant="ghost"
                icon="i-lucide-copy"
                :aria-label="$t('repositories.webhook.copyUrl')"
                @click="emit('copy', hook.callbackUrl)"
              />
            </template>
          </UInput>
        </UFormField>
        <p class="text-sm text-muted">
          {{ deliveryLabel(hook) }}
        </p>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { useDateTime } from '~/composables/use-date-time';
import type { OrganizationWebhook } from '~/types/api/resources';

/** Saved local webhook metadata and the mutation gate inherited from the parent. */
defineProps<{ configurations: OrganizationWebhook[]; pending: boolean }>();
const emit = defineEmits<{ edit: [hook: OrganizationWebhook]; copy: [url: string] }>();
const { formatDateTime } = useDateTime();
const { t } = useI18n();

/** Format receipt metadata without implying that provider registration has been verified. */
function deliveryLabel(hook: OrganizationWebhook): string {
  return t('organizationWebhooks.lastDelivery', {
    value: hook.lastDeliveryAt ? formatDateTime(hook.lastDeliveryAt) : t('repositories.webhook.neverDelivered'),
  });
}
</script>
