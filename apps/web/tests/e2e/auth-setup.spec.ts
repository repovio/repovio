import { resolve } from 'node:path';

import { expect, test } from '@playwright/test';

const administrator = {
  avatarUpdatedAt: null,
  firstName: 'Vera',
  id: 'administrator-id',
  lastName: 'Admin',
  role: 'SYSTEM_ADMIN',
  username: 'vera',
} as const;

test('creates and signs in the first administrator from the guided setup', /** Verifies creates and signs in the first administrator from the guided setup. */ async ({
  page,
}, testInfo) => {
  await page.route(
    '**/api/v1/auth/setup-status',
    /** Supplies the mocked response for `/api/v1/auth/setup-status`. */ (route) =>
      route.fulfill({ json: { initialized: false } }),
  );
  await page.route(
    '**/api/v1/auth/setup',
    /** Supplies the mocked response for `/api/v1/auth/setup`. */ async (route) => {
      expect(route.request().postDataJSON()).toEqual({
        firstName: 'Vera',
        lastName: 'Admin',
        password: 'secure-password',
        username: 'vera',
      });
      await route.fulfill({ json: { accessToken: 'setup-access-token', user: administrator } });
    },
  );

  await page.goto('/');
  await expect(page).toHaveURL('/auth/setup');
  await expect(page.getByRole('heading', { name: 'First-run setup' })).toBeVisible();
  await page.getByLabel('First name').fill('Vera');
  await page.getByLabel('Last name').fill('Admin');
  await page.getByLabel('Username').fill('vera');
  await page.getByLabel('Password', { exact: true }).fill('secure-password');
  await page.getByLabel('Confirm password').fill('different-password');
  await page.getByRole('button', { name: 'Create administrator' }).click();
  await expect(page.getByText('The passwords do not match.')).toBeVisible();
  await page.getByLabel('Confirm password').fill('secure-password');
  await page.screenshot({ path: testInfo.outputPath('first-run-setup.png'), fullPage: true });
  await page.getByRole('button', { name: 'Create administrator' }).click();

  await expect(page).toHaveURL('/');
  await expect
    .poll(
      /** Evaluates `page.evaluate(() => window.localStorage.getItem('repovio.access-token'))` when expect .poll invokes this callback. */ () =>
        page.evaluate(
          /** Reads or updates browser state for the auth setup scenario. */ () =>
            window.localStorage.getItem('repovio.access-token'),
        ),
    )
    .toBe('setup-access-token');
});

test('redirects an initialized installation away from setup', /** Verifies redirects an initialized installation away from setup. */ async ({
  page,
}) => {
  await page.route(
    '**/api/v1/auth/setup-status',
    /** Supplies the mocked response for `/api/v1/auth/setup-status`. */ (route) =>
      route.fulfill({ json: { initialized: true } }),
  );

  await page.goto('/auth/setup');

  await expect(page).toHaveURL('/auth/signin');
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Repovio' }).locator('img:visible')).toHaveAttribute(
    'src',
    /\/logo-wordmark-(?:light|dark)\.svg/,
  );
  await page.screenshot({ path: resolve(process.cwd(), 'test-results/captures/sign-in.png'), fullPage: true });
});
