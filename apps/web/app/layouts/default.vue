<template>
  <UDashboardGroup storage="local" storage-key="repovio" unit="rem">
    <a
      class="sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-inverted focus:outline-none"
      href="#main-content"
    >
      {{ t('layout.skipToContent') }}
    </a>

    <LayoutSidebar />

    <div class="flex min-w-0 flex-1 flex-col">
      <UDashboardPanel
        id="main"
        class="min-h-0"
        :ui="{ body: usesFullWidthContent ? 'overflow-hidden p-0!' : 'overflow-y-auto p-0!' }"
      >
        <template #header>
          <LayoutNavbar />
        </template>

        <template #body>
          <main
            id="main-content"
            tabindex="-1"
            :class="[
              'w-full',
              usesFullWidthContent
                ? 'flex min-h-0 flex-1 flex-col overflow-hidden'
                : 'mx-auto max-w-7xl p-4 sm:p-6 lg:p-8',
            ]"
          >
            <slot />
          </main>
        </template>
      </UDashboardPanel>

      <LayoutApiStatusBar />
    </div>

    <LayoutCommandPalette />
    <CommonDialogsShortcuts />
    <LayoutChangelogDialog v-model:open="changelogOpen" />
  </UDashboardGroup>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useCommandPalette } from '~/composables/app/command-palette';
import { useShortcuts } from '~/composables/app/shortcuts';
import { useSettingsStore } from '~/store/settings';
import { createShortcutBindings } from '~/util/shortcuts';

const { t } = useI18n();
const route = useRoute();
const usesFullWidthContent = computed(
  /** Derives uses full width content from the current reactive dependencies. */ () => route.meta.fullWidth === true,
);
const settings = useSettingsStore();
const changelogOpen = useState(
  'changelog-open',
  /** Evaluates `false` when useState invokes this callback. */ () => false,
);

const { open: paletteOpen, show: showPalette } = useCommandPalette();
const { open: shortcutsOpen } = useShortcuts();

/** Open the shared search without interrupting another dialog. */
function openSearch(): void {
  if (document.querySelector('[role="dialog"]:not([data-state="closed"])')) return;
  showPalette();
}

defineShortcuts(
  createShortcutBindings({
    search: openSearch,
    palette: openSearch,
    /** Opens the keyboard-shortcuts dialog. */
    shortcuts: () => {
      if (!paletteOpen.value) shortcutsOpen.value = !shortcutsOpen.value;
    },
  }),
);

onMounted(
  /** Initializes component subscriptions and data after mounting. */ () => {
    void settings.load();
  },
);
</script>
