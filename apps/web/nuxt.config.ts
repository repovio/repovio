import { version as appVersion } from '../../package.json';

/** Nuxt configuration for the Repovio single-page dashboard. */
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  css: ['~/assets/css/main.css'],
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@nuxtjs/i18n', '@nuxtjs/color-mode', '@pinia/nuxt', '@querry-kit/nuxt-ui', '@vite-pwa/nuxt'],
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api/v1',
      appVersion,
    },
  },
  ssr: false,
  srcDir: 'app',
  app: {
    head: {
      htmlAttrs: { class: 'h-full' },
      bodyAttrs: { class: 'h-full bg-default' },
      link: [
        { rel: 'icon', sizes: '48x48', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'icon', sizes: 'any', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon-180x180.png' },
      ],
      meta: [
        { name: 'theme-color', content: '#4f46ff' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      ],
      script: [{ src: '/oidc-handoff.js' }],
      title: 'Repovio',
      titleTemplate: '%s · Repovio',
    },
  },
  colorMode: {
    fallback: 'dark',
    preference: 'dark',
  },
  icon: {
    aliases: {
      'tabler-pin-off': 'tabler:pinned-off',
    },
    collections: ['lucide', 'simple-icons', 'tabler'],
    fallbackToApi: false,
    provider: 'none',
    serverBundle: false,
    clientBundle: {
      icons: [
        'tabler:adjustments',
        'tabler:arrows-sort',
        'tabler:cancel',
        'tabler:device-desktop',
        'tabler:filter',
        'tabler:filter-2',
        'tabler:layers-intersect-2',
        'tabler:layers-union',
        'tabler:moon',
        'tabler:pin',
        'tabler:pinned-off',
        'tabler:sort-ascending',
        'tabler:sort-descending',
        'tabler:sun',
      ],
      scan: {
        globInclude: ['app/**', 'node_modules/@nuxt/ui/dist/**', 'node_modules/@querry-kit/nuxt-ui/dist/**'],
      },
    },
  },
  i18n: {
    detectBrowserLanguage: {
      cookieKey: 'repovio-locale',
      fallbackLocale: 'en',
      redirectOn: 'root',
      useCookie: true,
    },
    defaultLocale: 'en',
    locales: [
      { code: 'en', file: 'en.json', name: 'English' },
      { code: 'de', file: 'de.json', name: 'Deutsch' },
      { code: 'es', file: 'es.json', name: 'Español' },
      { code: 'fr', file: 'fr.json', name: 'Français' },
      { code: 'it', file: 'it.json', name: 'Italiano' },
      { code: 'nl', file: 'nl.json', name: 'Nederlands' },
      { code: 'pl', file: 'pl.json', name: 'Polski' },
      { code: 'pt', file: 'pt.json', name: 'Português' },
    ],
    strategy: 'no_prefix',
    vueI18n: './i18n.config.ts',
  },
  ui: {
    colorMode: true,
  },
  pwa: {
    client: {
      registerPlugin: true,
    },
    manifest: {
      background_color: '#0b1238',
      description: 'Read-only workflow status dashboard for GitHub, GitLab, Forgejo, and Gitea.',
      display: 'standalone',
      id: '/',
      icons: [
        { src: '/pwa-64x64.png', sizes: '64x64', type: 'image/png' },
        { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        { src: '/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
      lang: 'en',
      name: 'Repovio',
      scope: '/',
      short_name: 'Repovio',
      start_url: '/',
      theme_color: '#4f46ff',
    },
    registerType: 'prompt',
    workbox: {
      cleanupOutdatedCaches: true,
      globPatterns: ['**/*.{css,ico,js,png,svg,woff2}'],
      importScripts: ['/notification-sw.js'],
      navigateFallback: null,
      runtimeCaching: [],
    },
  },
});
