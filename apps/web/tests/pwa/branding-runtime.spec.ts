import { expect, test } from '@playwright/test';
import { spawn } from 'node:child_process';
import type { BrandingManifest } from '../../server/utils/branding-manifest';
import type { PublicBranding } from '../../shared/branding';

test('uses different runtime configurations with the same production build', /** Verify actual public HTTP contracts and private mounted asset precedence. */ async ({
  request,
}) => {
  const defaults = await request.get('http://127.0.0.1:3310/api/branding');
  expect((await defaults.json()).brandName).toBe('Repovio');
  const response = await request.get('/api/branding');
  expect(response.headers()['cache-control']).toBe('no-store');
  const branding = (await response.json()) as PublicBranding;
  expect(branding).toMatchObject({
    brandName: 'Example Forge',
    themePrimary: 'rose',
    brandLogoLight: '/api/branding/logo-light',
    brandPwaIcon_192: '/api/branding/pwa-icon-192',
  });
  expect(JSON.stringify(branding)).not.toMatch(/File|private|\/mnt\//);
  const asset = await request.get(branding.brandLogoLight);
  expect(asset.status()).toBe(200);
  expect(asset.headers()['content-type']).toBe('image/svg+xml');
  expect(asset.headers()['cache-control']).toBe('no-store');
  expect(asset.headers()['x-content-type-options']).toBe('nosniff');
  expect(await asset.text()).toContain('<svg');
  expect((await request.get('/api/branding/unknown')).status()).toBe(404);
  expect((await request.get('/api/branding/package.json')).status()).toBe(404);
  const manifestResponse = await request.get('/manifest.webmanifest');
  expect(manifestResponse.headers()['content-type']).toContain('application/manifest+json');
  expect(manifestResponse.headers()['cache-control']).toBe('no-store');
  const manifest = (await manifestResponse.json()) as BrandingManifest;
  expect(manifest).toMatchObject({
    id: '/',
    scope: '/',
    start_url: '/',
    display: 'standalone',
    name: 'Example Forge',
    description: 'Example workflow dashboard',
    theme_color: '#112233',
    background_color: '#334455',
  });
  expect(manifest.icons).toHaveLength(2);
  for (const icon of manifest.icons) {
    expect(icon.purpose).toBeUndefined();
    const png = await request.get(icon.src);
    expect(png.headers()['content-type']).toBe('image/png');
    const bytes = await png.body();
    expect(bytes.readUInt32BE(16)).toBe(Number.parseInt(icon.sizes, 10));
    expect(bytes.readUInt32BE(20)).toBe(Number.parseInt(icon.sizes, 10));
  }
});

test('renders and installs the runtime brand using mounted icons', /** Exercise real runtime configuration, metadata, icons, and browser installability. */ async ({
  page,
}, testInfo) => {
  await page.route(
    '**/api/v1/auth/setup-status',
    /** Keep authentication deterministic without mocking branding. */ (route) =>
      route.fulfill({ json: { initialized: true } }),
  );
  await page.route(
    '**/api/v1/auth/oidc/config',
    /** Disable provider sign-in in this local fixture. */ (route) => route.fulfill({ json: { enabled: false } }),
  );
  await page.goto('/auth/signin');
  await expect(page.getByRole('link', { name: 'Example Forge', exact: true }).locator('img:visible')).toHaveAttribute(
    'src',
    '/api/branding/logo-dark',
  );
  await expect(page).toHaveTitle('Sign in · Example Forge');
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#112233');
  await expect(page.locator('link[rel="icon"]')).toHaveCount(1);
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/api/branding/favicon');
  await page.evaluate(
    /** Wait for the real production service worker to activate. */ async () => navigator.serviceWorker.ready,
  );
  const session = await page.context().newCDPSession(page);
  expect((await session.send('Page.getInstallabilityErrors')).installabilityErrors).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath('runtime-branding.png') });
});

for (const overrides of [
  { NUXT_PUBLIC_THEME_PRIMARY: 'invalid' },
  { NUXT_BRAND_LOGO_LIGHT_FILE: '/missing/branding.svg' },
  { NUXT_BRAND_PWA_ICON_192_FILE: 'public/pwa-512x512.png' },
]) {
  test(`rejects invalid startup setting ${Object.keys(overrides)[0]}`, /** Fail before accepting requests when a runtime setting is invalid. */ async () => {
    const process = spawn('node', ['.output/server/index.mjs'], {
      env: { ...globalThis.process.env, ...overrides, HOST: '127.0.0.1', PORT: '3312' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    process.stdout.on(
      'data',
      /** Capture startup diagnostics without printing private paths. */ (chunk) => {
        output += chunk;
      },
    );
    process.stderr.on(
      'data',
      /** Capture startup validation errors. */ (chunk) => {
        output += chunk;
      },
    );
    try {
      const code = await new Promise<number | null>(
        /** Wait for failed startup, with bounded cleanup. */ (resolve, reject) => {
          const timeout = setTimeout(
            /** Reject a server that did not fail startup promptly. */ () =>
              reject(new Error('Invalid branding did not stop startup')),
            5000,
          );
          process.once(
            'exit',
            /** Return the failed startup exit code. */ (code) => {
              clearTimeout(timeout);
              resolve(code);
            },
          );
          process.once(
            'error',
            /** Report process launch errors. */ (error) => {
              clearTimeout(timeout);
              reject(error);
            },
          );
        },
      );
      expect(code).not.toBe(0);
      expect(output).toContain('Invalid branding');
    } finally {
      process.kill();
    }
  });
}
