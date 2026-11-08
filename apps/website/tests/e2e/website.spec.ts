import { expect, test } from '@playwright/test';
import manifest from '../../content/versions.json' with { type: 'json' };

for (const locale of ['en', 'de']) {
  const prefix = locale === 'de' ? '/de' : '';
  for (const mode of ['light', 'dark']) {
    for (const width of [390, 1440]) {
      test(`${locale} ${mode} ${width}: product and documentation journey`, /** Verify the declared behavior. */ async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 1000 });
        await page.addInitScript(
          /** Evaluate `localStorage.setItem('repovio-color-mode', value)`. */ (value) =>
            localStorage.setItem('repovio-color-mode', value),
          mode,
        );
        await page.goto(prefix || '/');
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
          locale === 'de' ? 'Deine Repositories.' : 'Your repositories.',
        );
        await expect(page.locator('html')).toHaveAttribute('lang', locale);
        await expect(page.locator('html')).toHaveClass(new RegExp(mode));
        await expect
          .poll(
            /** Evaluate `page.locator('body').evaluate((body) => body.scrollWidth <= window.innerWidth)`. */ () =>
              page
                .locator('body')
                .evaluate(
                  /** Evaluate `body.scrollWidth <= window.innerWidth`. */ (body) =>
                    body.scrollWidth <= window.innerWidth,
                ),
          )
          .toBe(true);
        const screenshot = page.locator(`img[src="/images/product/dashboard-${locale}-${mode}.png"]`);
        await expect(screenshot).toBeVisible();
        await expect
          .poll(
            /** Evaluate `screenshot.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)`. */ () =>
              screenshot.evaluate(
                /** Evaluate `img.complete && img.naturalWidth > 0`. */ (img: HTMLImageElement) =>
                  img.complete && img.naturalWidth > 0,
              ),
          )
          .toBe(true);
        await page
          .getByRole('link', { name: locale === 'de' ? 'Loslegen' : 'Get started', exact: true })
          .first()
          .click();
        await expect(page).toHaveURL(new RegExp(`/docs/${manifest.stable}/installation$`));
        await expect(page.locator('article h1')).toHaveCount(1);
        await expect(page.locator('article h1')).toBeVisible();
        await page
          .getByRole('button', {
            name: locale === 'de' ? 'Dokumentation durchsuchen' : 'Search documentation',
            exact: true,
          })
          .click();
        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible();
        await dialog.getByRole('textbox').fill('MCP');
        await expect(dialog.getByRole('link').first()).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(dialog).not.toBeVisible();
        await page.screenshot({ path: `test-results/docs-${locale}-${mode}-${width}.png`, fullPage: true });
      });
    }
  }
  test(`${locale}: released routes resolve and preview routes stay private`, /** Verify the declared behavior. */ async ({
    page,
    request,
  }) => {
    for (const version of manifest.versions.filter(
      /** Keep entries matching `entry.status !== 'preview'`. */ (entry) => entry.status !== 'preview',
    )) {
      for (const slug of version.slugs) {
        const result = await request.get(`${prefix}/docs/${version.id}/${slug}`);
        expect(result.status(), slug).toBe(200);
        expect(await result.text()).toContain('<article');
      }
    }
    expect((await request.get(`${prefix}/docs/next/overview`)).status()).toBe(404);
    expect((await request.get(`${prefix}/docs/v99.0/overview`)).status()).toBe(404);
    const redirected = await request.get(`${prefix}/docs/guide/dashboard`);
    expect(redirected.url()).toContain(`/docs/${manifest.stable}/guide-dashboard`);
    await page.goto(`${prefix}/docs/overview`);
    await expect(page).toHaveURL(new RegExp(`/docs/${manifest.stable}/overview$`));
  });
}
test('search indices and sitemap exclude unpublished sources', /** Verify search indices and sitemap exclude unpublished sources. */ async ({
  request,
}) => {
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap).not.toContain('/next/');
  expect(sitemap).toContain('/de/docs/');
  expect((await request.get('/images/docs/next/capture.json')).status()).toBe(404);
});

test('language and theme controls persist across navigation and reload', /** Verify language and theme controls persist across navigation and reload. */ async ({
  page,
}) => {
  await page.addInitScript(
    /** Handle each page.addInitScript callback invocation. */ () => {
      if (!localStorage.getItem('repovio-color-mode')) localStorage.setItem('repovio-color-mode', 'light');
    },
  );
  await page.goto(`/docs/${manifest.stable}/overview`);
  await expect(page.getByTestId('language-switch')).toBeEnabled();
  await page.getByTestId('language-switch').press('Enter');
  await page.getByRole('menuitemcheckbox', { name: /Deutsch/ }).click();
  await expect(page).toHaveURL(new RegExp(`/de/docs/${manifest.stable}/overview$`));
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await page.getByTestId('theme-switch').click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await page.getByTestId('language-switch').click();
  await page.getByRole('menuitemcheckbox', { name: /English/ }).click();
  await expect(page).toHaveURL(new RegExp(`(?<!/de)/docs/${manifest.stable}/overview$`));
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

for (const locale of ['en', 'de']) {
  const prefix = locale === 'en' ? '' : `/${locale}`;
  test(`${locale}: guide sections, split destinations, and localized content links`, /** Verify the declared behavior. */ async ({
    page,
  }) => {
    await page.goto(`${prefix}/docs/${manifest.stable}/guide-dashboard`);
    await expect(page.locator('a[href*="/edit/main/"]')).toHaveAttribute(
      'href',
      `https://github.com/repovio/repovio/edit/main/apps/website/content/${locale}/docs/${manifest.stable}/guide-dashboard.md`,
    );
    const navigation = page.getByTestId('docs-navigation');
    await expect(navigation.getByRole('heading')).toHaveText(
      locale === 'en' ? ['Overview', 'Operations', 'Administration'] : ['Übersicht', 'Betrieb', 'Verwaltung'],
    );
    await navigation.locator(`a[href="${prefix}/docs/${manifest.stable}/guide-pull-requests"]`).click();
    await expect(page.locator('article h1')).toBeVisible();
    await page.goto(`${prefix}/docs/${manifest.stable}/installation`);
    await expect(page.locator(`article a[href="${prefix}/docs/${manifest.stable}/sign-in"]`)).toBeVisible();
    await page.locator(`article a[href="${prefix}/docs/${manifest.stable}/sign-in"]`).click();
    await expect(page).toHaveURL(new RegExp(`${prefix}/docs/${manifest.stable}/sign-in$`));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${prefix}/docs/${manifest.stable}/guide-dashboard`);
    await page.getByTestId('guides-menu-toggle').click();
    await page
      .locator('article')
      .getByTestId('docs-navigation')
      .getByRole('link', { name: 'Issues', exact: true })
      .click();
    await expect(page).toHaveURL(new RegExp(`${prefix}/docs/${manifest.stable}/guide-issues$`));
    await expect(page.getByTestId('guides-menu-toggle')).toHaveAttribute('aria-expanded', 'false');
  });
}

test('legacy combined pages preserve localized bookmarks across the HTTP redirect', /** Verify legacy combined pages preserve localized bookmarks across the HTTP redirect. */ async ({
  page,
}) => {
  await page.goto(`/de/docs/${manifest.stable}/guide-administration#benutzer-und-rechte`);
  await expect(page).toHaveURL(new RegExp(`/de/docs/${manifest.stable}/users$`));
  await page.goto(`/docs/${manifest.stable}/guide-workflow-queues#needs-attention`);
  await expect(page).toHaveURL(new RegExp(`/docs/${manifest.stable}/needs-attention$`));
});
