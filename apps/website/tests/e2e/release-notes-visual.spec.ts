import { expect, test } from '@playwright/test';
import locales from '../../content/locales.json' with { type: 'json' };
import manifest from '../../content/versions.json' with { type: 'json' };

for (const code of ['en', 'de', 'ar'] as const) {
  const prefix = code === 'en' ? '' : `/${code}`;
  for (const width of [375, 1440]) {
    for (const mode of ['light', 'dark']) {
      test(`${code} ${width} ${mode}: release layout and keyboard access`, /** Verify real theme, direction, overflow, focus, and readable source language. */ async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 1000 });
        await page.addInitScript(
          /** Select a deterministic supported theme before hydration. */ (value) =>
            localStorage.setItem('repovio-color-mode', value),
          mode,
        );
        const errors: string[] = [];
        page.on(
          'pageerror',
          /** Preserve actual runtime failures for the acceptance result. */ (error) => errors.push(error.message),
        );
        await page.goto(`${prefix}/docs/release-notes`);
        await expect(page.locator('html')).toHaveAttribute('dir', locales[code].dir);
        await expect(page.locator('html')).toHaveClass(new RegExp(mode));
        const body = page.getByTestId('release-notes-body');
        await expect(body).toHaveAttribute('lang', 'en');
        await expect(body).toHaveAttribute('dir', 'ltr');
        const toolbar = page.getByTestId('docs-toolbar');
        for (const link of await toolbar.getByRole('link').all()) {
          await expect(link).toBeVisible();
          await link.focus();
          await expect(link).toBeFocused();
        }
        expect(
          await page
            .locator('body')
            .evaluate(
              /** Detect page-level horizontal overflow. */ (element) => element.scrollWidth <= window.innerWidth,
            ),
        ).toBe(true);
        if (width === 375) {
          const summary = page.getByTestId('release-mobile-toc').locator('summary');
          await summary.focus();
          await page.keyboard.press('Enter');
          const link = page.getByTestId('release-mobile-toc').getByRole('link').first();
          await expect(link).toBeVisible();
          expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
          await page.keyboard.press('Tab');
          await expect(link).toBeFocused();
          const outline = await link.evaluate(
            /** Verify keyboard focus has a visible outline. */ (element) => getComputedStyle(element).outlineStyle,
          );
          expect(outline).not.toBe('none');
          await summary.click();
        } else {
          await expect(page.getByTestId('release-desktop-toc')).toBeVisible();
        }
        await page.screenshot({ path: `test-results/release-notes-${code}-${width}-${mode}.png` });
        await page.goto(`${prefix}/docs/${manifest.stable}/overview`);
        expect(
          await page
            .locator('body')
            .evaluate(
              /** Verify the expanded toolbar also fits versioned documentation. */ (element) =>
                element.scrollWidth <= window.innerWidth,
            ),
        ).toBe(true);
        expect(errors).toEqual([]);
      });
    }
  }
}
