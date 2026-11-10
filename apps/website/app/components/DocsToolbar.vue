<template>
  <div
    data-testid="docs-toolbar"
    class="docs-toolbar sticky top-20 z-30 border-b border-default bg-default/95 backdrop-blur-xl"
  >
    <div class="page-width flex min-h-10 flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <UNavigationMenu
        variant="link"
        class="min-w-0 max-w-full"
        :items="items.map((item) => ({ ...item, active: item.section === section }))"
        :aria-label="t('docs')"
        highlight
        :ui="{
          list: 'flex-wrap gap-x-3 gap-y-0 p-0',
          item: 'py-0',
          link: 'h-10 py-0 text-xs after:bottom-0',
          linkLeadingIcon: 'size-4',
          linkLabel: 'whitespace-nowrap',
        }"
      />
      <DocsVersionSwitch v-if="showVersion" class="ms-auto" />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ section: string; showVersion?: boolean }>(), { showVersion: true });
const { t } = useI18n();
const localePath = useLocalePath();
const { entries } = useDocs();
const items = computed(
  /** Return `[ { label: t('getStarted'), icon: 'i-lucide-rocket', to: entries.value.find((entry) => entry.tab === 'get-started')?.to, section: 'get-start` when invoked. */ () => [
    {
      label: t('getStarted'),
      icon: 'i-lucide-rocket',
      to: entries.value.find(
        /** Find the entry matching `entry.tab === 'get-started'`. */ (entry) => entry.tab === 'get-started',
      )?.to,
      section: 'get-started',
    },
    {
      label: t('guides'),
      icon: 'i-lucide-book-open',
      to: entries.value.find(/** Find the entry matching `entry.tab === 'guides'`. */ (entry) => entry.tab === 'guides')
        ?.to,
      section: 'guides',
    },
    ...(entries.value.some(/** Check whether an entry matches `entry.tab === 'api'`. */ (entry) => entry.tab === 'api')
      ? [
          {
            label: t('api'),
            icon: 'i-lucide-code',
            to: entries.value.find(
              /** Find the entry matching `entry.tab === 'api'`. */ (entry) => entry.tab === 'api',
            )!.to,
            section: 'api',
          },
        ]
      : []),
    {
      label: t('releaseNotes'),
      icon: 'i-lucide-scroll-text',
      to: localePath('/docs/release-notes'),
      section: 'release-notes',
    },
  ],
);
</script>
