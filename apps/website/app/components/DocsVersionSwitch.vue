<template>
  <USelect
    size="sm"
    variant="outline"
    color="neutral"
    icon="i-lucide-git-branch"
    class="my-1 w-auto min-w-24 shrink-0"
    :model-value="version?.id"
    :items="
      docVersionsByNewest
        .filter((item) => item.id !== 'next')
        .map((item) => ({
          label: item.id,
          value: item.id,
        }))
    "
    :aria-label="t('docsVersion')"
    :ui="{
      base: 'rounded-md bg-default shadow-xs',
      leadingIcon: 'size-3.5',
      trailingIcon: 'size-3.5',
    }"
    @update:model-value="changeVersion($event as string)"
  />
</template>

<script setup lang="ts">
import { docPath, docVersionsByNewest } from '#shared/docs';
const { t } = useI18n();
const { version } = useDocs();
const route = useRoute();
const localePath = useLocalePath();
/** Define change version behavior. */
async function changeVersion(id: string) {
  const target = docVersionsByNewest.find(/** Find the entry matching `item.id === id`. */ (item) => item.id === id)!;
  const slug = String(route.params.slug || 'overview');
  const exists = target.slugs.includes(slug);
  await navigateTo({
    path: localePath(docPath(id, exists ? slug : 'overview')),
    query: exists ? {} : { missing: slug },
    hash: exists ? route.hash : '',
  });
}
</script>
