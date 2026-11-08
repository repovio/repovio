import { expect, test } from '@playwright/test';
import manifest from '../../content/versions.json' with { type: 'json' };
import websitePackage from '../../package.json' with { type: 'json' };

for (const locale of ['en', 'de']) {
  const prefix = locale === 'de' ? '/de' : '';
  for (const mode of ['light', 'dark']) {
    for (const width of [390, 1440]) {
      test(`${locale} ${mode} ${width}: website version stays at the footer's right edge`, /** Verify the package version and responsive footer on product and documentation pages. */ async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 1000 });
        await page.addInitScript(
          /** Select the theme before hydration. */ (value) => localStorage.setItem('repovio-color-mode', value),
          mode,
        );
        for (const route of ['', `/docs/${manifest.stable}/overview`]) {
          await page.goto(`${prefix}${route}` || '/');
          await expect(page.locator('html')).toHaveAttribute('lang', locale);
          await expect(page.locator('html')).toHaveClass(new RegExp(mode));
          const footer = page.locator('footer');
          const label = footer.getByTestId('website-version');
          await expect(label).toHaveText(`v${websitePackage.version}`);
          await label.scrollIntoViewIfNeeded();
          await expect(label).toBeVisible();
          expect(
            await label.evaluate(/** Check that the version is plain text. */ (element) => element.closest('a')),
          ).toBeNull();
          const labelBox = await label.boundingBox();
          const rowBox = await label.locator('..').boundingBox();
          expect(labelBox).not.toBeNull();
          expect(rowBox).not.toBeNull();
          expect(Math.abs(labelBox!.x + labelBox!.width - rowBox!.x - rowBox!.width)).toBeLessThan(2);
          expect(
            await page
              .locator('body')
              .evaluate(/** Check that the page fits the viewport. */ (body) => body.scrollWidth <= window.innerWidth),
          ).toBe(true);
          await footer.screenshot({
            path: `test-results/footer-${locale}-${mode}-${width}-${route ? 'docs' : 'home'}.png`,
          });
        }
      });
    }
  }
}
