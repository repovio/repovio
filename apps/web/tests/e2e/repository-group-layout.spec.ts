import { expect, test } from '@playwright/test';
import de from '../../i18n/locales/de.json';
import en from '../../i18n/locales/en.json';
import { mockRepositoryApplication } from './fixtures/repository-detail';

for (const locale of ['en', 'de'] as const) {
  for (const theme of ['light', 'dark']) {
    for (const width of [390, 1102, 1440]) {
      test(`Group access form ${locale} ${theme} ${width}`, /** Check localized form controls and long populated rows at the real content width. */ async ({
        page,
        baseURL,
      }, testInfo) => {
        const labels = (locale === 'de' ? de : en).userGroups;
        await mockRepositoryApplication(page);
        await page.context().addCookies([{ name: 'repovio-locale', value: locale, url: baseURL! }]);
        await page.addInitScript(
          /** Set the actual theme preference before startup. */ (value) =>
            localStorage.setItem('nuxt-color-mode', value),
          theme,
        );
        await page.setViewportSize({ width, height: 1000 });
        await page.route(
          '**/api/v1/repositories/repository-1/group-memberships',
          /** Supply long local group names for responsive grant controls. */ (route) =>
            route.fulfill({
              json: [
                {
                  id: 'grant-1',
                  groupId: 'group-1',
                  role: 'VIEWER',
                  group: { id: 'group-1', name: `Engineering-${'long-group-name-'.repeat(14)}` },
                },
              ],
            }),
        );
        await page.goto('/repositories/repository-1/settings?tab=groups');
        const panel = page.locator('[data-settings-section="groups"]');
        const form = panel.getByRole('group', { name: labels.assign, exact: true });
        await expect(form.getByRole('button', { name: labels.assign, exact: true })).toHaveText(labels.assign);
        for (const label of await form.locator('label').all())
          expect((await label.boundingBox())!.width).toBeGreaterThan(1);
        const clipped = await form.evaluate(
          /** Identify horizontal clipping of actual rendered controls. */ (element) => {
            const parent = element.getBoundingClientRect();
            const outside: string[] = [];
            for (const control of element.querySelectorAll('input,button,[role="combobox"]')) {
              if (control.getAttribute('aria-hidden') === 'true' || control.getAttribute('type') === 'hidden') continue;
              const bounds = control.getBoundingClientRect();
              if (bounds.width && (bounds.left < parent.left - 1 || bounds.right > parent.right + 1))
                outside.push(control.tagName);
            }
            return outside;
          },
        );
        expect(clipped).toEqual([]);
        expect(
          await page.evaluate(
            /** Keep table overflow contained rather than widening the document. */ () =>
              document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        await page.screenshot({
          path: testInfo.outputPath(`groups-${locale}-${theme}-${width}.png`),
          fullPage: true,
          animations: 'disabled',
        });
      });
    }
  }
}

test('group search, failed assignment, dependent refresh, role changes, and removal', /** Preserve additive grants and loading through the full refresh lifetime. */ async ({
  page,
}) => {
  await mockRepositoryApplication(page);
  const group = { id: 'group-1', name: 'Synthetic Engineering' };
  let grants: unknown[] = [];
  let fail = true;
  let puts = 0;
  let deletes = 0;
  let releaseRefresh!: () => void;
  const refreshGate = new Promise<void>(
    /** Hold the dependent grant-list refresh. */ (resolve) => {
      releaseRefresh = resolve;
    },
  );
  const searches: string[] = [];
  await page.route(
    '**/api/v1/user-groups**',
    /** Exercise real group search and pagination query construction. */ (route) => {
      searches.push(route.request().url());
      return route.fulfill({ json: { items: [group], meta: { itemCount: 11, pageCount: 2 } } });
    },
  );
  await page.route(
    '**/api/v1/repositories/repository-1/group-memberships',
    /** Retain a held successful refresh after assignment. */ async (route) => {
      if (puts === 2 && grants.length) await refreshGate;
      return route.fulfill({ json: grants });
    },
  );
  await page.route(
    '**/api/v1/repositories/repository-1/group-memberships/group-1',
    /** Record local grants without any Provider writes. */ (route) => {
      if (route.request().method() === 'DELETE') {
        deletes++;
        grants = [];
        return route.fulfill({ status: 204 });
      }
      puts++;
      if (fail) return route.fulfill({ status: 500, json: {} });
      grants = [{ id: 'grant-1', groupId: group.id, group, ...route.request().postDataJSON() }];
      return route.fulfill({ json: grants[0] });
    },
  );
  await page.goto('/repositories/repository-1/settings?tab=groups');
  const panel = page.locator('[data-settings-section="groups"]');
  const add = panel.getByRole('button', { name: 'Assign group', exact: true });
  await expect(add).toBeDisabled();
  await panel.getByRole('textbox', { name: 'Search groups', exact: true }).fill('Engineering');
  await expect
    .poll(
      /** Verify the real search text reaches the transport. */ () =>
        searches.some(/** Find the requested group name. */ (url) => decodeURIComponent(url).includes('Engineering')),
    )
    .toBe(true);
  await panel.getByRole('button', { name: 'Next page', exact: true }).click();
  await expect
    .poll(
      /** Verify group discovery can reach later pages. */ () =>
        searches.some(/** Match the second-page query. */ (url) => new URL(url).searchParams.get('page') === '2'),
    )
    .toBe(true);
  await panel.getByRole('combobox', { name: 'Select a group', exact: true }).click();
  await page.getByRole('option', { name: group.name, exact: true }).click();
  await add.click();
  await expect(panel.getByText('The group operation could not be completed.', { exact: true })).toBeVisible();
  fail = false;
  await add.click();
  await expect(add).toBeDisabled();
  await expect(panel.getByRole('textbox', { name: 'Search groups', exact: true })).toBeDisabled();
  releaseRefresh();
  await expect(panel.getByText(group.name, { exact: true }).last()).toBeVisible();
  const role = panel.getByRole('combobox', { name: `Repository role for ${group.name}`, exact: true });
  await role.click();
  await page.getByRole('option', { name: 'Repository manager', exact: true }).click();
  await expect(role).toContainText('Repository manager');
  expect(puts).toBe(3);
  await panel.getByRole('button', { name: `Remove access for ${group.name}`, exact: true }).click();
  const confirmation = page.getByRole('dialog', { name: 'Confirm removal' });
  await confirmation.getByRole('button', { name: 'Cancel', exact: true }).click();
  expect(deletes).toBe(0);
  await panel.getByRole('button', { name: `Remove access for ${group.name}`, exact: true }).click();
  await confirmation.getByRole('button', { name: 'Remove', exact: true }).click();
  await expect(panel.getByText('No groups have access to this repository.', { exact: true })).toBeVisible();
  expect(deletes).toBe(1);
});
