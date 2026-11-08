<template>
  <ProseA :href="localizedHref" v-bind="$attrs">
    <slot />
  </ProseA>
</template>

<script setup lang="ts">
import { ProseA } from '@nuxt/ui/components/prose';

defineOptions({ inheritAttrs: false });
const props = defineProps<{ href?: string }>();
const localePath = useLocalePath();
const localizedHref = computed(
  /** Return `(props.href?.startsWith('/docs/') ? localePath(props.href) : props.href)` when invoked. */ () =>
    props.href?.startsWith('/docs/') ? localePath(props.href) : props.href,
);
</script>
