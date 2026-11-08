<template>
  <div class="flex flex-col items-start gap-1">
    <UBadge variant="subtle">
      {{ authenticationLabel }}
    </UBadge>
    <UBadge
      v-if="provider.oauthStatus === 'REAUTHORIZATION_REQUIRED'"
      class="max-w-48 whitespace-normal text-left"
      color="warning"
      variant="subtle"
    >
      {{ $t('providers.reauthorizationRequired') }}
    </UBadge>
    <UBadge
      v-if="provider.githubInstallationState && provider.githubInstallationState !== 'ACTIVE'"
      color="warning"
      variant="subtle"
    >
      {{ $t(`githubApp.states.${provider.githubInstallationState}`) }}
    </UBadge>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ProviderAccount } from '~/types/api/resources';

const { t } = useI18n();
const props = defineProps<{ provider: ProviderAccount }>();
const oauthManaged = computed(
  /** Identify explicitly managed OAuth accounts without relabeling legacy tokens. */ () =>
    Boolean(props.provider.oauthStatus && props.provider.oauthStatus !== 'NONE'),
);
const authenticationLabel = computed(
  /** Render managed OAuth distinctly while retaining legacy token and App labels. */ () =>
    oauthManaged.value
      ? t('providers.authenticationOAuth')
      : props.provider.authenticationMethod === 'GITHUB_APP'
        ? t('githubApp.title')
        : t('githubApp.token'),
);
</script>
