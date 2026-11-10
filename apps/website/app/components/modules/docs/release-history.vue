<template>
  <div class="page-width grid gap-10 py-8 xl:grid-cols-[minmax(0,1fr)_190px]">
    <article class="docs-article w-full pb-12" data-testid="release-history">
      <UPageHeader
        :title="t('releaseNotes')"
        :description="t('releaseNotesDescription')"
        :ui="{ title: 'text-3xl sm:text-4xl tracking-tight', description: 'text-base leading-7' }"
      />
      <p class="mt-5 text-sm text-muted">
        {{ t('releaseNotesEnglish') }}
      </p>
      <details
        v-if="headings.length"
        class="mt-6 rounded-lg border border-default p-4 xl:hidden"
        data-testid="release-mobile-toc"
      >
        <summary class="cursor-pointer text-sm font-medium">
          {{ t('releaseNotesVersions') }}
        </summary>
        <nav
          class="mt-3 grid max-h-60 grid-cols-3 gap-2 overflow-y-auto text-sm"
          :aria-label="t('releaseNotesVersions')"
        >
          <a
            v-for="heading in headings"
            :key="heading.id"
            class="rounded px-2 py-1 text-muted hover:text-primary"
            :href="`#${heading.id}`"
          >
            {{ heading.text }}
          </a>
        </nav>
      </details>
      <UPageBody v-if="headings.length" lang="en" dir="ltr" data-testid="release-notes-body">
        <ContentRenderer :value="document" :components="{ h1: omitSourceTitle }" />
      </UPageBody>
      <p v-else class="mt-8 text-muted" role="status">
        {{ t('releaseNotesEmpty') }}
      </p>
    </article>
    <aside v-if="headings.length" class="hidden xl:block" data-testid="release-desktop-toc">
      <UContentToc
        class="sticky top-40 max-h-[calc(100dvh-11rem)] overflow-y-auto"
        :links="headings"
        :title="t('releaseNotesVersions')"
        highlight
      />
    </aside>
  </div>
</template>

<script setup lang="ts">
import type { ReleaseNotesCollectionItem } from '@nuxt/content';
import { getReleaseHeadings } from '~/util/release-notes';

/** Canonical parsed Markdown; callers own loading and unavailable-source errors. */
const props = defineProps<{ document: ReleaseNotesCollectionItem }>();
const headings = computed(
  /** Reuse the same rendered release identifiers for desktop and mobile navigation. */ () =>
    getReleaseHeadings(props.document.body.toc?.links || []),
);
/** Omit only the source H1 because the page already supplies a localized title. */
const omitSourceTitle = (): null => null;
const { t } = useI18n();
</script>
