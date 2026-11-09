import { expect, test, type Locator, type Page } from '@playwright/test';

/** Verify real data-row styling in both themes without mutating selection or clicking actions. */
export async function expectTableHover(page: Page, table: Locator): Promise<void> {
  const row = table.locator('tbody tr').first();
  await expect(row).toBeVisible();
  const selected = await row.getAttribute('data-selected');
  const dark = await page.evaluate(
    /** Remember the current theme for the enclosing regression scenario. */ () =>
      document.documentElement.classList.contains('dark'),
  );
  for (const theme of [false, true]) {
    await page.evaluate(
      /** Activate the actual theme classes without altering data. */ (value) =>
        document.documentElement.classList.toggle('dark', value),
      theme,
    );
    await page.mouse.move(0, 0);
    const pinned = table.locator(
      'th[data-pinned="left"], th[data-pinned="right"], td[data-pinned="left"], td[data-pinned="right"]',
    );
    if (await pinned.count()) {
      const alpha = await pinned.first().evaluate(
        /** Pinned cells must fully hide text scrolling behind them. */ (element) => {
          const canvas = document.createElement('canvas');
          canvas.width = 1;
          canvas.height = 1;
          const context = canvas.getContext('2d')!;
          context.fillStyle = getComputedStyle(element).backgroundColor;
          context.fillRect(0, 0, 1, 1);
          return context.getImageData(0, 0, 1, 1).data[3];
        },
      );
      expect(alpha).toBe(255);
    }

    const before = await row.evaluate(
      /** Read both raw-row and pinned-cell presentation. */ (element) =>
        JSON.stringify([
          getComputedStyle(element).backgroundColor,
          getComputedStyle(element.querySelector('td:last-child')!).backgroundColor,
        ]),
    );
    await row.hover();
    await expect
      .poll(
        /** Wait for computed colors instead of testing implementation class strings. */ () =>
          row.evaluate(
            /** Read hovered backgrounds after style recalculation. */ (element) =>
              JSON.stringify([
                getComputedStyle(element).backgroundColor,
                getComputedStyle(element.querySelector('td:last-child')!).backgroundColor,
              ]),
          ),
      )
      .not.toBe(before);
    expect(await row.getAttribute('data-selected')).toBe(selected);
  }
  await page.mouse.move(0, 0);
  test.info().annotations.push({
    type: 'table-hover-both-themes',
    description: JSON.stringify({
      path: new URL(page.url()).pathname,
      headers: await table.locator('thead').innerText(),
    }),
  });
  await page.evaluate(
    /** Restore the surrounding test's theme. */ (value) => document.documentElement.classList.toggle('dark', value),
    dark,
  );
}
