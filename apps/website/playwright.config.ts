import { defineConfig } from '@playwright/test';

const testPort = Number(process.env.WEBSITE_TEST_PORT || process.env.PLAYWRIGHT_PORT || 3002);
const testUrl = `http://127.0.0.1:${testPort}`;

/** Exercise the production website rather than the development renderer. */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  workers: 2,
  use: { baseURL: testUrl, screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  webServer: {
    command: `HOST=127.0.0.1 PORT=${testPort} node .output/server/index.mjs`,
    url: testUrl,
    reuseExistingServer: !process.env.CI,
  },
});
