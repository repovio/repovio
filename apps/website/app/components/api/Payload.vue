<template>
  <div class="space-y-4">
    <p v-if="resolved.description" class="whitespace-pre-wrap text-sm text-muted">
      {{ resolved.description }}
    </p>
    <span v-if="resolved.required" class="text-xs font-medium text-primary">{{ t('apiRequired') }}</span>
    <div v-for="(media, contentType) in resolved.content" :key="contentType" class="space-y-3">
      <code class="break-all text-xs text-muted">
        {{ contentType }}
      </code>
      <ApiSchema v-if="media.schema" :schema="media.schema" :document="document" />
      <details v-if="media.example !== undefined || media.examples" class="text-xs">
        <summary class="cursor-pointer text-muted">
          {{ t('apiExamples') }}
        </summary>
        <!-- eslint-disable repovio/multiline-tag-content-newline -- Preserve preformatted JSON without extra whitespace. -->
        <pre
          class="max-h-80 overflow-auto rounded-lg bg-elevated p-3"
        ><code>{{ JSON.stringify(media.examples ?? media.example, null, 2) }}</code></pre>
        <!-- eslint-enable repovio/multiline-tag-content-newline -->
      </details>
    </div>
    <div v-for="(header, name) in resolved.headers" :key="name" class="space-y-2">
      <!-- eslint-disable-next-line vue/singleline-html-element-content-newline -- Preserve the header suffix without trailing whitespace. -->
      <code class="break-all text-xs">{{ name }} (header)</code>
      <ApiSchema v-if="header.schema" :schema="header.schema" :document="document" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { resolveApiReference, type ApiDocument, type ApiPayload } from '#shared/openapi';
const props = defineProps<{ payload: ApiPayload; document: ApiDocument }>();
const { t } = useI18n();
const resolved = computed(
  /** Return `resolveApiReference(props.payload, props.document)` when invoked. */ () =>
    resolveApiReference(props.payload, props.document),
);
</script>
