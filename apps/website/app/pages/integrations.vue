<template>
  <div>
    <ProductHero
      icon="i-lucide-blocks"
      :title="t('product_integrations')"
      :description="t('product_integrationsDescription')"
    />
    <section class="page-width py-16">
      <h2 class="text-2xl font-semibold">
        {{ t('product_providers') }}
      </h2>
      <div class="mt-8 grid gap-6 sm:grid-cols-2">
        <article v-for="provider in providers" :key="provider.name" class="rounded-2xl border border-default p-7">
          <h3 class="text-xl font-semibold" dir="ltr">
            {{ provider.name }}
          </h3>
          <p class="mt-4 leading-8 text-muted">
            {{ t(provider.description) }}
          </p>
        </article>
      </div>
      <UButton
        class="mt-8"
        color="neutral"
        variant="outline"
        trailing-icon="i-lucide-arrow-right"
        :to="localePath(docPath(stableDocVersion, 'provider-accounts'))"
      >
        {{ t('provider-accounts') }}
      </UButton>
    </section>
    <section class="border-y border-default bg-muted/25 py-16">
      <div class="page-width grid gap-10 lg:grid-cols-2">
        <article>
          <UIcon name="i-lucide-bell" class="size-7 text-primary" />
          <h2 class="mt-4 text-2xl font-semibold">
            {{ t('product_channels') }}
          </h2>
          <p class="mt-4 leading-8 text-muted">
            {{ t('featureNotificationsText') }}
          </p>
          <UButton class="mt-6" color="neutral" variant="outline" :to="localePath('/features/notifications')">
            {{ t('featureNotificationsTitle') }}
          </UButton>
        </article>
        <article>
          <UIcon name="i-lucide-plug" class="size-7 text-primary" />
          <h2 class="mt-4 text-2xl font-semibold">
            {{ t('featureMcpTitle') }}
          </h2>
          <p class="mt-4 leading-8 text-muted">
            {{ t('product_details_mcp_limit') }}
          </p>
          <UButton class="mt-6" color="neutral" variant="outline" :to="localePath('/features/mcp')">
            {{ t('mcp') }}
          </UButton>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { docPath, stableDocVersion } from '#shared/docs';
import ProductHero from '~/components/modules/product/hero.vue';
import { useProductSeo } from '~/composables/app/product-seo';
const { t } = useI18n();
const localePath = useLocalePath();
const providers = [
  { name: 'GitHub', description: 'product_github' },
  { name: 'GitLab', description: 'product_gitlab' },
  { name: 'Forgejo', description: 'product_forgejo' },
  { name: 'Gitea', description: 'product_forgejo' },
];
useProductSeo(
  /** Return `t('product_integrations')` when invoked. */ () => t('product_integrations'),
  /** Return `t('product_integrationsDescription')` when invoked. */ () => t('product_integrationsDescription'),
);
</script>
