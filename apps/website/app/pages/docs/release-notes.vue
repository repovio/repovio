<template>
  <div class="docs-page">
    <DocsToolbar section="release-notes" :show-version="false" />
    <ReleaseHistory :document="document!" />
  </div>
</template>

<script setup lang="ts">
import ReleaseHistory from '~/components/modules/docs/release-history.vue';

const { t } = useI18n();
useSeoMeta({
  /** Keep the title reactive when switching the website language. */
  title: () => t('releaseNotes'),
  /** Describe the canonical application history in the current interface language. */
  description: () => t('releaseNotesDescription'),
  /** Share the localized release-history title. */
  ogTitle: () => t('releaseNotes'),
  /** Share the localized release-history description. */
  ogDescription: () => t('releaseNotesDescription'),
  ogType: 'article',
});

const { data: document } = await useAsyncData(
  'application-release-history',
  /** Read the immutable local application changelog, independent of the handbook version and locale. */ () =>
    queryCollection('release_notes').first(),
);
if (!document.value) throw createError({ statusCode: 500, statusMessage: 'Release history unavailable' });
</script>
