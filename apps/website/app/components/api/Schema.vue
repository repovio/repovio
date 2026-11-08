<template>
  <div class="min-w-0 space-y-2 text-sm">
    <div class="flex flex-wrap items-baseline gap-2">
      <code v-if="name" class="break-all font-semibold">
        {{ name }}
      </code>
      <span v-if="required" class="text-xs font-medium text-primary">{{ t('apiRequired') }}</span>
      <code class="break-all text-xs text-muted">
        {{ typeLabel }}
      </code>
      <span v-if="resolved.nullable" class="text-xs text-muted">nullable</span>
    </div>
    <p v-if="resolved.description" class="whitespace-pre-wrap text-sm text-muted">
      {{ resolved.description }}
    </p>
    <p v-if="resolved.enum" class="break-words font-mono text-xs">
      {{ JSON.stringify(resolved.enum) }}
    </p>
    <template v-if="!stopped">
      <details
        v-if="Object.keys(resolved.properties || {}).length"
        class="rounded-lg border border-default p-3"
        @toggle="propertiesOpen = ($event.target as HTMLDetailsElement).open"
      >
        <summary class="cursor-pointer text-sm font-medium">
          {{ t('apiProperties') }}
        </summary>
        <div v-if="propertiesOpen" class="mt-4 space-y-4 border-s border-default ps-3">
          <ApiSchema
            v-for="(property, key) in resolved.properties"
            :key="key"
            :schema="property"
            :document="document"
            :name="String(key)"
            :required="resolved.required?.includes(String(key))"
            :depth="depth + 1"
            :references="nextReferences"
          />
        </div>
      </details>
      <div v-if="resolved.items" class="border-s border-default ps-3">
        <span class="text-xs text-muted">{{ t('apiItems') }}</span>
        <ApiSchema :schema="resolved.items" :document="document" :depth="depth + 1" :references="nextReferences" />
      </div>
      <div v-if="resolved.additionalProperties" class="border-s border-default ps-3">
        <span class="text-xs text-muted">{{ t('apiAdditionalProperties') }}</span>
        <ApiSchema
          v-if="typeof resolved.additionalProperties === 'object'"
          :schema="resolved.additionalProperties"
          :document="document"
          :depth="depth + 1"
          :references="nextReferences"
        />
      </div>
      <template v-for="composition in compositions" :key="composition.kind">
        <div v-if="composition.schemas?.length" class="space-y-3 border-s border-default ps-3">
          <code class="text-xs text-muted">
            {{ composition.kind }}
          </code>
          <ApiSchema
            v-for="(variant, index) in composition.schemas"
            :key="index"
            :schema="variant"
            :document="document"
            :depth="depth + 1"
            :references="nextReferences"
          />
        </div>
      </template>
    </template>
    <p v-else class="text-xs text-muted">
      {{ t('apiSchemaLimit') }}
    </p>
    <details
      v-if="depth === 0 || stopped"
      class="text-xs"
      @toggle="jsonOpen = ($event.target as HTMLDetailsElement).open"
    >
      <summary class="cursor-pointer text-muted">
        {{ t('apiSchemaJson') }}
      </summary>
      <!-- eslint-disable repovio/multiline-tag-content-newline -- Preserve preformatted schema bytes. -->
      <pre
        v-if="jsonOpen"
        class="mt-2 max-h-80 overflow-auto rounded-lg bg-elevated p-3"
      ><code>{{ JSON.stringify(schema, null, 2) }}</code></pre>
      <!-- eslint-enable repovio/multiline-tag-content-newline -->
    </details>
  </div>
</template>

<script setup lang="ts">
import { resolveApiReference, type ApiDocument, type ApiSchema } from '#shared/openapi';
const props = withDefaults(
  defineProps<{
    schema: ApiSchema;
    document: ApiDocument;
    name?: string;
    required?: boolean;
    depth?: number;
    references?: string[];
  }>(),
  { name: '', depth: 0, references: /** Allocate a separate reference chain for each component instance. */ () => [] },
);
const { t } = useI18n();
const propertiesOpen = ref(false);
const jsonOpen = ref(false);
const resolved = computed(
  /** Return `resolveApiReference(props.schema, props.document)` when invoked. */ () =>
    resolveApiReference(props.schema, props.document),
);
const stopped = computed(
  /** Return `props.depth >= 8 || Boolean(props.schema.$ref && props.references.includes(props.schema.$ref))` when invoked. */ () =>
    props.depth >= 8 || Boolean(props.schema.$ref && props.references.includes(props.schema.$ref)),
);
const nextReferences = computed(
  /** Return `props.schema.$ref ? [...props.references, props.schema.$ref] : props.references` when invoked. */ () =>
    props.schema.$ref ? [...props.references, props.schema.$ref] : props.references,
);
const typeLabel = computed(
  /** Return `[ props.schema.$ref?.split('/').at(-1), Array.isArray(resolved.value.type) ? resolved.value.type.join(' | ') : resolved.value.type, resolved` when invoked. */ () =>
    [
      props.schema.$ref?.split('/').at(-1),
      Array.isArray(resolved.value.type) ? resolved.value.type.join(' | ') : resolved.value.type,
      resolved.value.format,
    ]
      .filter(Boolean)
      .join(' · '),
);
const compositions = computed(
  /** Return `['allOf', 'anyOf', 'oneOf'].map((kind) => ({ kind, schemas: resolved.value[kind] as ApiSchema[] | undefined, }))` when invoked. */ () =>
    ['allOf', 'anyOf', 'oneOf'].map(
      /** Map each entry to `({ kind, schemas: resolved.value[kind] as ApiSchema[] | undefined, })`. */ (kind) => ({
        kind,
        schemas: resolved.value[kind] as ApiSchema[] | undefined,
      }),
    ),
);
</script>
