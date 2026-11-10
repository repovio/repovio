import { expect, test } from '@playwright/test';
import de from '../../i18n/locales/de.json';
import en from '../../i18n/locales/en.json';
import { mockRepositoryApplication } from './fixtures/repository-detail';

for (const locale of ['en', 'de'] as const) {
  for (const theme of ['light', 'dark']) {
    for (const width of [390, 1102, 1440]) {
      test(`Workflow Filter form ${locale} ${theme} ${width}`, /** Check localized form controls and long populated rows at the real content width. */ async ({
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
          '**/api/v1/repositories/repository-1/workflow-filters',
          /** Supply a long name that must remain inside the table scroll area. */ (route) =>
            route.fulfill({
              json: [
                {
                  id: 'filter-1',
                  repositoryId: 'repository-1',
                  mode: 'DENY',
                  pattern: `release-${'long-workflow-name-'.repeat(12)}*`,
                },
              ],
            }),
        );
        await page.goto('/repositories/repository-1/settings?tab=workflow-filters');
        const panel = page.locator('[data-settings-section="workflow-filters"]');
        const form = panel.locator('form');
        await expect(form.getByRole('button', { name: labels.addFilter, exact: true })).toHaveText(labels.addFilter);
        for (const label of await form.locator('label').all())
          expect((await label.boundingBox())!.width).toBeGreaterThan(1);
        const clipped = await form.evaluate(
          /** Identify horizontal clipping of actual rendered controls. */ (element) => {
            const parent = element.getBoundingClientRect();
            const outside: string[] = [];
            for (const control of element.querySelectorAll('input,button,[role="combobox"]')) {
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
          path: testInfo.outputPath(`workflow-filters-${locale}-${theme}-${width}.png`),
          fullPage: true,
          animations: 'disabled',
        });
      });
    }
  }
}

test('Workflow Filter validation, failure, pending create, and confirmed removal', /** Preserve real form validation and request-lifetime state. */ async ({
  page,
}) => {
  await mockRepositoryApplication(page);
  let fail = true;
  let creates = 0;
  let deletes = 0;
  let release!: () => void;
  const gate = new Promise<void>(
    /** Retain synthetic create completion control. */ (resolve) => {
      release = resolve;
    },
  );
  await page.route(
    '**/api/v1/repositories/repository-1/workflow-filters',
    /** Exercise the real create endpoint with failure and a held success. */ async (route) => {
      if (route.request().method() !== 'POST') return route.fulfill({ json: [] });
      creates++;
      if (fail) return route.fulfill({ status: 500, json: {} });
      await gate;
      return route.fulfill({
        json: { id: 'filter-1', repositoryId: 'repository-1', ...route.request().postDataJSON() },
      });
    },
  );
  await page.route(
    '**/api/v1/repositories/repository-1/workflow-filters/filter-1',
    /** Record confirmed local rule removal. */ (route) => {
      deletes++;
      return route.fulfill({ status: 204 });
    },
  );
  await page.goto('/repositories/repository-1/settings?tab=workflow-filters');
  const add = page.getByRole('button', { name: 'Add workflow filter', exact: true });
  await add.click();
  await expect(page.getByText('Enter a valid value.', { exact: true })).toBeVisible();
  expect(creates).toBe(0);
  const pattern = page.getByRole('textbox', { name: 'Workflow pattern', exact: true });
  await pattern.fill('release-*');
  await pattern.blur();
  await expect(page.getByText('Enter a valid value.', { exact: true })).toHaveCount(0);
  await add.click();
  await expect(page.getByText('The repository settings could not be saved.', { exact: true })).toBeVisible();
  fail = false;
  await add.click();
  await expect(add).toBeDisabled();
  release();
  await expect(page.getByText('release-*', { exact: true })).toBeVisible();
  await expect(add).toBeEnabled();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  const confirmation = page.getByRole('dialog', { name: 'Confirm removal' });
  await confirmation.getByRole('button', { name: 'Cancel', exact: true }).click();
  expect(deletes).toBe(0);
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await confirmation.getByRole('button', { name: 'Remove', exact: true }).click();
  await expect(page.getByText('No workflow filters are configured.', { exact: true })).toBeVisible();
  expect(creates).toBe(2);
  expect(deletes).toBe(1);
});
