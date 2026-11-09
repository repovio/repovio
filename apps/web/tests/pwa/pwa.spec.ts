import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { chromium, expect, test } from '@playwright/test';

const serviceWorkerPath = resolve(process.cwd(), '.output/public/sw.js');
let originalServiceWorker = '';

test.beforeEach(
  /** Read the original worker before each scenario. */ async () => {
    originalServiceWorker = await readFile(serviceWorkerPath, 'utf8');
  },
);

test.afterEach(
  /** Restore the worker even when a scenario fails. */ async () => {
    if (originalServiceWorker) await writeFile(serviceWorkerPath, originalServiceWorker);
  },
);

/** Keep unauthenticated routing stable while exercising the production client. */
async function mockSetupStatus(page: import('@playwright/test').Page): Promise<void> {
  await page.route(
    '**/api/v1/auth/setup-status',
    /** Supplies the mocked response for `/api/v1/auth/setup-status`. */ (route) =>
      route.fulfill({ json: { initialized: true } }),
  );
}

test('publishes an installable manifest without caching protected application data', /** Verifies publishes an installable manifest without caching protected application data. */ async ({
  page,
}) => {
  await mockSetupStatus(page);
  await page.goto('/auth/signin');

  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/manifest.webmanifest');
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#4f46ff');
  await expect(page.locator('meta[name="mobile-web-app-capable"]')).toHaveAttribute('content', 'yes');
  await expect(page.locator('meta[name="apple-mobile-web-app-capable"]')).toHaveAttribute('content', 'yes');
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href', '/apple-touch-icon-180x180.png');

  const manifestResponse = await page.request.get('/manifest.webmanifest');
  expect(manifestResponse.ok()).toBe(true);
  expect(manifestResponse.headers()['content-type']).toContain('application/manifest+json');
  expect(manifestResponse.headers()['cache-control']).toBe('no-store');
  const manifest = (await manifestResponse.json()) as {
    display: string;
    icons: { purpose?: string; sizes: string; src: string; type: string }[];
    name: string;
    scope: string;
    start_url: string;
  };
  expect(manifest).toMatchObject({ display: 'standalone', name: 'Repovio', scope: '/', start_url: '/' });
  expect(manifest.icons).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ sizes: '192x192', type: 'image/png' }),
      expect.objectContaining({ sizes: '512x512', type: 'image/png' }),
      expect.objectContaining({ purpose: 'maskable', sizes: '512x512', type: 'image/png' }),
    ]),
  );
  for (const icon of manifest.icons) expect((await page.request.get(icon.src)).ok()).toBe(true);

  await expect
    .poll(
      /** Evaluates `page.evaluate(async () => { const registration = await navigator.serviceWorker.ready; return registration.active?.state; })` when expect .poll invokes this callback. */ () =>
        page.evaluate(
          /** Reads or updates browser state for the pwa scenario. */ async () => {
            const registration = await navigator.serviceWorker.ready;
            return registration.active?.state;
          },
        ),
    )
    .toBe('activated');

  const chromiumSession = await page.context().newCDPSession(page);
  const { installabilityErrors } = await chromiumSession.send('Page.getInstallabilityErrors');
  expect(installabilityErrors).toEqual([]);

  const cachedUrls = await page.evaluate(
    /** Reads or updates browser state for the cached urls scenario. */ async () => {
      const urls: string[] = [];
      for (const cacheName of await caches.keys()) {
        for (const request of await (await caches.open(cacheName)).keys()) urls.push(request.url);
      }
      return urls;
    },
  );
  expect(cachedUrls.length).toBeGreaterThan(0);
  expect(
    cachedUrls.some(
      /** Checks whether any entry satisfies `/\/api(?:\/|$)|\/socket\.io(?:\/|$)|\/manifest\.webmanifest$/.test(new URL(url).pathname)`. */ (
        url,
      ) => /\/api(?:\/|$)|\/socket\.io(?:\/|$)|\/manifest\.webmanifest$/.test(new URL(url).pathname),
    ),
  ).toBe(false);
});

test('offers a controlled choice when a new service worker is waiting', /** Verifies offers a controlled choice when a new service worker is waiting. */ async ({
  page,
}) => {
  await mockSetupStatus(page);
  await page.goto('/auth/signin');
  await page.evaluate(
    /** Reads or updates browser state for the pwa scenario. */ async () => navigator.serviceWorker.ready,
  );
  await page.reload();
  await expect
    .poll(
      /** Evaluates `page.evaluate(() => navigator.serviceWorker.controller?.state ?? null)` when expect.poll invokes this callback. */ () =>
        page.evaluate(
          /** Reads or updates browser state for the pwa scenario. */ () =>
            navigator.serviceWorker.controller?.state ?? null,
        ),
    )
    .toBe('activated');

  await writeFile(serviceWorkerPath, `${originalServiceWorker}\n// browser-test-update\n`);
  await page.evaluate(
    /** Reads or updates browser state for the pwa scenario. */ async () => {
      await navigator.serviceWorker.register('/sw.js?browser-test-update', { scope: '/', updateViaCache: 'none' });
    },
  );
  await expect
    .poll(
      /** Reads the observable state until the browser assertion settles. */ () =>
        page.evaluate(
          /** Reads or updates browser state for the pwa scenario. */ async () => {
            const registration = await navigator.serviceWorker.getRegistration();
            return registration?.waiting?.state ?? registration?.installing?.state ?? null;
          },
        ),
    )
    .toBe('installed');

  const prompt = page.locator('[data-pwa-update-prompt]');
  await expect(prompt).toBeVisible();
  await prompt.getByRole('button', { name: 'Later' }).click();
  await expect(prompt).toBeHidden();

  await page.reload();
  await expect(prompt).toBeVisible();
  await prompt.getByRole('button', { name: 'Update' }).click();
  await expect(page).toHaveURL(/\/auth\/signin$/);
  await expect(prompt).toBeHidden();
});

test('displays an injected push through the production worker and handles its notification click', /** Verifies real worker handlers with synthetic event delivery, not a network Web Push receipt. */ async () => {
  // Full Chromium supports notifications; headless-shell reports denied despite a granted permissions query.
  const browser = await chromium.launch({ channel: 'chromium', headless: true });
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:3310' });
  const page = await context.newPage();
  try {
    await page.context().grantPermissions(['notifications'], { origin: 'http://127.0.0.1:3310' });
    await mockSetupStatus(page);
    await page.goto('/auth/signin');
    await page.evaluate(
      /** Waits until subscription-dependent worker APIs can be used. */ async () => navigator.serviceWorker.ready,
    );
    await page.context().grantPermissions(['notifications'], { origin: new URL(page.url()).origin });
    await expect(
      page.evaluate(
        /** Confirms Chromium granted notifications for this exact test origin. */ () => Notification.permission,
      ),
    ).resolves.toBe('granted');
    const worker = page
      .context()
      .serviceWorkers()
      .find(
        /** Selects the generated production worker, not a development fixture. */ (candidate) =>
          candidate.url().includes('/sw.js'),
      );
    expect(worker).toBeTruthy();
    // Synthetic dispatch invokes the shipped handler and real showNotification API without pretending to contact a push service.
    await worker!.evaluate(`(async () => {
    let completion;
    const event = new Event('push');
    Object.defineProperty(event, 'data', { value: { json: () => ({ title: 'Synthetic worker delivery', body: 'Controlled production-worker regression', url: '/auth/signin' }) } });
    Object.defineProperty(event, 'waitUntil', { value: (promise) => { completion = promise; } });
    self.dispatchEvent(event);
    if (!completion) throw new Error('Production push handler did not extend event lifetime.');
    await completion;
  })()`);
    await expect
      .poll(
        /** Observes a notification actually created by the production push handler. */ () =>
          page.evaluate(
            /** Reads notification display metadata without OS automation. */ async () => {
              const registration = await navigator.serviceWorker.ready;
              return (await registration.getNotifications()).map(
                /** Projects the safe observable notification details. */ (notification) => ({
                  title: notification.title,
                  body: notification.body,
                  url: notification.data?.url,
                }),
              );
            },
          ),
      )
      .toContainEqual({
        title: 'Synthetic worker delivery',
        body: 'Controlled production-worker regression',
        url: 'http://127.0.0.1:3310/auth/signin',
      });
    // Synthetic click dispatch supplies waitUntil explicitly; it does not claim a physical OS notification click.
    const clickError = await worker!.evaluate(`(async () => {
    const notification = (await self.registration.getNotifications()).find((item) => item.title === 'Synthetic worker delivery');
    if (!notification) throw new Error('Displayed notification is missing.');
    let completion = Promise.resolve();
    const event = new Event('notificationclick');
    Object.defineProperty(event, 'notification', { value: notification });
    Object.defineProperty(event, 'waitUntil', { value: (promise) => { completion = promise; } });
    self.dispatchEvent(event);
    try { await completion; return null; } catch (error) { return error.name; }
  })()`);
    // Synthetic notification events do not carry Chromium's trusted OS-click activation needed by WindowClient.focus().
    expect([null, 'InvalidAccessError']).toContain(clickError);
    await expect
      .poll(
        /** Checks the click handler closed the displayed notification. */ () =>
          page.evaluate(
            /** Reads active notifications after the click handler settles. */ async () =>
              (await (await navigator.serviceWorker.ready).getNotifications()).map(
                /** Returns the display title for assertions. */ (notification) => notification.title,
              ),
          ),
      )
      .not.toContain('Synthetic worker delivery');
    await expect(page).toHaveURL(/\/auth\/signin$/);
    expect(page.context().pages()).toHaveLength(1);
    for (const url of [
      'javascript:alert(1)',
      'data:text/html,synthetic',
      'https://[',
      'https://user:synthetic@example.com/',
    ]) {
      await worker!.evaluate(`(async () => {
        let completion;
        const event = new Event('push');
        Object.defineProperty(event, 'data', { value: { json: () => ({ title: 'Unsafe target regression', body: 'Synthetic payload', url: ${JSON.stringify(url)} }) } });
        Object.defineProperty(event, 'waitUntil', { value: (promise) => { completion = promise; } });
        self.dispatchEvent(event);
        await completion;
      })()`);
      await expect(
        page.evaluate(
          /** Checks unsafe push destinations were normalized before display. */ async () => {
            const notifications = await (await navigator.serviceWorker.ready).getNotifications();
            const current = notifications.find(
              /** Finds only this safe-target regression notification. */ (item) =>
                item.title === 'Unsafe target regression',
            );
            return current?.data?.url;
          },
        ),
      ).resolves.toBe('http://127.0.0.1:3310/');
      await worker!.evaluate(`(async () => {
        for (const notification of await self.registration.getNotifications()) notification.close();
      })()`);
    }
    await worker!.evaluate(`(async () => {
      let completion;
      const event = new Event('push');
      Object.defineProperty(event, 'data', { value: { json: () => { throw new SyntaxError('synthetic invalid JSON'); } } });
      Object.defineProperty(event, 'waitUntil', { value: (promise) => { completion = promise; } });
      self.dispatchEvent(event);
      await completion;
    })()`);
    await expect(
      page.evaluate(
        /** Checks malformed payloads still display a safe generic notification. */ async () => {
          const notifications = await (await navigator.serviceWorker.ready).getNotifications();
          return notifications.map(
            /** Returns observable generic display metadata. */ (notification) => ({
              title: notification.title,
              body: notification.body,
              url: notification.data?.url,
            }),
          );
        },
      ),
    ).resolves.toContainEqual({ title: 'Repovio', body: '', url: 'http://127.0.0.1:3310/' });
  } finally {
    await browser.close();
  }
});
