import { stableDocVersion } from './shared/docs';
import { supportedLocales } from './shared/locales';
export default defineNuxtConfig({
  hooks: {
    /** Remove unpublished preview captures from the production asset output. */
    'nitro:build:public-assets': async (nitro) => {
      const { rm } = await import('node:fs/promises');
      await rm(nitro.options.output.publicDir + '/images/docs/next', {
        recursive: true,
        force: true,
      });
    },
  },

  routeRules: Object.fromEntries(
    supportedLocales.flatMap(
      /** Handle each supportedLocales.flatMap callback invocation. */ ({ code }) => {
        const prefix = code === 'en' ? '' : `/${code}`;
        const legacy = {
          'getting-started': 'installation',
          'getting-started/index': 'installation',
          'guide/administration': 'guide-administration',
          'guide/dashboard': 'guide-dashboard',
          'guide/issues-pull-requests': 'guide-issues-pull-requests',
          'guide/jobs': 'guide-jobs',
          'guide/repositories-notifications': 'guide-repositories-notifications',
          'guide/security-alerts': 'guide-security-alerts',
          'guide/sign-in-navigation': 'guide-sign-in-navigation',
          'guide/workflow-queues': 'guide-workflow-queues',
        };
        return Object.entries(legacy).map(
          /** Map each entry to `[ `${prefix}/docs/${from}`, { redirect: { to: `${prefix}/docs/${stableDocVersion}/${to}`, statusCode: 302 as const } }, ]`. */ ([
            from,
            to,
          ]) => [
            `${prefix}/docs/${from}`,
            { redirect: { to: `${prefix}/docs/${stableDocVersion}/${to}`, statusCode: 302 as const } },
          ],
        );
      },
    ),
  ),
  compatibilityDate: '2026-11-01',
  modules: ['./modules/openapi', '@nuxt/ui', '@nuxt/content', '@nuxtjs/i18n', '@nuxt/eslint'],
  css: ['~/assets/css/main.css'],
  devtools: { enabled: false },
  ui: { fonts: false },
  content: {
    // Restore the immutable build dump in memory so read-only containers need no writable database file.
    database: { type: 'sqlite', filename: ':memory:' },
    experimental: { sqliteConnector: 'native' },
    build: {
      markdown: {
        highlight: {
          theme: { default: 'github-light', light: 'github-light', dark: 'github-dark' },
          langs: [
            'bash',
            'json',
            'yaml',
            'dockerfile',
            'dotenv',
            'javascript',
            'typescript',
            'html',
            'css',
            'sql',
            'markdown',
          ],
        },
      },
    },
  },
  colorMode: {
    preference: 'system',
    fallback: 'light',
    storage: 'localStorage',
    storageKey: 'repovio-color-mode',
  },
  i18n: {
    strategy: 'prefix_except_default',
    defaultLocale: 'en',
    locales: supportedLocales.map(
      /** Map each entry to `({ code, language, name, file, dir, })`. */ ({ code, language, name, file, dir }) => ({
        code,
        language,
        name,
        file,
        dir,
      }),
    ),
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'repovio-language',
      redirectOn: 'root',
      fallbackLocale: 'en',
    },
    baseUrl: 'https://repovio.de',
  },
  runtimeConfig: {
    public: {
      siteUrl: 'https://repovio.de',
      themePrimary: '',
      themeNeutral: '',
      themeRadius: '',
      themeFontFamily: '',
      brandName: 'Repovio',
      brandDescription: '',
      brandLogoLight: '/logo.svg',
      brandLogoDark: '/logo.svg',
      brandFavicon: '/favicon.svg',
      brandTitleTemplate: '',
      brandProductUrl: 'https://repovio.de',
      brandDocsUrl: '/docs/overview',
      brandRepositoryUrl: 'https://github.com/repovio',
    },
  },
  app: {
    head: {
      title: 'Repovio',
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
    },
  },
  typescript: { strict: true },
  eslint: { config: { stylistic: false } },
});
