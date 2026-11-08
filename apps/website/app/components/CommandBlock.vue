<template>
  <div class="overflow-hidden rounded-xl border border-default bg-muted/50">
    <div class="flex items-center justify-between border-b border-default px-4 py-2.5">
      <span class="text-xs text-muted">{{ label || t('terminal') }}</span>
      <UButton
        color="neutral"
        variant="ghost"
        size="xs"
        :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
        :aria-label="t(copied ? 'copied' : 'copy')"
        @click="copy(code)"
      />
    </div>
    <CodeBlock class="p-5 font-mono text-xs leading-7 sm:text-sm" :code="code" :language="language" />
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ code: string; label?: string; language?: string }>(), {
  language: 'bash',
  label: undefined,
});
const { t } = useI18n();
const copied = ref(false);
let timer: ReturnType<typeof setTimeout> | undefined;
/** Define copy behavior. */
async function copy(code: string) {
  try {
    await navigator.clipboard.writeText(code);
    copied.value = true;
    clearTimeout(timer);
    timer = setTimeout(/** Return `(copied.value = false)` when invoked. */ () => (copied.value = false), 1800);
  } catch {
    useToast().add({ title: t('copyFailed'), color: 'error' });
  }
}
onBeforeUnmount(/** Return `clearTimeout(timer)` when invoked. */ () => clearTimeout(timer));
</script>
