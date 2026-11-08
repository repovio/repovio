<template>
  <ColorScheme>
    <UButton
      color="neutral"
      variant="ghost"
      data-testid="theme-switch"
      :icon="selected.icon"
      :aria-label="`${t('theme')}: ${t(selected.value)}`"
      :title="`${t('theme')}: ${t(selected.value)}`"
      :disabled="Boolean(mode.forced)"
      @click="cycle"
    />
    <template #placeholder>
      <UButton icon="i-lucide-monitor" color="neutral" variant="ghost" :aria-label="t('theme')" disabled />
    </template>
  </ColorScheme>
</template>

<script setup lang="ts">
const mode = useColorMode();
const { t } = useI18n();
const modes = [
  { value: 'system', icon: 'i-lucide-monitor' },
  { value: 'light', icon: 'i-lucide-sun' },
  { value: 'dark', icon: 'i-lucide-moon' },
];
const selected = computed(
  /** Return `modes.find((item) => item.value === mode.preference) || modes[0]!` when invoked. */ () =>
    modes.find(
      /** Find the entry matching `item.value === mode.preference`. */ (item) => item.value === mode.preference,
    ) || modes[0]!,
);
/** Define cycle behavior. */
function cycle() {
  const index = modes.findIndex(
    /** Find the index matching `item.value === selected.value.value`. */ (item) => item.value === selected.value.value,
  );
  mode.preference = modes[(index + 1) % modes.length]!.value;
}
</script>
