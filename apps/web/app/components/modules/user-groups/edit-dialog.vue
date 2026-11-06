<template>
  <UModal
    v-model:open="open"
    :title="$t(group ? 'userGroups.rename' : 'userGroups.create')"
    :dismissible="!saving"
    :close="!saving"
  >
    <template #body>
      <UAlert v-if="error" class="mb-4" color="error" :title="$t(error)" />
      <UForm
        class="space-y-4"
        :schema="localizeFormSchema(ApiSaveUserGroupSchema, $t('forms.invalidValue'))"
        :state="form"
        @submit="save"
      >
        <UFormField name="name" :label="$t('userGroups.name')" required>
          <UInput v-model="form.name" class="w-full" :disabled="saving" />
        </UFormField>
        <div class="flex justify-end gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            :label="$t('users.cancel')"
            :disabled="saving"
            @click="open = false"
          />
          <UButton type="submit" :label="$t(group ? 'userGroups.rename' : 'userGroups.create')" :loading="saving" />
        </div>
      </UForm>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ApiSaveUserGroupSchema, localizeFormSchema, type UserGroup } from '@repovio/schemas';
import { isAxiosError } from 'axios';
import { reactive, ref, watch } from 'vue';
import { useRepovioApi } from '~/composables/api/repovio-api';
const open = defineModel<boolean>('open', { required: true });
const props = defineProps<{
  group: UserGroup | null;
  /** Refreshes dependent table state before the mutation finishes. */ refresh: () => Promise<unknown>;
}>();
const api = useRepovioApi();
const form = reactive({ name: '' });
const saving = ref(false);
const error = ref('');
watch(
  open,
  /** Initializes or clears the group name draft. */ (value) => {
    form.name = value ? (props.group?.name ?? '') : '';
    error.value = '';
  },
);

/** Persists a validated group name while retaining the submit loading state. */
async function save(): Promise<void> {
  if (saving.value) return;
  saving.value = true;
  error.value = '';
  try {
    if (props.group) await api.userGroups.rename(props.group.id, form);
    else await api.userGroups.create(form);
    await props.refresh();
    open.value = false;
  } catch (reason) {
    error.value =
      isAxiosError(reason) && reason.response?.status === 409 ? 'userGroups.nameExists' : 'userGroups.saveError';
  } finally {
    saving.value = false;
  }
}
</script>
