import { expect, test } from '@playwright/test';
import { mockRefreshApplication } from './fixtures/auto-refresh';

for (const [path, endpoint] of [
  ['/issues', 'issues'],
  ['/pull-requests', 'pull-requests'],
  ['/alerts/dependencies', 'security-alerts'],
  ['/alerts/code', 'security-alerts'],
  ['/alerts/secrets', 'security-alerts'],
] as const) {
  test(`refreshes table and summary on ${path}`, /** All feature adapters must register complete content, not just rows. */ async ({
    page,
  }) => {
    const { counts, writes } = await mockRefreshApplication(page);
    await page.clock.install();
    await page.goto(`${path}?page=2`);
    const refresh = page.getByRole('button', { name: 'Refresh', exact: true });
    await expect(refresh).toBeEnabled();
    const tableBefore = counts[endpoint];
    const summaryBefore = counts[`${endpoint}/summary`];
    await page.clock.runFor(15000);
    await expect.poll(/** Observe the real table adapter. */ () => counts[endpoint]).toBe(tableBefore + 1);
    await expect
      .poll(/** Observe the same cycle's summary. */ () => counts[`${endpoint}/summary`])
      .toBe(summaryBefore + 1);
    await expect(refresh).toBeEnabled();
    expect(page.url()).toContain('page=2');
    expect(writes).toEqual([]);
  });
}

test('keeps a work-item refresh pending through a slow supporting response', /** Delayed summaries must gate manual and scheduled triggers. */ async ({
  page,
}) => {
  const { counts } = await mockRefreshApplication(page);
  await page.clock.install();
  await page.goto('/issues');
  const refresh = page.getByRole('button', { name: 'Refresh', exact: true });
  await expect(refresh).toBeEnabled();
  let finish!: () => void;
  const held = new Promise<void>(
    /** Hold summary transport open. */ (resolve) => {
      finish = resolve;
    },
  );
  let started = false;
  await page.route(
    '**/api/v1/issues/summary',
    /** Delay the supporting read after the table finishes. */ async (route) => {
      started = true;
      await held;
      await route.fallback();
    },
  );
  await refresh.click();
  await expect.poll(/** Wait for the summary request. */ () => started).toBe(true);
  await expect(refresh).toBeDisabled();
  const before = counts.issues;
  await page.clock.runFor(60000);
  expect(counts.issues).toBe(before);
  finish();
  await expect(refresh).toBeEnabled();
});
