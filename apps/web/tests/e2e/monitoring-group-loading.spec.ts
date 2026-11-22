import { expect, test } from '@playwright/test';
import { mockRefreshApplication } from './fixtures/auto-refresh';

for (const [path, resource, field, value] of [
  ['/workflow-runs', 'workflow-runs', 'status', 'FAILED'],
  ['/issues', 'issues', 'state', 'OPEN'],
  ['/pull-requests', 'pull-requests', 'state', 'MERGED'],
  ['/alerts/dependencies', 'security-alerts', 'severity', 'HIGH'],
] as const) {
  test(`keeps infinite loading inside the selected ${resource} group`, /** Exercise each table's actual query adapter and grouping controls. */ async ({
    page,
  }) => {
    await mockRefreshApplication(page);
    await page.route(
      `**/api/v1/${resource}/group-by?**`,
      /** Confirm the requested dimension and preserve the alert category. */ async (route) => {
        const query = new URL(route.request().url()).searchParams;
        expect(JSON.parse(query.get('by')!)).toEqual([field]);
        if (resource === 'security-alerts') expect(query.get('where')).toContain('DEPENDENCY');
        return route.fulfill({ json: [{ [field]: value, _count: { _all: 3 } }] });
      },
    );
    await page.goto(path);
    await page.getByRole('button', { name: 'Group by', exact: true }).click();
    await page.getByRole('combobox', { name: 'Select grouping field' }).click();
    await page.getByRole('option').first().click();
    await page.getByRole('button', { name: 'Add grouping' }).click();
    await page.keyboard.press('Escape');
    const group = page.getByRole('button', { name: /3 items/ });
    await group.click();
    const mode = page.getByRole('combobox', { name: 'Row loading mode' });
    await mode.click();
    const firstBatch = page.waitForRequest(
      /** Require both the original endpoint and its leaf constraint. */ (request) => {
        const url = new URL(request.url());
        return (
          url.pathname === `/api/v1/${resource}` &&
          (url.searchParams.get('where') ?? '').includes(`"${field}":"${value}"`)
        );
      },
    );
    await page.getByRole('option', { name: 'Infinite scroll' }).click();
    const batch = new URL((await firstBatch).url()).searchParams;
    expect(batch.get('page')).toBe('1');
    expect(batch.get('orderBy')).toBeNull();
    await expect(mode).toContainText('Infinite scroll');
    await group.click();
    await expect(mode).toHaveCount(0);
  });
}
