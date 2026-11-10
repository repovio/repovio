import { expect, test, type Page, type Route } from '@playwright/test';

const repository = {
  id: 'repository-1',
  owner: 'fixture',
  name: 'disposable',
  enabled: true,
  members: [],
  providerAccountId: 'provider-1',
  providerRepositoryId: '1',
  url: 'https://example.test/disposable',
  lastSyncAt: null,
  workflowRunCount: 0,
  workflowRunRetentionDays: null,
  issueRetentionDays: null,
  pullRequestRetentionDays: null,
  syncIntervalSeconds: 1800,
  syncState: {
    attempt: 0,
    lastError: null,
    progressCurrent: null,
    progressPhase: null,
    progressTotal: null,
    requestedAt: null,
    scopes: [],
    startedAt: null,
    status: 'IDLE',
  },
};
const empty = {
  items: [],
  meta: { itemCount: 0, page: 1, pageCount: 0, perPage: 10, hasNextPage: false, hasPrevPage: false },
};

/** Provide deterministic synthetic API responses while rendering the real application. */
async function fixture(page: Page, role = 'SYSTEM_ADMIN', failRefreshOnce = false) {
  let deleted = false;
  let requests = 0;
  let refreshRequests = 0;
  let completeRefresh: (() => Promise<void>) | undefined;
  let complete: (() => Promise<void>) | undefined;
  await page.addInitScript(
    /** Initialize the synthetic browser identity. */ () => {
      localStorage.setItem('repovio.access-token', 'synthetic-token');
    },
  );
  await page.route(
    '**/api/v1/**',
    /** Serve synthetic shell and repository resources. */ async (route: Route) => {
      const path = new URL(route.request().url()).pathname;
      if (path.endsWith('/auth/me')) return route.fulfill({ json: { id: 'admin', username: 'Fixture', role } });
      if (path.endsWith('/settings'))
        return route.fulfill({ json: { dateTimeFormat: 'LOCALE_MEDIUM', workflowRunRetentionDays: 90 } });
      if (path.endsWith('/repositories/repository-1')) {
        if (route.request().method() !== 'DELETE') return route.fulfill({ json: repository });
        requests += 1;
        if (requests <= 2) return route.fulfill({ status: requests === 1 ? 500 : 409, json: {} });
        await new Promise<void>(
          /** Hold the successful deletion to inspect both pending controls. */ (resolve) => {
            complete = /** Commit the synthetic response without modifying any provider. */ async () => {
              deleted = true;
              await route.fulfill({ status: 204 });
              resolve();
            };
          },
        );
        return;
      }
      if (path.endsWith('/repositories') && deleted && failRefreshOnce) {
        refreshRequests += 1;
        if (refreshRequests === 1) {
          await new Promise<void>(
            /** Keep the dependent list refresh pending before its synthetic failure. */ (resolve) => {
              completeRefresh = /** Release the failed refresh so the confirmation offers a retry. */ async () => {
                await route.fulfill({ status: 500, json: {} });
                resolve();
              };
            },
          );
          return;
        }
      }
      if (path.endsWith('/repositories'))
        return route.fulfill({
          json: deleted
            ? empty
            : { ...empty, items: [repository], meta: { ...empty.meta, itemCount: 1, pageCount: 1 } },
        });
      if (/webhook-configurations|memberships|workflow-filters|\/groups$|user-groups$|awaiting-approval$/.test(path))
        return route.fulfill({ json: [] });
      return route.fulfill({ json: empty });
    },
  );
  return {
    /** Read the observed number of dependent refresh requests. */
    refreshRequests: () => refreshRequests,
    /** Finish the held dependent refresh with a synthetic failure. */
    completeRefresh: async () => {
      await completeRefresh!();
    },
    /** Read the observed number of deletion requests. */
    requests: () => requests,
    /** Release the held successful request once its pending state is visible. */
    complete: async () => {
      await complete!();
    },
  };
}

for (const locale of ['en', 'de']) {
  for (const surface of ['page', 'legacy']) {
    for (const width of [390, 1440]) {
      test(`deletes local repository with cancellation, errors and retry (${locale}, ${surface}, ${width})`, /** Verify the real shared action and its parent refresh/navigation. */ async ({
        page,
      }, testInfo) => {
        const de = locale === 'de';
        await page.setViewportSize({ width, height: 900 });
        await page
          .context()
          .addCookies([{ name: 'repovio-locale', value: locale, url: testInfo.project.use.baseURL! }]);
        const state = await fixture(page);
        await page.goto(surface === 'page' ? '/repositories/repository-1' : '/repositories?repository=repository-1');
        const trigger = page.getByRole('button', {
          name: de ? 'Repository löschen' : 'Delete repository',
          exact: true,
        });
        const dialog = page.getByRole('dialog', { name: de ? 'Entfernen bestätigen' : 'Confirm removal' });
        await expect(trigger).toBeVisible();
        await trigger.click();
        await expect(dialog).toContainText('fixture/disposable');
        await expect(dialog).toContainText(
          de ? 'beim Anbieter bleiben unverändert' : 'at the provider remain unchanged',
        );
        await dialog.getByRole('button', { name: de ? 'Abbrechen' : 'Cancel', exact: true }).click();
        await expect(dialog).toBeHidden();
        await expect(trigger).toBeFocused();
        expect(state.requests()).toBe(0);
        await trigger.click();
        const confirm = dialog.getByRole('button', { name: de ? 'Entfernen' : 'Remove', exact: true });
        await confirm.click();
        await expect(dialog.getByRole('alert')).toContainText(de ? 'nicht abgeschlossen' : 'could not be completed');
        await confirm.click();
        await expect(dialog.getByRole('alert')).toContainText(
          de ? 'Synchronisierung läuft' : 'Synchronization is running',
        );
        await page.screenshot({ path: testInfo.outputPath('repository-delete-conflict.png') });
        await confirm.click();
        await expect(confirm).toBeDisabled();
        await expect(
          page.getByRole('button', {
            name: de ? 'Repository löschen' : 'Delete repository',
            exact: true,
            includeHidden: true,
          }),
        ).toBeDisabled();
        await expect(dialog.getByRole('button', { name: de ? 'Abbrechen' : 'Cancel', exact: true })).toBeDisabled();
        await page.keyboard.press('Escape');
        await expect(dialog).toBeVisible();
        await expect.poll(state.requests).toBe(3);
        await state.complete();
        await expect(dialog).toBeHidden();
        await expect(page).toHaveURL(/\/repositories$/);
        await expect(page.getByRole('link', { name: 'disposable', exact: true })).toHaveCount(0);
        await expect(trigger).toHaveCount(0);
        await expect
          .poll(
            /** Ensure the refreshed layout fits the viewport. */ () =>
              page.evaluate(
                /** Compare document width with the visible viewport. */ () =>
                  document.documentElement.scrollWidth <= document.documentElement.clientWidth,
              ),
          )
          .toBe(true);
      });
    }
  }
}

for (const role of ['VIEWER', 'MANAGER']) {
  test(`hides repository deletion from ${role}`, /** Keep role restrictions consistent on the page and dialog. */ async ({
    page,
  }) => {
    await fixture(page, role);
    for (const url of ['/repositories/repository-1', '/repositories?repository=repository-1']) {
      await page.goto(url);
      await expect(page.getByRole('link', { name: 'Open in provider' }).last()).toBeVisible();
      await expect(page.getByRole('button', { name: 'Delete repository', exact: true })).toHaveCount(0);
    }
  });
}

test('a failed destination list load never repeats successful deletion', /** Keep the full action pending and retain successful deletion across refresh failures. */ async ({
  page,
}) => {
  const state = await fixture(page, 'SYSTEM_ADMIN', true);
  await page.goto('/repositories?repository=repository-1');
  await page.getByRole('button', { name: 'Delete repository', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Confirm removal' });
  const confirm = dialog.getByRole('button', { name: 'Remove', exact: true });
  await confirm.click();
  await expect(dialog.getByRole('alert')).toBeVisible();
  await confirm.click();
  await expect(dialog.getByRole('alert')).toContainText('Synchronization is running');
  await confirm.click();
  await expect.poll(state.requests).toBe(3);
  await state.complete();
  await expect(page).toHaveURL(/\/repositories$/);
  await expect.poll(state.refreshRequests).toBe(1);
  await state.completeRefresh();
  await expect(page.getByText('Repositories could not be loaded.', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('link', { name: 'disposable', exact: true })).toHaveCount(0);
  expect(state.requests()).toBe(3);
  await expect.poll(state.refreshRequests).toBe(2);
});
