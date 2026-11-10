import { expect, test } from '@playwright/test';
import manifest from '../../content/versions.json' with { type: 'json' };
import de from '../../i18n/locales/de.json' with { type: 'json' };
import en from '../../i18n/locales/en.json' with { type: 'json' };
import { readReleaseNotes, validateReleaseNotes } from '../../scripts/check-release-notes.mjs';

for (const [code, messages] of [
  ['en', en],
  ['de', de],
] as const) {
  const prefix = code === 'en' ? '' : `/${code}`;
  test(`${code}: fourth tab opens complete public release history`, /** Verify real navigation, SSR reload, and existing destinations. */ async ({
    page,
  }) => {
    const external: string[] = [];
    page.on(
      'request',
      /** Record external release-service requests rather than allowing a hidden remote dependency. */ (request) => {
        if (/api\.github\.com|github\.com\/.*releases/.test(request.url())) external.push(request.url());
      },
    );
    await page.goto(`${prefix}/docs/${manifest.stable}/overview`);
    const toolbar = page.getByTestId('docs-toolbar');
    await expect(toolbar.getByRole('link')).toHaveText([
      messages.getStarted,
      messages.guides,
      messages.api,
      messages.releaseNotes,
    ]);
    await toolbar.getByRole('link', { name: messages.releaseNotes, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${prefix}/docs/release-notes$`));
    await expect(page.getByRole('heading', { name: messages.releaseNotes, exact: true, level: 1 })).toBeVisible();
    await expect(toolbar.getByRole('link', { name: messages.releaseNotes, exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(page.getByTestId('release-history')).toContainText(
      'Apply the additive notification-attempt migrations',
    );
    await expect(page.getByRole('heading', { name: 'Changelog', exact: true })).toHaveCount(0);
    await expect(toolbar.getByRole('combobox')).toHaveCount(0);
    await page.reload();
    await expect(page.getByTestId('release-history')).toBeVisible();
    await toolbar.getByRole('link', { name: messages.guides, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/docs/${manifest.stable}/`));
    await expect(toolbar.getByRole('combobox')).toBeVisible();
    expect(external).toEqual([]);
  });
}

for (const [code, messages] of [
  ['en', en],
  ['de', de],
] as const) {
  const prefix = code === 'en' ? '' : `/${code}`;
  test(`${code}: archived handbook retains its existing tab availability`, /** Verify the real archive rather than mocking version entries. */ async ({
    page,
  }) => {
    await page.goto(`${prefix}/docs/v1.0/overview`);
    const toolbar = page.getByTestId('docs-toolbar');
    await expect(toolbar.getByRole('link')).toHaveText([messages.getStarted, messages.guides, messages.releaseNotes]);
    await expect(toolbar.getByRole('link', { name: messages.guides, exact: true })).toHaveAttribute(
      'href',
      /\/docs\/v1\.0\//,
    );
    await toolbar.getByRole('link', { name: messages.releaseNotes, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${prefix}/docs/release-notes$`));
    await expect(page.getByTestId('release-history')).toBeVisible();
  });
}

for (const prefix of ['', '/de']) {
  test(`${prefix || 'en'}: release TOC follows actual rendered headings`, /** Verify stable release links, complete history, and actual browser fragments. */ async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`${prefix}/docs/release-notes`);
    const headings = page.getByTestId('release-notes-body').locator('h2');
    const versions = await headings.allTextContents();
    const expectedVersions = validateReleaseNotes(readReleaseNotes());
    expect(versions).toEqual(expectedVersions);
    const ids = await headings.evaluateAll(
      /** Read IDs emitted by the real Markdown renderer. */ (elements) =>
        elements.map(/** Preserve each DOM heading identifier. */ (element) => element.id),
    );
    expect(new Set(ids).size).toBe(ids.length);
    const toc = page.getByTestId('release-desktop-toc');
    const href = `#${ids[1]}`;
    await toc.locator(`a[href="${href}"]`).click();
    await expect(page).toHaveURL(new RegExp(`${href}$`));
    // Router history updates before smooth scrolling completes; reload only after the anchor is fully reached.
    await expect(headings.nth(1)).toBeInViewport({ ratio: 1 });
    await page.reload();
    await expect(headings.nth(1)).toBeInViewport();
    await expect(page.getByTestId('release-notes-body')).toContainText(
      'Apply the additive notification-attempt migrations before starting the updated API.',
    );
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto(`${prefix}/docs/release-notes`);
    const mobile = page.getByTestId('release-mobile-toc');
    await mobile.locator('summary').click();
    await mobile.locator(`a[href="${href}"]`).click();
    await expect(page).toHaveURL(new RegExp(`${href}$`));
    await expect(headings.nth(1)).toBeInViewport();
  });
}
