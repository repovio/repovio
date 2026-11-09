import { expect, test } from '@playwright/test';
import { controlPage, expectPublicCachesOnly, mockApplication } from './helpers';

test('requires online dynamic responses and recovers after an offline interruption', /** Use real network loss for uncached public metadata; API mocks are not used as offline proof. */ async ({
  page,
  context,
}) => {
  await mockApplication(page);
  await page.goto('/auth/signin');
  await controlPage(page);
  await expect(page.getByRole('heading', { name: 'Sign in', exact: true })).toBeVisible();
  expect(
    await page.evaluate(
      /** Fetch dynamic metadata over the real local server. */ async () => (await fetch('/manifest.webmanifest')).ok,
    ),
  ).toBe(true);
  await context.setOffline(true);
  expect(
    await page.evaluate(
      /** Offline metadata must fail rather than replay a stale cached result. */ async () => {
        try {
          await fetch('/manifest.webmanifest');
          return false;
        } catch {
          return true;
        }
      },
    ),
  ).toBe(true);
  await expect(page.getByRole('heading', { name: 'Sign in', exact: true })).toBeVisible();
  const cold = await context.newPage();
  await expect(cold.goto('/auth/signin')).rejects.toThrow();
  await cold.close();
  await context.setOffline(false);
  const response = page.waitForResponse(
    /** Confirm the recovered response is genuinely fetched online. */ (value) =>
      value.url().endsWith('/manifest.webmanifest'),
  );
  expect(
    await page.evaluate(
      /** Retry dynamic metadata after connectivity returns. */ async () => (await fetch('/manifest.webmanifest')).ok,
    ),
  ).toBe(true);
  expect((await response).fromServiceWorker()).toBe(false);
  await expectPublicCachesOnly(page);
});
