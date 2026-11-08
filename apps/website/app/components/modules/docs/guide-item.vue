<template>
  <div>
    <div class="flex min-w-0 items-center gap-1 rounded-md" :class="containsCurrent ? 'bg-primary/5' : ''">
      <NuxtLink
        v-if="node.to"
        class="flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-elevated focus-visible:outline-primary"
        :to="node.to"
        :class="current ? 'font-semibold text-primary' : 'text-muted hover:text-highlighted'"
        :aria-current="current ? (node.to.includes('#') ? 'location' : 'page') : undefined"
        @click="emit('select')"
      >
        <UIcon v-if="node.icon" class="size-4 shrink-0" :name="node.icon" />
        <span class="min-w-0 break-words">{{ node.title }}</span>
      </NuxtLink>
      <UButton
        v-else
        color="neutral"
        variant="ghost"
        class="min-w-0 flex-1 justify-start py-2 text-start"
        :class="containsCurrent ? 'text-primary' : 'text-muted'"
        :icon="node.icon"
        :disabled="!hydrated"
        :aria-controls="contentId"
        :aria-expanded="open"
        @click="open = !open"
      >
        <span class="min-w-0 break-words">{{ node.title }}</span>
      </UButton>
      <UButton
        v-if="node.children.length"
        color="neutral"
        variant="ghost"
        size="xs"
        class="shrink-0"
        :icon="open ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
        :disabled="!hydrated"
        :aria-label="`${t('navigation')}: ${node.title}`"
        :aria-controls="contentId"
        :aria-expanded="open"
        :ui="{ leadingIcon: open ? '' : 'rtl:rotate-180' }"
        @click="open = !open"
      />
    </div>
    <UCollapsible v-if="node.children.length" v-model:open="open">
      <template #content>
        <div :id="contentId" class="ms-3 border-s border-default ps-2">
          <GuideItem v-for="child in node.children" :key="child.id" :node="child" @select="emit('select')" />
        </div>
      </template>
    </UCollapsible>
  </div>
</template>

<script setup lang="ts">
import type { GuideNavigationNode } from '#shared/docs-navigation';
import GuideItem from './guide-item.vue';

const props = defineProps<{ node: GuideNavigationNode }>();
const emit = defineEmits<{ select: [] }>();
const route = useRoute();
const { t } = useI18n();
const contentId = useId();
const hash = ref('');
const hydrated = ref(false);
onMounted(
  /** Initialize the active fragment after hydration. */ () => {
    hydrated.value = true;
    hash.value = route.hash;
  },
);
watch(
  /** Return `route.hash` when invoked. */ () => route.hash,
  /** Track fragment navigation when determining the current guide item. */ (value) => {
    hash.value = value;
  },
);

/** Compare decoded fragments while tolerating malformed incoming bookmarks. */
function normalize(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

const current = computed(
  /** Return `!!props.node.to && normalize(props.node.to) === normalize(route.path + hash.value)` when invoked. */ () =>
    !!props.node.to && normalize(props.node.to) === normalize(route.path + hash.value),
);
/** Keep the current page's ancestors visible even when an unknown or legacy fragment is used. */
function includesPage(node: GuideNavigationNode): boolean {
  return node.to?.split('#')[0] === route.path || node.children.some(includesPage);
}
const containsCurrent = computed(
  /** Return `props.node.children.length > 0 && includesPage(props.node)` when invoked. */ () =>
    props.node.children.length > 0 && includesPage(props.node),
);
const open = ref(containsCurrent.value);
watch(
  /** Return `route.path + hash.value` when invoked. */ () => route.path + hash.value,
  /** Expand ancestors whenever navigation enters one of their descendants. */ () => {
    if (containsCurrent.value) open.value = true;
  },
);
</script>
