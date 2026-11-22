import { expect, test, type Page } from '@playwright/test';
import { expectTableHover } from './fixtures/table-hover';

const issue = {
  assignees: [{ avatarUrl: null, displayName: 'Alex Example', url: null, username: 'alex' }],
  author: { avatarUrl: null, displayName: 'Taylor Example', url: null, username: 'taylor' },
  body: '## Reproduction\n\n<script>window.__unsafe = true</script>\n\n[unsafe](javascript:alert(1))',
  closedAt: null,
  id: 'issue-1',
  labels: [
    { color: '#d73a4a', description: 'Defect', name: 'Bug' },
    { color: '#0052cc', description: null, name: 'Priority: High' },
  ],
  milestone: 'v1.0',
  number: '204',
  providerCreatedAt: '2026-09-01T08:00:00.000Z',
  providerType: 'GITHUB',
  providerUpdatedAt: '2026-09-12T08:00:00.000Z',
  repositoryId: 'repository-1',
  repositoryName: 'repovio',
  repositoryOwner: 'tobiaswaelde',
  state: 'OPEN',
  title: 'Track provider issues',
  url: 'https://github.com/repovio/repovio/issues/204',
};

const pullRequest = {
  ...issue,
  body: 'Adds merge request tracking.',
  draft: true,
  id: 'pull-request-1',
  mergedAt: null,
  number: '213',
  providerType: 'GITLAB',
  sourceBranch: 'feature/work-items',
  targetBranch: 'main',
  title: 'Track merge requests',
  url: 'https://gitlab.example.test/repovio/-/merge_requests/213',
  workflowApprovalRequired: true,
  workflowStatus: 'FAILED',
};

/** Mocks shell. */
async function mockShell(page: Page): Promise<void> {
  await page.addInitScript(
    /** Initializes browser-side authentication and preferences before page scripts run. */ () =>
      window.localStorage.setItem('repovio.access-token', 'playwright-access-token'),
  );
  await page.route(
    '**/api/v1/auth/me',
    /** Supplies the mocked response for `/api/v1/auth/me`. */ (route) =>
      route.fulfill({ json: { id: 'viewer', role: 'VIEWER', username: 'viewer' } }),
  );
  await page.route(
    '**/api/v1/settings',
    /** Supplies the mocked response for `/api/v1/settings`. */ (route) =>
      route.fulfill({ json: { dateTimeFormat: 'LOCALE_MEDIUM', workflowRunRetentionDays: 90 } }),
  );
  await page.route(
    '**/api/v1/health',
    /** Supplies the mocked response for `/api/v1/health`. */ (route) =>
      route.fulfill({ json: { api: 'ok', database: 'ok', providers: [], status: 'ok' } }),
  );
  await page.route(
    /\/api\/v1\/repositories(?:\?.*)?$/,
    /** Supplies the mocked response for the intercepted request. */ (route) =>
      route.fulfill({
        json: {
          items: [{ id: 'repository-1', name: 'repovio', owner: 'tobiaswaelde' }],
          meta: { hasNextPage: false, hasPrevPage: false, itemCount: 1, page: 1, pageCount: 1, perPage: 1_000 },
        },
      }),
  );
}

/** Checks full page shell. */
test('opens a server-counted issue group and keeps issue links', /** Checks group counts independently of the loaded page. */ async ({
  page,
}) => {
  await mockShell(page);
  await page.route(
    '**/api/v1/issues/filter-options',
    /** Supply empty filter choices. */ (route) =>
      route.fulfill({ json: { labels: [], authors: [], assignees: [], milestones: [] } }),
  );
  await page.route(
    '**/api/v1/issues/summary',
    /** Supply summary metrics. */ (route) =>
      route.fulfill({ json: { assigned: 0, open: 42, recentlyUpdated: 0, stale: 0 } }),
  );
  await page.route(
    /\/api\/v1\/issues(?:\?.*)?$/,
    /** Return only one row regardless of total group size. */ (route) =>
      route.fulfill({ json: { items: [issue], meta: { itemCount: 42, pageCount: 2 } } }),
  );
  await page.route(
    '**/api/v1/issues/group-by?**',
    /** Supply the complete server count. */ (route) =>
      route.fulfill({ json: [{ state: 'OPEN', _count: { _all: 42 } }] }),
  );
  await page.goto('/issues');
  await page.getByRole('button', { name: 'Group by', exact: true }).click();
  await page.getByRole('combobox', { name: 'Select grouping field' }).click();
  await page.getByRole('option').first().click();
  await page.getByRole('button', { name: 'Add grouping' }).click();
  await page.keyboard.press('Escape');
  const group = page.getByRole('button', { name: /Open.*42 items/i });
  await expect(group).toHaveAttribute('aria-expanded', 'false');
  const leaf = page.waitForRequest(
    /** Match the group-scoped record request. */ (request) =>
      new URL(request.url()).pathname === '/api/v1/issues' &&
      (new URL(request.url()).searchParams.get('where') ?? '').includes('"state":"OPEN"'),
  );
  await group.press('Enter');
  await leaf;
  await expect(page.getByRole('link', { name: issue.title })).toHaveAttribute('href', '/issues/issue-1');
});

/** Checks full page shell. */
async function expectFullPageShell(page: Page): Promise<void> {
  await expect(page.locator('#main-content')).toHaveClass(/overflow-hidden/);
}

for (const locale of ['en', 'de'] as const) {
  test(`infinite issue rows retry and deduplicate (${locale})`, /** Exercise real scroll and mode controls at two viewport sizes. */ async ({
    page,
    baseURL,
  }) => {
    const german = locale === 'de';
    await page.setViewportSize({ width: german ? 390 : 1440, height: 900 });
    await page.context().addCookies([{ name: 'repovio-locale', value: locale, url: baseURL! }]);
    await mockShell(page);
    await page.route(
      '**/issues/summary',
      /** Return valid supporting metrics. */ (route) =>
        route.fulfill({ json: { assigned: 0, open: 26, recentlyUpdated: 0, stale: 0 } }),
    );
    await page.route(
      '**/issues/filter-options',
      /** Return valid supporting filter choices. */ (route) =>
        route.fulfill({ json: { authors: [], assignees: [], labels: [], milestones: [] } }),
    );
    let attempts = 0;
    await page.route(
      /\/api\/v1\/issues(?:\?.*)?$/,
      /** Overlap one identity on the retried second page. */ async (route) => {
        const second = new URL(route.request().url()).searchParams.get('page') === '2';
        if (second && ++attempts === 1) return route.fulfill({ status: 503 });
        const ids = second
          ? [24, 25]
          : Array.from({ length: 25 }, /** Generate stable first-page identities. */ (_, index) => index);
        return route.fulfill({
          json: {
            items: ids.map(
              /** Build distinguishable leaf rows. */ (id) => ({ ...issue, id: `issue-${id}`, title: `Fixture ${id}` }),
            ),
            meta: { itemCount: 26, pageCount: 2 },
          },
        });
      },
    );
    await page.goto('/issues');
    const mode = page.getByRole('combobox', { name: german ? 'Lademodus' : 'Row loading mode' });
    await mode.click();
    await page.getByRole('option', { name: german ? 'Endloses Scrollen' : 'Infinite scroll' }).click();
    await expect(mode).toContainText(german ? 'Endloses Scrollen' : 'Infinite scroll');
    await page
      .locator('footer')
      .filter({ has: mode })
      .locator(':scope > span[aria-hidden="true"]')
      .scrollIntoViewIfNeeded();
    const retry = page.getByRole('button', { name: german ? 'Erneut versuchen' : 'Retry', exact: true });
    await retry.click();
    await expect(page.getByRole('link', { name: 'Fixture 25', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Fixture 24', exact: true })).toHaveCount(1);
    await mode.click();
    await page.getByRole('option', { name: german ? 'Seitennavigation' : 'Pagination' }).click();
    await expect(page.getByRole('link', { name: 'Fixture 25', exact: true })).toHaveCount(0);
  });
}

test('filters issues by every selected label and updated range, then renders sanitized provider Markdown', /** Verifies filters issues by every selected label and updated range, then renders sanitized provider Markdown. */ async ({
  page,
}, testInfo) => {
  await mockShell(page);
  const requestedUrls: string[] = [];
  await page.route(
    '**/api/v1/issues/filter-options',
    /** Supplies the mocked response for `/api/v1/issues/filter-options`. */ (route) =>
      route.fulfill({
        json: { assignees: ['alex'], authors: ['taylor'], labels: ['Bug', 'Priority: High'], milestones: ['v1.0'] },
      }),
  );
  await page.route(
    '**/api/v1/issues/summary',
    /** Supplies the mocked response for `/api/v1/issues/summary`. */ (route) =>
      route.fulfill({ json: { assigned: 1, open: 1, recentlyUpdated: 1, stale: 0 } }),
  );
  await page.route(
    /\/api\/v1\/issues(?:\?.*)?$/,
    /** Supplies the mocked response for the intercepted request. */ (route) => {
      requestedUrls.push(route.request().url());
      return route.fulfill({
        json: {
          items: [{ ...issue, body: undefined }],
          meta: { hasNextPage: false, hasPrevPage: false, itemCount: 1, page: 1, pageCount: 1, perPage: 25 },
        },
      });
    },
  );
  await page.route(
    '**/api/v1/issues/issue-1',
    /** Supplies the mocked response for `/api/v1/issues/issue-1`. */ (route) => route.fulfill({ json: issue }),
  );

  await page.goto('/issues');
  await expectFullPageShell(page);
  const issueBreadcrumbs = page.locator('[data-page-toolbar]').first();
  await expect(issueBreadcrumbs.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/');
  await expect(issueBreadcrumbs.getByText('Issues', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Issues' })).toBeVisible();
  await expect(page.getByText('Track provider issues')).toBeVisible();
  await expectTableHover(page, page.getByRole('table'));
  await expect(page.locator('[data-table-toolbar]').getByRole('button', { name: 'Labels' })).toHaveCount(0);
  await page.locator('[data-table-toolbar]').getByRole('button', { name: 'Filter', exact: true }).click();
  await page.getByRole('button', { name: 'Labels' }).click();
  await page.getByRole('option', { name: 'Bug' }).click();
  await page.getByRole('option', { name: 'Priority: High' }).click();
  await page.keyboard.press('Escape');
  await page.getByLabel('Updated from').fill('2026-09-01');
  await page.getByLabel('Updated to').fill('2026-09-13');
  await expect
    .poll(
      /** Evaluates `new URL(requestedUrls.at(-1)!).searchParams.get('where') ?? ''` when expect .poll invokes this callback. */ () =>
        new URL(requestedUrls.at(-1)!).searchParams.get('where') ?? '',
    )
    .toContain('2026-09-13T23:59:59.999Z');
  const where = new URL(requestedUrls.at(-1)!).searchParams.get('where') ?? '';
  expect(where).toContain('bug');
  expect(where).toContain('priority: high');
  expect(where).toContain('2026-09-01T00:00:00.000Z');
  expect(where).toContain('2026-09-13T23:59:59.999Z');

  const filterTrigger = page.locator('[data-table-toolbar]').getByRole('button', { name: 'Filter', exact: true });
  await page.keyboard.press('Escape');
  await expect(filterTrigger).toBeFocused();
  await expect(filterTrigger).toHaveClass(/text-primary/);
  await filterTrigger.click();
  await expect(page.getByLabel('Updated from')).toHaveValue('2026-09-01');
  await expect(page.getByLabel('Updated to')).toHaveValue('2026-09-13');
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await expect(page.getByLabel('Updated from')).toHaveValue('');
  await expect(page.getByLabel('Updated to')).toHaveValue('');
  await expect
    .poll(
      /** Reads the latest encoded list constraints after Clear. */ () =>
        new URL(requestedUrls.at(-1)!).searchParams.get('where') ?? '',
    )
    .not.toContain('normalizedName');
  await page.keyboard.press('Escape');
  await page.getByRole('link', { name: 'Track provider issues' }).click();
  await expectFullPageShell(page);
  const issueDetailBreadcrumbs = page.locator('[data-page-toolbar]').first();
  await expect(issueDetailBreadcrumbs.getByRole('link', { name: 'Issues' })).toHaveAttribute('href', '/issues');
  await expect(issueDetailBreadcrumbs.getByText('#204', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Track provider issues' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Reproduction' })).toBeVisible();
  await expect(page.locator('script').filter({ hasText: 'window.__unsafe' })).toHaveCount(0);
  await expect(page.locator('a[href^="javascript:"]')).toHaveCount(0);
  expect(
    await page.evaluate(/** Reads or updates browser state for the work items scenario. */ () => '__unsafe' in window),
  ).toBe(false);
  await page.screenshot({ path: testInfo.outputPath('issue-detail.png'), fullPage: true });
});

test('renders GitLab pull requests as merge requests with independent workflow signals', /** Verifies renders GitLab pull requests as merge requests with independent workflow signals. */ async ({
  page,
}, testInfo) => {
  await mockShell(page);
  await page.route(
    '**/api/v1/pull-requests/filter-options',
    /** Supplies the mocked response for `/api/v1/pull-requests/filter-options`. */ (route) =>
      route.fulfill({ json: { assignees: ['alex'], authors: ['taylor'], labels: ['Bug'], milestones: [] } }),
  );
  await page.route(
    '**/api/v1/pull-requests/summary',
    /** Supplies the mocked response for `/api/v1/pull-requests/summary`. */ (route) =>
      route.fulfill({ json: { drafts: 1, failedWorkflows: 1, open: 1, workflowApprovalRequired: 1 } }),
  );
  await page.route(
    /\/api\/v1\/pull-requests(?:\?.*)?$/,
    /** Supplies the mocked response for the intercepted request. */ (route) =>
      route.fulfill({
        json: {
          items: [{ ...pullRequest, body: undefined }],
          meta: { hasNextPage: false, hasPrevPage: false, itemCount: 1, page: 1, pageCount: 1, perPage: 25 },
        },
      }),
  );
  await page.route(
    '**/api/v1/pull-requests/pull-request-1',
    /** Supplies the mocked response for `/api/v1/pull-requests/pull-request-1`. */ (route) =>
      route.fulfill({ json: pullRequest }),
  );

  await page.goto('/pull-requests');
  await expectFullPageShell(page);
  const pullRequestBreadcrumbs = page.locator('[data-page-toolbar]').first();
  await expect(pullRequestBreadcrumbs.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/');
  await expect(pullRequestBreadcrumbs.getByText('Pull requests', { exact: true })).toBeVisible();
  await expect(page.getByText('Failed', { exact: true })).toBeVisible();
  await expect(page.getByRole('table').getByText('Workflow approval required', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Track merge requests' }).click();
  await expectFullPageShell(page);
  const pullRequestDetailBreadcrumbs = page.locator('[data-page-toolbar]').first();
  await expect(pullRequestDetailBreadcrumbs.getByRole('link', { name: 'Pull requests' })).toHaveAttribute(
    'href',
    '/pull-requests',
  );
  await expect(pullRequestDetailBreadcrumbs.getByText('#213', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open merge request' })).toHaveAttribute('href', pullRequest.url);
  await expect(page.getByText('feature/work-items')).toBeVisible();
  await expect(page.getByText('main', { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('merge-request-detail.png'), fullPage: true });
});

for (const theme of ['light', 'dark'] as const) {
  test(`keeps work-item overview responsive in ${theme} mode`, /** Verifies keeps work-item overview responsive in [theme] mode. */ async ({
    page,
  }, testInfo) => {
    await page.addInitScript(
      /** Initializes browser-side authentication and preferences before page scripts run. */ (colorMode) =>
        window.localStorage.setItem('nuxt-color-mode', colorMode),
      theme,
    );
    await mockShell(page);
    await page.route(
      '**/api/v1/issues/filter-options',
      /** Supplies the mocked response for `/api/v1/issues/filter-options`. */ (route) =>
        route.fulfill({ json: { assignees: [], authors: [], labels: ['Bug'], milestones: [] } }),
    );
    await page.route(
      '**/api/v1/issues/summary',
      /** Supplies the mocked response for `/api/v1/issues/summary`. */ (route) =>
        route.fulfill({ json: { assigned: 1, open: 1, recentlyUpdated: 1, stale: 0 } }),
    );
    await page.route(
      /\/api\/v1\/issues(?:\?.*)?$/,
      /** Supplies the mocked response for the intercepted request. */ (route) =>
        route.fulfill({
          json: {
            items: [{ ...issue, body: undefined }],
            meta: { hasNextPage: false, hasPrevPage: false, itemCount: 1, page: 1, pageCount: 1, perPage: 25 },
          },
        }),
    );
    await page.setViewportSize({ height: 844, width: 390 });

    await page.goto('/issues');

    await expect(page.locator('html')).toHaveClass(new RegExp(theme));
    await expect(page.getByText('Track provider issues')).toBeVisible();
    await expect
      .poll(
        /** Evaluates `page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)` when expect .poll invokes this callback. */ () =>
          page.evaluate(
            /** Reads or updates browser state for the work items scenario. */ () =>
              document.documentElement.scrollWidth <= document.documentElement.clientWidth,
          ),
      )
      .toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`issues-${theme}-mobile.png`), fullPage: true });
  });
}
