import { expect, test } from '@playwright/test';
import locales from '../../content/locales.json' with { type: 'json' };
import manifest from '../../content/versions.json' with { type: 'json' };
import { productFeatures, productPaths } from '../../shared/product';

for (const code of Object.keys(locales)) {
  const prefix = code === 'en' ? '' : `/${code}`;
  test(`${code}: product routes, metadata, translated content, and sitemap`, /** Verify the declared behavior. */ async ({
    request,
  }) => {
    const sitemap = await (await request.get('/sitemap.xml')).text();
    for (const path of productPaths) {
      const response = await request.get(prefix + path);
      expect(response.status(), prefix + path).toBe(200);
      const html = await response.text();
      expect(html).toContain(`lang="${code}"`);
      expect(html).toContain(`rel="canonical" href="https://repovio.de${prefix}${path}"`);
      expect(html).not.toMatch(/product_details_[\w-]+_(useCase|limit)</);
      expect(html).toContain('property="og:title"');
      expect(html).toContain('name="description"');
      expect(sitemap).toContain(prefix + path + '</loc>');
    }
    expect((await request.get(`${prefix}/features/not-a-feature`)).status()).toBe(404);
    expect((await request.get(`${prefix}/features/constructor`)).status()).toBe(404);
  });
}

for (const code of ['en', 'de']) {
  for (const mode of ['light', 'dark']) {
    for (const width of [390, 1600]) {
      test(`${code} ${mode} ${width}: complete product journey`, /** Verify the declared behavior. */ async ({
        page,
      }) => {
        test.setTimeout(90_000);
        const prefix = code === 'en' ? '' : '/de';
        const errors: string[] = [];
        page.on('pageerror', /** Evaluate `errors.push(error.message)`. */ (error) => errors.push(error.message));
        await page.setViewportSize({ width, height: 1000 });
        await page.addInitScript(
          /** Evaluate `localStorage.setItem('repovio-color-mode', value)`. */ (value) =>
            localStorage.setItem('repovio-color-mode', value),
          mode,
        );
        await page.goto(`${prefix}/features`);
        if (width === 1600) {
          const trigger = page.getByTestId('features-menu');
          await expect(trigger).toBeEnabled();
          await trigger.focus();
          await page.keyboard.press('Enter');
          await expect(page.getByRole('menuitem')).toHaveCount(8);
          await expect(page.getByRole('menuitem').first()).toBeVisible();
          await page.keyboard.press('Escape');
          await expect(trigger).toBeFocused();
          await trigger.click();
          await page
            .getByRole('menuitem')
            .filter({ hasText: code === 'de' ? 'Repository-Dashboard' : 'Repository dashboard' })
            .click();
        } else {
          const trigger = page.getByTestId('mobile-navigation-open');
          await trigger.click();
          const menu = page.getByTestId('mobile-product-navigation');
          await expect(menu.locator(`a[href="${prefix}/features"]`)).toHaveAttribute('aria-current', 'page');
          await menu.getByTestId('mobile-features-menu').click();
          await expect(menu.locator(`a[href="${prefix}/features/dashboard"]`)).not.toBeVisible();
          await menu.getByTestId('mobile-features-menu').press('Enter');
          await menu.locator(`a[href="${prefix}/features/dashboard"]`).click();
          await expect(page.getByRole('dialog')).not.toBeVisible();
          await trigger.click();
          await page.keyboard.press('Escape');
          await expect(trigger).toBeFocused();
        }
        await expect(page).toHaveURL(new RegExp(`${prefix}/features/dashboard$`));
        if (width === 1600) await expect(page.getByTestId('features-menu')).toHaveAttribute('aria-current', 'true');
        for (const path of productPaths) {
          await page.goto(prefix + path);
          await expect(page.locator('main h1')).toHaveCount(1);
          await expect(page.locator('main h1')).toBeVisible();
          await expect
            .poll(
              /** Evaluate `page.locator('body').evaluate((body) => body.scrollWidth <= innerWidth)`. */ () =>
                page
                  .locator('body')
                  .evaluate(/** Evaluate `body.scrollWidth <= innerWidth`. */ (body) => body.scrollWidth <= innerWidth),
            )
            .toBe(true);
          for (const image of await page.locator('main img:visible').all()) {
            await image.scrollIntoViewIfNeeded();
            await expect
              .poll(
                /** Evaluate `image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)`. */ () =>
                  image.evaluate(
                    /** Evaluate `img.complete && img.naturalWidth > 0`. */ (img: HTMLImageElement) =>
                      img.complete && img.naturalWidth > 0,
                  ),
              )
              .toBe(true);
          }
          await page.screenshot({
            path: `test-results/product-${code}-${mode}-${width}-${path.replaceAll('/', '-')}.png`,
            fullPage: true,
          });
        }
        await page.goto(`${prefix}/features/mcp`);
        await page.getByTestId('language-switch').click();
        await page.getByRole('menuitemcheckbox', { name: code === 'en' ? /Deutsch/ : /English/ }).click();
        await expect(page).toHaveURL(new RegExp(`${code === 'en' ? '/de' : ''}/features/mcp$`));
        await page
          .locator('main')
          .getByRole('link', { name: code === 'en' ? 'Loslegen' : 'Get started', exact: true })
          .click();
        await expect(page).toHaveURL(new RegExp(`/docs/${manifest.stable}/installation$`));
        const switchedPrefix = code === 'en' ? '/de' : '';
        // Nuxt commits its route after page rendering; wait before the route watcher can close a newly opened menu.
        await expect(
          page
            .getByTestId('product-navigation')
            .locator(`a[href="${switchedPrefix}/docs/${manifest.stable}/overview"]`),
        ).toHaveAttribute('aria-current', 'true');
        if (width === 390) await page.getByTestId('mobile-navigation-open').click();
        const navigation = page.getByTestId(width === 390 ? 'mobile-product-navigation' : 'product-navigation');
        await expect(
          navigation.locator(`a[href="${switchedPrefix}/docs/${manifest.stable}/overview"]`),
        ).toHaveAttribute('aria-current', 'true');
        expect(errors).toEqual([]);
      });
    }
  }
}

for (const code of ['fr', 'ru', 'bn', 'ar', 'ur']) {
  test(`${code}: translated header and RTL stay usable around the navigation breakpoint`, /** Verify the declared behavior. */ async ({
    page,
  }) => {
    await page.goto(`/${code}/features/notifications`);
    for (const width of [390, 1535, 1536, 1600]) {
      await page.setViewportSize({ width, height: 1000 });
      await expect
        .poll(
          /** Evaluate `page.locator('body').evaluate((body) => body.scrollWidth <= innerWidth)`. */ () =>
            page
              .locator('body')
              .evaluate(/** Evaluate `body.scrollWidth <= innerWidth`. */ (body) => body.scrollWidth <= innerWidth),
        )
        .toBe(true);
      if (width < 1536) await expect(page.getByTestId('mobile-navigation-open')).toBeVisible();
      else await expect(page.getByTestId('features-menu')).toBeVisible();
    }
    await expect(page.locator('html')).toHaveAttribute('dir', ['ar', 'ur'].includes(code) ? 'rtl' : 'ltr');
    await expect(page.getByTestId('screenshot-language-note')).toBeVisible();
    await page.screenshot({ path: `test-results/product-header-${code}.png`, fullPage: true });
  });
}

test('feature detail links use stable localized handbook pages', /** Verify feature detail links use stable localized handbook pages. */ async ({
  page,
  request,
}) => {
  for (const feature of productFeatures) {
    await page.goto(`/de/features/${feature.slug}`);
    for (const slug of feature.docs) {
      const target = `/de/docs/${manifest.stable}/${slug}`;
      await expect(page.locator(`main a[href="${target}"]`).first()).toBeVisible();
      expect((await request.get(target)).status()).toBe(200);
    }
  }
});
