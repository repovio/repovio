import { expect, test, type Page } from '@playwright/test';
import { controlPage, expectPublicCachesOnly } from './helpers';

/** Require explicit disposable integration inputs; never fall back to a shared deployment. */
function fixtureEnvironment(): { api: string; repositoryId: string; password: string } {
  const api = process.env.PWA_REAL_API_URL;
  const repositoryId = process.env.PWA_REAL_REPOSITORY_ID;
  const password = process.env.PWA_REAL_TEST_PASSWORD;
  if (!api || !repositoryId || !password)
    throw new Error('Set the documented disposable PWA_REAL_* fixture variables.');
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(new URL(api).hostname)) {
    throw new Error('The disposable PWA integration API must use a loopback host.');
  }
  return { api, repositoryId, password };
}

/** Sign in through the real form; no API routes or authorization are mocked in this suite. */
async function login(page: Page, username: 'alice' | 'bob', password: string): Promise<void> {
  await page.goto('/auth/signin');
  await page.getByLabel('Username', { exact: true }).fill(username);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL('/');
  await expect(
    page.getByRole('button', { name: username === 'alice' ? 'Alice Fixture' : 'Bob Fixture', exact: true }),
  ).toBeVisible();
}

/** Fetch a protected record with the current identity and prove its response did not come from the worker. */
async function repositoryStatus(page: Page, api: string, repositoryId: string): Promise<number> {
  const observed = page.waitForResponse(
    /** Match the protected API response, not a similarly named document. */ (response) =>
      response.url() === `${api}/repositories/${repositoryId}`,
  );
  const status = await page.evaluate(
    /** Use the actual current session without serializing or logging its token. */ async ({ api, repositoryId }) => {
      const response = await fetch(`${api}/repositories/${repositoryId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('repovio.access-token')}` },
      });
      return response.status;
    },
    { api, repositoryId },
  );
  expect((await observed).fromServiceWorker()).toBe(false);
  return status;
}

test('isolates real local accounts with the production worker and disposable API', /** Verify actual server authorization, logout, deep links, and recovery independently of synthetic fixtures. */ async ({
  page,
  context,
}) => {
  const { api, repositoryId, password } = fixtureEnvironment();
  await login(page, 'alice', password);
  await controlPage(page);
  await expect(page.getByRole('button', { name: 'Alice Fixture', exact: true })).toBeVisible();
  expect(await repositoryStatus(page, api, repositoryId)).toBe(200);
  await page.goto(`/repositories/${repositoryId}`);
  await expect(page.getByRole('heading', { name: 'fixture/alice-private', level: 1, exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'fixture/alice-private', level: 1, exact: true })).toBeVisible();
  await expectPublicCachesOnly(page);
  await page.getByRole('button', { name: 'Alice Fixture', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Sign out', exact: true }).click();
  await expect(page).toHaveURL('/auth/signin');
  expect(
    await page.evaluate(
      /** Verify sign-out clears persistence without returning the credential. */ () =>
        localStorage.getItem('repovio.access-token') === null,
    ),
  ).toBe(true);
  await login(page, 'bob', password);
  expect([403, 404]).toContain(await repositoryStatus(page, api, repositoryId));
  await expectPublicCachesOnly(page);
  await context.setOffline(true);
  expect(
    await page.evaluate(
      /** An authenticated endpoint must not be available through a worker cache offline. */ async (api) => {
        try {
          await fetch(`${api}/auth/me`);
          return false;
        } catch {
          return true;
        }
      },
      api,
    ),
  ).toBe(true);
  await context.setOffline(false);
  const response = page.waitForResponse(
    /** Observe the recovered authenticated response. */ (value) => value.url() === `${api}/auth/me`,
  );
  const recovered = await page.evaluate(
    /** Fetch fresh authorized identity after connectivity is restored. */ async (api) => {
      const result = await fetch(`${api}/auth/me`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('repovio.access-token')}` },
      });
      return { status: result.status, username: (await result.json()).username };
    },
    api,
  );
  expect(recovered).toEqual({ status: 200, username: 'bob' });
  expect((await response).fromServiceWorker()).toBe(false);
  await expectPublicCachesOnly(page);
});
