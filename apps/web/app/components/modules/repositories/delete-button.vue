<template>
  <UButton
    v-if="isAdmin"
    color="error"
    icon="i-lucide-trash-2"
    variant="soft"
    :label="$t('repositoryDetails.deleteRepository')"
    :loading="pending"
    :disabled="disabled || pending"
    @click="remove"
  />
</template>

<script setup lang="ts">
import axios from 'axios';
import { computed, ref } from 'vue';
import { useRepovioApi } from '~/composables/api/repovio-api';
import { useDestructiveAction } from '~/composables/app/destructive-action';
import { useAuthStore } from '~/store/auth';
import type { Repository } from '~/types/api/resources';

const props = defineProps<{
  repository: Pick<Repository, 'id' | 'owner' | 'name'>;
  disabled?: boolean;
  /** Finish navigation or list refresh before the confirmation completes. */
  afterDelete: () => Promise<void>;
}>();
const emit = defineEmits<{ pending: [value: boolean] }>();
const auth = useAuthStore();
const isAdmin = computed(
  /** Restrict the destructive control to administrators. */ () => auth.user?.role === 'SYSTEM_ADMIN',
);
const api = useRepovioApi();
const { t } = useI18n();
const { confirmDestructiveAction } = useDestructiveAction();
const pending = ref(false);
let deleted = false;

/** Confirm irreversible local deletion and retain pending state through dependent navigation or refresh. */
async function remove(): Promise<void> {
  if (!isAdmin.value || pending.value) return;
  pending.value = true;
  emit('pending', true);
  const name = `${props.repository.owner}/${props.repository.name}`;
  try {
    await confirmDestructiveAction(
      name,
      /** Retrying a failed refresh must not repeat an already completed deletion. */ async () => {
        if (!deleted) {
          await api.repositories.delete(props.repository.id);
          deleted = true;
        }
        await props.afterDelete();
      },
      {
        description: t('repositoryDetails.deleteDescription', { name }),
        /** Explain the actionable synchronization conflict without exposing server errors. */
        errorMessage: (error) =>
          t(
            axios.isAxiosError(error) && error.response?.status === 409
              ? 'repositoryDetails.deleteSyncConflict'
              : 'repositoryDetails.deleteError',
          ),
      },
    );
  } finally {
    pending.value = false;
    emit('pending', false);
  }
}
</script>
