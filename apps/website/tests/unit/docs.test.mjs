import { readFile } from 'node:fs/promises';
import { expect, it } from 'vitest';
import { checkDocs } from '../../content/scripts/validate.mjs';
it('validates complete multilingual versioned documentation', /** Verify validates complete multilingual versioned documentation. */ async () => {
  const manifest = await checkDocs('content', { assetRoot: 'public', previewAssetRoot: 'captures/next' });
  expect(
    manifest.versions.some(
      /** Check whether an entry matches `version.id === 'next'`. */ (version) => version.id === 'next',
    ),
  ).toBe(true);
});
it('keeps interface keys in sync without silent locale fallback', /** Verify keeps interface keys in sync without silent locale fallback. */ async () => {
  /** Compute `read` as `JSON.parse(await readFile(`i18n/locales/${locale}.json`, 'utf8'))`. */
  const read = async (locale) => JSON.parse(await readFile(`i18n/locales/${locale}.json`, 'utf8'));
  expect(Object.keys(await read('de')).sort()).toEqual(Object.keys(await read('en')).sort());
});

it('covers the canonical Crateview language set and right-to-left locales', /** Verify covers the canonical Crateview language set and right-to-left locales. */ async () => {
  const locales = JSON.parse(await readFile('content/locales.json', 'utf8'));
  expect(Object.keys(locales)).toEqual([
    'en',
    'de',
    'zh-CN',
    'hi',
    'es',
    'ar',
    'fr',
    'bn',
    'pt-BR',
    'id',
    'ur',
    'ru',
    'ja',
  ]);
  expect(
    Object.entries(locales)
      .filter(/** Keep entries matching `locale.dir === 'rtl'`. */ ([, locale]) => locale.dir === 'rtl')
      .map(/** Map each entry to `code`. */ ([code]) => code),
  ).toEqual(['ar', 'ur']);
  const reference = Object.keys(JSON.parse(await readFile('i18n/locales/en.json', 'utf8'))).sort();
  for (const locale of Object.keys(locales)) {
    const messages = JSON.parse(await readFile(`i18n/locales/${locale}.json`, 'utf8'));
    expect(Object.keys(messages).sort(), locale).toEqual(reference);
    expect(
      Object.values(messages).every(
        /** Require every entry to match `typeof value === 'string' && value.trim()`. */ (value) =>
          typeof value === 'string' && value.trim(),
      ),
      locale,
    ).toBe(true);
  }
});
