<template>
  <div class="page-width py-8">
    <article class="docs-article mx-auto max-w-4xl pb-12" data-testid="release-history">
      <UPageHeader
        :title="t('releaseNotes')"
        :description="t('releaseNotesDescription')"
        :ui="{ title: 'text-3xl sm:text-4xl tracking-tight', description: 'text-base leading-7' }"
      />
      <p class="mt-5 text-sm text-muted">
        {{ t('releaseNotesEnglish') }}
      </p>
      <UPageBody v-if="document.body.toc?.links.length" lang="en" dir="ltr" data-testid="release-notes-body">
        <ContentRenderer :value="document" :components="{ h1: omitSourceTitle }" />
      </UPageBody>
      <p v-else class="mt-8 text-muted" role="status">
        {{ t('releaseNotesEmpty') }}
      </p>
    </article>
  </div>
</template>

<script setup lang="ts">
import type { ReleaseNotesCollectionItem } from '@nuxt/content';

/** Canonical parsed Markdown; callers own loading and unavailable-source errors. */
defineProps<{ document: ReleaseNotesCollectionItem }>();
/** Omit only the source H1 because the page already supplies a localized title. */
const omitSourceTitle = (): null => null;
const { t } = useI18n();
</script>
