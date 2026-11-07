<template>
  <UModal
    :title="$t('destructiveAction.title')"
    :description="$t('destructiveAction.description', { target })"
    :dismissible="!pending"
    :close="!pending"
    @update:open="handleOpen"
  >
    <template #body>
      <UAlert v-if="failed" color="error" role="alert" :title="$t('destructiveAction.error')" />
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton autofocus color="neutral" variant="outline" :disabled="pending" @click="cancel">
          {{ $t('destructiveAction.cancel') }}
        </UButton>
        <UButton color="error" :loading="pending" :disabled="pending" @click="execute">
          {{ $t('destructiveAction.confirm') }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const props = defineProps<{ target: string; action: () => Promise<unknown> }>();
const emit = defineEmits<{ close: [result: boolean] }>();
const pending = ref(false);
const failed = ref(false);

/** Resolve cancellation without invoking the destructive action. */
function cancel(): void {
  if (!pending.value) emit('close', false);
}

/** Treat Escape, outside clicks, and the close button as cancellation. */
function handleOpen(open: boolean): void {
  if (!open) cancel();
}

/** Keep confirmation open through the complete mutation and dependent refresh. */
async function execute(): Promise<void> {
  if (pending.value) return;
  pending.value = true;
  failed.value = false;
  try {
    await props.action();
    emit('close', true);
  } catch {
    failed.value = true;
  } finally {
    pending.value = false;
  }
}
</script>
