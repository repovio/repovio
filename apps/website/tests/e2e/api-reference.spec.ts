import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import locales from '../../content/locales.json' with { type: 'json' };
import manifest from '../../content/versions.json' with { type: 'json' };
import { apiEndpoints, type ApiDocument } from '../../shared/openapi';

const version = manifest.versions.find(
  /** Find the entry matching `entry.id === process.env.API_REFERENCE_FIXTURE_VERSION && entry.status !== 'preview' && entry.slugs.includes('api-reference')`. */ (
    entry,
  ) =>
    entry.id === process.env.API_REFERENCE_FIXTURE_VERSION &&
    entry.status !== 'preview' &&
    entry.slugs.includes('api-reference'),
);

const messages = Object.fromEntries(
  await Promise.all(
    Object.keys(locales).map(
      /** Map each entry to `[ locale, JSON.parse(await readFile(new URL(`../../i18n/locales/${locale}.json`, import.meta.url), 'utf8')), ]`. */ async (
        locale,
      ) => [locale, JSON.parse(await readFile(new URL(`../../i18n/locales/${locale}.json`, import.meta.url), 'utf8'))],
    ),
  ),
);

for (const locale of Object.keys(locales)) {
  for (const mode of ['light', 'dark']) {
    for (const width of [390, 1440]) {
      test(`${locale} ${mode} ${width}: native API reference`, /** Verify the declared behavior. */ async ({
        page,
        request,
        baseURL,
      }) => {
        test.skip(!version, 'Run against a temporary released API fixture until the first API documentation release.');
        const prefix = locale === 'en' ? '' : `/${locale}`;
        const external: string[] = [];
        page.on(
          'request',
          /** Handle each page.on callback invocation. */ (event) => {
            if (
              (!event.url().startsWith(`${baseURL}/`) && !event.url().startsWith('data:')) ||
              new URL(event.url()).pathname.startsWith('/api/v1')
            )
              external.push(event.url());
          },
        );
        await page.setViewportSize({ width, height: 1000 });
        await page.addInitScript(
          /** Evaluate `localStorage.setItem('repovio-color-mode', value)`. */ (value) =>
            localStorage.setItem('repovio-color-mode', value),
          mode,
        );
        await page.goto(`${prefix}/docs/${version!.id}/api-reference`);
        await expect(page.locator('article h1')).toBeVisible();
        await expect(page.locator('html')).toHaveAttribute('lang', locale);
        await expect(page.locator('html')).toHaveClass(new RegExp(mode));
        const search = page.getByRole('textbox', {
          name: messages[locale].apiSearch,
        });
        await expect(search).toBeVisible();
        await search.fill('GET /api/v1/items');
        await expect(page.locator('section[id^="endpoint-"]')).toHaveCount(1);
        await expect(page.getByRole('status').filter({ hasText: /1/ })).toBeVisible();
        await search.fill('not-an-endpoint');
        await expect(page.getByText(messages[locale].apiNoResults, { exact: false })).toBeVisible();
        await search.fill('GET /api/v1/items');
        const endpoint = page.locator('section[id^="endpoint-"]').first();
        const anchor = await endpoint.getAttribute('id');
        await expect(endpoint.locator('h3 a')).toHaveCSS('direction', 'ltr');
        await expect(
          page.getByRole('navigation', { name: messages[locale].apiEndpoints }).getByRole('link').first(),
        ).toHaveCSS('direction', 'ltr');
        await page.getByRole('navigation', { name: messages[locale].apiEndpoints }).getByRole('link').first().click();
        await expect(page).toHaveURL(new RegExp(`#${anchor}$`));
        await endpoint.locator('summary').filter({ hasText: '200' }).click();
        const properties = endpoint.locator('summary').filter({ hasText: messages[locale].apiProperties }).first();
        await properties.focus();
        await page.keyboard.press('Enter');
        await expect(endpoint.getByText('A synthetic display name')).toBeVisible();
        await expect(endpoint.getByText('nullable', { exact: true })).toBeVisible();
        await expect(endpoint.getByText('allOf', { exact: true })).toHaveCount(0);
        await expect(endpoint.getByText(messages[locale].apiSchemaLimit, { exact: false })).toBeVisible();
        const download = page.getByRole('link', {
          name: messages[locale].apiDownload,
        });
        await expect(download).toHaveAttribute('download', '');
        const json = await request.get((await download.getAttribute('href'))!);
        expect(json.ok()).toBe(true);
        expect((await json.json()).openapi).toMatch(/^3\./);
        await expect
          .poll(
            /** Evaluate `page.locator('body').evaluate((body) => body.scrollWidth <= innerWidth)`. */ () =>
              page
                .locator('body')
                .evaluate(/** Evaluate `body.scrollWidth <= innerWidth`. */ (body) => body.scrollWidth <= innerWidth),
          )
          .toBe(true);
        expect(external).toEqual([]);
        await search.scrollIntoViewIfNeeded();
        await expect(search).toBeInViewport();
        await page.screenshot({ path: `test-results/api-${locale}-${mode}-${width}.png`, fullPage: true });
        await search.fill('PATCH /api/v1/items');
        await expect(page.locator('section[id^="endpoint-"]')).toHaveCount(1);
        await expect(page.getByText('allOf', { exact: true })).toBeVisible();
        await expect(page.getByText(messages[locale].apiRequestBody, { exact: true })).toBeVisible();
        await search.fill('GET /api/v1/items');
        await page.reload();
        await expect(page.locator(`section[id="${anchor}"]`)).toBeVisible();
      });
    }
  }
}

test('unreleased API pages and schema downloads stay private', /** Verify unreleased API pages and schema downloads stay private. */ async ({
  request,
}) => {
  for (const prefix of Object.keys(locales).map(
    /** Map each entry to `(code === 'en' ? '' : `/${code}`)`. */ (code) => (code === 'en' ? '' : `/${code}`),
  )) {
    expect((await request.get(`${prefix}/docs/next/api-reference`)).status()).toBe(404);
    expect((await request.get(`${prefix}/docs/v1.0/api-reference`)).status()).toBe(404);
  }
  expect((await request.get('/openapi/next.json')).status()).toBe(404);
  expect((await request.get('/openapi/v1.0.json')).status()).toBe(404);
  expect((await request.get('/openapi/v99.0.json')).status()).toBe(404);
});

test('renders the real exported contract without contacting an application', /** Verify renders the real exported contract without contacting an application. */ async ({
  page,
  request,
}) => {
  const version = process.env.API_REFERENCE_REAL_VERSION;
  test.skip(!version, 'Set API_REFERENCE_SCHEMA_FILE to verify a real monorepo export.');
  const document = (await (await request.get(`/openapi/${version}.json`)).json()) as ApiDocument;
  const endpoints = apiEndpoints(document);
  const errors: string[] = [];
  page.on('pageerror', /** Evaluate `errors.push(error.message)`. */ (error) => errors.push(error.message));
  await page.goto(`/docs/${version}/api-reference`);
  await expect(page.locator('section[id^="endpoint-"]')).toHaveCount(endpoints.length);
  await page.getByRole('textbox', { name: 'Search endpoints' }).fill(`${endpoints[0]!.method} ${endpoints[0]!.path}`);
  await expect(page.locator('section[id^="endpoint-"]')).not.toHaveCount(0);
  expect(errors).toEqual([]);
  await page.evaluate(/** Evaluate `window.scrollTo(0, 0)`. */ () => window.scrollTo(0, 0));
  await page.screenshot({ path: 'test-results/api-real-export.png', fullPage: true });
});

test('shows a load error when a schema request fails during client navigation', /** Verify shows a load error when a schema request fails during client navigation. */ async ({
  page,
}) => {
  test.skip(!version, 'Run against the isolated API fixture.');
  await page.goto(`/docs/${version!.id}/api-access`);
  await page.route(
    `**/openapi/${version!.id}.json`,
    /** Evaluate `route.fulfill({ status: 503, body: 'Unavailable' })`. */ (route) =>
      route.fulfill({ status: 503, body: 'Unavailable' }),
  );
  await page.locator(`article a[href="/docs/${version!.id}/api-reference"]`).first().click();
  await expect(page.getByText('The API schema could not be loaded. Reload the page to try again.')).toBeVisible();
  await expect(page.locator('section[id^="endpoint-"]')).toHaveCount(0);
});
