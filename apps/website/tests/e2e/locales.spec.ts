import { expect, test } from '@playwright/test';
import locales from '../../content/locales.json' with { type: 'json' };
import manifest from '../../content/versions.json' with { type: 'json' };

for (const [code, metadata] of Object.entries(locales)) {
  const prefix = code === 'en' ? '' : `/${code}`;
  test(`${code}: all released handbook pages and translated legal notices resolve`, /** Verify the declared behavior. */ async ({
    request,
  }) => {
    for (const version of manifest.versions.filter(
      /** Keep entries matching `item.status !== 'preview'`. */ (item) => item.status !== 'preview',
    )) {
      for (const slug of version.slugs) {
        const response = await request.get(`${prefix}/docs/${version.id}/${slug}`);
        expect(response.status(), `${code}/${version.id}/${slug}`).toBe(200);
        const html = await response.text();
        expect(html).toContain(`lang="${code}"`);
        expect(html).toContain(`dir="${metadata.dir}"`);
        expect(html).toContain('<article');
      }
    }
    for (const slug of ['imprint', 'privacy-policy'])
      expect((await request.get(`${prefix}/${slug}`)).status()).toBe(200);
    expect((await request.get(`${prefix}/docs/next/overview`)).status()).toBe(404);
    expect((await request.get(`${prefix}/docs/v99.0/overview`)).status()).toBe(404);
  });

  for (const width of [390, 1440]) {
    for (const mode of ['light', 'dark']) {
      test(`${code} ${width} ${mode}: navigation, search, screenshots, and language switch`, /** Verify the declared behavior. */ async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 1000 });
        await page.addInitScript(
          /** Evaluate `localStorage.setItem('repovio-color-mode', value)`. */ (value) =>
            localStorage.setItem('repovio-color-mode', value),
          mode,
        );
        await page.goto(prefix || '/');
        await expect(page.locator('html')).toHaveAttribute('dir', metadata.dir);
        const imageLocale = code === 'de' ? 'de' : 'en';
        const screenshot = page.locator(`img[src="/images/product/dashboard-${imageLocale}-${mode}.png"]`);
        await expect(screenshot).toBeVisible();
        if (!['en', 'de'].includes(code)) await expect(page.getByTestId('screenshot-language-note')).toBeVisible();
        await expect
          .poll(
            /** Evaluate `screenshot.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)`. */ () =>
              screenshot.evaluate(
                /** Evaluate `img.complete && img.naturalWidth > 0`. */ (img: HTMLImageElement) =>
                  img.complete && img.naturalWidth > 0,
              ),
          )
          .toBe(true);
        await expect
          .poll(
            /** Evaluate `page.locator('body').evaluate((body) => body.scrollWidth <= innerWidth)`. */ () =>
              page
                .locator('body')
                .evaluate(/** Evaluate `body.scrollWidth <= innerWidth`. */ (body) => body.scrollWidth <= innerWidth),
          )
          .toBe(true);

        await page.goto(`${prefix}/docs/${manifest.stable}/authentication`);
        await expect(page.locator('article h1')).toBeVisible();
        await expect(page.locator('html')).toHaveAttribute('lang', code);
        await expect(page.locator('html')).toHaveClass(new RegExp(mode));
        if (width === 1440) {
          await expect(page.getByTestId('docs-navigation').getByRole('heading')).toHaveCount(3);
        } else {
          await page.getByTestId('guides-menu-toggle').click();
          await expect(page.locator('article').getByTestId('docs-navigation').getByRole('heading')).toHaveCount(3);
        }
        await expect
          .poll(
            /** Evaluate `page.locator('body').evaluate((body) => body.scrollWidth <= innerWidth)`. */ () =>
              page
                .locator('body')
                .evaluate(/** Evaluate `body.scrollWidth <= innerWidth`. */ (body) => body.scrollWidth <= innerWidth),
          )
          .toBe(true);
        await expect(page.locator('article pre').first()).toHaveCSS('direction', 'ltr');
        await page.screenshot({ path: `test-results/locale-${code}-${mode}-${width}.png` });

        await page.getByTestId('docs-search-open').click();
        const dialog = page.getByRole('dialog');
        await dialog.getByRole('textbox').fill('MCP');
        const result = dialog.locator(`a[href^="${prefix}/docs/${manifest.stable}/"]`).first();
        await expect(result).toBeVisible();
        await result.click();
        await expect(page).toHaveURL(new RegExp(`${prefix}/docs/${manifest.stable}/`));
        await page.goto(`${prefix}/docs/${manifest.stable}/authentication#groups-roles-and-identities`);
        await page.getByTestId('language-switch').click();
        await page.getByRole('menuitemcheckbox', { name: code === 'en' ? /Deutsch/ : /English/ }).click();
        const targetPrefix = code === 'en' ? '/de' : '';
        await expect(page).toHaveURL(
          new RegExp(`${targetPrefix}/docs/${manifest.stable}/authentication#groups-roles-and-identities$`),
        );
        if (code !== 'en') {
          await page.getByTestId('language-switch').click();
          await page.getByRole('menuitemcheckbox', { name: metadata.name, exact: true }).click();
          await expect(page).toHaveURL(
            new RegExp(`${prefix}/docs/${manifest.stable}/authentication#groups-roles-and-identities$`),
          );
          await expect(page.locator('html')).toHaveAttribute('dir', metadata.dir);
        }
      });
    }
  }
}

test('sitemap includes all canonical locales and omits internal previews and redirects', /** Verify sitemap includes all canonical locales and omits internal previews and redirects. */ async ({
  request,
}) => {
  const sitemap = await (await request.get('/sitemap.xml')).text();
  for (const code of Object.keys(locales)) {
    const prefix = code === 'en' ? '' : `/${code}`;
    expect(sitemap).toContain(`${prefix}/docs/${manifest.stable}/guide-dashboard`);
  }
  expect(sitemap).not.toContain('/next/');
  expect(sitemap).not.toContain('guide-workflow-queues');
});
