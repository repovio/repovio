<template>
  <UModal
    v-model:open="open"
    :title="$t(user ? 'users.resetPassword' : 'users.create')"
    :dismissible="!saving"
    :close="!saving"
  >
    <template #body>
      <UAlert v-if="error" class="mb-4" color="error" :title="$t(error)" />
      <UForm class="space-y-4" :schema="schema" :state="form" @submit="save">
        <template v-if="!user">
          <UFormField name="username" :label="$t('users.columns.username')" required>
            <UInput v-model="form.username" class="w-full" autocomplete="off" :disabled="saving" />
          </UFormField>
          <UFormField name="firstName" :label="$t('settings.firstName')">
            <UInput v-model="form.firstName" class="w-full" :disabled="saving" />
          </UFormField>
          <UFormField name="lastName" :label="$t('settings.lastName')">
            <UInput v-model="form.lastName" class="w-full" :disabled="saving" />
          </UFormField>
          <UFormField name="role" :label="$t('users.columns.role')" required>
            <USelect v-model="form.role" class="w-full" :items="roles" :disabled="saving" />
          </UFormField>
        </template>
        <p v-else class="text-sm text-muted">
          {{ $t('users.resetHint', { username: getUserIdentityLabel(user) }) }}
        </p>
        <UFormField
          name="password"
          :label="$t('settings.newPassword')"
          :help="$t('auth.passwordRequirements')"
          required
        >
          <UInput
            v-model="form.password"
            class="w-full"
            type="password"
            autocomplete="new-password"
            :disabled="saving"
          />
        </UFormField>
        <UFormField name="confirmPassword" :label="$t('auth.confirmPassword')" required>
          <UInput
            v-model="form.confirmPassword"
            class="w-full"
            type="password"
            autocomplete="new-password"
            :disabled="saving"
          />
        </UFormField>
        <div class="flex justify-end gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            :label="$t('users.cancel')"
            :disabled="saving"
            @click="open = false"
          />
          <UButton type="submit" :label="$t(user ? 'users.resetPassword' : 'users.create')" :loading="saving" />
        </div>
      </UForm>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ApiCreateUserSchema, localizeFormSchema } from '@repovio/schemas';
import { isAxiosError } from 'axios';
import { computed, reactive, ref, watch } from 'vue';
import { z } from 'zod';
import { useRepovioApi } from '~/composables/api/repovio-api';
import { useAuthStore } from '~/store/auth';
import type { User } from '~/types/api/resources';
import { getUserIdentityLabel } from '~/utils/user-identity';

const open = defineModel<boolean>('open', { required: true });
const props = defineProps<{
  user: User | null;
  /** Refreshes the user table before releasing the submit button's pending state. */
  refresh: () => Promise<unknown>;
}>();
const { t } = useI18n();
const api = useRepovioApi();
const auth = useAuthStore();
const saving = ref(false);
const error = ref('');
const form = reactive({
  username: '',
  firstName: '',
  lastName: '',
  role: 'VIEWER' as User['role'],
  password: '',
  confirmPassword: '',
});
const roles = computed(
  /** Provides translated application roles. */ () =>
    (['VIEWER', 'MANAGER', 'SYSTEM_ADMIN'] as const).map(
      /** Labels one role. */ (value) => ({ value, label: t(`roles.${value}`) }),
    ),
);
const schema = computed(
  /** Validates creation or reset with client-only confirmation. */ () => {
    const base = props.user ? ApiCreateUserSchema.pick({ password: true }) : ApiCreateUserSchema;
    return localizeFormSchema(
      z
        .object({ ...base.shape, confirmPassword: z.string() })
        .refine(
          /** Matches the confirmation without sending it to the API. */ (value) =>
            value.password === value.confirmPassword,
          { path: ['confirmPassword'], message: t('auth.passwordMismatch') },
        ),
      t('forms.invalidValue'),
    );
  },
);
watch(
  open,
  /** Clears private drafts when opening or closing the dialog. */ () => {
    Object.assign(form, {
      username: '',
      firstName: '',
      lastName: '',
      role: 'VIEWER',
      password: '',
      confirmPassword: '',
    });
    error.value = '';
  },
);

/** Saves local credentials and waits for the dependent table refresh or self sign-out. */
async function save(): Promise<void> {
  if (saving.value) return;
  saving.value = true;
  error.value = '';
  try {
    if (props.user) {
      await api.users.resetPassword(props.user.id, { newPassword: form.password });
      if (props.user.id === auth.user?.id) {
        auth.clearSession();
        open.value = false;
        await navigateTo('/auth/signin');
        return;
      }
    } else {
      await api.users.create({
        username: form.username,
        firstName: form.firstName || undefined,
        lastName: form.lastName || undefined,
        role: form.role,
        password: form.password,
      });
    }
    form.password = '';
    form.confirmPassword = '';
    await props.refresh();
    open.value = false;
  } catch (reason) {
    error.value = isAxiosError(reason) && reason.response?.status === 409 ? 'users.usernameExists' : 'users.saveError';
  } finally {
    saving.value = false;
  }
}
</script>
