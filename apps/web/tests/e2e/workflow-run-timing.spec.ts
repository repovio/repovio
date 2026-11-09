import { expect, test } from '@playwright/test';
import { mockRepositoryApplication } from './fixtures/repository-detail';

const activeRuns = ['RUNNING', 'QUEUED'].map(
  /** Create stale API rows that bypass the server's corrected timing normalization. */ (status, index) => ({
    id: `active-${index}`,
    providerRunId: String(index + 1),
    displayTitle: `Active ${status}`,
    workflowName: 'Build',
    status,
    awaitingApproval: status === 'QUEUED',
    reviewUrl: null,
    startedAt: '2026-11-09T10:00:00Z',
    providerCreatedAt: '2026-11-09T09:59:00Z',
    completedAt: index === 0 ? '1970-01-01T00:00:00Z' : '2026-11-09T10:02:00Z',
    durationMs: index === 0 ? -1785578400000 : 120_000,
    repositoryId: 'repository-1',
    repositoryName: 'repository-1',
    repositoryOwner: 'team',
    providerType: 'FORGEJO',
    repository: {
      id: 'repository-1',
      name: 'repository-1',
      owner: 'team',
      url: 'https://example.test/team/repository-1',
    },
    provider: { id: 'provider-1', displayName: 'Test provider', providerType: 'FORGEJO' },
    url: 'https://example.test/team/repository-1/actions/runs/1',
    workflowLifecycleState: 'ACTIVE',
    workflowLifecycleCheckedAt: null,
  }),
);

for (const locale of ['en', 'de']) {
  for (const path of ['/', '/workflow-runs']) {
    test(`active run timing stays unavailable: ${locale} ${path}`, /** Exercise real localized rows with stale payloads. */ async ({
      page,
    }, testInfo) => {
      await mockRepositoryApplication(page, 'VIEWER');
      await page
        .context()
        .addCookies([{ name: 'repovio-locale', value: locale, url: testInfo.project.use.baseURL as string }]);
      await page.route(
        '**/api/v1/dashboard/summary**',
        /** Supply complete synthetic summary metrics. */ (route) =>
          route.fulfill({
            json: {
              awaitingApprovalCount: 1,
              completedCount: 0,
              medianDurationMs: null,
              queuedCount: 1,
              runningCount: 1,
              statuses: { cancelled: 0, failed: 0, skipped: 0, success: 0, unknown: 0 },
              successRate: null,
              totalRunDurationMs: 0,
            },
          }),
      );
      await page.route(
        '**/api/v1/dashboard/latest-runs**',
        /** Return stale dashboard rows. */ (route) => route.fulfill({ json: activeRuns }),
      );
      await page.route(
        /\/api\/v1\/workflow-runs(?:\?.*)?$/,
        /** Return stale table rows without correcting them in the mock. */ (route) =>
          route.fulfill({
            json: {
              items: activeRuns,
              meta: { hasNextPage: false, hasPrevPage: false, itemCount: 2, page: 1, pageCount: 1, perPage: 25 },
            },
          }),
      );
      await page.goto(path);
      for (const status of ['RUNNING', 'QUEUED']) {
        const row = page.locator('tbody tr').filter({ hasText: `Active ${status}` });
        await expect(row).toHaveCount(1, { timeout: 15_000 });
        await row.scrollIntoViewIfNeeded();
        await expect(row).toBeVisible();
        if (path === '/') {
          await expect(row.locator('td').nth(2)).toHaveText(locale === 'de' ? 'Unbekannt' : 'Unknown');
          await expect(row.locator('td').nth(3)).toHaveText('—');
        } else {
          await expect(row.getByText('—', { exact: true })).toHaveCount(2);
        }
        await expect(row).not.toContainText('1970');
        await expect(row).not.toContainText('-1785578400000');
      }
      await page.screenshot({ path: testInfo.outputPath(`active-timing-${locale}.png`), fullPage: true });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.locator('tbody tr').filter({ hasText: 'Active RUNNING' }).scrollIntoViewIfNeeded();
      await expect(page.locator('tbody tr').filter({ hasText: 'Active RUNNING' })).toBeVisible();
      await page.screenshot({ path: testInfo.outputPath(`active-timing-${locale}-mobile.png`), fullPage: true });
    });
  }
}
