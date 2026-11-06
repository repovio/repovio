import { resolve } from 'node:path';

import { expect, test, type Page } from '@playwright/test';

const jobs = [
  {
    attempt: 1,
    id: 'repository-running',
    lastError: null,
    progressCurrent: 7,
    progressPhase: 'PROCESSING_WORKFLOWS',
    progressTotal: 12,
    providerName: 'GitHub',
    providerType: 'GITHUB',
    repositoryName: 'repovio',
    repositoryOwner: 'tobiaswaelde',
    requestedAt: '2026-09-13T04:00:00.000Z',
    runAfter: '2026-09-13T04:00:00.000Z',
    scopes: ['WORKFLOWS', 'ISSUES', 'PULL_REQUESTS'],
    startedAt: '2026-09-13T04:00:01.000Z',
    status: 'RUNNING',
  },
  {
    attempt: 0,
    id: 'repository-idle',
    lastError: null,
    progressCurrent: null,
    progressPhase: null,
    progressTotal: null,
    providerName: 'Forgejo',
    providerType: 'FORGEJO',
    repositoryName: 'idle-repository',
    repositoryOwner: 'team',
    requestedAt: null,
    runAfter: null,
    scopes: ['WORKFLOWS', 'ISSUES', 'PULL_REQUESTS'],
    startedAt: null,
    status: 'IDLE',
  },
  {
    attempt: 1,
    id: 'repository-warning',
    lastError: null,
    progressCurrent: null,
    progressPhase: null,
    progressTotal: null,
    providerName: 'GitLab',
    providerType: 'GITLAB',
    repositoryName: 'partial-alerts',
    repositoryOwner: 'team',
    requestedAt: '2026-09-13T03:00:00.000Z',
    runAfter: '2026-09-13T03:00:00.000Z',
    scopes: ['WORKFLOWS', 'ISSUES', 'PULL_REQUESTS', 'ALERTS'],
    startedAt: '2026-09-13T03:00:01.000Z',
    status: 'WARNING',
    warningKinds: ['CODE'],
  },
] as const;

/** Mocks jobs page. */
async function mockJobsPage(
  page: Page,
  onQuery: (url: string) => void = /** Returns `undefined` to the caller. */ () => undefined,
): Promise<void> {
  await page.addInitScript(
    /** Initializes browser-side authentication and preferences before page scripts run. */ () =>
      window.localStorage.setItem('repovio.access-token', 'playwright-access-token'),
  );
  await page.route(
    '**/api/v1/auth/me',
    /** Supplies the mocked response for `/api/v1/auth/me`. */ (route) =>
      route.fulfill({ json: { id: 'admin-id', role: 'SYSTEM_ADMIN', username: 'admin' } }),
  );
  await page.route(
    '**/api/v1/settings',
    /** Supplies the mocked response for `/api/v1/settings`. */ (route) =>
      route.fulfill({ json: { dateTimeFormat: 'LOCALE_MEDIUM', workflowRunRetentionDays: 90 } }),
  );
  await page.route(
    '**/api/v1/dashboard/awaiting-approval',
    /** Supplies the mocked response for `/api/v1/dashboard/awaiting-approval`. */ (route) =>
      route.fulfill({ json: [] }),
  );
  await page.route(
    '**/api/v1/workflow-runs/needs-attention**',
    /** Supplies the mocked response for `/api/v1/workflow-runs/needs-attention**`. */ (route) =>
      route.fulfill({
        json: {
          items: [],
          meta: { hasNextPage: false, hasPrevPage: false, itemCount: 0, page: 1, pageCount: 0, perPage: 1 },
        },
      }),
  );
  await page.route(
    '**/api/v1/version/latest',
    /** Supplies the mocked response for `/api/v1/version/latest`. */ (route) =>
      route.fulfill({ json: { latest: null } }),
  );
  await page.route(
    '**/api/v1/jobs/repository-sync/summary',
    /** Supplies the mocked response for `/api/v1/jobs/repository-sync/summary`. */ (route) =>
      route.fulfill({ json: { failed: 0, idle: 1, pending: 0, running: 1, total: 3, warning: 1 } }),
  );
  await page.route(
    /\/api\/v1\/jobs\/repository-sync(?:\?.*)?$/,
    /** Supplies the mocked response for the intercepted request. */ (route) => {
      onQuery(route.request().url());
      return route.fulfill({
        json: {
          items: jobs,
          meta: { hasNextPage: false, hasPrevPage: false, itemCount: 3, page: 1, pageCount: 1, perPage: 10 },
        },
      });
    },
  );
}

test('shows available jobs, progress, start actions, and root navigation sections', /** Verifies shows available jobs, progress, start actions, and root navigation sections. */ async ({
  page,
}) => {
  await mockJobsPage(page);
  let runAllCount = 0;
  let runRepositoryCount = 0;
  await page.route(
    '**/api/v1/jobs/repository-sync/run',
    /** Supplies the mocked response for `/api/v1/jobs/repository-sync/run`. */ async (route) => {
      runAllCount += 1;
      await route.fulfill({ json: { queuedCount: 1 }, status: 202 });
    },
  );
  await page.route(
    '**/api/v1/jobs/repository-sync/repository-idle/run',
    /** Supplies the mocked response for `/api/v1/jobs/repository-sync/repository-idle/run`. */ async (route) => {
      runRepositoryCount += 1;
      await route.fulfill({ json: { queuedCount: 1 }, status: 202 });
    },
  );

  await page.goto('/jobs');

  await expect(page.getByRole('heading', { name: 'Jobs' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Repository synchronization' })).toBeVisible();
  await expect(page.getByText('repovio/repovio')).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Provider' })).toBeVisible();
  await expect(page.getByText('Processing workflows: 7/12')).toBeVisible();
  await expect(page.getByRole('progressbar', { name: '58%' })).toHaveAttribute('aria-valuenow', '7');
  await expect(page.getByText('team/idle-repository')).toBeVisible();
  await expect(page.getByRole('row').filter({ hasText: 'team/partial-alerts' })).toContainText('Code scanning');
  await expect(page.getByText('Overview', { exact: true })).toBeVisible();
  await expect(page.getByText('Operations', { exact: true })).toBeVisible();
  await expect(page.getByText('Administration', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Provider accounts' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Users' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Settings' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Administration' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Run all' }).click();
  await expect.poll(/** Evaluates `runAllCount` when expect.poll invokes this callback. */ () => runAllCount).toBe(1);
  await page.getByRole('row').filter({ hasText: 'team/idle-repository' }).getByRole('button', { name: 'Run' }).click();
  await expect
    .poll(/** Evaluates `runRepositoryCount` when expect.poll invokes this callback. */ () => runRepositoryCount)
    .toBe(1);

  await page.screenshot({ path: resolve(process.cwd(), 'test-results/captures/jobs.png'), fullPage: true });

  await page.setViewportSize({ height: 844, width: 390 });
  await expect
    .poll(
      /** Evaluates `page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)` when expect .poll invokes this callback. */ () =>
        page.evaluate(
          /** Reads or updates browser state for the jobs scenario. */ () =>
            document.documentElement.scrollWidth <= document.documentElement.clientWidth,
        ),
    )
    .toBe(true);
});

test('polls every five seconds only while the jobs page is mounted', /** Verifies polls every five seconds only while the jobs page is mounted. */ async ({
  page,
}) => {
  let queryCount = 0;
  await mockJobsPage(
    page,
    /** Provides isolated jobs behavior for this test fixture. */ () => {
      queryCount += 1;
    },
  );

  await page.goto('/jobs');
  await expect
    .poll(/** Evaluates `queryCount` when expect.poll invokes this callback. */ () => queryCount)
    .toBeGreaterThanOrEqual(1);
  const initialQueryCount = queryCount;
  await expect
    .poll(/** Evaluates `queryCount` when expect.poll invokes this callback. */ () => queryCount, { timeout: 6_000 })
    .toBeGreaterThan(initialQueryCount);

  await page.goto('/repositories');
  const unmountedQueryCount = queryCount;
  await page.waitForTimeout(5_250);
  expect(queryCount).toBe(unmountedQueryCount);
});

test('restores the selected page size across visits', /** Verifies restores the selected page size across visits. */ async ({
  page,
}) => {
  await page.addInitScript(
    /** Initializes browser-side authentication and preferences before page scripts run. */ () => {
      if (!window.localStorage.getItem('table:jobs:items-per-page')) {
        window.localStorage.setItem('table:jobs:items-per-page', '25');
      }
    },
  );
  const requestedUrls: string[] = [];
  await mockJobsPage(
    page,
    /** Provides isolated jobs behavior for this test fixture. */ (url) => requestedUrls.push(url),
  );

  await page.goto('/jobs');
  await expect
    .poll(
      /** Evaluates `requestedUrls.some((url) => new URL(url).searchParams.get('perPage') === '25')` when expect.poll invokes this callback. */ () =>
        requestedUrls.some(
          /** Checks whether any entry satisfies `new URL(url).searchParams.get('perPage') === '25'`. */ (url) =>
            new URL(url).searchParams.get('perPage') === '25',
        ),
    )
    .toBe(true);

  await page.locator('footer').getByRole('combobox').click();
  await page.getByRole('option', { name: '50', exact: true }).click();
  await expect
    .poll(
      /** Evaluates `page.evaluate(() => window.localStorage.getItem('table:jobs:items-per-page'))` when expect.poll invokes this callback. */ () =>
        page.evaluate(
          /** Reads or updates browser state for the jobs scenario. */ () =>
            window.localStorage.getItem('table:jobs:items-per-page'),
        ),
    )
    .toBe('50');

  const requestCountBeforeReload = requestedUrls.length;
  await page.reload();
  await expect
    .poll(/** Evaluates `requestedUrls.length` when expect.poll invokes this callback. */ () => requestedUrls.length)
    .toBeGreaterThan(requestCountBeforeReload);
  await expect
    .poll(
      /** Evaluates `new URL(requestedUrls.at(-1)!).searchParams.get('perPage')` when expect.poll invokes this callback. */ () =>
        new URL(requestedUrls.at(-1)!).searchParams.get('perPage'),
    )
    .toBe('50');
});
