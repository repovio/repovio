import { expect, test } from '@playwright/test';
import de from '../../i18n/locales/de.json';
import en from '../../i18n/locales/en.json';
import { mockRepositoryApplication } from './fixtures/repository-detail';

for (const locale of ['en', 'de'] as const) {
  for (const theme of ['light', 'dark']) {
    for (const width of [390, 1102, 1440]) {
      test(`Member form ${locale} ${theme} ${width}`, /** Check localized form controls and long member identities at the real content width. */ async ({
        page,
        baseURL,
      }, testInfo) => {
        const labels = (locale === 'de' ? de : en).repositoryDetails;
        await mockRepositoryApplication(page);
        await page.context().addCookies([{ name: 'repovio-locale', value: locale, url: baseURL! }]);
        await page.addInitScript(
          /** Set the actual theme preference before startup. */ (value) =>
            localStorage.setItem('nuxt-color-mode', value),
          theme,
        );
        await page.setViewportSize({ width, height: 1000 });
        await page.route(
          '**/api/v1/repositories/repository-1/memberships',
          /** Supply a long membership identity without real user data. */ (route) =>
            route.fulfill({
              json: [
                {
                  id: 'membership-1',
                  userId: 'user-1',
                  role: 'VIEWER',
                  user: {
                    id: 'user-1',
                    username: `member-${'long-name-'.repeat(14)}`,
                    firstName: 'Synthetic',
                    lastName: 'Member',
                  },
                },
              ],
            }),
        );
        await page.goto('/repositories/repository-1/settings?tab=members');
        const panel = page.locator('[data-settings-section="members"]');
        const form = panel.locator('form');
        await expect(form.getByRole('button', { name: labels.addMember, exact: true })).toHaveText(labels.addMember);
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
        if (width >= 1102) await expect(panel.getByRole('row').last().getByRole('combobox')).toBeInViewport();
        expect(
          await page.evaluate(
            /** Keep table overflow contained rather than widening the document. */ () =>
              document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        await page.screenshot({
          path: testInfo.outputPath(`members-${locale}-${theme}-${width}.png`),
          fullPage: true,
          animations: 'disabled',
        });
      });
    }
  }
}

test('member search, failed assignment, pending role changes, and confirmed removal', /** Preserve real membership operations while changing presentation only. */ async ({
  page,
}) => {
  await mockRepositoryApplication(page);
  const user = { id: 'user-1', username: 'synthetic-viewer', firstName: 'Vera', lastName: 'Viewer', role: 'VIEWER' };
  let membership: unknown[] = [];
  let fail = true;
  let puts = 0;
  let deletes = 0;
  let release!: () => void;
  const gate = new Promise<void>(
    /** Hold the first successful assignment open. */ (resolve) => {
      release = resolve;
    },
  );
  let releaseRole!: () => void;
  const roleGate = new Promise<void>(
    /** Hold role persistence to inspect its initiating control. */ (resolve) => {
      releaseRole = resolve;
    },
  );
  const searches: string[] = [];
  await page.route(
    '**/api/v1/users**',
    /** Supply paged safe user discovery and record actual search queries. */ (route) => {
      searches.push(route.request().url());
      return route.fulfill({ json: { items: [user], meta: { itemCount: 11, pageCount: 2 } } });
    },
  );
  await page.route(
    '**/api/v1/repositories/repository-1/memberships',
    /** Read current local membership state. */ (route) => route.fulfill({ json: membership }),
  );
  await page.route(
    '**/api/v1/repositories/repository-1/memberships/user-1',
    /** Exercise actual upsert and confirmed-delete contracts. */ async (route) => {
      if (route.request().method() === 'DELETE') {
        deletes++;
        membership = [];
        return route.fulfill({ status: 204 });
      }
      puts++;
      if (fail) return route.fulfill({ status: 500, json: {} });
      if (puts === 2) await gate;
      if (puts === 3) await roleGate;
      const saved = { id: 'membership-1', userId: user.id, user, ...route.request().postDataJSON() };
      membership = [saved];
      return route.fulfill({ json: saved });
    },
  );
  await page.goto('/repositories/repository-1/settings?tab=members');
  const panel = page.locator('[data-settings-section="members"]');
  const add = panel.getByRole('button', { name: 'Add member', exact: true });
  await expect(add).toBeDisabled();
  await panel.getByRole('button', { name: 'User', exact: true }).click();
  await page.getByPlaceholder(/^Search/).fill('Vera');
  await expect
    .poll(
      /** Observe the actual remote name-search query. */ () =>
        searches.some(/** Find the requested user name. */ (url) => decodeURIComponent(url).includes('Vera')),
    )
    .toBe(true);
  await page.getByRole('button', { name: 'Next page', exact: true }).click();
  await expect
    .poll(
      /** Read real pagination requests rather than UI text alone. */ () =>
        searches.some(/** Locate second-page user discovery. */ (url) => new URL(url).searchParams.get('page') === '2'),
    )
    .toBe(true);
  await page.getByRole('option', { name: /Vera Viewer/ }).click();
  await add.click();
  await expect(page.getByText('The repository settings could not be saved.', { exact: true })).toBeVisible();
  fail = false;
  await add.click();
  await expect(add).toBeDisabled();
  release();
  const row = panel.getByRole('row').filter({ hasText: 'Vera Viewer' });
  await expect(row).toBeVisible();
  await row.getByRole('combobox').click();
  await page.getByRole('option', { name: 'Repository manager', exact: true }).click();
  await expect(row.getByRole('combobox')).toBeDisabled();
  await expect(row.getByRole('button', { name: 'Remove member', exact: true })).toBeDisabled();
  releaseRole();
  await expect(row.getByRole('combobox')).toBeEnabled();
  await expect(row.getByRole('combobox')).toContainText('Repository manager');
  expect(puts).toBe(3);
  await row.getByRole('button', { name: 'Remove member', exact: true }).click();
  const confirmation = page.getByRole('dialog', { name: 'Confirm removal' });
  await confirmation.getByRole('button', { name: 'Cancel', exact: true }).click();
  expect(deletes).toBe(0);
  await row.getByRole('button', { name: 'Remove member', exact: true }).click();
  await confirmation.getByRole('button', { name: 'Remove', exact: true }).click();
  await expect(panel.getByText('No users have explicit access to this repository.', { exact: true })).toBeVisible();
  expect(deletes).toBe(1);
});
