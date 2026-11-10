import { expect, test } from '@playwright/test';
import { mockRefreshApplication } from './fixtures/auto-refresh';

for (const [path, endpoint] of [
  ['/', 'dashboard/summary'],
  ['/workflows/awaiting-approval', 'dashboard/awaiting-approval'],
] as const) {
  test(`refreshes ${path} after the default interval and releases it on navigation`, /** Exercise mounted page adapters with the browser clock. */ async ({
    page,
  }) => {
    const { counts, writes } = await mockRefreshApplication(page);
    await page.clock.install();
    await page.goto(path);
    const refresh = page.getByRole('button', { name: 'Refresh', exact: true });
    await expect(refresh).toBeEnabled();
    const before = counts[endpoint] ?? 0;
    await page.clock.runFor(15000);
    await expect.poll(/** Observe the new period/list read. */ () => counts[endpoint]).toBeGreaterThan(before);
    await expect(refresh).toBeEnabled();
    expect(writes).toEqual([]);
    await page.goto('/admin/users');
    await expect(page.getByRole('heading', { name: 'Users', exact: true })).toBeVisible();
    const afterNavigation = counts[endpoint];
    await page.clock.runFor(60000);
    expect(counts[endpoint]).toBe(afterNavigation);
  });
}

test('dashboard remains busy until a delayed sibling settles after another read fails', /** A rejected trend must not release a pending summary. */ async ({
  page,
}) => {
  const { counts } = await mockRefreshApplication(page);
  await page.clock.install();
  await page.goto('/');
  const refresh = page.getByRole('button', { name: 'Refresh', exact: true });
  await expect(refresh).toBeEnabled();
  let finish!: () => void;
  const held = new Promise<void>(
    /** Keep one dashboard sibling pending. */ (resolve) => {
      finish = resolve;
    },
  );
  let started = false;
  await page.route(
    '**/api/v1/dashboard/summary**',
    /** Delay the next summary while the trend fails. */ async (route) => {
      started = true;
      await held;
      await route.fallback();
    },
  );
  await page.route(
    '**/api/v1/dashboard/trend**',
    /** Record a real HTTP failure in existing error state. */ (route) => route.fulfill({ status: 503, json: {} }),
  );
  await refresh.click();
  await expect.poll(/** Await transport dispatch before advancing the clock. */ () => started).toBe(true);
  await expect(refresh).toBeDisabled();
  const before = counts['dashboard/latest-runs'];
  await page.clock.runFor(45000);
  expect(counts['dashboard/latest-runs']).toBe(before);
  finish();
  await expect(refresh).toBeEnabled();
  await expect(page.getByText('Some dashboard data is unavailable', { exact: true })).toBeVisible();
});
