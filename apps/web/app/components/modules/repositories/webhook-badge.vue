<template>
  <UBadge variant="subtle" :class="badgeClass" :color="badgeColor">
    {{ label }}
  </UBadge>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { RepositoryWebhookConfiguration } from '~/types/api/resources';

const props = defineProps<{
  source?: RepositoryWebhookConfiguration['source'];
  configured?: boolean;
}>();
const { t } = useI18n();
const label = computed(
  /** Localize the effective webhook source. */ () =>
    t(
      props.source === 'ORGANIZATION'
        ? 'organizationWebhooks.badge'
        : props.configured
          ? 'repositories.webhook.configured'
          : 'repositories.webhook.notConfigured',
    ),
);
const badgeColor = computed(
  /** Retain existing repository status colors. */ () =>
    props.source === 'ORGANIZATION' ? 'neutral' : props.configured ? 'success' : 'warning',
);
const badgeClass = computed(
  /** Keep organization status blue independently of the primary theme color. */ () =>
    props.source === 'ORGANIZATION' ? 'bg-blue-500/10 text-blue-600 ring-blue-500/25 dark:text-blue-400' : undefined,
);
</script>
