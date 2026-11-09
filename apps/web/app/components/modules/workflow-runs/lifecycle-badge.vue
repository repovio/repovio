<template>
  <UTooltip
    v-if="props.state === 'REMOVED' || props.state === 'DISABLED'"
    :disabled="!props.checkedAt"
    :text="
      props.checkedAt ? t('workflowRuns.lifecycle.checkedAt', { time: formatDateTime(props.checkedAt) }) : undefined
    "
  >
    <UBadge class="ml-2" color="neutral" tabindex="0" variant="subtle">
      {{ t(`workflowRuns.lifecycle.${props.state}`) }}
    </UBadge>
  </UTooltip>
</template>

<script setup lang="ts">
import { useDateTime } from '~/composables/use-date-time';

/** Provider-confirmed workflow availability and the timestamp of its latest authoritative observation. */
const props = defineProps<{
  checkedAt?: string | null;
  state?: 'UNKNOWN' | 'ACTIVE' | 'DISABLED' | 'REMOVED';
}>();

const { t } = useI18n();
const { formatDateTime } = useDateTime();
</script>
