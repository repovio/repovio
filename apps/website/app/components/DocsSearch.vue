<template>
  <UModal v-model:open="open" :title="t('searchLabel')" :description="t('searchHint')">
    <template #body>
      <UInput
        v-model="query"
        icon="i-lucide-search"
        class="w-full"
        :placeholder="t('search')"
        :aria-label="t('searchLabel')"
        autofocus
      />
      <div class="mt-4 max-h-96 space-y-1 overflow-y-auto">
        <NuxtLink
          v-for="(result, index) in results"
          :key="result.id + index"
          class="block rounded-lg px-4 py-3 hover:bg-muted focus:bg-muted"
          :to="result.id"
          @click="open = false"
        >
          <div class="flex items-center gap-3 text-sm font-medium">
            <UIcon name="i-lucide-file-text" class="text-primary" />
            <span>{{ result.title }}</span>
          </div>
          <p v-if="result.content" class="mt-1 line-clamp-2 ps-7 text-xs leading-5 text-muted">
            {{ result.content.slice(0, 180) }}
          </p>
        </NuxtLink>
        <p v-if="!results.length" class="p-8 text-center text-sm text-muted">
          {{ t('noResults') }}
        </p>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { stableDocVersion } from '#shared/docs';
const open = defineModel<boolean>('open', { default: false });
const { t, locale } = useI18n();
const { entries, collection, version } = useDocs();
const localePath = useLocalePath();
const query = ref('');
const { data: sections } = await useAsyncData(
  /** Return `'docs-search-' + locale.value + '-' + (version.value?.id || stableDocVersion)` when invoked. */ () =>
    'docs-search-' + locale.value + '-' + (version.value?.id || stableDocVersion),
  /** Return `queryCollectionSearchSections(collection.value).where( 'path', 'LIKE', `/docs/${version.value?.id || stableDocVersion}/%`, )` when invoked. */ () =>
    queryCollectionSearchSections(collection.value).where(
      'path',
      'LIKE',
      `/docs/${version.value?.id || stableDocVersion}/%`,
    ),
  { watch: [locale, version] },
);
const results = computed(
  /** Filter published headings and content by the normalized search query. */ () => {
    const term = query.value.trim().toLowerCase();
    if (!term)
      return entries.value.map(
        /** Map each entry to `({ id: entry.to, title: entry.title, content: '' })`. */ (entry) => ({
          id: entry.to,
          title: entry.title,
          content: '',
        }),
      );
    return (sections.value || [])
      .filter(
        /** Keep entries matching `(section.title + ' ' + section.content).toLowerCase().includes(term)`. */ (
          section,
        ) => (section.title + ' ' + section.content).toLowerCase().includes(term),
      )
      .slice(0, 12)
      .map(
        /** Map each entry to `({ ...section, id: localePath(section.id) })`. */ (section) => ({
          ...section,
          id: localePath(section.id),
        }),
      );
  },
);
watch(
  open,
  /** Clear the previous query when the search dialog opens. */ (value) => {
    if (value) query.value = '';
  },
);
</script>
