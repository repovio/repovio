<template>
  <nav class="space-y-6" data-testid="docs-navigation" :aria-label="t('guides')">
    <section v-for="section in sections" :key="section.id" :aria-labelledby="`${id}-${section.id}`">
      <h2 :id="`${id}-${section.id}`" class="mb-2 px-2 text-xs font-semibold text-highlighted">
        {{ t(section.title) }}
      </h2>
      <GuideItem v-for="node in section.nodes" :key="node.id" :node="node" @select="emit('select')" />
    </section>
  </nav>
</template>

<script setup lang="ts">
import { getGuideSection, type GuideNavigationNode } from '#shared/docs-navigation';
import GuideItem from './guide-item.vue';

const props = defineProps<{ nodes: GuideNavigationNode[] }>();
const emit = defineEmits<{ select: [] }>();
const { t } = useI18n();
const id = useId();
const sections = computed(
  /** Return `[ { id: 'overview', title: 'docsOverview' }, { id: 'operations', title: 'docsOperations' }, { id: 'administration', title: 'docsAdministrati` when invoked. */ () =>
    [
      { id: 'overview', title: 'docsOverview' },
      { id: 'operations', title: 'docsOperations' },
      { id: 'administration', title: 'docsAdministration' },
    ].map(
      /** Map each entry to `({ ...section, nodes: props.nodes.filter((node) => getGuideSection(node.id) === section.id) })`. */ (
        section,
      ) => ({
        ...section,
        nodes: props.nodes.filter(
          /** Keep entries matching `getGuideSection(node.id) === section.id`. */ (node) =>
            getGuideSection(node.id) === section.id,
        ),
      }),
    ),
);
</script>
