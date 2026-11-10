<template>
  <UPopover :content="{ align: 'end' }">
    <UTooltip :text="currentLabel">
      <UButton
        data-auto-refresh-control
        color="neutral"
        icon="i-lucide-timer-reset"
        size="md"
        variant="ghost"
        :aria-label="currentLabel"
      />
    </UTooltip>
    <template #content>
      <fieldset class="w-64 max-w-[calc(100vw-2rem)] space-y-2 p-4" aria-describedby="auto-refresh-help">
        <legend class="sr-only">
          {{ $t('autoRefresh.title') }}
        </legend>
        <p class="font-semibold">
          {{ $t('autoRefresh.title') }}
        </p>
        <label
          v-for="option in options"
          :key="option.value"
          class="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-elevated focus-within:ring-2 focus-within:ring-primary"
        >
          <input
            class="size-4 accent-primary"
            name="auto-refresh-interval"
            type="radio"
            :checked="preference.interval === option.value"
            :value="option.value"
            @change="preference.setInterval(option.value)"
          />
          <span>{{ option.label }}</span>
        </label>
        <p id="auto-refresh-help" class="text-xs text-muted">
          {{ $t('autoRefresh.help') }}
        </p>
      </fieldset>
    </template>
  </UPopover>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAutoRefreshStore } from '~/store/auto-refresh';
const { t, locale } = useI18n();
const preference = useAutoRefreshStore();
const options = computed(
  /** Format duration labels using the active language's standard unit names. */ () =>
    [0, 15000, 30000, 60000, 300000].map(
      /** Label supported cadences without accepting arbitrary input. */ (value) => ({
        value,
        label:
          value === 0
            ? t('autoRefresh.off')
            : new Intl.NumberFormat(locale.value, {
                style: 'unit',
                unit: value >= 60000 ? 'minute' : 'second',
                unitDisplay: 'short',
              }).format(value / (value >= 60000 ? 60000 : 1000)),
      }),
    ),
);
const currentLabel = computed(
  /** Expose the selected cadence even when the popover is closed. */ () =>
    t('autoRefresh.current', {
      interval: options.value.find(
        /** Find the validated selected value. */ (option) => option.value === preference.interval,
      )?.label,
    }),
);
</script>
