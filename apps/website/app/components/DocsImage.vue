<template>
  <template v-if="screenshot">
    <ProseImg
      class="dark:hidden"
      :src="light"
      :alt="alt || ''"
      :width="width || 1440"
      :height="height || 1000"
      v-bind="$attrs"
    />
    <ProseImg
      class="hidden dark:block"
      :src="dark"
      :alt="alt || ''"
      :width="width || 1440"
      :height="height || 1000"
      v-bind="$attrs"
    />
  </template>
  <ProseImg v-else :src="src" :alt="alt || ''" :width="width" :height="height" v-bind="$attrs" />
</template>

<script setup lang="ts">
import { ProseImg } from '@nuxt/ui/components/prose';

defineOptions({ inheritAttrs: false });
const props = defineProps<{
  src: string;
  alt?: string;
  width?: string | number;
  height?: string | number;
}>();
const localSource = computed(
  /** Return `props.src.replace(/^https:\/\/repovio\.de(?=\/images\/docs\/)/, '')` when invoked. */ () =>
    props.src.replace(/^https:\/\/repovio\.de(?=\/images\/docs\/)/, ''),
);
const screenshot = computed(
  /** Return `/^\/images\/docs\/[^/]+\/[^/]+-(light|dark)\.(?:webp|png)$/.test(localSource.value)` when invoked. */ () =>
    /^\/images\/docs\/[^/]+\/[^/]+-(light|dark)\.(?:webp|png)$/.test(localSource.value),
);
const light = computed(
  /** Return `localSource.value.replace(/-(light|dark)(\.(?:webp|png))$/, '-light$2')` when invoked. */ () =>
    localSource.value.replace(/-(light|dark)(\.(?:webp|png))$/, '-light$2'),
);
const dark = computed(
  /** Return `localSource.value.replace(/-(light|dark)(\.(?:webp|png))$/, '-dark$2')` when invoked. */ () =>
    localSource.value.replace(/-(light|dark)(\.(?:webp|png))$/, '-dark$2'),
);
</script>
