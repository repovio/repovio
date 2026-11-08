<template>
  <!-- eslint-disable vue/no-v-html -->
  <!-- Only escaped text or Shiki-generated HTML is rendered. -->
  <div dir="ltr" class="code-block" v-html="html" />
</template>

<script setup lang="ts">
import { getCodeHighlighter, highlightCode, plainCode } from '../utils/highlighting';

const props = defineProps<{ code: string; language?: string }>();
const html = ref(plainCode(props.code));
onMounted(
  /** Return `watch( () => [props.code, props.language] as const, async ([code, language], _, onCleanup) => { let active = true; onCleanup(() => (active =` when invoked. */ () =>
    watch(
      /** Return `[props.code, props.language] as const` when invoked. */ () => [props.code, props.language] as const,
      /** Load the requested code-highlighting language and render escaped source markup. */ async (
        [code, language],
        _,
        onCleanup,
      ) => {
        let active = true;
        onCleanup(/** Return `(active = false)` when invoked. */ () => (active = false));
        html.value = plainCode(code);
        try {
          const highlighter = await getCodeHighlighter();
          if (active) html.value = highlightCode(highlighter, code, language);
        } catch {
          // Keep escaped plain text if highlighting cannot initialize.
        }
      },
      { immediate: true },
    ),
);
</script>
