import { expect, test, type Page } from '@playwright/test';
import { mockRepositoryApplication } from './fixtures/repository-detail';

const repository = {
  enabled: true,
  id: 'repository-1',
  lastSyncAt: null,
  members: [],
  name: 'repovio',
  owner: 'twaelde',
  providerAccountId: 'provider-1',
  providerRepositoryId: 'repository-1',
  syncIntervalSeconds: 1_800,
  syncState: {
    attempt: 0,
    lastError: null,
    progressCurrent: null,
    progressPhase: null,
    progressTotal: null,
    requestedAt: null,
    scopes: ['WORKFLOWS', 'ISSUES', 'PULL_REQUESTS'],
    startedAt: null,
    status: 'IDLE',
  },
  url: 'https://github.com/repovio/repovio',
  workflowRunCount: 12,
  workflowRunRetentionDays: 30,
};

/** Configure the assigned repository list and detail for a non-administrative user. */
async function mockViewerRepositories(page: Page): Promise<void> {
  await page.addInitScript(
    /** Initializes browser-side authentication and preferences before page scripts run. */ () =>
      window.localStorage.setItem('repovio.access-token', 'playwright-access-token'),
  );
  await page.route(
    '**/api/v1/auth/me',
    /** Supplies the mocked response for `/api/v1/auth/me`. */ (route) =>
      route.fulfill({ json: { id: 'playwright-viewer', role: 'VIEWER', username: 'playwright' } }),
  );
  await page.route(
    /\/api\/v1\/repositories(?:\?.*)?$/,
    /** Supplies the mocked response for the intercepted request. */ (route) => {
      expect(route.request().url()).not.toContain('webhook');
      return route.fulfill({
        json: {
          items: [repository],
          meta: { hasNextPage: false, hasPrevPage: false, itemCount: 1, page: 1, pageCount: 1, perPage: 10 },
        },
      });
    },
  );
  await page.route(
    '**/api/v1/repositories/repository-1',
    /** Supplies the mocked response for `/api/v1/repositories/repository-1`. */ (route) =>
      route.fulfill({ json: repository }),
  );
  await page.route(
    /\/api\/v1\/(?:issues|pull-requests|workflow-runs)(?:\?.*)?$/,
    /** Supplies the mocked response for the intercepted request. */ (route) =>
      route.fulfill({
        json: {
          items: [],
          meta: { hasNextPage: false, hasPrevPage: false, itemCount: 0, page: 1, pageCount: 0, perPage: 5 },
        },
      }),
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
}

test('viewer cannot access repository webhook controls', /** Verifies viewer cannot access repository webhook controls. */ async ({
  page,
}) => {
  await mockViewerRepositories(page);
  await page.goto('/repositories?repository=repository-1');

  await expect(page.getByRole('columnheader', { name: 'Webhook' })).toHaveCount(0);
  const dialog = page.locator('#main-content');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading', { name: 'Repository webhook' })).toHaveCount(0);
});

test('viewer browses assigned repositories without administration actions', /** Verifies viewer browses assigned repositories without administration actions. */ async ({
  page,
}, testInfo) => {
  await mockViewerRepositories(page);
  await page.goto('/repositories');

  await expect(page).toHaveTitle('Repositories · Repovio');
  const brandLink = page.getByRole('link', { name: 'Repovio', exact: true });
  await expect(brandLink.locator('img:visible')).toBeVisible();
  await expect(brandLink).toHaveAttribute('href', '/');
  await expect(page.getByRole('link', { name: 'GitHub' })).toHaveAttribute(
    'href',
    'https://github.com/repovio/repovio',
  );
  const navigation = page.getByRole('navigation', { name: 'Primary navigation' });
  const repositoriesLink = navigation.getByRole('link', { name: 'Repositories' });
  await expect(repositoriesLink).toHaveAttribute('href', '/repositories');
  await expect(repositoriesLink).toHaveAttribute('aria-current', 'page');
  await expect(navigation.getByText('Administration', { exact: true })).toHaveCount(0);
  await expect(page.getByText('twaelde', { exact: true })).toBeVisible();
  await expect(page.getByText('repovio', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'repovio', exact: true })).toHaveAttribute(
    'href',
    '/repositories/repository-1',
  );
  await expect(page.getByRole('button', { name: 'Add repository' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Disable' })).toHaveCount(0);
  await expect(page.getByRole('columnheader', { name: 'Webhook' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Open in provider' })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('viewer-repository-navigation-desktop.png'), fullPage: true });

  await page.getByRole('button', { name: 'Collapse sidebar' }).click();
  await expect(page.getByRole('button', { name: 'Expand sidebar' })).toBeVisible();
  await expect(brandLink.locator('img')).toBeVisible();
  await expect(brandLink).toHaveText('');
  await expect(navigation.getByRole('button', { name: 'Workflow runs' })).toBeVisible();
  await expect(repositoriesLink).toHaveAttribute('aria-current', 'page');
  await page.screenshot({ path: testInfo.outputPath('viewer-repository-navigation-collapsed.png'), fullPage: true });
  await page.getByRole('button', { name: 'Expand sidebar' }).click();
  await expect(brandLink.locator('img:visible')).toBeVisible();

  await page.getByRole('button', { name: 'Open search', exact: true }).click();
  await page.getByPlaceholder('Search or type a command').fill('repositories');
  await expect(page.getByRole('option', { name: 'Repositories', exact: true })).toHaveAttribute(
    'href',
    '/repositories',
  );
  await page.keyboard.press('Escape');
  await page.getByRole('link', { name: 'Open repository', exact: true }).click();

  await expect(page).toHaveURL(/\/repositories\/repository-1$/);
  await expect(page.getByRole('navigation', { name: 'Repository navigation', exact: true })).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'twaelde/repovio' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Save', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Refresh provider data' })).toHaveCount(0);
  await page.goBack();
  await expect(page).toHaveURL(/\/repositories$/);
  await page.goForward();
  await expect(page).toHaveURL(/\/repositories\/repository-1$/);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Synchronization', exact: true })).toBeVisible();

  await page.goto('/admin/repositories/repository-1?source=legacy#details');
  await expect
    .poll(
      /** Reads the observable state until the browser assertion settles. */ () => {
        const url = new URL(page.url());
        return `${url.pathname}|${url.searchParams.get('source')}|${url.hash}`;
      },
    )
    .toBe('/repositories/repository-1|legacy|#details');
  await page.setViewportSize({ height: 844, width: 390 });
  await expect(page.getByRole('heading', { name: 'Synchronization' })).toBeVisible();
  await expect
    .poll(
      /** Evaluates `page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)` when expect .poll invokes this callback. */ () =>
        page.evaluate(
          /** Reads or updates browser state for the repository navigation scenario. */ () =>
            document.documentElement.scrollWidth <= document.documentElement.clientWidth,
        ),
    )
    .toBe(true);
  await page.screenshot({ path: testInfo.outputPath('viewer-repository-mobile.png'), fullPage: true });
});

test('administrator refreshes renamed repository metadata from the provider', /** Verifies administrator refreshes renamed repository metadata from the provider. */ async ({
  page,
}, testInfo) => {
  let releaseRefresh: (() => void) | undefined;
  let refreshAttempts = 0;
  const refreshResponse = new Promise<void>(
    /** Retains the response resolver so this test controls request completion. */ (resolve) => {
      releaseRefresh = resolve;
    },
  );
  await page.addInitScript(
    /** Initializes browser-side authentication and preferences before page scripts run. */ () =>
      window.localStorage.setItem('repovio.access-token', 'playwright-access-token'),
  );
  await page.route(
    '**/api/v1/auth/me',
    /** Supplies the mocked response for `/api/v1/auth/me`. */ (route) =>
      route.fulfill({ json: { id: 'playwright-admin', role: 'SYSTEM_ADMIN', username: 'playwright' } }),
  );
  await page.route(
    '**/api/v1/repositories/repository-1/refresh',
    /** Supplies the mocked response for `/api/v1/repositories/repository-1/refresh`. */ async (route) => {
      refreshAttempts += 1;
      if (refreshAttempts > 1) {
        await route.fulfill({ json: { message: 'Provider repository not found.' }, status: 404 });
        return;
      }
      await refreshResponse;
      await route.fulfill({
        json: {
          ...repository,
          name: 'repovio',
          owner: 'new-owner',
          url: 'https://github.com/new-owner/repovio',
        },
      });
    },
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
    '**/api/v1/repositories/webhook-configurations',
    /** Supplies the mocked response for `/api/v1/repositories/webhook-configurations`. */ (route) =>
      route.fulfill({
        json: [
          {
            callbackUrl: 'https://repovio.example.test/api/webhooks/github/repository-1',
            configured: false,
            lastDeliveryAt: null,
            providerType: 'GITHUB',
            repositoryId: 'repository-1',
          },
        ],
      }),
  );
  await page.route(
    /\/api\/v1\/users(?:\?.*)?$/,
    /** Supplies the mocked response for the intercepted request. */ (route) =>
      route.fulfill({ json: { items: [], meta: { itemCount: 0, pageCount: 0 } } }),
  );
  await page.route(
    '**/api/v1/repositories/repository-1',
    /** Supplies the mocked response for `/api/v1/repositories/repository-1`. */ (route) =>
      route.fulfill({ json: repository }),
  );
  await page.route(
    /\/api\/v1\/repositories(?:\?.*)?$/,
    /** Supplies the mocked response for the intercepted request. */ (route) => {
      expect(new URL(route.request().url()).searchParams.get('fields')).not.toContain('webhook');
      return route.fulfill({
        json: {
          items: [repository],
          meta: { hasNextPage: false, hasPrevPage: false, itemCount: 1, page: 1, pageCount: 1, perPage: 10 },
        },
      });
    },
  );

  await page.goto('/repositories?repository=repository-1');

  const refreshButton = page.getByRole('button', { name: 'Refresh provider data' });
  await refreshButton.click();
  await expect(refreshButton).toBeDisabled();
  await expect(refreshButton.locator('[data-slot="leadingIcon"]')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('repository-refresh-loading.png'), fullPage: true });
  releaseRefresh?.();

  await expect(page).toHaveTitle('new-owner/repovio · Repovio');
  await expect(page.getByRole('link', { name: 'Open in provider' })).toHaveAttribute(
    'href',
    'https://github.com/new-owner/repovio',
  );
  await expect(page.getByText('Repository data was refreshed from the provider.', { exact: true })).toBeVisible();

  await refreshButton.click();
  await expect(
    page.getByText('Repository data could not be refreshed from the provider.', { exact: true }),
  ).toBeVisible();
});

test('administrator configures a webhook for one repository', /** Verifies administrator configures a webhook for one repository. */ async ({
  page,
}, testInfo) => {
  let configured = false;
  let requestFails = false;
  let savedSecret = '';
  let releaseSave: (() => void) | undefined;
  const saveResponse = new Promise<void>(
    /** Retains the response resolver so this test controls request completion. */ (resolve) => {
      releaseSave = resolve;
    },
  );
  /** Builds channel-specific credentials and options, omitting unchanged configuration. */
  const configuration = () => ({
    callbackUrl: 'https://repovio.example.test/api/webhooks/github/repository-1',
    configured,
    lastDeliveryAt: configured ? '2026-09-13T12:00:00.000Z' : null,
    providerType: 'GITHUB',
    repositoryId: 'repository-1',
  });

  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.addInitScript(
    /** Initializes browser-side authentication and preferences before page scripts run. */ () =>
      window.localStorage.setItem('repovio.access-token', 'playwright-access-token'),
  );
  await page.route(
    '**/api/v1/auth/me',
    /** Supplies the mocked response for `/api/v1/auth/me`. */ (route) =>
      route.fulfill({ json: { id: 'playwright-admin', role: 'SYSTEM_ADMIN', username: 'playwright' } }),
  );
  await page.route(
    '**/api/v1/repositories/webhook-configurations',
    /** Supplies the mocked response for `/api/v1/repositories/webhook-configurations`. */ (route) =>
      route.fulfill({ json: [configuration()] }),
  );
  await page.route(
    '**/api/v1/repositories/repository-1/webhook-configuration',
    /** Supplies the mocked response for `/api/v1/repositories/repository-1/webhook-configuration`. */ async (
      route,
    ) => {
      if (route.request().method() === 'DELETE') {
        configured = false;
        await route.fulfill({ status: 204 });
        return;
      }
      savedSecret = (route.request().postDataJSON() as { webhookSecret: string }).webhookSecret;
      if (!configured) await saveResponse;
      if (requestFails) {
        await route.fulfill({ json: { message: 'failed' }, status: 500 });
        return;
      }
      configured = true;
      await route.fulfill({ json: configuration() });
    },
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
    /\/api\/v1\/users(?:\?.*)?$/,
    /** Supplies the mocked response for the intercepted request. */ (route) =>
      route.fulfill({ json: { items: [], meta: { itemCount: 0, pageCount: 0 } } }),
  );
  await page.route(
    '**/api/v1/repositories/repository-1',
    /** Supplies the mocked response for `/api/v1/repositories/repository-1`. */ (route) =>
      route.fulfill({ json: repository }),
  );
  await page.route(
    /\/api\/v1\/repositories(?:\?.*)?$/,
    /** Supplies the mocked response for the intercepted request. */ (route) =>
      route.fulfill({
        json: {
          items: [repository],
          meta: { hasNextPage: false, hasPrevPage: false, itemCount: 1, page: 1, pageCount: 1, perPage: 10 },
        },
      }),
  );

  await page.goto('/repositories');
  await expect(page.getByRole('columnheader', { name: 'Webhook' })).toBeVisible();
  await expect(page.getByText('Not configured', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Edit repository', exact: true }).click();

  await page
    .getByRole('navigation', { name: 'Repository settings sections', exact: true })
    .getByRole('link', { name: 'Webhook', exact: true })
    .click();
  const dialog = page.locator('#main-content');
  await expect(dialog.getByRole('heading', { name: 'Repository webhook' })).toBeVisible();
  await expect(
    dialog.locator('input[value="https://repovio.example.test/api/webhooks/github/repository-1"]'),
  ).toBeVisible();
  await expect(dialog.getByText(/Workflow runs \(workflow_run\)/)).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('repository-webhook-dark.png'), fullPage: true });

  await dialog.getByRole('button', { name: 'Generate secret' }).click();
  const secretInput = dialog.getByRole('textbox', { name: 'Signing secret' });
  await expect(secretInput).toHaveValue(/^[A-Za-z0-9+/]{43}=$/);
  await dialog.getByRole('button', { name: 'Save secret' }).click();
  await expect(dialog.getByRole('button', { name: 'Save secret' })).toBeDisabled();
  expect(savedSecret).toMatch(/^[A-Za-z0-9+/]{43}=$/);
  releaseSave?.();

  await expect(dialog.getByText('Webhook secret saved')).toBeVisible();
  await expect(dialog.getByText('Configured', { exact: true })).toBeVisible();
  await expect(secretInput).toHaveValue(savedSecret);
  await expect(dialog.getByText('This repository webhook requires an update')).toBeVisible();

  await secretInput.fill('replacement-token');
  await dialog.getByText("I will update this repository's provider webhook with the new secret.").click();
  requestFails = true;
  await dialog.getByRole('button', { name: 'Rotate secret' }).click();
  await expect(dialog.getByText('The webhook secret could not be updated.')).toBeVisible();
  requestFails = false;

  await dialog.getByRole('button', { name: 'Remove configuration' }).click();
  await page
    .getByRole('dialog', { name: 'Confirm removal' })
    .getByRole('button', { name: 'Remove', exact: true })
    .click();
  await expect(dialog.getByText('Not configured', { exact: true })).toBeVisible();
  await expect(page.getByText('Not configured', { exact: true }).first()).toBeVisible();

  await page.evaluate(
    /** Reads or updates browser state for the repository navigation scenario. */ () =>
      window.localStorage.setItem('nuxt-color-mode', 'light'),
  );
  await page.setViewportSize({ height: 844, width: 390 });
  await page.reload();
  await expect(page.locator('html')).toHaveClass(/light/);
  await expect(dialog.getByRole('heading', { name: 'Repository webhook' })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('repository-webhook-light-mobile.png'), fullPage: true });
});

test('Repository section links restore direct destinations and browser history', /** Keep the navigation-first journey in the existing regression suite. */ async ({
  page,
}) => {
  await mockRepositoryApplication(page, 'VIEWER');
  await page.goto('/repositories/repository-1');
  const navigation = page.getByRole('navigation', { name: 'Repository navigation', exact: true });
  await expect(navigation.getByRole('link', { name: 'Overview', exact: true })).toHaveAttribute(
    'href',
    '/repositories/repository-1',
  );
  await navigation.getByRole('link', { name: 'Workflow runs', exact: true }).click();
  await expect(page).toHaveURL('/repositories/repository-1/workflow-runs');
  await navigation.getByRole('link', { name: 'Issues', exact: true }).click();
  await expect(page).toHaveURL('/repositories/repository-1/issues');
  await page.goBack();
  await expect(page).toHaveURL('/repositories/repository-1/workflow-runs');
  await page.reload();
  await expect(page.locator('tbody')).toContainText('Build repository-1');
});

for (const section of ['issues', 'pull-requests', 'security-alerts?kind=CODE']) {
  test(`keeps Repository scope in embedded ${section} filtering`, /** Verifies the moved criteria use the local toolbar and cannot broaden Repository or Provider scope. */ async ({
    page,
  }) => {
    await mockRepositoryApplication(page, 'MANAGER');
    const urls: string[] = [];
    page.on(
      'request',
      /** Captures effective scoped queries without replacing the existing fixture adapter. */ (request) => {
        if (/\/api\/v1\/(issues|pull-requests|security-alerts)\?/.test(request.url())) urls.push(request.url());
      },
    );
    await page.goto(`/repositories/repository-1/${section}`);
    const local = page.locator('[data-table-toolbar]');
    await expect(local).toHaveCount(1);
    await expect(page.locator('[data-page-toolbar]')).toHaveCount(1);
    await local.getByRole('button', { name: 'Filter', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Filter', exact: true });
    await dialog.getByRole('combobox', { name: 'Select field' }).click();
    await expect(page.getByRole('option', { name: 'Repository', exact: true })).toHaveCount(0);
    await expect(page.getByRole('option', { name: 'Provider', exact: true })).toHaveCount(0);
    await page.keyboard.press('Escape');
    await dialog.getByLabel('Updated from', { exact: true }).fill('2026-09-01');
    await expect
      .poll(
        /** Reads the effective request until the moved date constraint arrives. */ () =>
          new URL(urls.at(-1)!).searchParams.get('where') ?? '',
      )
      .toContain('2026-09-01T00:00:00.000Z');
    expect(new URL(urls.at(-1)!).searchParams.get('where')).toContain('repository-1');
    await dialog.getByRole('button', { name: 'Clear filters', exact: true }).click();
    await expect
      .poll(
        /** Waits for the cleared date while preserving mandatory constraints. */ () =>
          new URL(urls.at(-1)!).searchParams.get('where') ?? '',
      )
      .not.toContain('providerUpdatedAt');
    expect(new URL(urls.at(-1)!).searchParams.get('where')).toContain('repository-1');
    if (section.startsWith('security-alerts'))
      expect(new URL(urls.at(-1)!).searchParams.get('where')).toContain('CODE');
  });
}

for (const role of ['VIEWER', 'MANAGER', 'SYSTEM_ADMIN'] as const) {
  test(`canonical entry points and legacy links for ${role}`, /** Preserve old destinations without recreating the modal. */ async ({
    page,
  }) => {
    await mockRepositoryApplication(page, role);
    await page.goto('/repositories');
    const action = page
      .getByRole('link', { name: role === 'SYSTEM_ADMIN' ? 'Edit repository' : 'Open repository', exact: true })
      .first();
    await expect(action).toHaveAttribute(
      'href',
      `/repositories/repository-1${role === 'SYSTEM_ADMIN' ? '/settings' : ''}`,
    );
    await action.click();
    await expect(page).toHaveURL(`/repositories/repository-1${role === 'SYSTEM_ADMIN' ? '/settings' : ''}`);
    await page.goBack();
    await expect(page).toHaveURL('/repositories');
    await page.goto('/repositories?source=legacy&repository=repository-1#details');
    await expect(page).toHaveURL('/repositories/repository-1?source=legacy#details');
    await expect(page.getByRole('dialog', { name: 'team/repository-1' })).toHaveCount(0);
    await page.reload();
    await expect(page.getByRole('navigation', { name: 'Repository navigation', exact: true })).toBeVisible();
    for (const query of ['repository=', 'repository=repository-1&repository=repository-2']) {
      await page.goto(`/repositories?${query}`);
      await expect(page.getByRole('link', { name: 'repository-1', exact: true })).toBeVisible();
      expect(new URL(page.url()).pathname).toBe('/repositories');
    }
    await page.goto('/repositories?repository=forbidden');
    await expect(page.getByText('This repository was not found or is not available to you.')).toBeVisible();
  });
}
