import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import locales from '../../content/locales.json' with { type: 'json' };
import de from '../../i18n/locales/de.json' with { type: 'json' };
import en from '../../i18n/locales/en.json' with { type: 'json' };

test('all locale release routes expose localized metadata and canonical links', /** Check real SSR HTML across every supported locale. */ async ({
  request,
}) => {
  for (const [code, metadata] of Object.entries(locales)) {
    const prefix = code === 'en' ? '' : `/${code}`;
    const path = `${prefix}/docs/release-notes`;
    const messages = JSON.parse(await readFile(new URL(`../../i18n/locales/${code}.json`, import.meta.url), 'utf8'));
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toContain(`<title>${messages.releaseNotes} · Repovio</title>`);
    expect(html).toContain(`name="description" content="${messages.releaseNotesDescription}"`);
    expect(html).toContain(`rel="canonical" href="https://repovio.de${path}"`);
    expect(html).toContain(`lang="${code}" dir="${metadata.dir}"`);
    expect(html).toContain('release-notes-body');
    expect(html).toContain('hreflang="x-default"');
  }
});

test('sitemap has one global release-history URL per locale', /** Exclude duplicate history URLs for individual handbook versions. */ async ({
  request,
}) => {
  const response = await request.get('/sitemap.xml');
  expect(response.status()).toBe(200);
  const sitemap = await response.text();
  const urls = [...sitemap.matchAll(/<loc>([^<]*\/docs\/release-notes)<\/loc>/g)].map(
    /** Extract the canonical sitemap destination. */ (match) => match[1],
  );
  expect(urls).toHaveLength(Object.keys(locales).length);
  expect(new Set(urls).size).toBe(urls.length);
  for (const code of Object.keys(locales)) {
    expect(urls).toContain(`https://repovio.de${code === 'en' ? '' : `/${code}`}/docs/release-notes`);
  }
});

test('language switching preserves release fragment and updates metadata', /** Exercise the existing language switch instead of replacing it with a test stub. */ async ({
  page,
}) => {
  await page.goto('/docs/release-notes');
  const heading = page.getByTestId('release-notes-body').locator('h2').nth(1);
  const id = await heading.getAttribute('id');
  await page.goto(`/docs/release-notes#${id}`);
  await page.getByTestId('language-switch').click();
  await page.getByRole('menuitemcheckbox', { name: /Deutsch/ }).click();
  await expect(page).toHaveURL(new RegExp(`/de/docs/release-notes#${id}$`));
  await expect(page).toHaveTitle(`${de.releaseNotes} · Repovio`);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', de.releaseNotesDescription);
  await expect(page.getByRole('heading', { name: de.releaseNotes, level: 1 })).toBeVisible();
  await page.getByTestId('language-switch').click();
  await page.getByRole('menuitemcheckbox', { name: /English/ }).click();
  await expect(page).toHaveURL(new RegExp(`/docs/release-notes#${id}$`));
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', en.releaseNotesDescription);
});
