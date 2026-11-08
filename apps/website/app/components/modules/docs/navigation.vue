<template>
  <template v-if="tab === 'guides'">
    <UCollapsible v-if="mobile" v-model:open="mobileOpen" class="mb-6 lg:hidden">
      <UButton
        color="neutral"
        variant="outline"
        icon="i-lucide-menu"
        class="w-full justify-between"
        data-testid="guides-menu-toggle"
        :label="t('guides')"
        :disabled="!hydrated"
      />
      <template #content>
        <GuideTree class="mt-3 rounded-lg border border-default p-3" :nodes="guideNodes" @select="mobileOpen = false" />
      </template>
    </UCollapsible>
    <GuideTree v-else :nodes="guideNodes" />
  </template>
  <div v-else-if="mobile" class="mb-6 lg:hidden">
    <USelect
      class="w-full"
      :model-value="slug"
      :items="mobileItems"
      :aria-label="t('docs')"
      @update:model-value="selectPage(String($event))"
    />
  </div>
  <nav v-else class="space-y-6" data-testid="docs-navigation" :aria-label="t('docs')">
    <section v-for="section in sections" :key="section.id" :aria-labelledby="`docs-section-${section.id}`">
      <h2 :id="`docs-section-${section.id}`" class="mb-2 px-2 text-xs font-semibold text-highlighted">
        {{ section.title }}
      </h2>
      <UContentNavigation variant="link" :navigation="section.children" :collapsible="false" highlight />
    </section>
  </nav>
</template>

<script setup lang="ts">
import { buildGuideNavigation } from '#shared/docs-navigation';
import type { ContentNavigationItem } from '@nuxt/content';
import GuideTree from './guide-tree.vue';

const props = defineProps<{ tab: string; slug: string; mobile?: boolean }>();
const { t, locale } = useI18n();
const { entries, collection, version } = useDocs();
const mobileOpen = ref(false);
const hydrated = ref(false);
onMounted(
  /** Enable the collapsible handbook navigation after hydration. */ () => {
    hydrated.value = true;
  },
);
const { data: guideHeadings } = await useAsyncData(
  /** Return ``guide-headings-${locale.value}-${version.value?.id}-${props.tab}`` when invoked. */ () =>
    `guide-headings-${locale.value}-${version.value?.id}-${props.tab}`,
  /** Load published page headings for the selected locale, version, and tab. */ async () => {
    if (props.tab !== 'guides' || !version.value) return [];
    const pages = await queryCollection(collection.value)
      .where('path', 'LIKE', `/docs/${version.value.id}/%`)
      .select('path', 'body')
      .all();
    return pages.map(
      /** Map each entry to `({ path: page.path, links: page.body?.toc?.links || [] })`. */ (page) => ({
        path: page.path,
        links: page.body?.toc?.links || [],
      }),
    );
  },
  {
    /** Return `[]` when invoked. */
    default: () => [],
  },
);
const guideNodes = computed(
  /** Return `buildGuideNavigation(entries.value, guideHeadings.value, t)` when invoked. */ () =>
    buildGuideNavigation(entries.value, guideHeadings.value, t),
);
const tabEntries = computed(
  /** Return `entries.value.filter((entry) => entry.tab === props.tab)` when invoked. */ () =>
    entries.value.filter(/** Keep entries matching `entry.tab === props.tab`. */ (entry) => entry.tab === props.tab),
);
const sectionKeys: Record<string, string> = {
  'getting-started': 'gettingStarted',
  api: 'api',
  overview: 'docsOverview',
  operations: 'docsOperations',
  administration: 'docsAdministration',
};
const sections = computed(
  /** Group handbook destinations into translated navigation sections. */ () => {
    const result: Array<{ id: string; title: string; children: ContentNavigationItem[] }> = [];
    for (const entry of tabEntries.value) {
      let section = result.find(
        /** Find the entry matching `item.id === entry.section`. */ (item) => item.id === entry.section,
      );
      if (!section) {
        section = { id: entry.section, title: t(sectionKeys[entry.section]!), children: [] };
        result.push(section);
      }
      const item = { title: entry.title, path: entry.to };
      if (entry.group) {
        let group = section.children.find(
          /** Find the entry matching `child.group === entry.group`. */ (child) => child.group === entry.group,
        );
        if (!group) {
          group = { title: t(entry.group), path: entry.to, group: entry.group, children: [] };
          section.children.push(group);
        }
        group.children!.push(item);
      } else section.children.push(item);
    }
    return result;
  },
);
const mobileItems = computed(
  /** Return `sections.value.flatMap((section) => [ { type: 'label' as const, label: section.title }, ...tabEntries.value .filter((entry) => entry.section` when invoked. */ () =>
    sections.value.flatMap(
      /** Evaluate `[ { type: 'label' as const, label: section.title }, ...tabEntries.value .filter((entry) => entry.section === section.id) .map((entry) => ({ `. */ (
        section,
      ) => [
        { type: 'label' as const, label: section.title },
        ...tabEntries.value
          .filter(/** Keep entries matching `entry.section === section.id`. */ (entry) => entry.section === section.id)
          .map(
            /** Map each entry to `({ label: entry.group ? `${t(entry.group)} · ${entry.title}` : entry.title, value: entry.slug, })`. */ (
              entry,
            ) => ({
              label: entry.group ? `${t(entry.group)} · ${entry.title}` : entry.title,
              value: entry.slug,
            }),
          ),
      ],
    ),
);

/** Navigate only to a destination in this tab's versioned navigation. */
async function selectPage(slug: string): Promise<void> {
  const entry = tabEntries.value.find(
    /** Find the entry matching `item.slug === slug`. */ (item) => item.slug === slug,
  );
  if (entry) await navigateTo(entry.to);
}
</script>
