import { expect, test } from '@playwright/test';
import { mockRepositoryApplication } from './fixtures/repository-detail';

test.use({ timezoneId: 'UTC' });

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
  for (const path of ['/', '/workflow-runs', '/repositories/repository-1/workflow-runs']) {
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

const terminalCases = [
  {
    title: 'Terminal zero',
    status: 'SUCCESS',
    completedAt: '2026-11-09T10:02:00Z',
    durationMs: 0,
    seconds: 0,
    completion: true,
  },
  {
    title: 'Invalid completion',
    status: 'FAILED',
    completedAt: 'invalid',
    durationMs: 3000,
    seconds: 3,
    completion: false,
  },
  {
    title: 'Negative duration',
    status: 'CANCELLED',
    completedAt: '2026-11-09T10:02:00Z',
    durationMs: -1,
    seconds: null,
    completion: true,
  },
  { title: 'Missing timing', status: 'SKIPPED', completedAt: null, durationMs: null, seconds: null, completion: false },
  {
    title: 'Unknown valid timing',
    status: 'UNKNOWN',
    completedAt: '2026-11-09T10:02:00Z',
    durationMs: 3000,
    seconds: 3,
    completion: true,
  },
  {
    title: 'Reversed completion',
    status: 'SUCCESS',
    completedAt: '2026-11-09T09:59:00Z',
    durationMs: 60_000,
    seconds: 60,
    completion: false,
  },
  {
    title: 'Epoch completion',
    status: 'FAILED',
    completedAt: '1970-01-01T00:00:00Z',
    durationMs: 3000,
    seconds: 3,
    completion: false,
  },
];

for (const locale of ['en', 'de']) {
  for (const path of ['/', '/workflow-runs']) {
    test(`terminal timing survives refresh: ${locale} ${path}`, /** Verify refreshed completion and independent timing fields through the actual UI. */ async ({
      page,
    }, testInfo) => {
      await mockRepositoryApplication(page, 'VIEWER');
      await page
        .context()
        .addCookies([{ name: 'repovio-locale', value: locale, url: testInfo.project.use.baseURL as string }]);
      let rows: unknown[] = activeRuns;
      await page.route(
        '**/api/v1/dashboard/summary**',
        /** Supply complete synthetic dashboard metrics. */ (route) =>
          route.fulfill({
            json: {
              awaitingApprovalCount: 0,
              completedCount: 7,
              medianDurationMs: 3000,
              queuedCount: 0,
              runningCount: 0,
              statuses: { cancelled: 1, failed: 2, skipped: 1, success: 2, unknown: 1 },
              successRate: 50,
              totalRunDurationMs: 69000,
            },
          }),
      );
      await page.route(
        '**/api/v1/dashboard/latest-runs**',
        /** Return the current fixture state on refresh. */ (route) => route.fulfill({ json: rows }),
      );
      await page.route(
        /\/api\/v1\/workflow-runs(?:\?.*)?$/,
        /** Preserve real query and rendering behavior while returning current fixture rows. */ (route) =>
          route.fulfill({
            json: {
              items: rows,
              meta: {
                hasNextPage: false,
                hasPrevPage: false,
                itemCount: rows.length,
                page: 1,
                pageCount: 1,
                perPage: 25,
              },
            },
          }),
      );
      await page.goto(path);
      await expect(page.locator('tbody tr').filter({ hasText: 'Active RUNNING' })).toHaveCount(1, { timeout: 15_000 });
      rows = terminalCases.map(
        /** Keep the original active row identity when it becomes terminal. */ (entry, index) => ({
          ...activeRuns[0],
          id: index === 0 ? activeRuns[0]!.id : `terminal-${index}`,
          displayTitle: entry.title,
          status: entry.status,
          completedAt: entry.completedAt,
          durationMs: entry.durationMs,
        }),
      );
      await page.getByRole('button', { name: locale === 'de' ? 'Aktualisieren' : 'Refresh', exact: true }).click();
      await expect(page.locator('tbody tr').filter({ hasText: 'Active RUNNING' })).toHaveCount(0);
      for (const entry of terminalCases) {
        const row = page.locator('tbody tr').filter({ hasText: entry.title });
        await expect(row).toHaveCount(1);
        const cells = row.locator('td');
        const count = await cells.count();
        const durationCell = cells.nth(path === '/' ? 2 : count - 3);
        const completionCell = cells.nth(path === '/' ? 3 : count - 2);
        const seconds = entry.seconds;
        const expected =
          seconds === null
            ? path === '/'
              ? locale === 'de'
                ? 'Unbekannt'
                : 'Unknown'
              : '—'
            : path === '/' && seconds < 60
              ? locale === 'de'
                ? `${seconds} Sek.`
                : `${seconds}s`
              : locale === 'de'
                ? `${Math.floor(seconds / 60)} Min. ${seconds % 60} Sek.`
                : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
        await expect(durationCell).toHaveText(expected);
        if (entry.completion) await expect(completionCell).toContainText('10:02');
        else await expect(completionCell).toHaveText('—');
      }
      await page.locator('tbody tr').filter({ hasText: 'Terminal zero' }).scrollIntoViewIfNeeded();
      await page.screenshot({ path: testInfo.outputPath(`terminal-timing-${locale}.png`), fullPage: true });
    });
  }
}
