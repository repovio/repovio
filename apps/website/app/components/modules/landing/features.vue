<template>
  <section id="features" class="border-y border-default bg-muted/25 py-20">
    <div class="page-width">
      <h2 class="section-title">
        {{ t('featuresTitle') }}
      </h2>
      <div class="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <NuxtLink
          v-for="feature in features"
          :key="feature.key"
          class="rounded-2xl border border-default bg-default p-7 transition hover:border-primary/50 hover:bg-primary/5"
          :to="localePath(`/features/${feature.slug}`)"
        >
          <UIcon class="size-7 text-primary" :name="feature.icon" />
          <h3 class="mt-5 text-lg font-semibold">
            {{ t(`feature${feature.key}Title`) }}
          </h3>
          <p class="mt-3 text-sm leading-7 text-muted">
            {{ t(`feature${feature.key}Text`) }}
          </p>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const { t } = useI18n();
const localePath = useLocalePath();
const features = [
  { key: 'Workflows', slug: 'workflow-monitoring', icon: 'i-lucide-workflow' },
  { key: 'Work', slug: 'issues-pull-requests', icon: 'i-lucide-git-pull-request' },
  { key: 'Security', slug: 'security-alerts', icon: 'i-lucide-shield-check' },
  { key: 'Notifications', slug: 'notifications', icon: 'i-lucide-bell' },
  { key: 'Permissions', slug: 'access-control', icon: 'i-lucide-users' },
  { key: 'Mcp', slug: 'mcp', icon: 'i-lucide-plug' },
];
</script>
