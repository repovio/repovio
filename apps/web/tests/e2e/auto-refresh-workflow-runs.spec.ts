import { expect, test } from '@playwright/test';
import { mockRefreshApplication } from './fixtures/auto-refresh';

for (const [path, endpoint] of [
  ['/workflow-runs', 'workflow-runs'],
  ['/workflow-runs/needs-attention', 'workflow-runs/needs-attention'],
] as const) {
  test(`refreshes ${path} without resetting its query`, /** Check real monitoring adapters with synthetic transport. */ async ({
    page,
  }) => {
    const { counts, writes } = await mockRefreshApplication(page);
    await page.clock.install();
    await page.goto(`${path}?page=2`);
    const refresh = page.getByRole('button', { name: 'Refresh', exact: true });
    await expect(refresh).toBeEnabled();
    const before = counts[endpoint] ?? 0;
    await page.clock.runFor(15000);
    await expect.poll(/** Observe one completed interval cycle. */ () => counts[endpoint]).toBeGreaterThan(before);
    await expect(refresh).toBeEnabled();
    expect(page.url()).toContain('page=2');
    expect(writes).toEqual([]);
  });
}
