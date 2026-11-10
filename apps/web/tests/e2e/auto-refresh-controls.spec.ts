import { expect, test } from '@playwright/test';
import { mockRefreshApplication } from './fixtures/auto-refresh';

const routes = [
  '/',
  '/workflow-runs',
  '/workflows/awaiting-approval',
  '/workflow-runs/needs-attention',
  '/issues',
  '/pull-requests',
  '/alerts/dependencies',
  '/alerts/code',
  '/alerts/secrets',
];

test('all nine manual controls share compact accessible styling, including when automatic refresh is Off', /** Exercise the actual common component in every host toolbar. */ async ({
  page,
}, testInfo) => {
  const { writes } = await mockRefreshApplication(page);
  await page.addInitScript(
    /** Keep only explicit refresh enabled for this comparison. */ () =>
      localStorage.setItem('repovio:auto-refresh:interval-ms', '0'),
  );
  await page.clock.install();
  let reference: unknown;
  for (const [index, path] of routes.entries()) {
    await page.goto(path);
    const control = page.locator('[data-manual-refresh]');
    await expect(control).toBeEnabled();
    await expect(control).toHaveAccessibleName('Refresh');
    await expect(control).toHaveText('');
    const style = await control.evaluate(
      /** Compare physical appearance, not only component names. */ (element) => {
        const css = getComputedStyle(element);
        return {
          width: css.width,
          height: css.height,
          background: css.backgroundColor,
          radius: css.borderRadius,
          color: css.color,
        };
      },
    );
    if (reference === undefined) reference = style;
    else expect(style).toEqual(reference);
    await control.focus();
    await expect(control).toBeFocused();
    await page.clock.runFor(1000);
    await expect(page.getByRole('tooltip', { name: 'Refresh', exact: true })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`refresh-control-${index}.png`) });
    await page.keyboard.press('Escape');
    await control.click();
    await expect(control).toHaveAttribute('aria-busy', 'false');
  }
  expect(writes).toEqual([]);
});
