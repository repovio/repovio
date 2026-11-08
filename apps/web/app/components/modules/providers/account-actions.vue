<template>
  <div class="flex justify-end gap-1">
    <UTooltip
      v-if="provider.providerType === 'GITLAB'"
      :text="oauthAvailable ? oauthLabel : $t('providers.oauthUnavailable')"
    >
      <span class="inline-flex">
        <UButton
          color="neutral"
          icon="i-lucide-key-round"
          variant="ghost"
          :aria-label="oauthLabel"
          :disabled="pending || !oauthAvailable"
          :loading="oauthPending"
          @click="emit('oauth')"
        />
      </span>
    </UTooltip>
    <UTooltip :text="provider.enabled ? $t('providers.disable') : $t('providers.enable')">
      <span class="inline-flex">
        <UButton
          color="neutral"
          variant="ghost"
          :aria-label="provider.enabled ? $t('providers.disable') : $t('providers.enable')"
          :disabled="pending"
          :icon="provider.enabled ? 'i-lucide-pause' : 'i-lucide-play'"
          :loading="togglePending"
          @click="emit('toggle')"
        />
      </span>
    </UTooltip>
    <UTooltip :text="$t('providers.delete')">
      <span class="inline-flex">
        <UButton
          color="error"
          icon="i-lucide-trash-2"
          variant="ghost"
          :aria-label="$t('providers.delete')"
          :disabled="pending"
          :loading="deletePending"
          @click="emit('delete')"
        />
      </span>
    </UTooltip>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ProviderAccount } from '~/types/api/resources';

const props = defineProps<{
  provider: ProviderAccount;
  pending: boolean;
  oauthAvailable: boolean;
  oauthPending: boolean;
  togglePending: boolean;
  deletePending: boolean;
}>();
const emit = defineEmits<{ oauth: []; toggle: []; delete: [] }>();
const { t } = useI18n();
const oauthLabel = computed(
  /** Choose conversion or reauthorization text from the explicit OAuth status. */ () =>
    props.provider.oauthStatus && props.provider.oauthStatus !== 'NONE'
      ? t('providers.reauthorize')
      : t('providers.connectGitLabOAuth'),
);
</script>
