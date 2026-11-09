<template>
  <div class="min-h-screen">
    <a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:bg-default focus:p-4">
      {{ t('skipContent') }}
    </a>
    <header class="sticky top-0 z-40 border-b border-default bg-default/90 backdrop-blur-xl">
      <div class="page-width flex h-20 items-center gap-2 sm:gap-6 2xl:flex 2xl:gap-8">
        <BrandMark />
        <ProductNavigation :links="links" />
        <div class="ms-auto flex items-center gap-2 sm:gap-3">
          <UButton
            icon="i-lucide-search"
            color="neutral"
            variant="ghost"
            data-testid="docs-search-open"
            :aria-label="t('searchLabel')"
            :disabled="!hydrated"
            @click="searchOpen = true"
          />
          <UButton
            class="hidden whitespace-nowrap 2xl:inline-flex"
            trailing-icon="i-lucide-arrow-right"
            :to="localePath(docPath(stableDocVersion, 'installation'))"
          >
            {{ t('getStarted') }}
          </UButton>
          <ModeSwitch />
          <LanguageSwitch />
          <UButton
            v-if="safeUrl(config.brandRepositoryUrl)"
            icon="i-lucide-github"
            color="neutral"
            variant="ghost"
            target="_blank"
            aria-label="GitHub"
            class="hidden sm:flex"
            :to="safeUrl(config.brandRepositoryUrl)"
          />
          <UButton
            icon="i-lucide-menu"
            color="neutral"
            variant="ghost"
            class="2xl:hidden"
            data-testid="mobile-navigation-open"
            :aria-label="t('navigation')"
            :disabled="!hydrated"
            @click="menuOpen = true"
          />
        </div>
      </div>
    </header>
    <main id="main">
      <slot />
    </main>
    <footer class="border-t border-default bg-muted/25 py-12">
      <div class="page-width">
        <div class="flex flex-col justify-between gap-8 sm:flex-row">
          <div>
            <BrandMark />
            <p class="mt-4 max-w-xs text-sm leading-6 text-muted">
              {{ t('footerLine') }}
            </p>
          </div>
          <div class="grid grid-cols-2 gap-x-10 gap-y-3 text-sm">
            <NuxtLink class="text-muted hover:text-highlighted" :to="localePath('/features')">
              {{ t('features') }}
            </NuxtLink>
            <NuxtLink class="text-muted hover:text-highlighted" :to="localePath('/integrations')">
              {{ t('product_integrations') }}
            </NuxtLink>
            <NuxtLink class="text-muted hover:text-highlighted" :to="localePath('/self-hosting')">
              {{ t('product_selfHosting') }}
            </NuxtLink>
            <NuxtLink
              class="text-muted hover:text-highlighted"
              :to="localePath(docPath(stableDocVersion, 'installation'))"
            >
              {{ t('getStarted') }}
            </NuxtLink>
            <a
              href="https://github.com/repovio/repovio"
              target="_blank"
              rel="noopener noreferrer"
              class="text-muted hover:text-highlighted"
            >
              {{ t('websiteSource') }}
            </a>
            <NuxtLink v-if="docsLink" class="text-muted hover:text-highlighted" :to="docsLink">
              {{ t('docs') }}
            </NuxtLink>
            <a
              href="https://buymeacoffee.com/tobiaswaelde"
              target="_blank"
              rel="noopener noreferrer"
              class="text-muted hover:text-highlighted"
            >
              {{ t('support') }}
            </a>
            <a
              v-if="safeUrl(config.brandRepositoryUrl)"
              target="_blank"
              rel="noopener noreferrer"
              class="text-muted hover:text-highlighted"
              :href="safeUrl(config.brandRepositoryUrl)"
            >
              {{ t('sourceCode') }}
            </a>
            <a
              href="https://github.com/repovio/repovio/security/advisories/new"
              target="_blank"
              rel="noopener noreferrer"
              class="text-muted hover:text-highlighted"
            >
              {{ t('security') }}
            </a>
            <NuxtLink class="text-muted hover:text-highlighted" :to="localePath('/imprint')">
              {{ t('imprint') }}
            </NuxtLink>
            <NuxtLink class="text-muted hover:text-highlighted" :to="localePath('/privacy-policy')">
              {{ t('privacyPolicy') }}
            </NuxtLink>
          </div>
        </div>
        <div
          class="mt-10 flex flex-col gap-3 border-t border-default pt-6 text-xs text-dimmed sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            {{ t('builtWith') }}
            <a href="https://tobiaswaelde.com" class="ms-3 text-muted hover:text-highlighted">
              <span>{{ t('createdBy') }} Tobias Wälde</span>
            </a>
            <a
              v-if="safeUrl(config.brandProductUrl)"
              class="ms-3 text-muted hover:text-highlighted"
              :href="safeUrl(config.brandProductUrl)"
            >
              {{ config.brandName }}
            </a>
          </div>
          <span class="shrink-0 self-end whitespace-nowrap sm:self-auto" data-testid="website-version">
            v{{ appConfig.version }}
          </span>
        </div>
      </div>
    </footer>
    <DocsSearch v-model:open="searchOpen" />
    <UModal v-model:open="menuOpen" :title="t('navigation')" :ui="{ body: 'max-h-[75dvh] overflow-y-auto' }">
      <template #body>
        <MobileProductNavigation :links="links" @navigate="menuOpen = false" />
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { docPath, stableDocVersion } from '#shared/docs';
import MobileProductNavigation from '~/components/modules/product/mobile-navigation.vue';
import ProductNavigation from '~/components/modules/product/navigation.vue';
const { t } = useI18n();
const localePath = useLocalePath();
const config = useRuntimeConfig().public;
const appConfig = useAppConfig();
const searchOpen = ref(false);
const hydrated = ref(false);
onMounted(
  /** Enable browser-dependent navigation and theme controls after hydration. */ () => {
    hydrated.value = true;
  },
);
const menuOpen = ref(false);
const route = useRoute();
const docsLink = computed(
  /** Return `config.brandDocsUrl === '/docs/overview' ? localePath(docPath(stableDocVersion)) : safeUrl(config.brandDocsUrl)` when invoked. */ () =>
    config.brandDocsUrl === '/docs/overview' ? localePath(docPath(stableDocVersion)) : safeUrl(config.brandDocsUrl),
);
const links = computed(
  /** Return `[ { label: t('product_integrations'), to: localePath('/integrations') }, { label: t('product_selfHosting'), to: localePath('/self-hosting') ` when invoked. */ () =>
    [
      { label: t('product_integrations'), to: localePath('/integrations') },
      { label: t('product_selfHosting'), to: localePath('/self-hosting') },
      { label: t('docs'), to: docsLink.value },
    ].filter(/** Keep entries matching `link.to`. */ (link) => link.to),
);
watch(
  /** Return `route.fullPath` when invoked. */ () => route.fullPath,
  /** Return `(menuOpen.value = false)` when invoked. */ () => (menuOpen.value = false),
);
/** Define shortcut behavior. */
function shortcut(event: KeyboardEvent) {
  if (event.defaultPrevented || event.isComposing || event.altKey) return;
  const editable =
    event.target instanceof Element &&
    event.target.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"])');
  if (
    ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') ||
    (!editable && !event.ctrlKey && !event.metaKey && event.key === '/')
  ) {
    event.preventDefault();
    searchOpen.value = true;
  }
}
onMounted(
  /** Return `window.addEventListener('keydown', shortcut)` when invoked. */ () =>
    window.addEventListener('keydown', shortcut),
);
onBeforeUnmount(
  /** Return `window.removeEventListener('keydown', shortcut)` when invoked. */ () =>
    window.removeEventListener('keydown', shortcut),
);
</script>
