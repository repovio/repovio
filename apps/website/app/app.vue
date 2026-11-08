<template>
  <UApp :locale="getUiLocale(locale)">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>

<script setup lang="ts">
import { getLocale, localizedPath, supportedLocales } from '#shared/locales';
import { getUiLocale } from '~/utils/locales';
const config = useRuntimeConfig().public;
const { locale } = useI18n();
const route = useRoute();
const origin = computed(
  /** Return `safeUrl(config.siteUrl).replace(/\/$/, '') || 'https://repovio.de'` when invoked. */ () =>
    safeUrl(config.siteUrl).replace(/\/$/, '') || 'https://repovio.de',
);
const plainPath = computed(
  /** Return `route.path.replace( new RegExp( `^/(${supportedLocales .filter((item) => item.code !== 'en') .map((item) => item.code) .join('|')})(?=/|$)`,` when invoked. */ () =>
    route.path.replace(
      new RegExp(
        `^/(${supportedLocales
          .filter(/** Keep entries matching `item.code !== 'en'`. */ (item) => item.code !== 'en')
          .map(/** Map each entry to `item.code`. */ (item) => item.code)
          .join('|')})(?=/|$)`,
      ),
      '',
    ) || '/',
);
useHead(
  /** Return `({ htmlAttrs: { lang: locale.value, dir: getLocale(locale.value).dir }, titleTemplate: (title) => title === config.brandName && !config.bran` when invoked. */ () => ({
    htmlAttrs: { lang: locale.value, dir: getLocale(locale.value).dir },
    /** Return `title === config.brandName && !config.brandTitleTemplate ? config.brandName : (config.brandTitleTemplate || `%s · ${config.brandName}`).repl` when invoked. */
    titleTemplate: (title) =>
      title === config.brandName && !config.brandTitleTemplate
        ? config.brandName
        : (config.brandTitleTemplate || `%s · ${config.brandName}`).replaceAll('%s', title || config.brandName),
    link: [
      { rel: 'icon', href: safeUrl(config.brandFavicon) || '/favicon.ico' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      { rel: 'canonical', href: origin.value + route.path },
      ...supportedLocales.map(
        /** Map each entry to `({ rel: 'alternate' as const, hreflang: item.language, href: origin.value + localizedPath(item.code, plainPath.value), })`. */ (
          item,
        ) => ({
          rel: 'alternate' as const,
          hreflang: item.language,
          href: origin.value + localizedPath(item.code, plainPath.value),
        }),
      ),
      { rel: 'alternate', hreflang: 'x-default', href: origin.value + plainPath.value },
    ],
    meta: [
      { property: 'og:site_name', content: config.brandName },
      { property: 'og:locale', content: getLocale(locale.value).og },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
);
</script>
