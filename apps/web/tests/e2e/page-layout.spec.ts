import { resolve } from 'node:path';

import { expect, test, type Locator, type Page } from '@playwright/test';
import { testRepository } from './fixtures/repository-detail';

const emptyPage = {
  items: [],
  meta: { hasNextPage: false, hasPrevPage: false, itemCount: 0, page: 1, pageCount: 0, perPage: 25 },
};

/** Mock authenticated application resources used across the page-shell scenarios. */
async function mockApplication(page: Page): Promise<void> {
  await page.addInitScript(
    /** Initializes browser-side authentication and preferences before page scripts run. */ () =>
      window.localStorage.setItem('repovio.access-token', 'playwright-access-token'),
  );
  await page.route(
    '**/api/v1/auth/me',
    /** Supplies the mocked response for `/api/v1/auth/me`. */ (route) =>
      route.fulfill({
        json: {
          avatarUpdatedAt: null,
          firstName: 'Vera',
          id: 'administrator-id',
          lastName: 'Admin',
          role: 'SYSTEM_ADMIN',
          username: 'vera',
        },
      }),
  );
  await page.route(
    /\/api\/v1\/settings$/,
    /** Supplies the mocked response for the intercepted request. */ (route) =>
      route.fulfill({ json: { dateTimeFormat: 'LOCALE_MEDIUM', workflowRunRetentionDays: 90 } }),
  );
  await page.route(
    '**/api/v1/health',
    /** Supplies the mocked response for `/api/v1/health`. */ (route) =>
      route.fulfill({ json: { api: 'ok', database: 'ok', providers: [], status: 'ok' } }),
  );
  await page.route(
    '**/api/v1/version/latest',
    /** Supplies the mocked response for `/api/v1/version/latest`. */ (route) =>
      route.fulfill({ json: { latest: '999.0.0' } }),
  );
  await page.route(
    '**/api/v1/dashboard/failures',
    /** Supplies the mocked response for `/api/v1/dashboard/failures`. */ (route) => route.fulfill({ json: [] }),
  );
  await page.route(
    '**/api/v1/dashboard/latest-runs',
    /** Supplies the mocked response for `/api/v1/dashboard/latest-runs`. */ (route) => route.fulfill({ json: [] }),
  );
  await page.route(
    '**/api/v1/dashboard/awaiting-approval',
    /** Supplies the mocked response for `/api/v1/dashboard/awaiting-approval`. */ (route) =>
      route.fulfill({ json: [] }),
  );
  await page.route(
    '**/api/v1/dashboard/repositories**',
    /** Supplies the mocked response for `/api/v1/dashboard/repositories**`. */ (route) => route.fulfill({ json: [] }),
  );
  await page.route(
    '**/api/v1/dashboard/trend**',
    /** Supplies the mocked response for `/api/v1/dashboard/trend**`. */ (route) => route.fulfill({ json: [] }),
  );
  await page.route(
    '**/api/v1/dashboard/summary**',
    /** Supplies the mocked response for `/api/v1/dashboard/summary**`. */ (route) =>
      route.fulfill({
        json: {
          awaitingApprovalCount: 0,
          completedCount: 0,
          medianDurationMs: null,
          queuedCount: 0,
          runningCount: 0,
          statuses: { cancelled: 0, failed: 0, skipped: 0, success: 0, unknown: 0 },
          successRate: 0,
          totalRunDurationMs: 0,
        },
      }),
  );
  await page.route(
    /\/api\/v1\/(?:provider-accounts|repositories|users|workflow-runs)(?:\?.*)?$/,
    /** Supplies the mocked response for the intercepted request. */ (route) => route.fulfill({ json: emptyPage }),
  );
  await page.route(
    /\/api\/v1\/workflow-runs\/needs-attention(?:\?.*)?$/,
    /** Supplies the mocked response for the intercepted request. */ (route) => route.fulfill({ json: emptyPage }),
  );
  await page.route(
    '**/api/v1/repositories/repository-1',
    /** Supplies the mocked response for `/api/v1/repositories/repository-1`. */ (route) =>
      route.fulfill({
        json: {
          ...testRepository(),
          enabled: true,
          id: 'repository-1',
          lastSyncAt: null,
          name: 'repovio',
          owner: 'tobiaswaelde',
          providerAccountId: 'provider-1',
          url: 'https://github.com/repovio/repovio',
          workflowRunRetentionDays: 90,
        },
      }),
  );
  await page.route(
    '**/api/v1/repositories/repository-1/workflow-filters',
    /** Supplies the mocked response for `/api/v1/repositories/repository-1/workflow-filters`. */ (route) =>
      route.fulfill({ json: [] }),
  );
  await page.route(
    '**/api/v1/repositories/repository-1/memberships',
    /** Supplies the mocked response for `/api/v1/repositories/repository-1/memberships`. */ (route) =>
      route.fulfill({ json: [] }),
  );
  await page.route(
    '**/api/v1/notification-channels',
    /** Supplies the mocked response for `/api/v1/notification-channels`. */ (route) => route.fulfill({ json: [] }),
  );
  await page.route(
    '**/api/v1/notification-channels/query**',
    /** Supplies the mocked response for `/api/v1/notification-channels/query**`. */ (route) =>
      route.fulfill({ json: emptyPage }),
  );
  await page.route(
    '**/api/v1/notification-channels/manageable-repositories',
    /** Supplies the mocked response for `/api/v1/notification-channels/manageable-repositories`. */ (route) =>
      route.fulfill({ json: [] }),
  );
  await page.route(
    '**/api/v1/notification-deliveries',
    /** Supplies the mocked response for `/api/v1/notification-deliveries`. */ (route) => route.fulfill({ json: [] }),
  );
  await page.route(
    '**/api/v1/notification-deliveries/query**',
    /** Supplies the mocked response for `/api/v1/notification-deliveries/query**`. */ (route) =>
      route.fulfill({ json: emptyPage }),
  );
  await page.route(
    '**/api/v1/browser-push',
    /** Supplies the mocked response for `/api/v1/browser-push`. */ (route) =>
      route.fulfill({ json: { available: false, publicKey: null, subscriptionCount: 0 } }),
  );
}

/** Measure foreground contrast against the first opaque ancestor background. */
async function contrastRatio(locator: Locator): Promise<number> {
  return locator.evaluate(
    /** Reads or updates browser state for the contrast ratio scenario. */ (element) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) throw new Error('Canvas color parsing is unavailable.');
      /** Converts a CSS color representation into numeric RGBA channels. */
      const rgba = (value: string): [number, number, number, number] => {
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = value;
        context.fillRect(0, 0, 1, 1);
        const [red = 0, green = 0, blue = 0, alpha = 0] = context.getImageData(0, 0, 1, 1).data;
        return [red, green, blue, alpha / 255];
      };
      const foreground = rgba(getComputedStyle(element).color);
      let background: [number, number, number, number] = [255, 255, 255, 1];
      for (let current: Element | null = element; current; current = current.parentElement) {
        const candidate = rgba(getComputedStyle(current).backgroundColor);
        if (candidate[3] === 1) {
          background = candidate;
          break;
        }
      }
      /** Computes relative luminance for the contrast assertion. */
      const luminance = ([red, green, blue]: [number, number, number, number]): number => {
        /** Creates a notification-channel fixture with the requested overrides. */
        const channel = (value: number): number => {
          const normalized = value / 255;
          return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
        };
        return 0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue);
      };
      const foregroundLuminance = luminance(foreground);
      const backgroundLuminance = luminance(background);
      return (
        (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
        (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
      );
    },
  );
}

test('uses the shared page shell without introductory banners', /** Verifies uses the shared page shell without introductory banners. */ async ({
  page,
}) => {
  await mockApplication(page);
  await page.goto('/');
  await expect(page.locator('[data-page-shell]')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Vera Admin', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Vera Admin (@vera)', exact: true })).toHaveCount(0);
  await expect(page.locator('[data-page-toolbar]')).toHaveCount(1);
  await expect(page.locator('[data-page-introduction]')).toHaveCount(0);
  await expect(page.locator('[data-intro-banner-id]')).toHaveCount(0);
  await expect(page.locator('[data-sidebar-footer]')).toBeVisible();
  const sidebarLogo = page.getByRole('link', { name: 'Repovio', exact: true });
  await expect(sidebarLogo.locator('img[src="/logo-wordmark-light.svg"]')).toHaveCount(1);
  await expect(sidebarLogo.locator('img[src="/logo-wordmark-dark.svg"]')).toHaveCount(1);
  await expect(sidebarLogo.locator('img:visible')).toHaveAttribute('src', /\/logo-wordmark-(light|dark)\.svg/);
  await expect(page.locator('link[rel="icon"][href="/favicon.svg"]')).toHaveAttribute('href', '/favicon.svg');
  await expect(page.getByRole('link', { name: 'GitHub' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Documentation' })).toBeVisible();
  await expect(page.locator('[data-update-indicator]')).toBeVisible();
  await expect(page.getByText('Update available', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Open changelog: Update available' })).toBeVisible();
  const workflowRunNavigation = page
    .getByRole('navigation', { name: 'Primary navigation' })
    .getByRole('region', { name: 'Workflow runs' });
  await expect(workflowRunNavigation.locator('[data-slot="linkTrailingBadge"]')).toHaveCount(0);
  await expect(page.getByLabel('Collapse sidebar')).toBeVisible();
  await page.screenshot({
    path: resolve(process.cwd(), 'test-results/captures/dashboard.png'),
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Open changelog' }).click();
  await expect(page.getByRole('dialog', { name: 'Changelog' })).toBeVisible();

  for (const [path, name] of [
    ['/workflow-runs', 'workflow-runs'],
    ['/repositories', 'repositories'],
    ['/notifications', 'notifications'],
    ['/admin/providers', 'provider-accounts'],
    ['/admin/settings', 'settings'],
  ]) {
    await page.goto(path);
    await expect(page.locator('[data-page-shell]')).toBeVisible();
    await page.screenshot({
      path: resolve(process.cwd(), `test-results/captures/${name}.png`),
      fullPage: true,
    });
  }
});

test('keeps table navigation accessible at desktop and narrow widths', /** Verifies keeps table navigation accessible at desktop and narrow widths. */ async ({
  page,
}, testInfo) => {
  await mockApplication(page);
  await page.goto('/workflow-runs');
  await expect(page.getByText('No workflow runs are available.')).toBeVisible();

  await page.keyboard.press('Tab');
  const skipLink = page.getByRole('link', { name: 'Skip to main content' });
  await expect(skipLink).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();

  const unnamedButtons = await page.locator('[data-page-shell] button:visible').evaluateAll(
    /** Reads the rendered element state used by this browser assertion. */ (buttons) =>
      buttons
        .filter(
          /** Keeps entries matching the unnamedButtons predicate. */ (button) => {
            const labelledBy = button.getAttribute('aria-labelledby');
            return !(
              button.textContent?.trim() ||
              button.getAttribute('aria-label')?.trim() ||
              button.getAttribute('title')?.trim() ||
              (labelledBy && document.getElementById(labelledBy)?.textContent?.trim())
            );
          },
        )
        .map(/** Projects each entry using `button.outerHTML`. */ (button) => button.outerHTML),
  );
  expect(unnamedButtons).toEqual([]);
  expect(await contrastRatio(page.getByText('No workflow runs are available.'))).toBeGreaterThanOrEqual(4.5);

  const table = page.getByRole('table');
  const tableScroller = table.locator('..');
  await expect
    .poll(
      /** Evaluates `table.evaluate((element) => element.clientWidth >= (element.parentElement?.clientWidth ?? 0))` when expect .poll invokes this callback. */ () =>
        table.evaluate(
          /** Reads or updates browser state for the page layout scenario. */ (element) =>
            element.clientWidth >= (element.parentElement?.clientWidth ?? 0),
        ),
    )
    .toBe(true);
  await page.screenshot({
    animations: 'disabled',
    path: testInfo.outputPath('workflow-runs-desktop.png'),
    fullPage: true,
  });

  await page.setViewportSize({ height: 844, width: 390 });
  await expect
    .poll(
      /** Evaluates `page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)` when expect .poll invokes this callback. */ () =>
        page.evaluate(
          /** Reads or updates browser state for the page layout scenario. */ () =>
            document.documentElement.scrollWidth <= document.documentElement.clientWidth,
        ),
    )
    .toBe(true);
  await expect
    .poll(
      /** Evaluates `tableScroller.evaluate((element) => element.scrollWidth > element.clientWidth)` when expect.poll invokes this callback. */ () =>
        tableScroller.evaluate(
          /** Reads or updates browser state for the page layout scenario. */ (element) =>
            element.scrollWidth > element.clientWidth,
        ),
    )
    .toBe(true);
  const titleHeader = await page.getByRole('columnheader', { name: 'Title' }).boundingBox();
  const workflowHeader = await page.getByRole('columnheader', { name: 'Workflow' }).boundingBox();
  expect(titleHeader).not.toBeNull();
  expect(workflowHeader).not.toBeNull();
  expect(titleHeader!.x + titleHeader!.width).toBeLessThanOrEqual(workflowHeader!.x);
  await page.screenshot({
    animations: 'disabled',
    path: testInfo.outputPath('workflow-runs-narrow.png'),
    fullPage: true,
  });
});

test('refreshes and hides attention badges after navigation', /** Verifies refreshes and hides attention badges after navigation. */ async ({
  page,
}) => {
  await mockApplication(page);
  let awaitingApprovalCount = 2;
  let needsAttentionCount = 3;
  await page.route(
    '**/api/v1/dashboard/awaiting-approval',
    /** Supplies the mocked response for `/api/v1/dashboard/awaiting-approval`. */ (route) =>
      route.fulfill({
        json: Array.from(
          { length: awaitingApprovalCount },
          /** Evaluates `({ id: `run-${index}` })` when Array.from invokes this callback. */ (_, index) => ({
            id: `run-${index}`,
          }),
        ),
      }),
  );
  await page.route(
    /\/api\/v1\/workflow-runs\/needs-attention(?:\?.*)?$/,
    /** Supplies the mocked response for the intercepted request. */ (route) =>
      route.fulfill({
        json: {
          ...emptyPage,
          meta: { ...emptyPage.meta, itemCount: needsAttentionCount },
        },
      }),
  );

  await page.goto('/');
  const navigation = page.getByRole('navigation', { name: 'Primary navigation' });
  const workflowRuns = navigation.getByRole('region', { name: 'Workflow runs' });
  await expect(workflowRuns.getByRole('link', { name: 'Awaiting approval' })).toContainText('2');
  await expect(workflowRuns.getByRole('link', { name: 'Needs attention' })).toContainText('3');

  awaitingApprovalCount = 0;
  needsAttentionCount = 0;
  await navigation.getByRole('link', { name: 'Notifications', exact: true }).click();
  await expect(page).toHaveURL(/\/notifications$/);
  await expect(workflowRuns.locator('[data-slot="linkTrailingBadge"]')).toHaveCount(0);
});

test('queues workflow retrieval from the repository detail page', /** Verifies queues workflow retrieval from the repository detail page. */ async ({
  page,
}) => {
  await mockApplication(page);
  let syncRequested = false;
  await page.route(
    '**/api/v1/repositories/repository-1/sync',
    /** Supplies the mocked response for `/api/v1/repositories/repository-1/sync`. */ async (route) => {
      syncRequested = true;
      await route.fulfill({ status: 202 });
    },
  );

  await page.goto('/repositories/repository-1');

  const syncButton = page.getByRole('button', { name: 'Fetch workflow runs' });
  await expect(syncButton).toBeVisible();
  await syncButton.click();
  await expect
    .poll(/** Evaluates `syncRequested` when expect.poll invokes this callback. */ () => syncRequested)
    .toBe(true);
  await expect(page.getByText('Workflow runs were queued for retrieval.', { exact: true })).toBeVisible();
});

/** Supply deterministic resources for the toolbar layout matrix. */
async function mockToolbarPages(page: Page): Promise<void> {
  await mockApplication(page);
  await page.route(
    /\/api\/v1\/(?:issues|pull-requests|security-alerts|user-groups)(?:\?.*)?$/,
    /** Supplies the mocked response for the intercepted request. */ (route) => route.fulfill({ json: emptyPage }),
  );
  await page.route(
    /\/api\/v1\/(?:issues|pull-requests)\/filter-options$/,
    /** Supplies the mocked response for the intercepted request. */ (route) =>
      route.fulfill({ json: { assignees: [], authors: [], labels: ['Bug'], milestones: [] } }),
  );
  await page.route(
    /\/api\/v1\/(?:issues|pull-requests)\/summary$/,
    /** Supplies the mocked response for the intercepted request. */ (route) =>
      route.fulfill({
        json: {
          assigned: 0,
          drafts: 0,
          failedWorkflows: 0,
          open: 0,
          recentlyUpdated: 0,
          stale: 0,
          workflowApprovalRequired: 0,
        },
      }),
  );
  await page.route(
    '**/api/v1/security-alerts/filter-options',
    /** Supplies the mocked response for `/api/v1/security-alerts/filter-options`. */ (route) =>
      route.fulfill({
        json: {
          availability: [],
          ecosystems: [],
          manifests: [],
          packages: [],
          paths: ['src/example.ts'],
          repositories: [],
          rules: [],
          scanners: [],
          secretProviders: [],
          secretTypes: [],
          tools: [],
        },
      }),
  );
  await page.route(
    '**/api/v1/security-alerts/summary',
    /** Supplies the mocked response for `/api/v1/security-alerts/summary`. */ (route) =>
      route.fulfill({
        json: {
          open: { CODE: 0, DEPENDENCY: 0, SECRET: 0 },
          severity: { CRITICAL: 0, HIGH: 0, INFO: 0, LOW: 0, MEDIUM: 0, UNKNOWN: 0 },
          unavailableRepositories: 0,
        },
      }),
  );
}

/** Assert each control fits its toolbar, rather than only checking the container. */
async function expectToolbarControls(page: Page, width: number): Promise<void> {
  const toolbars = page.locator('[data-page-toolbar], [data-table-toolbar], [data-page-navigation]');
  for (const toolbar of await toolbars.all()) {
    await expect(toolbar).toBeVisible();
    await expect
      .poll(
        /** Evaluates `toolbar.evaluate((element) => element.scrollWidth <= element.clientWidth)` when expect.poll invokes this callback. */ () =>
          toolbar.evaluate(
            /** Reads or updates browser state for the expect toolbar controls scenario. */ (element) =>
              element.scrollWidth <= element.clientWidth,
          ),
      )
      .toBe(true);
    const bounds = await toolbar.boundingBox();
    expect(bounds).not.toBeNull();
    for (const control of await toolbar.locator('button:visible, input:visible, a:visible').all()) {
      const box = await control.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(bounds!.x - 1);
      expect(box!.x + box!.width).toBeLessThanOrEqual(bounds!.x + bounds!.width + 1);
      expect(box!.y + box!.height).toBeLessThanOrEqual(bounds!.y + bounds!.height + 1);
      if (width < 640) {
        expect(box!.width).toBeGreaterThanOrEqual(44);
        expect(box!.height).toBeGreaterThanOrEqual(44);
      }
    }
  }
  await expect
    .poll(
      /** Evaluates `page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)` when expect .poll invokes this callback. */ () =>
        page.evaluate(
          /** Reads or updates browser state for the expect toolbar controls scenario. */ () =>
            document.documentElement.scrollWidth <= document.documentElement.clientWidth,
        ),
    )
    .toBe(true);
}

for (const locale of ['en', 'de']) {
  for (const width of [320, 390, 768, 1440]) {
    test(`wraps toolbar controls at ${width}px in ${locale}`, /** Verifies wraps toolbar controls at [width]px in [locale]. */ async ({
      page,
      context,
    }, testInfo) => {
      test.setTimeout(120_000);
      await context.addCookies([{ name: 'repovio-locale', value: locale, url: testInfo.project.use.baseURL! }]);
      await page.setViewportSize({ height: 900, width });
      await mockToolbarPages(page);
      for (const path of [
        '/',
        '/issues',
        '/pull-requests',
        '/alerts/code',
        '/alerts/dependencies',
        '/alerts/secrets',
        '/workflow-runs/needs-attention',
        '/repositories',
        '/admin/users',
        '/admin/providers',
        '/notifications',
        '/notifications/history',
        '/admin/settings',
      ]) {
        await page.goto(path);
        await expect(page.locator('[data-page-toolbar]')).toBeVisible({ timeout: 15_000 });
        await expectToolbarControls(page, width);
        if (path === '/issues') {
          const actions = page.locator('[data-page-toolbar] [data-slot="right"]');
          const search = actions.locator('input').first();
          if (width < 640) {
            expect((await search.boundingBox())!.width).toBeGreaterThanOrEqual(
              (await actions.boundingBox())!.width - 2,
            );
          }
          for (const theme of ['light', 'dark']) {
            await page.evaluate(
              /** Reads or updates browser state for the page layout scenario. */ (theme) =>
                window.localStorage.setItem('nuxt-color-mode', theme),
              theme,
            );
            await page.reload();
            await expect(page.locator('html')).toHaveClass(new RegExp(theme));
            await expect(
              actions.getByRole('button', { name: locale === 'de' ? 'Aktualisieren' : 'Refresh', exact: true }),
            ).toBeVisible();
            await expect(actions.locator('input').first()).toBeVisible();
            await page.screenshot({ path: testInfo.outputPath(`issues-${theme}.png`), fullPage: true });
          }
        }
      }
    });
  }
}

test('operates wrapped filters and preserves refresh loading until every request completes', /** Verifies operates wrapped filters and preserves refresh loading until every request completes. */ async ({
  page,
}) => {
  await page.setViewportSize({ height: 900, width: 320 });
  await mockToolbarPages(page);
  const requestedUrls: string[] = [];
  let releaseSummary: (() => void) | undefined;
  let holdSummary = false;
  await page.route(
    '**/api/v1/issues/summary',
    /** Supplies the mocked response for `/api/v1/issues/summary`. */ async (route) => {
      if (holdSummary)
        await new Promise<void>(
          /** Retains the request resolver until the layout scenario releases its response. */ (resolve) => {
            releaseSummary = resolve;
          },
        );
      await route.fulfill({ json: { assigned: 0, open: 0, recentlyUpdated: 0, stale: 0 } });
    },
  );
  await page.route(
    /\/api\/v1\/issues(?:\?.*)?$/,
    /** Supplies the mocked response for the intercepted request. */ (route) => {
      requestedUrls.push(route.request().url());
      return route.fulfill({ json: emptyPage });
    },
  );
  await page.goto('/issues');
  const toolbar = page.locator('[data-page-toolbar]');
  const refresh = toolbar.getByRole('button', { name: 'Refresh', exact: true });
  await expect(refresh).toBeEnabled();
  await toolbar.getByRole('textbox', { name: 'Search work items' }).fill('mobile');
  await toolbar.getByRole('button', { name: 'Filter', exact: true }).click();
  await page.getByRole('button', { name: 'Labels', exact: true }).click();
  await page.getByRole('option', { name: 'Bug', exact: true }).click();
  await page.keyboard.press('Escape');
  await page.getByLabel('Updated from', { exact: true }).fill('2026-09-01');
  await page.getByLabel('Updated to', { exact: true }).fill('2026-09-13');
  await expect
    .poll(
      /** Evaluates `requestedUrls.at(-1) ?? ''` when expect.poll invokes this callback. */ () =>
        requestedUrls.at(-1) ?? '',
    )
    .toContain('mobile');
  await expect
    .poll(
      /** Evaluates `decodeURIComponent(requestedUrls.at(-1) ?? '')` when expect.poll invokes this callback. */ () =>
        decodeURIComponent(requestedUrls.at(-1) ?? ''),
    )
    .toContain('2026-09-13T23:59:59.999Z');
  expect(decodeURIComponent(requestedUrls.at(-1)!)).toContain('bug');

  await page.getByRole('button', { name: 'Toggle filter mode', exact: true }).focus();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Filter', exact: true })).toBeHidden();
  await expect(toolbar.getByRole('button', { name: 'Filter', exact: true })).toBeFocused();
  for (const name of ['Sort', 'Filter', 'Table options']) {
    const trigger = toolbar.getByRole('button', { name, exact: true });
    await trigger.focus();
    await expect(trigger).toBeFocused();
    await page.keyboard.press('Enter');
    const popover = page.getByRole('dialog', { name, exact: true });
    await expect(popover).toBeVisible();
    if (name === 'Filter') {
      await popover.getByRole('combobox', { name: 'Select field' }).click();
      await page.getByRole('option', { name: 'State', exact: true }).click();
      await popover.getByRole('button', { name: 'Add filter', exact: true }).click();
      await expect(popover.getByRole('button', { name: 'Remove filter' })).toBeVisible();
    }
    await expect
      .poll(
        /** Reads the observable state until the browser assertion settles. */ () =>
          popover.evaluate(
            /** Reads or updates browser state for the page layout scenario. */ (element) => {
              const box = element.getBoundingClientRect();
              return box.left >= 0 && box.right <= window.innerWidth && element.scrollWidth <= element.clientWidth;
            },
          ),
      )
      .toBe(true);
    await page.keyboard.press('Escape');
    await expect(popover).toBeHidden();
    await expect(trigger).toBeFocused();
  }
  await toolbar.getByRole('button', { name: 'Filter', exact: true }).click();
  const combinedFilters = page.getByRole('dialog', { name: 'Filter', exact: true });
  await combinedFilters.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await expect(combinedFilters.getByRole('button', { name: 'Remove filter' })).toHaveCount(0);
  await expect(combinedFilters.getByLabel('Updated from', { exact: true })).toHaveValue('');
  await expect(combinedFilters.getByLabel('Updated to', { exact: true })).toHaveValue('');
  await expect(toolbar.getByRole('textbox', { name: 'Search work items' })).toHaveValue('mobile');
  await combinedFilters.getByRole('button', { name: 'Toggle filter mode', exact: true }).focus();
  await page.keyboard.press('Escape');
  await expect(combinedFilters).toBeHidden();
  await expect(toolbar.getByRole('button', { name: 'Filter', exact: true })).toBeFocused();
  holdSummary = true;
  await refresh.click();
  await expect
    .poll(
      /** Evaluates `Boolean(releaseSummary)` when expect.poll invokes this callback. */ () => Boolean(releaseSummary),
    )
    .toBe(true);
  await expect(refresh).toBeDisabled();
  releaseSummary!();
  await expect(refresh).toBeEnabled();
});

for (const width of [320, 1440]) {
  test(`restores Query Kit shortcut focus without stealing nested or outside focus at ${width}px`, /** Verifies restores Query Kit shortcut focus without stealing nested or outside focus at [width]px. */ async ({
    page,
  }) => {
    await mockApplication(page);
    await page.setViewportSize({ height: 900, width });
    await page.goto('/workflow-runs/needs-attention');
    const toolbar = page.locator('[data-page-toolbar]');
    const refresh = toolbar.getByRole('button', { name: 'Refresh', exact: true });
    await expect(refresh).toBeEnabled();
    const outside = toolbar.getByRole('textbox', { name: 'Search workflow runs', exact: true });
    for (const [name, shortcut] of [
      ['Sort', 'Shift+S'],
      ['Filter', 'Shift+F'],
      ['Table options', 'Shift+O'],
    ]) {
      const trigger = toolbar.getByRole('button', { name, exact: true });
      await trigger.focus();
      await page.keyboard.press(shortcut!);
      const popover = page.getByRole('dialog', { name, exact: true });
      await expect(popover).toBeVisible();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await page.keyboard.press('Escape');
      await expect(popover).toBeHidden();
      await expect(trigger).toBeFocused();
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await trigger.click();
      await expect(popover).toBeVisible();
      await outside.click();
      await expect(popover).toBeHidden();
      await expect(outside).toBeFocused();
    }

    const filter = toolbar.getByRole('button', { name: 'Filter', exact: true });
    await filter.click();
    const popover = page.getByRole('dialog', { name: 'Filter', exact: true });
    const field = popover.getByRole('combobox', { name: 'Select field', exact: true });
    await field.click();
    await expect(page.getByRole('listbox')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('listbox')).toBeHidden();
    await expect(popover).toBeVisible();
    await expect(field).toBeFocused();
    await outside.click();
    await expect(popover).toBeHidden();
    await expect(outside).toBeFocused();
  });
}

for (const locale of ['en', 'de']) {
  for (const theme of ['light', 'dark']) {
    test(`sidebar menu icon stays bundled and usable in ${locale} ${theme}`, /** Verify the responsive menu asset and preserve sidebar interactions across breakpoints. */ async ({
      page,
      baseURL,
    }, testInfo) => {
      await mockApplication(page);
      await page.context().addCookies([{ name: 'repovio-locale', value: locale, url: baseURL! }]);
      await page.addInitScript(
        /** Apply the requested theme before the application initializes. */ (value) =>
          localStorage.setItem('nuxt-color-mode', value),
        theme,
      );
      const externalIconRequests: string[] = [];
      await page.route(
        /https?:\/\/(?:api\.iconify\.design|api\.simplesvg\.com|api\.unisvg\.com|cdn\.jsdelivr\.net|unpkg\.com)\/.*/,
        /** Block external icon services so the assertion requires the bundled asset. */ async (route) => {
          externalIconRequests.push(route.request().url());
          await route.abort();
        },
      );
      const openLabel = locale === 'de' ? 'Seitenleiste öffnen' : 'Open sidebar';
      const collapseLabel = locale === 'de' ? 'Seitenleiste einklappen' : 'Collapse sidebar';
      const expandLabel = locale === 'de' ? 'Seitenleiste ausklappen' : 'Expand sidebar';
      for (const viewport of [
        { width: 982, height: 1134 },
        { width: 390, height: 844 },
      ]) {
        await page.setViewportSize(viewport);
        await page.goto('/');
        await expect(page.locator('html')).toHaveClass(new RegExp(theme));
        const open = page.getByRole('button', { name: openLabel, exact: true });
        const icon = open.locator('[class~="i-tabler:menu-2"]');
        await expect(icon).toBeVisible();
        await expect
          .poll(
            /** Inspect actual local SVG data rather than trusting an icon class name. */ () =>
              icon.evaluate(
                /** Read the bundled icon's computed mask data. */ (element) =>
                  getComputedStyle(element).getPropertyValue('--svg'),
              ),
          )
          .toContain('data:image/svg+xml');
        await page.screenshot({ path: testInfo.outputPath(`sidebar-${viewport.width}.png`) });
        await open.click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(page.getByRole('dialog')).toBeHidden();
        await expect(open).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(page.getByRole('dialog')).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(page.getByRole('dialog')).toBeHidden();
        await expect(icon).toBeVisible();
        await expect(page).toHaveURL(`${baseURL}/`);
      }
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.getByRole('button', { name: collapseLabel, exact: true }).click();
      await expect(page.getByRole('button', { name: expandLabel, exact: true })).toBeVisible();
      await page.reload();
      await expect(page.getByRole('button', { name: expandLabel, exact: true })).toBeVisible();
      await page.getByRole('button', { name: expandLabel, exact: true }).click();
      await expect(page.getByRole('button', { name: collapseLabel, exact: true })).toBeVisible();
      expect(externalIconRequests).toEqual([]);
    });
  }
}

for (const locale of ['en', 'de'] as const) {
  test(`opens notification channels directly across navigation surfaces (${locale})`, /** Verifies one localized destination in desktop, search, collapsed, and mobile navigation. */ async ({
    page,
    baseURL,
  }, testInfo) => {
    await mockApplication(page);
    await page.context().addCookies([{ name: 'repovio-locale', value: locale, url: baseURL! }]);
    const labels =
      locale === 'de'
        ? {
            navigation: 'Hauptnavigation',
            notifications: 'Benachrichtigungen',
            channels: 'Kanäle',
            history: 'Zustellverlauf',
            collapse: 'Seitenleiste einklappen',
            openSidebar: 'Seitenleiste öffnen',
            expand: 'Seitenleiste ausklappen',
            search: 'Suche',
            query: 'Suchen oder Befehl eingeben',
          }
        : {
            navigation: 'Primary navigation',
            notifications: 'Notifications',
            channels: 'Channels',
            history: 'Delivery history',
            collapse: 'Collapse sidebar',
            openSidebar: 'Open sidebar',
            expand: 'Expand sidebar',
            search: 'Search',
            query: 'Search or type a command',
          };
    await page.goto('/');
    const navigation = page.getByRole('navigation', { name: labels.navigation });
    const notifications = navigation.getByRole('link', { name: labels.notifications, exact: true });
    await expect(notifications).toHaveCount(1);
    await expect(notifications).toHaveAttribute('href', '/notifications');
    await expect(notifications).not.toHaveAttribute('aria-expanded');
    await expect(navigation.getByRole('button', { name: labels.notifications, exact: true })).toHaveCount(0);
    await expect(navigation.getByRole('link', { name: labels.channels, exact: true })).toHaveCount(0);
    await expect(navigation.getByRole('link', { name: labels.history, exact: true })).toHaveCount(0);
    await notifications.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/notifications$/);
    await expect(notifications).toHaveAttribute('aria-current', 'page');
    await page.screenshot({
      path: testInfo.outputPath(`notifications-expanded-${locale}.png`),
      animations: 'disabled',
    });

    await page.locator('#global-search-trigger').click();
    const palette = page.getByRole('dialog', { name: labels.search, exact: true });
    await expect(palette.getByRole('option', { name: labels.notifications, exact: true })).toHaveCount(1);
    await expect(palette.getByRole('option', { name: labels.channels, exact: true })).toHaveCount(0);
    await expect(palette.getByRole('option', { name: labels.history, exact: true })).toHaveCount(0);
    await palette.getByPlaceholder(labels.query).fill(labels.notifications);
    await expect(palette.getByRole('option', { name: labels.notifications, exact: true })).toBeVisible();
    await palette.getByRole('option', { name: labels.notifications, exact: true }).click();
    await expect(palette).not.toBeVisible();
    await expect(page).toHaveURL(/\/notifications$/);

    await page.getByRole('button', { name: labels.collapse, exact: true }).click();
    await expect(page.getByRole('complementary')).toHaveAttribute('data-collapsed', 'true');
    await expect(notifications).toBeVisible();
    await notifications.click();
    await expect(page).toHaveURL(/\/notifications$/);
    await page.screenshot({
      path: testInfo.outputPath(`notifications-collapsed-${locale}.png`),
      animations: 'disabled',
    });
    await page.getByRole('button', { name: labels.expand, exact: true }).click();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.getByRole('button', { name: labels.openSidebar, exact: true }).click();
    const mobile = page.getByRole('dialog').getByRole('navigation', { name: labels.navigation });
    const mobileNotifications = mobile.getByRole('link', { name: labels.notifications, exact: true });
    await expect(mobileNotifications).toHaveCount(1);
    await expect(mobile.getByRole('link', { name: labels.channels, exact: true })).toHaveCount(0);
    await expect(mobile.getByRole('link', { name: labels.history, exact: true })).toHaveCount(0);
    await page.screenshot({
      path: testInfo.outputPath(`notifications-mobile-menu-${locale}.png`),
      animations: 'disabled',
    });
    await mobileNotifications.click();
    await expect(page).toHaveURL(/\/notifications$/);
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`notifications-mobile-${locale}.png`), animations: 'disabled' });
  });
}

for (const locale of ['en', 'de']) {
  for (const width of [390, 1065, 1440]) {
    test(`matches the six marked toolbars at ${width}px in ${locale}`, /** Proves compact headers, visible controls, themes, popover bounds, and keyboard access across the requested viewports. */ async ({
      page,
      context,
    }, testInfo) => {
      test.setTimeout(120_000);
      await context.addCookies([{ name: 'repovio-locale', value: locale, url: testInfo.project.use.baseURL! }]);
      await page.setViewportSize({ width, height: width === 1065 ? 1134 : width === 390 ? 844 : 900 });
      await mockToolbarPages(page);
      const filterName = locale === 'de' ? 'Filtern' : 'Filter';
      const modeName = locale === 'de' ? 'Filtermodus wechseln' : 'Toggle filter mode';
      for (const theme of ['light', 'dark']) {
        await page.addInitScript(
          /** Sets a deterministic theme before the next navigation. */ (value) =>
            localStorage.setItem('nuxt-color-mode', value),
          theme,
        );
        for (const path of [
          '/issues',
          '/pull-requests',
          '/alerts/dependencies',
          '/alerts/code',
          '/alerts/secrets',
          '/admin/user-groups',
        ]) {
          await page.goto(path);
          const toolbar = page.locator('[data-page-toolbar]');
          await expect(toolbar).toBeVisible({ timeout: 15_000 });
          await expect(toolbar).toHaveCount(1);
          await expect(page.locator('html')).toHaveClass(new RegExp(theme));
          await expectToolbarControls(page, width);
          await expect(toolbar.locator('input[type="date"]')).toHaveCount(0);
          await expect(toolbar.getByRole('textbox')).toHaveCount(1);
          await expect(page.locator('.qk-table-toolbar-search')).toHaveCount(0);
          const name = path.slice(1).replaceAll('/', '-');
          await page.screenshot({ path: testInfo.outputPath(`${name}-${theme}.png`), animations: 'disabled' });
          if (path === '/admin/user-groups') {
            await expect(
              toolbar.getByRole('button', { name: locale === 'de' ? 'Neue Gruppe' : 'New group', exact: true }),
            ).toBeVisible();
            continue;
          }
          const trigger = toolbar.getByRole('button', { name: filterName, exact: true });
          await trigger.focus();
          await page.keyboard.press('Shift+F');
          const dialog = page.getByRole('dialog', { name: filterName, exact: true });
          await expect(dialog).toBeVisible();
          await expect(dialog.locator('input[type="date"]')).toHaveCount(2);
          await expect
            .poll(
              /** Checks that the portaled criteria remain inside the viewport. */ () =>
                dialog.evaluate(
                  /** Reads popover bounds and its scrollable content width. */ (element) => {
                    const box = element.getBoundingClientRect();
                    return box.left >= 0 && box.right <= innerWidth && element.scrollWidth <= element.clientWidth;
                  },
                ),
            )
            .toBe(true);
          if (path === '/issues' || path === '/alerts/code')
            await page.screenshot({
              path: testInfo.outputPath(`${name}-filters-${theme}.png`),
              animations: 'disabled',
            });
          await dialog.getByRole('button', { name: modeName, exact: true }).focus();
          await page.keyboard.press('Escape');
          await expect(dialog).toBeHidden();
          await expect(trigger).toBeFocused();
        }
      }
    });
  }
}
