import { expect, test } from '@playwright/test';
import manifest from '../../content/versions.json' with { type: 'json' };
import de from '../../i18n/locales/de.json' with { type: 'json' };
import en from '../../i18n/locales/en.json' with { type: 'json' };

for (const locale of ['en', 'de'] as const) {
  const prefix = locale === 'en' ? '' : '/de';
  const messages = locale === 'en' ? en : de;
  for (const width of [390, 1440]) {
    for (const mode of ['light', 'dark']) {
      test(`${locale} ${width} ${mode}: Guide features, expansion, and direct fragments`, /** Verify the declared behavior. */ async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 1000 });
        await page.addInitScript(
          /** Evaluate `localStorage.setItem('repovio-color-mode', value)`. */ (value) =>
            localStorage.setItem('repovio-color-mode', value),
          mode,
        );
        const errors: string[] = [];
        page.on('pageerror', /** Evaluate `errors.push(error.message)`. */ (error) => errors.push(error.message));
        await page.goto(`${prefix}/docs/${manifest.stable}/repositories`);
        const menu = page.getByTestId('guides-menu-toggle');
        if (width === 390) await menu.click();
        const nav =
          width === 390
            ? page.locator('article').getByTestId('docs-navigation')
            : page.locator('aside').getByTestId('docs-navigation');
        await expect(nav.getByRole('heading')).toHaveCount(3);
        const repository = nav.getByRole('link', { name: messages.repositories, exact: true });
        await expect(repository).toHaveAttribute('aria-current', 'page');
        const toggle = nav.getByRole('button', {
          name: `${messages.navigation}: ${messages.repositories}`,
          exact: true,
        });
        await expect(toggle).toHaveAttribute('aria-expanded', 'true');
        const feature = nav.locator(`a[href*="/repositories#"]`).first();
        await expect(feature).toBeVisible();
        const href = (await feature.getAttribute('href'))!;
        await expect(toggle).toBeEnabled();
        await toggle.focus();
        await expect(toggle).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(feature).toBeHidden();
        await page.keyboard.press('Enter');
        await expect(feature).toBeVisible();
        await feature.click();
        await expect(page).toHaveURL(new RegExp('/repositories#'));
        if (width === 390) {
          await expect(menu).toHaveAttribute('aria-expanded', 'false');
          await menu.click();
        }
        await expect(nav.locator('a[aria-current="location"]')).toHaveAttribute('href', href);
        await expect(repository).not.toHaveAttribute('aria-current');
        await page.reload();
        if (width === 390) await menu.click();
        if (width === 390) await expect(menu).toHaveAttribute('aria-expanded', 'true');
        await expect(nav.locator('a[aria-current="location"]')).toHaveAttribute('href', href);
        await expect
          .poll(
            /** Evaluate `page.evaluate( (fragment) => !!document.getElementById(decodeURIComponent(fragment)), new URL(href, 'http://localhost').hash.slice(1), )`. */ () =>
              page.evaluate(
                /** Evaluate `!!document.getElementById(decodeURIComponent(fragment))`. */ (fragment) =>
                  !!document.getElementById(decodeURIComponent(fragment)),
                new URL(href, 'http://localhost').hash.slice(1),
              ),
          )
          .toBe(true);
        const inactive = nav.getByRole('button', {
          name: `${messages.navigation}: ${messages['guide-issues']}`,
          exact: true,
        });
        await expect(inactive).toHaveAttribute('aria-expanded', 'false');
        await inactive.click();
        await expect(inactive).toHaveAttribute('aria-expanded', 'true');
        await expect(toggle).toHaveAttribute('aria-expanded', 'true');
        if (width === 390) await expect(menu).toHaveAttribute('aria-expanded', 'true');
        await expect(nav).toBeVisible();
        await expect
          .poll(
            /** Evaluate `page.locator('body').evaluate((body) => body.scrollWidth <= innerWidth)`. */ () =>
              page
                .locator('body')
                .evaluate(/** Evaluate `body.scrollWidth <= innerWidth`. */ (body) => body.scrollWidth <= innerWidth),
          )
          .toBe(true);
        await page.screenshot({ path: `test-results/guides-${locale}-${mode}-${width}.png`, animations: 'disabled' });
        await expect(nav).toBeVisible();
        expect(errors).toEqual([]);
      });
    }
  }
}
