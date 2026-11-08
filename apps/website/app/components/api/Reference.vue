<template>
  <div class="mt-8 space-y-8">
    <div
      class="flex flex-col gap-4 rounded-xl border border-default bg-elevated/30 p-4 sm:flex-row sm:items-end sm:justify-between"
    >
      <div class="min-w-0 flex-1 space-y-2">
        <label class="block text-sm font-medium" :for="searchId">
          {{ t('apiSearch') }}
        </label>
        <UInput
          v-model="search"
          :id="searchId"
          icon="i-lucide-search"
          class="w-full"
          :placeholder="t('apiSearchPlaceholder')"
        />
        <p role="status" class="text-xs text-muted">
          {{ t('apiResultCount', filtered.length) }}
        </p>
      </div>
      <UButton icon="i-lucide-download" color="neutral" variant="outline" :href="schemaUrl" download>
        {{ t('apiDownload') }}
      </UButton>
    </div>
    <UAlert v-if="error" color="error" variant="subtle" :title="t('apiLoadError')" />
    <p v-else-if="status === 'pending'" role="status" class="text-sm text-muted">
      {{ t('apiLoading') }}
    </p>
    <template v-else-if="document">
      <p v-if="!filtered.length" class="text-sm text-muted">
        {{ t('apiNoResults') }}
      </p>
      <nav v-if="filtered.length" class="flex flex-wrap gap-2" :aria-label="t('apiEndpoints')">
        <a
          v-for="endpoint in filtered"
          :key="endpoint.anchor"
          dir="ltr"
          class="max-w-full rounded-md border border-default px-2 py-1 font-mono text-xs break-all text-muted hover:text-primary"
          :href="`#${endpoint.anchor}`"
        >
          {{ endpoint.method.toUpperCase() }} {{ endpoint.path }}
        </a>
      </nav>
      <section v-for="group in groups" :key="group.name" class="space-y-5">
        <h2 class="!mt-0">
          {{ group.name || t('apiOther') }}
        </h2>
        <ApiEndpoint
          v-for="endpoint in group.endpoints"
          :key="endpoint.anchor"
          :endpoint="endpoint"
          :document="document"
        />
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { apiEndpoints, filterApiEndpoints, type ApiDocument } from '#shared/openapi';
const props = defineProps<{ version: string }>();
const { t } = useI18n();
const searchId = useId();
const search = ref('');
const schemaUrl = computed(
  /** Return ``/openapi/${props.version}.json`` when invoked. */ () => `/openapi/${props.version}.json`,
);
const { data: document, status, error } = await useFetch<ApiDocument>(schemaUrl);
const filtered = computed(
  /** Return `filterApiEndpoints(document.value ? apiEndpoints(document.value) : [], search.value)` when invoked. */ () =>
    filterApiEndpoints(document.value ? apiEndpoints(document.value) : [], search.value),
);
const groups = computed(
  /** Return `[...new Set(filtered.value.map((endpoint) => endpoint.group))].map((name) => ({ name, endpoints: filtered.value.filter((endpoint) => endpoin` when invoked. */ () =>
    [...new Set(filtered.value.map(/** Map each entry to `endpoint.group`. */ (endpoint) => endpoint.group))].map(
      /** Map each entry to `({ name, endpoints: filtered.value.filter((endpoint) => endpoint.group === name), })`. */ (
        name,
      ) => ({
        name,
        endpoints: filtered.value.filter(
          /** Keep entries matching `endpoint.group === name`. */ (endpoint) => endpoint.group === name,
        ),
      }),
    ),
);
</script>
