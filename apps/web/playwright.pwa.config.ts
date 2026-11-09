import { resolve } from 'node:path';

import { defineConfig } from '@playwright/test';

/** Production-only browser checks for generated PWA resources and service-worker lifecycle behavior. */
export default defineConfig({
  testDir: './tests/pwa',
  timeout: 60_000,
  // All scenarios share production output; worker updates must never overlap.
  workers: 1,
  fullyParallel: false,
  use: {
    baseURL: 'http://127.0.0.1:3310',
    headless: true,
    viewport: { height: 900, width: 1440 },
  },
  webServer: [
    {
      command: 'node .output/server/index.mjs',
      env: { HOST: '127.0.0.1', PORT: '3310' },
      reuseExistingServer: false,
      timeout: 30_000,
      url: 'http://127.0.0.1:3310',
    },
    {
      command: 'node .output/server/index.mjs',
      env: {
        HOST: '127.0.0.1',
        PORT: '3311',
        NUXT_PUBLIC_BRAND_NAME: 'Example Forge',
        NUXT_PUBLIC_BRAND_DESCRIPTION: 'Example workflow dashboard',
        NUXT_PUBLIC_THEME_PRIMARY: 'rose',
        NUXT_PUBLIC_THEME_NEUTRAL: 'slate',
        NUXT_PUBLIC_BRAND_PWA_THEME_COLOR: '#112233',
        NUXT_PUBLIC_BRAND_PWA_BACKGROUND_COLOR: '#334455',
        NUXT_PUBLIC_BRAND_PWA_MASKABLE_ICON: '',
        NUXT_BRAND_LOGO_LIGHT_FILE: resolve('public/logo.svg'),
        NUXT_BRAND_LOGO_DARK_FILE: resolve('public/logo.svg'),
        NUXT_BRAND_FAVICON_FILE: resolve('public/favicon.ico'),
        NUXT_BRAND_PWA_ICON_192_FILE: resolve('public/pwa-192x192.png'),
        NUXT_BRAND_PWA_ICON_512_FILE: resolve('public/pwa-512x512.png'),
      },
      reuseExistingServer: false,
      timeout: 30_000,
      url: 'http://127.0.0.1:3311',
    },
  ],
  projects: [
    {
      name: 'chromium',
      testMatch: /(?:^|\/)(pwa|launch|update-prompt|update-lifecycle|cache-isolation|connectivity)\.spec\.ts$/,
    },
    ...(process.env.PWA_REAL_WEB_URL
      ? [{ name: 'local-api', testMatch: 'real-api.spec.ts', use: { baseURL: process.env.PWA_REAL_WEB_URL } }]
      : []),
    { name: 'runtime-branding', testMatch: 'branding-runtime.spec.ts', use: { baseURL: 'http://127.0.0.1:3311' } },
  ],
});
