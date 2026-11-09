import { expect, test, type Page } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { controlPage, mockApplication } from './helpers';

const workerPath = resolve('.output/public/sw.js');
let original = '';

test.beforeEach(
  /** Save exact original bytes for per-scenario cleanup. */ async () => {
    original = await readFile(workerPath, 'utf8');
  },
);

test.afterEach(
  /** Restore bytes after successes and failures, without writing an uninitialized backup. */ async () => {
    if (original) await writeFile(workerPath, original);
  },
);

/** Publish a distinguishable real worker and await its waiting state without activating it. */
async function publishUpdate(page: Page, version: number): Promise<void> {
  await writeFile(workerPath, `${original}\n// pwa-audit-version-${version}\n`);
  await page.evaluate(
    /** Ask the real registration to check the changed production worker. */ async () => {
      await navigator.serviceWorker.register(`/sw.js?pwa-audit=${Date.now()}`, { scope: '/', updateViaCache: 'none' });
    },
  );
  await expect
    .poll(
      /** Observe the new version reaching the waiting state. */ () =>
        page.evaluate(
          /** Read the registration without changing lifecycle state. */ async () =>
            (await navigator.serviceWorker.getRegistration())?.waiting?.state,
        ),
    )
    .toBe('installed');
}

test('handles two successive real worker updates without activation before acceptance or reload loops', /** Keep dismissal and explicit activation semantics through repeated releases. */ async ({
  page,
}) => {
  await mockApplication(page);
  await page.goto('/auth/signin');
  await controlPage(page);
  let reloads = 0;
  page.on(
    'load',
    /** Count document reloads after initial control. */ () => {
      reloads++;
    },
  );
  for (const version of [1, 2]) {
    await publishUpdate(page, version);
    const prompt = page.locator('[data-pwa-update-prompt]');
    await expect(prompt).toBeVisible();
    await prompt.getByRole('button', { name: 'Later', exact: true }).click();
    await expect(prompt).toBeHidden();
    expect(
      await page.evaluate(
        /** Dismissal must leave the new worker waiting. */ async () =>
          (await navigator.serviceWorker.getRegistration())?.waiting?.state,
      ),
    ).toBe('installed');
    await page.reload();
    await expect(prompt).toBeVisible();
    await Promise.all([page.waitForEvent('load'), prompt.getByRole('button', { name: 'Update', exact: true }).click()]);
    await expect(prompt).toBeHidden();
    await expect(page.getByRole('heading', { name: 'Sign in', exact: true })).toBeVisible();
    await expect
      .poll(
        /** Acceptance must clear the waiting worker. */ () =>
          page.evaluate(
            /** Observe the completed activation. */ async () =>
              (await navigator.serviceWorker.getRegistration())?.waiting?.state ?? null,
          ),
      )
      .toBeNull();
  }
  expect(reloads).toBe(4);
  expect(await readFile(workerPath, 'utf8')).toContain('notification-sw.js');
});

test('waits for explicit acceptance across two controlled tabs', /** Validate shared worker ownership without promising separate versions per tab. */ async ({
  page,
  context,
}) => {
  await mockApplication(page);
  await page.goto('/auth/signin');
  await controlPage(page);
  const other = await context.newPage();
  await mockApplication(other);
  await other.goto('/auth/signin');
  await controlPage(other);
  await publishUpdate(page, 3);
  await expect(page.locator('[data-pwa-update-prompt]')).toBeVisible();
  await expect(other.locator('[data-pwa-update-prompt]')).toBeVisible();
  expect(
    await other.evaluate(
      /** Both tabs share the same waiting worker before acceptance. */ async () =>
        (await navigator.serviceWorker.getRegistration())?.waiting?.state,
    ),
  ).toBe('installed');
  await Promise.all([other.waitForEvent('load'), other.getByRole('button', { name: 'Update', exact: true }).click()]);
  await expect(other.getByRole('heading', { name: 'Sign in', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Sign in', exact: true })).toBeVisible();
  await other.close();
});

test('keeps online routing usable when service worker registration rejects', /** Inject a browser capability failure before application startup. */ async ({
  page,
}) => {
  const errors: string[] = [];
  page.on(
    'pageerror',
    /** Record uncaught failures only, not expected registration diagnostics. */ (error) => {
      errors.push(error.message);
    },
  );
  await page.addInitScript(
    /** Reject registration without changing application code or the server. */ () => {
      navigator.serviceWorker.register = /** Simulate browser registration rejection. */ async () => {
        throw new Error('Synthetic registration failure');
      };
    },
  );
  await mockApplication(page);
  await page.goto('/auth/signin');
  await expect(page.getByRole('heading', { name: 'Sign in', exact: true })).toBeVisible();
  await expect
    .poll(
      /** Wait for registration failure to be handled by the real plugin. */ () =>
        page.evaluate(
          /** Read the production plugin state after the sign-in form has mounted. */ () => {
            const root = document.getElementById('__nuxt') as HTMLElement & {
              __vue_app__: { $nuxt: { $pwa: { registrationError: boolean } } };
            };
            return root.__vue_app__.$nuxt.$pwa.registrationError;
          },
        ),
    )
    .toBe(true);
  await expect(page.locator('[data-pwa-update-prompt]')).toBeHidden();
  expect(errors).toEqual([]);
});
