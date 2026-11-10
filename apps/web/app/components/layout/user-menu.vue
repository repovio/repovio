<template>
  <UDropdownMenu
    v-if="auth.user"
    v-model:open="menuOpen"
    :content="{ onCloseAutoFocus: openShortcutsAfterMenu }"
    :items="items"
    :ui="{ content: 'w-64' }"
  >
    <UButton
      ref="menuTrigger"
      class="gap-2"
      color="neutral"
      variant="ghost"
      :aria-label="getUserDisplayName(auth.user)"
      :disabled="signingOut || isChangingLocale"
      :loading="signingOut || isChangingLocale"
    >
      <CommonUserAvatar
        size="2xs"
        :avatar-source="auth.user.avatarSource"
        :avatar-updated-at="auth.user.avatarUpdatedAt"
        :first-name="auth.user.firstName"
        :last-name="auth.user.lastName"
        :user-id="auth.user.id"
        :username="auth.user.username"
      />
      <span class="hidden max-w-64 truncate text-sm sm:inline">{{ getUserDisplayName(auth.user) }}</span>
    </UButton>
  </UDropdownMenu>
  <UModal
    v-model:open="cleanupFailed"
    :title="$t('notifications.push.cleanupTitle')"
    :description="$t('notifications.push.cleanupDescription')"
  >
    <template #footer>
      <UButton color="neutral" :label="$t('notifications.navbar.retry')" :loading="signingOut" @click="signOut()" />
      <UButton
        color="error"
        :label="$t('notifications.push.continueSignOut')"
        :loading="signingOut"
        @click="signOut(true)"
      />
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { DropdownMenuItem } from '#ui/types';
import { useEventListener } from '@vueuse/core';

import { useLocales } from '~/composables/app/locales';
import { useShortcuts } from '~/composables/app/shortcuts';
import { useThemes } from '~/composables/app/themes';
import { useAuthStore } from '~/store/auth';
import { globalShortcuts } from '~/util/shortcuts';
import { getUserDisplayName } from '~/utils/user-identity';

const auth = useAuthStore();
const signingOut = ref(false);
const cleanupFailed = ref(false);
const menuTrigger = useTemplateRef('menuTrigger');
const shortcutsRequested = ref(false);
const menuOpen = ref(false);
const restoreLocaleFocus = ref(false);
const localeFocusOrigin = shallowRef<HTMLElement | null>(null);
const { open: shortcutsOpen } = useShortcuts();

/** Let the dropdown restore trigger focus before the dialog captures it. */
function openShortcutsAfterMenu(event: Event): void {
  if (isChangingLocale.value && restoreLocaleFocus.value) {
    event.preventDefault();
    return;
  }
  if (!shortcutsRequested.value) return;
  event.preventDefault();
  menuTrigger.value?.$el?.focus();
  shortcutsRequested.value = false;
  void nextTick(
    /** Opens the shortcuts dialog after the menu has released focus. */ () => {
      shortcutsOpen.value = true;
    },
  );
}

const { t } = useI18n();
const { dropdownMenuItems: localeItems, isChangingLocale } = useLocales(
  /** Release modal hiding so a failed selection can announce its error. */ () => {
    menuOpen.value = false;
  },
);

/** Remember keyboard dismissal while the native menu trigger cannot receive focus. */
function deferLocaleFocus(event: KeyboardEvent): void {
  if (event.key !== 'Escape' || !menuOpen.value || !isChangingLocale.value) return;
  restoreLocaleFocus.value = true;
  localeFocusOrigin.value = document.activeElement?.closest<HTMLElement>('[role="menu"]') ?? null;
}

useEventListener('keydown', deferLocaleFocus, { capture: true });

watch(
  isChangingLocale,
  /** Restore deferred keyboard focus after loading, without moving it away from another control. */ async (
    changing,
  ) => {
    if (changing || !restoreLocaleFocus.value) return;
    await nextTick();
    if (document.activeElement === document.body || localeFocusOrigin.value?.contains(document.activeElement)) {
      menuTrigger.value?.$el?.focus();
    }
    restoreLocaleFocus.value = false;
    localeFocusOrigin.value = null;
  },
);
const { dropdownMenuItems: themeItems } = useThemes();

const items = computed<DropdownMenuItem[]>(
  /** Derives items from the current reactive dependencies. */ () => [
    {
      icon: 'i-lucide-settings',
      label: t('layout.settings'),
      to: '/admin/settings',
    },
    { type: 'separator' },
    {
      children: localeItems.value,
      icon: 'i-tabler-language',
      label: t('layout.language'),
    },
    {
      children: themeItems.value,
      icon: 'i-tabler-palette',
      label: t('layout.theme'),
    },
    { type: 'separator' },
    {
      icon: 'i-tabler-keyboard',
      label: t('shortcuts.title'),
      kbds: [
        ...globalShortcuts.find(
          /** Finds the first entry matching `shortcut.id === 'shortcuts'`. */ (shortcut) =>
            shortcut.id === 'shortcuts',
        )!.keys,
      ],
      /** Runs the selected menu action. */
      onSelect: () => {
        shortcutsRequested.value = true;
      },
    },
    {
      color: 'error',
      icon: 'i-tabler-logout',
      label: t('auth.signOut'),
      /** Runs the selected menu action. */
      onSelect: () => {
        void signOut();
      },
    },
  ],
);

/** End the browser session before returning to the public sign-in route. */
async function signOut(force = false): Promise<void> {
  if (signingOut.value) return;

  signingOut.value = true;
  try {
    await auth.signOut(force);
    cleanupFailed.value = false;
    await navigateTo('/auth/signin');
  } catch {
    if (auth.user) cleanupFailed.value = true;
    else await navigateTo('/auth/signin');
  } finally {
    signingOut.value = false;
  }
}
</script>

<style lang="css">
::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
}

::view-transition-new(root) {
  z-index: 9999;
}

::view-transition-old(root) {
  z-index: 1;
}
</style>
