import { expect, test, type WebSocketRoute } from '@playwright/test';
import { mockRefreshApplication } from './fixtures/auto-refresh';
import { mockRepositoryApplication } from './fixtures/repository-detail';

for (const interval of [0, 15000, 30000, 60000, 300000]) {
  test(`applies the selected ${interval} ms cadence to actual content reads`, /** Validate every navbar choice rather than only its stored value. */ async ({
    page,
  }) => {
    const { counts } = await mockRefreshApplication(page);
    await page.clock.install();
    await page.goto('/workflow-runs');
    const manual = page.locator('[data-manual-refresh]');
    await expect(manual).toBeEnabled();
    await page.clock.pauseAt(
      await page.evaluate(/** Freeze wall-clock drift before exact deadline assertions. */ () => Date.now() + 100),
    );
    await page.locator('[data-auto-refresh-control]').click();
    await page.locator('input[name="auto-refresh-interval"][value="0"]').check();
    await page.locator(`input[name="auto-refresh-interval"][value="${interval}"]`).check();
    await page.keyboard.press('Escape');
    const before = counts['workflow-runs'];
    await page.clock.runFor(interval === 0 ? 300000 : interval - 1);
    expect(counts['workflow-runs']).toBe(before);
    if (interval) {
      await page.clock.runFor(1);
      await expect
        .poll(/** Observe the selected deadline's real request. */ () => counts['workflow-runs'])
        .toBe(before + 1);
    }
    await expect(manual).toBeEnabled();
  });
}

test('pauses offline and hidden content, resumes once, and never polls unsupported routes', /** Exercise browser event listeners and actual offline state. */ async ({
  page,
  context,
}) => {
  const { counts } = await mockRefreshApplication(page);
  await page.clock.install();
  await page.goto('/issues');
  await expect(page.locator('[data-manual-refresh]')).toBeEnabled();
  await context.setOffline(true);
  await expect
    .poll(
      /** Check browser connectivity before advancing time. */ () =>
        page.evaluate(/** Read the native online flag. */ () => navigator.onLine),
    )
    .toBe(false);
  const before = counts.issues;
  await page.clock.runFor(300000);
  expect(counts.issues).toBe(before);
  await context.setOffline(false);
  await expect.poll(/** Resume performs one catch-up. */ () => counts.issues).toBe(before + 1);
  await expect(page.locator('[data-manual-refresh]')).toBeEnabled();
  await page.evaluate(
    /** Simulate a background tab through the platform visibility event boundary. */ () => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
      document.dispatchEvent(new Event('visibilitychange'));
    },
  );
  const hiddenBefore = counts.issues;
  await page.clock.runFor(300000);
  expect(counts.issues).toBe(hiddenBefore);
  await page.evaluate(
    /** Restore visibility without replaying missed intervals. */ () => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
      document.dispatchEvent(new Event('visibilitychange'));
    },
  );
  await expect.poll(/** Observe one visibility catch-up. */ () => counts.issues).toBe(hiddenBefore + 1);
  await expect(page.locator('[data-manual-refresh]')).toBeEnabled();
  await page.clock.runFor(15000);
  await expect
    .poll(/** Normal scheduling resumes after catch-up completion. */ () => counts.issues)
    .toBe(hiddenBefore + 2);
  await page.goto('/admin/users');
  await expect(page.getByRole('heading', { name: 'Users', exact: true })).toBeVisible();
  const unsupportedBefore = counts.issues;
  await page.clock.runFor(60000);
  expect(counts.issues).toBe(unsupportedBefore);
  await expect(page.locator('[data-auto-refresh-control]')).toBeVisible();
  await expect(page.locator('[data-manual-refresh]')).toHaveCount(0);
});

test('updates visible rows automatically without changing the active search or query', /** Verify user-visible content, not just timer/request counts. */ async ({
  page,
}) => {
  await mockRefreshApplication(page);
  let title = 'Build first version';
  const urls: string[] = [];
  await page.route(
    /\/api\/v1\/issues(?:\?.*)?$/,
    /** Return changing content for the same preserved query. */ async (route) => {
      urls.push(route.request().url());
      await route.fulfill({
        json: {
          items: [
            {
              id: 'issue-1',
              number: '42',
              title,
              body: '',
              state: 'OPEN',
              labels: [],
              milestone: null,
              author: 'tester',
              assignees: [],
              closedAt: null,
              providerType: 'GITHUB',
              providerCreatedAt: '2026-11-01T00:00:00Z',
              providerUpdatedAt: '2026-11-10T00:00:00Z',
              repositoryId: 'repository-1',
              repositoryOwner: 'team',
              repositoryName: 'repo',
              url: 'https://example.test/issues/42',
            },
          ],
          meta: { itemCount: 1, pageCount: 1, page: 1, perPage: 25 },
        },
      });
    },
  );
  await page.clock.install();
  await page.goto('/issues');
  await expect(page.getByText(title, { exact: true })).toBeVisible();
  const search = page.getByPlaceholder('Search number or title');
  await search.fill('Build');
  await page.clock.runFor(500);
  await expect(page.locator('[data-manual-refresh]')).toBeEnabled();
  const before = urls.at(-1);
  title = 'Build automatic update';
  await page.clock.runFor(15000);
  await expect(page.getByText(title, { exact: true })).toBeVisible();
  expect(urls.at(-1)).toBe(before);
  await expect(search).toHaveValue('Build');
});

test('refreshes only the active repository tab and preserves fixed repository scope', /** Shared feature targets must not retain hidden tabs. */ async ({
  page,
}) => {
  const { requests } = await mockRepositoryApplication(page);
  await page.clock.install();
  await page.goto('/repositories/repository-1/issues');
  await expect(page.locator('[data-manual-refresh]')).toBeEnabled();
  /** Select only issue-list reads, excluding summaries and filter options. */
  const issueReads = () =>
    requests.filter(/** Match the scoped list transport. */ (url) => /^\/api\/v1\/issues\?/.test(url));
  const before = issueReads().length;
  await page.clock.runFor(15000);
  await expect.poll(issueReads).toHaveLength(before + 1);
  expect(decodeURIComponent(issueReads().at(-1)!)).toContain('repository-1');
  await page.goto('/repositories/repository-1/workflow-runs');
  await expect(page.locator('[data-manual-refresh]')).toBeEnabled();
  const afterNavigation = issueReads().length;
  await page.clock.runFor(60000);
  expect(issueReads()).toHaveLength(afterNavigation);
  expect(
    requests.filter(
      /** Exclude all synchronization writes from the read request fixture. */ (url) => url.includes('/refresh'),
    ),
  ).toEqual([]);
});

test('preserves workflow sync-completion refresh while automatic refresh is Off', /** Test the existing status-socket invalidation through its real protocol boundary. */ async ({
  page,
}) => {
  const { counts, writes } = await mockRefreshApplication(page);
  await page.addInitScript(
    /** Disable only interval-driven work. */ () => localStorage.setItem('repovio:auto-refresh:interval-ms', '0'),
  );
  let socket: WebSocketRoute | undefined;
  let connected = false;
  await page.routeWebSocket(
    /\/socket\.io\//,
    /** Serve a synthetic Socket.IO status connection. */ (route) => {
      socket = route;
      route.send(
        `0${JSON.stringify({ maxPayload: 1000000, pingInterval: 25000, pingTimeout: 20000, sid: 'refresh-acceptance', upgrades: [] })}`,
      );
      route.onMessage(
        /** Complete namespace authentication without a live server. */ (message) => {
          if (message.toString().startsWith('40/status,')) {
            route.send('40/status,{"sid":"refresh-client"}');
            connected = true;
          }
        },
      );
    },
  );
  await page.clock.install();
  await page.goto('/workflow-runs');
  await expect(page.locator('[data-manual-refresh]')).toBeEnabled();
  await expect.poll(/** Wait for the actual namespace subscription. */ () => connected).toBe(true);
  const before = counts['workflow-runs'];
  socket!.send(
    `42/status,${JSON.stringify(['system-status', { activity: { kind: 'PROVIDER_SYNC', phase: 'FETCHING_WORKFLOWS', repositoriesCompleted: 0, repositoriesTotal: 1, workflowRunsCompleted: null, workflowRunsTotal: null }, runningWorkflowCount: 1, updatedAt: '2026-11-10T10:00:00Z' }])}`,
  );
  await expect(page.getByText('Fetching workflows from provider', { exact: true })).toBeVisible();
  socket!.send(
    `42/status,${JSON.stringify(['system-status', { activity: null, runningWorkflowCount: 1, updatedAt: '2026-11-10T10:00:01Z' }])}`,
  );
  await expect(page.getByText('API idle', { exact: true })).toBeVisible();
  await page.clock.runFor(500);
  await expect
    .poll(/** One completed sync invalidates the visible table even when Off. */ () => counts['workflow-runs'])
    .toBe(before + 1);
  expect(writes).toEqual([]);
});
