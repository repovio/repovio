<template>
  <section :id="endpoint.anchor" class="scroll-mt-40 overflow-hidden rounded-xl border border-default">
    <div class="space-y-3 border-b border-default bg-elevated/40 p-4 sm:p-6">
      <h3 class="!m-0 flex flex-wrap items-baseline gap-3 !text-base">
        <UBadge color="primary" variant="subtle" class="font-mono">
          {{ endpoint.method.toUpperCase() }}
        </UBadge>
        <a dir="ltr" class="min-w-0 break-all font-mono text-sm" :href="`#${endpoint.anchor}`">
          {{ endpoint.path }}
        </a>
      </h3>
      <p v-if="endpoint.summary" class="font-medium">
        {{ endpoint.summary }}
      </p>
      <p v-if="endpoint.description" class="whitespace-pre-wrap text-sm text-muted">
        {{ endpoint.description }}
      </p>
      <UBadge v-if="endpoint.deprecated" color="warning" variant="subtle">
        {{ t('apiDeprecated') }}
      </UBadge>
    </div>
    <div class="space-y-6 p-4 sm:p-6">
      <div>
        <h4 class="mb-2 text-sm font-semibold">
          {{ t('apiAuthentication') }}
        </h4>
        <p v-if="!endpoint.security?.length" class="text-sm text-muted">
          {{ t('apiPublic') }}
        </p>
        <ul v-else class="space-y-2 text-sm">
          <li v-for="(alternative, index) in endpoint.security" :key="index" class="space-y-1">
            <span class="text-xs text-muted">{{ t('apiSecurityOption', { number: index + 1 }) }}</span>
            <p v-if="!Object.keys(alternative).length">
              {{ t('apiPublic') }}
            </p>
            <p v-for="(scopes, name) in alternative" :key="name" class="break-words font-mono text-xs">
              {{ name }} · {{ securityLabel(String(name)) }}{{ scopes.length ? ` (${scopes.join(', ')})` : '' }}
            </p>
          </li>
        </ul>
      </div>
      <div v-if="endpoint.parameters?.length" class="space-y-4">
        <h4 class="text-sm font-semibold">
          {{ t('apiParameters') }}
        </h4>
        <div
          v-for="parameter in endpoint.parameters"
          :key="`${parameter.in}:${parameter.name}`"
          class="space-y-2 border-s border-default ps-3"
        >
          <span class="text-xs text-muted">{{ parameter.in }}</span>
          <p v-if="parameter.description" class="whitespace-pre-wrap text-sm text-muted">
            {{ parameter.description }}
          </p>
          <ApiSchema
            :schema="parameter.schema || {}"
            :document="document"
            :name="parameter.name"
            :required="parameter.required || parameter.in === 'path'"
          />
          <ApiPayload v-if="parameter.content" :payload="{ content: parameter.content }" :document="document" />
        </div>
      </div>
      <div v-if="endpoint.requestBody" class="space-y-3">
        <h4 class="text-sm font-semibold">
          {{ t('apiRequestBody') }}
        </h4>
        <ApiPayload :payload="endpoint.requestBody" :document="document" />
      </div>
      <div v-if="endpoint.responses" class="space-y-3">
        <h4 class="text-sm font-semibold">
          {{ t('apiResponses') }}
        </h4>
        <details
          v-for="(response, code) in endpoint.responses"
          :key="code"
          class="rounded-lg border border-default p-3"
          @toggle="openResponses[String(code)] = ($event.target as HTMLDetailsElement).open"
        >
          <summary class="cursor-pointer text-sm">
            <code>
              {{ code }}
            </code>
            {{ resolveApiReference(response, document).description }}
          </summary>
          <div v-if="openResponses[String(code)]" class="mt-4">
            <ApiPayload :payload="response" :document="document" />
          </div>
        </details>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { resolveApiReference, type ApiDocument, type ApiEndpoint } from '#shared/openapi';
const props = defineProps<{ endpoint: ApiEndpoint; document: ApiDocument }>();
const { t } = useI18n();
const openResponses = ref<Record<string, boolean>>({});
/** Describe the authentication transport declared by the selected security scheme. */
function securityLabel(name: string): string {
  const scheme = props.document.components?.securitySchemes?.[name];
  return [scheme?.type, scheme?.scheme, scheme?.in, scheme?.name].filter(Boolean).join(' · ');
}
</script>
