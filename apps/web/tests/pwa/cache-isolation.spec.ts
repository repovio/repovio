import { expect, test } from '@playwright/test';
import { controlPage, expectPublicCachesOnly, mockApplication, signIn } from './helpers';

test('excludes protected traffic across sign-out and account switching', /** Inspect the actual worker caches and request responses in one controlled browser context. */ async ({
  page,
}) => {
  await mockApplication(page);
  await page.route(
    '**/socket.io/**',
    /** Supply a harmless synthetic realtime response. */ (route) => route.fulfill({ body: '0{"sid":"fixture"}' }),
  );
  await signIn(page, 'alice');
  await controlPage(page);
  const first = page.waitForResponse(
    /** Observe the synthetic protected request, not the document. */ (response) =>
      new URL(response.url()).pathname === '/api/v1/repositories/alice-only',
  );
  const allowed = await page.evaluate(
    /** Request a private resource using the current browser session. */ async () => {
      const response = await fetch('/api/v1/repositories/alice-only', {
        headers: { Authorization: `Bearer ${localStorage.getItem('repovio.access-token')}` },
      });
      return { status: response.status, name: (await response.json()).name };
    },
  );
  expect(allowed).toEqual({ status: 200, name: 'Private Alice fixture' });
  expect((await first).fromServiceWorker()).toBe(false);
  await page.evaluate(
    /** Exercise dynamic public metadata and realtime paths while controlled. */ async () => {
      await fetch('/manifest.webmanifest');
      await fetch('/api/branding');
      await fetch('/socket.io/?EIO=4&transport=polling');
    },
  );
  await expectPublicCachesOnly(page);
  await page.getByRole('button', { name: 'Alice Fixture', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Sign out', exact: true }).click();
  await expect(page).toHaveURL('/auth/signin');
  expect(
    await page.evaluate(
      /** Observe local sign-out cleanup without exposing token values. */ () =>
        localStorage.getItem('repovio.access-token') === null,
    ),
  ).toBe(true);
  await signIn(page, 'bob');
  const second = page.waitForResponse(
    /** Observe the second user's protected request. */ (response) =>
      new URL(response.url()).pathname === '/api/v1/repositories/alice-only',
  );
  const denied = await page.evaluate(
    /** The second fixture identity must not obtain the first identity's response. */ async () => {
      const response = await fetch('/api/v1/repositories/alice-only', {
        headers: { Authorization: `Bearer ${localStorage.getItem('repovio.access-token')}` },
      });
      return response.status;
    },
  );
  expect(denied).toBe(403);
  expect((await second).fromServiceWorker()).toBe(false);
  await expectPublicCachesOnly(page);
});
