import { strict as assert } from 'node:assert';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { checkDocs } from '../scripts/validate.mjs';

/** Build an isolated complete handbook fixture with stable anchors and executable examples. */
async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'repovio-docs-'));
  t.after(
    /** Evaluate `rm(root, { recursive: true, force: true })`. */ () => rm(root, { recursive: true, force: true }),
  );
  /** Compute `json` as `writeFile(join(root, file), JSON.stringify(data))`. */
  const json = (file, data) => writeFile(join(root, file), JSON.stringify(data));
  const navigation = {
    entries: [{ slug: 'overview', tab: 'guides', section: 'overview', group: 'dashboard', order: 0 }],
    groups: [
      { id: 'dashboard', section: 'overview', title: 'dashboard', icon: 'i-lucide-layout-dashboard', slug: 'overview' },
    ],
    redirects: { legacy: { to: 'overview', anchors: { old: 'overview' } } },
  };
  await json('locales.json', {
    en: { name: 'English', collection: 'docs_en', dir: 'ltr' },
    de: { name: 'Deutsch', collection: 'docs_de', dir: 'ltr' },
  });
  await json('navigation.json', navigation);
  await json('versions.json', {
    stable: 'v1.0',
    versions: [{ id: 'v1.0', revision: 'a'.repeat(40), status: 'stable', slugs: ['overview'] }],
  });
  /** Compute `page` as ``---\ntitle: ${title}\ndescription: ${title} guide\n---\n\n<a id="details"></a>\n\n## ${title}\n\nRead \`TOKEN_ENCRYPTION_KEY\`.\n\n[Details`. */
  const page = (title) =>
    `---\ntitle: ${title}\ndescription: ${title} guide\n---\n\n<a id="details"></a>\n\n## ${title}\n\nRead \`TOKEN_ENCRYPTION_KEY\`.\n\n[Details](/docs/v1.0/overview#details)\n`;
  for (const locale of ['en', 'de']) {
    await mkdir(join(root, locale, 'docs/v1.0'), { recursive: true });
    await writeFile(join(root, locale, 'docs/v1.0/overview.md'), page(locale));
  }
  return { root, json, navigation, page };
}

test('accepts complete versioned translations and stable cross-page anchors', /** Verify accepts complete versioned translations and stable cross-page anchors. */ async (t) => {
  const { root } = await fixture(t);
  assert.equal((await checkDocs(root)).stable, 'v1.0');
});

test('rejects missing translated pages', /** Verify rejects missing translated pages. */ async (t) => {
  const { root } = await fixture(t);
  await rm(join(root, 'de/docs/v1.0/overview.md'));
  await assert.rejects(checkDocs(root));
});

test('rejects unknown groups and groups in a different application section', /** Verify rejects unknown groups and groups in a different application section. */ async (t) => {
  const { root, json, navigation } = await fixture(t);
  navigation.entries[0].group = 'missing';
  await json('navigation.json', navigation);
  await assert.rejects(checkDocs(root), /invalid navigation metadata/);
  navigation.entries[0].group = 'dashboard';
  navigation.groups[0].section = 'operations';
  await json('navigation.json', navigation);
  await assert.rejects(checkDocs(root), /invalid navigation metadata/);
});

test('rejects duplicate group IDs and invalid landing pages', /** Verify rejects duplicate group IDs and invalid landing pages. */ async (t) => {
  const { root, json, navigation } = await fixture(t);
  navigation.groups.push({ ...navigation.groups[0], slug: 'missing' });
  await json('navigation.json', navigation);
  await assert.rejects(checkDocs(root), /unique IDs[\s\S]*invalid navigation group/);
});

test('rejects a translation that changes a technical identifier', /** Verify rejects a translation that changes a technical identifier. */ async (t) => {
  const { root, page } = await fixture(t);
  await writeFile(join(root, 'de/docs/v1.0/overview.md'), page('Deutsch').replace('TOKEN_ENCRYPTION_KEY', 'OTHER_KEY'));
  await assert.rejects(checkDocs(root), /translated technical identifiers/);
});

test('rejects broken fragment links', /** Verify rejects broken fragment links. */ async (t) => {
  const { root, page } = await fixture(t);
  await writeFile(join(root, 'de/docs/v1.0/overview.md'), page('Deutsch').replace('#details)', '#missing)'));
  await assert.rejects(checkDocs(root), /missing anchor/);
});

test('rejects duplicate navigation and combined-page redirect targets without a replacement', /** Verify rejects duplicate navigation and combined-page redirect targets without a replacement. */ async (t) => {
  const { root, json, navigation } = await fixture(t);
  navigation.entries.push({ ...navigation.entries[0] });
  navigation.redirects.legacy.to = 'absent';
  await json('navigation.json', navigation);
  await assert.rejects(checkDocs(root), /unique slugs and order[\s\S]*invalid redirect/);
});

test('ships the full canonical language set with Arabic and Urdu direction metadata', /** Verify ships the full canonical language set with Arabic and Urdu direction metadata. */ async () => {
  const { readLocales } = await import('../scripts/validate.mjs');
  const locales = await readLocales(new URL('../', import.meta.url).pathname);
  assert.deepEqual(Object.keys(locales), [
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
  assert.deepEqual(
    Object.entries(locales)
      .filter(/** Keep entries matching `value.dir === 'rtl'`. */ ([, value]) => value.dir === 'rtl')
      .map(/** Map each entry to `code`. */ ([code]) => code),
    ['ar', 'ur'],
  );
});

test('rejects an untranslated description even when the page body is localized', /** Verify rejects an untranslated description even when the page body is localized. */ async (t) => {
  const { root, page } = await fixture(t);
  await writeFile(
    join(root, 'de/docs/v1.0/overview.md'),
    page('Deutsch').replace('description: Deutsch guide', 'description: en guide'),
  );
  await assert.rejects(checkDocs(root), /untranslated English description/);
});
