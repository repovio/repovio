<template>
  <div class="docs-page">
    <DocsToolbar :section="tab" />
    <div
      class="page-width grid gap-10 py-8"
      :class="[
        tab === 'guides' ? 'lg:grid-cols-[260px_minmax(0,1fr)]' : 'lg:grid-cols-[200px_minmax(0,1fr)]',
        isApiReference
          ? ''
          : tab === 'guides'
            ? 'xl:grid-cols-[260px_minmax(0,1fr)_190px]'
            : 'xl:grid-cols-[200px_minmax(0,1fr)_190px]',
      ]"
    >
      <aside class="hidden lg:block">
        <div class="sticky top-40 max-h-[calc(100dvh-10rem)] overflow-y-auto px-2.5 pt-1.5">
          <DocsNavigation :tab="tab" :slug="slug" />
        </div>
      </aside>
      <article class="docs-article pb-12">
        <UAlert
          v-if="version!.status !== 'stable'"
          color="warning"
          variant="subtle"
          class="mb-5"
          :title="t(version!.status === 'preview' ? 'docsPreview' : 'docsArchived')"
        />
        <UAlert
          v-if="route.query.missing"
          color="neutral"
          variant="subtle"
          class="mb-5"
          :title="t('docsPageMissing')"
        />
        <DocsNavigation :tab="tab" :slug="slug" mobile />
        <UPageHeader
          :title="page!.title"
          :description="page!.description"
          :ui="{ title: 'text-3xl sm:text-4xl tracking-tight', description: 'text-base leading-7' }"
        />
        <UPageBody>
          <ContentRenderer v-if="page" :value="page" :components="{ img: DocsImage, a: DocsLink }" />
          <ApiReference v-if="isApiReference" :version="version!.id" />
        </UPageBody>
        <div class="mt-12 border-t border-default pt-6">
          <a
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 text-xs text-muted hover:text-primary"
            :href="editUrl"
          >
            <UIcon name="i-lucide-pencil" />
            <span>{{ t('editPage') }}</span>
          </a>
          <div class="mt-8 grid gap-4 sm:grid-cols-2">
            <NuxtLink
              v-if="neighbors.previous"
              class="rounded-xl border border-default p-5 hover:border-primary/40"
              :to="neighbors.previous.to"
            >
              <p class="mb-2 text-xs text-muted">
                {{ t('previous') }}
              </p>
              <span class="flex items-center gap-2 text-sm font-medium">
                <UIcon name="i-lucide-arrow-left" class="rtl:rotate-180" />
                <span>{{ neighbors.previous.title }}</span>
              </span>
            </NuxtLink>
            <div v-else />
            <NuxtLink
              v-if="neighbors.next"
              class="rounded-xl border border-default p-5 text-end hover:border-primary/40"
              :to="neighbors.next.to"
            >
              <p class="mb-2 text-xs text-muted">
                {{ t('next') }}
              </p>
              <span class="flex items-center justify-end gap-2 text-sm font-medium">
                <span>{{ neighbors.next.title }}</span>
                <UIcon name="i-lucide-arrow-right" class="rtl:rotate-180" />
              </span>
            </NuxtLink>
          </div>
        </div>
      </article>
      <aside v-if="!isApiReference" class="hidden xl:block">
        <UContentToc
          highlight
          highlight-variant="circuit"
          class="sticky top-40"
          :links="toc"
          :title="t('onThisPage')"
        />
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import DocsImage from '~/components/DocsImage.vue';
import DocsLink from '~/components/modules/docs/link.vue';
import DocsNavigation from '~/components/modules/docs/navigation.vue';
definePageMeta({
  /** Return `route.path` when invoked. */
  key: (route) => route.path,
  middleware: 'docs-legacy',
});
const route = useRoute();
const { locale, t } = useI18n();
const { entries, collection, version } = useDocs();
if (!version.value) throw createError({ statusCode: 404, statusMessage: 'Page not found' });
const config = useRuntimeConfig().public;
const slug = computed(/** Return `String(route.params.slug)` when invoked. */ () => String(route.params.slug));
const isApiReference = computed(
  /** Return `slug.value === 'api-reference'` when invoked. */ () => slug.value === 'api-reference',
);
const path = computed(
  /** Return ``/docs/${version.value!.id}/${slug.value}`` when invoked. */ () =>
    `/docs/${version.value!.id}/${slug.value}`,
);
const { data: page } = await useAsyncData(
  /** Return ``doc-${locale.value}-${version.value!.id}-${slug.value}`` when invoked. */ () =>
    `doc-${locale.value}-${version.value!.id}-${slug.value}`,
  /** Return `queryCollection(collection.value).path(path.value).first()` when invoked. */ () =>
    queryCollection(collection.value).path(path.value).first(),
  { watch: [locale, slug, version] },
);
if (!version.value?.slugs.includes(slug.value) || !page.value)
  throw createError({ statusCode: 404, statusMessage: 'Page not found' });
const tab = computed(
  /** Return `entries.value.find((entry) => entry.slug === slug.value)?.tab || 'get-started'` when invoked. */ () =>
    entries.value.find(/** Find the entry matching `entry.slug === slug.value`. */ (entry) => entry.slug === slug.value)
      ?.tab || 'get-started',
);
const tabEntries = computed(
  /** Return `entries.value.filter((entry) => entry.tab === tab.value)` when invoked. */ () =>
    entries.value.filter(/** Keep entries matching `entry.tab === tab.value`. */ (entry) => entry.tab === tab.value),
);
const index = computed(
  /** Return `tabEntries.value.findIndex((entry) => entry.slug === slug.value)` when invoked. */ () =>
    tabEntries.value.findIndex(
      /** Find the index matching `entry.slug === slug.value`. */ (entry) => entry.slug === slug.value,
    ),
);
const neighbors = computed(
  /** Return `({ previous: tabEntries.value[index.value - 1], next: tabEntries.value[index.value + 1], })` when invoked. */ () => ({
    previous: tabEntries.value[index.value - 1],
    next: tabEntries.value[index.value + 1],
  }),
);
const toc = computed(
  /** Return `page.value?.body?.toc?.links || []` when invoked. */ () => page.value?.body?.toc?.links || [],
);
const editUrl = computed(
  /** Return ``https://github.com/repovio/repovio/edit/main/apps/website/content/${locale.value}/docs/${version.value!.id}/${slug.value}.md`` when invoked. */ () =>
    `https://github.com/repovio/repovio/edit/main/apps/website/content/${locale.value}/docs/${version.value!.id}/${slug.value}.md`,
);
useHead(
  /** Return `({ title: `${page.value?.title} · ${version.value!.id}`, meta: version.value?.status === 'preview' ? [{ name: 'robots', content: 'noindex, f` when invoked. */ () => ({
    title: `${page.value?.title} · ${version.value!.id}`,
    meta: version.value?.status === 'preview' ? [{ name: 'robots', content: 'noindex, follow' }] : [],
  }),
);
useSeoMeta({
  /** Return `page.value?.description` when invoked. */
  description: () => page.value?.description,
  /** Return ``${page.value?.title} · ${config.brandName}`` when invoked. */
  ogTitle: () => `${page.value?.title} · ${config.brandName}`,
  /** Return `page.value?.description` when invoked. */
  ogDescription: () => page.value?.description,
  ogType: 'article',
});
</script>
