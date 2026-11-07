<template>
  <UCard :ui="{ body: 'space-y-5' }">
    <template #header>
      <div>
        <h2 class="font-semibold">
          {{ $t('settings.avatar') }}
        </h2>
        <p class="text-sm text-muted">
          {{ $t('settings.avatarDescription') }}
        </p>
      </div>
    </template>

    <UAlert v-if="error" color="error" icon="i-lucide-circle-alert" variant="subtle" :title="error" />
    <UAlert
      v-else-if="saved"
      color="success"
      icon="i-lucide-circle-check"
      variant="subtle"
      :title="$t('settings.avatarSaved')"
    />

    <div v-if="auth.user" class="flex flex-wrap items-center gap-4">
      <CommonUserAvatar
        size="xl"
        :avatar-updated-at="auth.user.avatarUpdatedAt"
        :first-name="auth.user.firstName"
        :last-name="auth.user.lastName"
        :user-id="auth.user.id"
        :username="auth.user.username"
      />
      <UButton
        v-if="auth.user.avatarUpdatedAt"
        color="error"
        icon="i-lucide-trash-2"
        variant="soft"
        :label="$t('settings.avatarRemove')"
        :loading="removing"
        @click="remove"
      />
    </div>

    <UForm :schema="localizeFormSchema(avatarUploadSchema, $t('forms.invalidValue'))" :state="{ file: selectedFile }">
      <UFormField name="file" :error="fileValidationError || undefined">
        <UFileUpload
          v-model="selectedFile"
          accept="image/jpeg,image/png,image/webp"
          :description="$t('settings.avatarUploadDescription')"
          :disabled="busy"
          :label="$t('settings.avatarUpload')"
          @update:model-value="handleSelectedFile"
        />
      </UFormField>
    </UForm>

    <UForm
      class="flex flex-col gap-2 sm:flex-row"
      :schema="localizeFormSchema(remoteAvatarSchema, $t('forms.invalidValue'))"
      :state="remoteForm"
      @submit="importRemote"
    >
      <UFormField name="url" class="flex-1" :label="$t('settings.avatarImport')" :ui="{ label: 'sr-only' }">
        <UInput
          v-model="remoteForm.url"
          class="w-full"
          type="url"
          :disabled="busy"
          :placeholder="$t('settings.avatarUrlPlaceholder')"
        />
      </UFormField>
      <UButton
        type="submit"
        icon="i-lucide-download"
        :disabled="busy || !remoteForm.url.trim()"
        :label="$t('settings.avatarImport')"
        :loading="importing"
      />
    </UForm>

    <ModulesSettingsAvatarCropDialog
      v-if="sourceUrl"
      :open="cropOpen"
      :source="sourceUrl"
      :save="save"
      @update:open="handleCropOpen"
    />
  </UCard>
</template>

<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui';
import { ApiRemoteAvatarSchema, localizeFormSchema } from '@repovio/schemas';
import { computed, onBeforeUnmount, reactive, ref } from 'vue';
import { z } from 'zod';
import { useDestructiveAction } from '~/composables/app/destructive-action';

import { useApi } from '~/composables/api/api';
import { useAuthStore } from '~/store/auth';
import type { AuthenticatedUser } from '~/types/api/auth';

const { confirmDestructiveAction } = useDestructiveAction();
const maximumBytes = 2 * 1024 * 1024;
const supportedTypes = ['image/jpeg', 'image/png', 'image/webp'];
const { t } = useI18n();
const api = useApi();
const auth = useAuthStore();
const selectedFile = ref<File | null>();
const remoteForm = reactive({ url: '' });
const fileValidationError = ref('');
/** Validate browser files without referencing File during server rendering. */
const avatarFileSchema = computed(
  /** Derives avatar file schema from the current reactive dependencies. */ () =>
    z
      .custom<File>(
        /** Evaluates `typeof File !== 'undefined' && value instanceof File` when z .custom invokes this callback. */ (
          value,
        ) => typeof File !== 'undefined' && value instanceof File,
        {
          /** Returns the localized validation error for this field. */
          error: () => t('forms.invalidValue'),
        },
      )
      .refine(/** Validates input against `file.size <= maximumBytes`. */ (file) => file.size <= maximumBytes, {
        /** Returns the localized validation error for this field. */ error: () => t('settings.avatarTooLarge'),
      })
      .refine(
        /** Validates input against `supportedTypes.includes(file.type)`. */ (file) =>
          supportedTypes.includes(file.type),
        { /** Returns the localized validation error for this field. */ error: () => t('settings.avatarInvalidType') },
      ),
);
const avatarUploadSchema = computed(
  /** Derives avatar upload schema from the current reactive dependencies. */ () =>
    z.object({ file: avatarFileSchema.value }),
);
const remoteAvatarBaseSchema = ApiRemoteAvatarSchema.pick({ url: true }).extend({ url: z.string().trim() });
const remoteAvatarSchema = computed(
  /** Derives remote avatar schema from the current reactive dependencies. */ () =>
    remoteAvatarBaseSchema.superRefine(
      /** Validates input against the remoteAvatarSchema predicate. */ (input, context) => {
        if (!ApiRemoteAvatarSchema.safeParse(input).success) {
          context.addIssue({ code: 'custom', message: t('forms.invalidValue'), path: ['url'] });
        }
      },
    ),
);
type RemoteAvatarForm = z.output<typeof remoteAvatarBaseSchema>;
const sourceUrl = ref<string>();
const cropOpen = ref(false);
const importing = ref(false);
const removing = ref(false);
const saving = ref(false);
const saved = ref(false);
const error = ref('');
const busy = computed(
  /** Derives busy from the current reactive dependencies. */ () => importing.value || removing.value || saving.value,
);

/** Validate a selected source and either upload it or open the square crop dialog. */
async function handleSelectedFile(file?: File | null): Promise<void> {
  if (!file) return;
  error.value = '';
  saved.value = false;
  await prepare(file);
}

/** Import one protected HTTPS source through the API before applying the local crop workflow. */
async function importRemote(event: FormSubmitEvent<RemoteAvatarForm>): Promise<void> {
  if (importing.value) return;
  error.value = '';
  saved.value = false;
  importing.value = true;
  try {
    const { data } = await api.post<Blob>(
      '/auth/me/avatar/remote-preview',
      { url: event.data.url },
      { responseType: 'blob' },
    );
    await prepare(new File([data], 'remote-avatar', { type: data.type }));
  } catch {
    error.value = t('settings.avatarImportError');
  } finally {
    importing.value = false;
  }
}

/** Reject unsupported, oversized, or missing source and cropped files before any upload. */
function validateFile(file: File): boolean {
  const parsed = avatarFileSchema.value.safeParse(file);
  fileValidationError.value = parsed.success ? '' : (parsed.error.issues[0]?.message ?? t('forms.invalidValue'));
  if (!parsed.success) selectedFile.value = null;
  return parsed.success;
}

/** Detect source geometry and require an explicit crop only for non-square images. */
async function prepare(file: File): Promise<void> {
  if (!validateFile(file)) return;
  try {
    const { height, width } = await readImageDimensions(file);
    const isSquare = width === height;
    if (isSquare) {
      await save(file);
      return;
    }
    replaceSourceUrl(URL.createObjectURL(file));
    cropOpen.value = true;
  } catch {
    error.value = t('settings.avatarInvalidImage');
  }
}

/** Read source dimensions through the same browser image decoder used by the preview. */
async function readImageDimensions(file: File): Promise<{ height: number; width: number }> {
  const objectUrl = URL.createObjectURL(file);
  try {
    return await new Promise(
      /** Resolves decoded image dimensions or rejects when image loading fails. */ (resolve, reject) => {
        const image = new Image();
        image.onload =
          /** Returns `resolve({ height: image.naturalHeight, width: image.naturalWidth })` to the caller. */ () =>
            resolve({ height: image.naturalHeight, width: image.naturalWidth });
        image.onerror = /** Returns `reject(new Error('Image decoding failed.'))` to the caller. */ () =>
          reject(new Error('Image decoding failed.'));
        image.src = objectUrl;
      },
    );
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/** Persist a square source and immediately refresh every current-user avatar surface. */
async function save(file: File): Promise<void> {
  if (!validateFile(file)) return;
  saving.value = true;
  error.value = '';
  saved.value = false;
  try {
    const form = new FormData();
    form.append('file', file);
    const { data } = await api.put<AuthenticatedUser>('/auth/me/avatar', form);
    auth.updateUser(data);
    selectedFile.value = null;
    remoteForm.url = '';
    saved.value = true;
  } catch {
    error.value = t('settings.avatarSaveError');
  } finally {
    saving.value = false;
    replaceSourceUrl(undefined);
  }
}

/** Delete the persisted avatar and switch every surface back to initials. */
async function remove(): Promise<void> {
  await confirmDestructiveAction(
    t('settings.avatar'),
    /** Perform the confirmed action and await its dependent UI updates. */ async () => {
      removing.value = true;
      error.value = '';
      saved.value = false;
      try {
        const { data } = await api.delete<AuthenticatedUser>('/auth/me/avatar');
        auth.updateUser(data);
        saved.value = true;
      } catch (cause) {
        error.value = t('settings.avatarRemoveError');
        throw cause;
      } finally {
        removing.value = false;
      }
    },
  );
}

/** Releases the previous preview URL before assigning the replacement. */
function replaceSourceUrl(nextSource: string | undefined): void {
  if (sourceUrl.value) URL.revokeObjectURL(sourceUrl.value);
  sourceUrl.value = nextSource;
}

/** Handles crop open. */
function handleCropOpen(isOpen: boolean): void {
  cropOpen.value = isOpen;
  if (!isOpen && !saving.value) replaceSourceUrl(undefined);
}

onBeforeUnmount(
  /** Releases component resources and subscriptions before disposal. */ () => replaceSourceUrl(undefined),
);
</script>
