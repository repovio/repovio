import { expect, test } from '@playwright/test';
import { mockRepositoryApplication } from './fixtures/repository-detail';
import { expectTableHover } from './fixtures/table-hover';

test('hover changes real row and pinned-cell backgrounds without adding Workflow Run actions', /** Verify semantic colors in the browser. */ async ({
  page,
}, testInfo) => {
  await mockRepositoryApplication(page);
  for (const theme of ['light', 'dark']) {
    await page.goto('/repositories');
    await page.evaluate(
      /** Set the actual theme without changing application data. */ (value) => {
        document.documentElement.classList.toggle('dark', value === 'dark');
      },
      theme,
    );
    await page.mouse.move(0, 0);
    const row = page.locator('tbody tr[data-selected]').first();
    const cell = row.locator('td').last();
    const before = await cell.evaluate(
      /** Read computed style before pointer entry. */ (element) => getComputedStyle(element).backgroundColor,
    );
    await row.hover();
    await expect
      .poll(
        /** Observe actual CSS rather than asserting utility class strings. */ () =>
          cell.evaluate(/** Read the hovered cell color. */ (element) => getComputedStyle(element).backgroundColor),
      )
      .not.toBe(before);
    await page.screenshot({ path: testInfo.outputPath(`table-hover-${theme}.png`), fullPage: true });
    await page.goto('/repositories/repository-1/workflow-runs');
    const run = page.locator('tbody tr[data-selected]').first();
    await expect(run).not.toHaveAttribute('tabindex');
    await run.locator('td').first().click();
    await expect(page).toHaveURL('/repositories/repository-1/workflow-runs');
  }
});

test('shortcut information rows have hover without activation', /** Cover the second raw HTML table through its real dialog. */ async ({
  page,
}) => {
  await mockRepositoryApplication(page);
  await page.goto('/repositories');
  await expect(page.locator('tbody tr[data-selected]').first()).toBeVisible();
  await page.keyboard.press('?');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expectTableHover(page, dialog.getByRole('table'));
  await expect(dialog.locator('tbody tr').first()).not.toHaveAttribute('tabindex');
});
