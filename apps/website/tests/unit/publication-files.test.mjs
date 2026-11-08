import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import registry from '../../content/locales.json' with { type: 'json' };
import { verifyOpenApiArchive } from '../../content/scripts/openapi.mjs';
import { preparePublication } from '../../scripts/publication.mjs';
import { recordPublication } from '../../scripts/record-publication.mjs';

/** Create an isolated Git fixture; no project checkout is committed or changed. */
async function fixture({ invalidSchema = false, api = true } = {}) {
  const root = await mkdtemp(join(tmpdir(), 'repovio-publication-'));
  const appRoot = join(root, 'app');
  const sourceDocsRoot = join(root, 'snapshot');
  const docsRoot = join(root, 'docs');
  const websiteRoot = join(root, 'website');
  /** Compute `git` as `execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()`. */
  const git = (cwd, ...args) =>
    execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  /** Execute the commit operation. */
  const commit = (cwd, message = 'fixture') => {
    git(cwd, 'add', '.');
    git(
      cwd,
      '-c',
      'user.name=Fixture',
      '-c',
      'user.email=fixture@example.invalid',
      '-c',
      'commit.gpgsign=false',
      'commit',
      '-qm',
      message,
    );
    return git(cwd, 'rev-parse', 'HEAD');
  };
  for (const directory of [appRoot, sourceDocsRoot, websiteRoot]) await mkdir(directory);
  git(appRoot, 'init', '-q');
  await writeFile(
    join(appRoot, 'package.json'),
    JSON.stringify({ name: '@repovio/api', version: '2.0.0', scripts: { 'openapi:export': 'node export.mjs' } }),
  );
  const document = invalidSchema ? '{}' : await readFile(new URL('../fixtures/openapi.json', import.meta.url), 'utf8');
  await writeFile(
    join(appRoot, 'export.mjs'),
    `import { writeFile } from 'node:fs/promises';\nawait writeFile(process.argv[2], ${JSON.stringify(document)});\n`,
  );
  await writeFile(join(appRoot, '.gitignore'), 'node_modules\n');
  const revision = commit(appRoot);
  git(sourceDocsRoot, 'init', '-q');
  const manifest = {
    stable: 'v1.0',
    versions: [
      { id: 'v1.0', release: '1.0.1', revision, status: 'stable', slugs: ['overview'] },
      {
        id: 'next',
        release: null,
        revision,
        status: 'preview',
        slugs: api ? ['overview', 'api-reference'] : ['overview'],
      },
    ],
  };
  await writeFile(join(sourceDocsRoot, 'versions.json'), JSON.stringify(manifest));
  await writeFile(join(sourceDocsRoot, 'locales.json'), JSON.stringify(registry));
  for (const locale of Object.keys(registry)) {
    await mkdir(join(sourceDocsRoot, locale, 'docs/next'), { recursive: true });
    await writeFile(
      join(sourceDocsRoot, locale, 'docs/next/overview.md'),
      '# Overview\n[Guide](/docs/next/overview)\n',
    );
  }
  if (api)
    for (const locale of Object.keys(registry))
      await writeFile(join(sourceDocsRoot, locale, 'docs/next/api-reference.md'), '# API reference\n');
  const docsRevision = commit(sourceDocsRoot);
  await cp(sourceDocsRoot, docsRoot, { recursive: true });
  return {
    root,
    appRoot,
    docsRoot,
    websiteRoot,
    sourceDocsRoot,
    git,
    commit,
    request: { tag: 'repovio@2.0.0', revision, docsRevision },
  };
}
it('creates a complete multilingual archive and safely recovers after the docs commit precedes website publication', /** Verify creates a complete multilingual archive and safely recovers after the docs commit precedes website publication. */ async () => {
  const value = await fixture();
  try {
    const plan = await preparePublication(value);
    expect(plan.existing).toBe(false);
    const manifest = JSON.parse(await readFile(join(value.docsRoot, 'versions.json'), 'utf8'));
    expect(manifest.stable).toBe('v2.0');
    const archive = manifest.versions.find(
      /** Find the entry matching `version.id === 'v2.0'`. */ (version) => version.id === 'v2.0',
    );
    const bytes = await readFile(join(value.docsRoot, 'openapi/v2.0.json'));
    expect(archive.openapi).toEqual({
      file: 'openapi/v2.0.json',
      revision: value.request.revision,
      sha256: createHash('sha256').update(bytes).digest('hex'),
    });
    expect(
      manifest.versions.find(/** Find the entry matching `version.id === 'v1.0'`. */ (version) => version.id === 'v1.0')
        .status,
    ).toBe('archived');
    for (const locale of Object.keys(registry))
      expect(await readFile(join(value.docsRoot, locale, 'docs/v2.0/overview.md'), 'utf8')).toContain(
        '/docs/v2.0/overview',
      );
    value.git(value.docsRoot, 'add', 'versions.json', '*/docs/v*', 'openapi');
    const staged = value.git(value.docsRoot, 'diff', '--cached', '--name-only').split('\n');
    for (const locale of Object.keys(registry)) expect(staged).toContain(`${locale}/docs/v2.0/overview.md`);
    expect(staged).toContain('openapi/v2.0.json');
    value.commit(value.docsRoot);
    expect((await preparePublication(value)).existing).toBe(true);
    expect(value.git(value.docsRoot, 'status', '--porcelain')).toBe('');
  } finally {
    await rm(value.root, { recursive: true, force: true });
  }
});
it('does not update the published manifest when a translation is absent', /** Verify does not update the published manifest when a translation is absent. */ async () => {
  const value = await fixture();
  try {
    const before = await readFile(join(value.docsRoot, 'versions.json'), 'utf8');
    await rm(join(value.sourceDocsRoot, 'ja/docs/next/overview.md'));
    value.request.docsRevision = value.commit(value.sourceDocsRoot);
    await expect(preparePublication(value)).rejects.toThrow();
    expect(await readFile(join(value.docsRoot, 'versions.json'), 'utf8')).toBe(before);
    await expect(readFile(join(value.docsRoot, 'en/docs/v2.0/overview.md'), 'utf8')).rejects.toThrow();
  } finally {
    await rm(value.root, { recursive: true, force: true });
  }
});
it('rejects documentation whose reviewed revision predates application behavior changes', /** Verify rejects documentation whose reviewed revision predates application behavior changes. */ async () => {
  const value = await fixture();
  try {
    await writeFile(join(value.appRoot, 'behavior.ts'), 'export const changed = true;');
    value.request.revision = value.commit(value.appRoot);
    await expect(preparePublication(value)).rejects.toThrow('not reviewed');
  } finally {
    await rm(value.root, { recursive: true, force: true });
  }
});

it('rejects missing, modified, and misattributed archived schemas on retry', /** Verify rejects missing, modified, and misattributed archived schemas on retry. */ async () => {
  const value = await fixture();
  try {
    await preparePublication(value);
    const file = join(value.docsRoot, 'openapi/v2.0.json');
    const bytes = await readFile(file);
    const manifest = JSON.parse(await readFile(join(value.docsRoot, 'versions.json'), 'utf8'));
    const archive = manifest.versions.find(
      /** Find the entry matching `entry.id === 'v2.0'`. */ (entry) => entry.id === 'v2.0',
    );
    await verifyOpenApiArchive(value.docsRoot, archive);
    await writeFile(file, '{}');
    await expect(preparePublication(value)).rejects.toThrow('checksum');
    await rm(file);
    await expect(preparePublication(value)).rejects.toThrow();
    await writeFile(file, bytes);
    await expect(
      verifyOpenApiArchive(value.docsRoot, { ...archive, openapi: { ...archive.openapi, revision: 'f'.repeat(40) } }),
    ).rejects.toThrow('provenance');
  } finally {
    await rm(value.root, { recursive: true, force: true });
  }
});
it('rejects invalid exported schemas without publishing a manifest', /** Verify rejects invalid exported schemas without publishing a manifest. */ async () => {
  const value = await fixture({ invalidSchema: true });
  try {
    const before = await readFile(join(value.docsRoot, 'versions.json'), 'utf8');
    await expect(preparePublication(value)).rejects.toThrow('Invalid OpenAPI');
    expect(await readFile(join(value.docsRoot, 'versions.json'), 'utf8')).toBe(before);
  } finally {
    await rm(value.root, { recursive: true, force: true });
  }
});
it('keeps historical publications without API pages compatible', /** Verify keeps historical publications without API pages compatible. */ async () => {
  const value = await fixture({ api: false });
  try {
    await preparePublication(value);
    const manifest = JSON.parse(await readFile(join(value.docsRoot, 'versions.json'), 'utf8'));
    const archive = manifest.versions.find(
      /** Find the entry matching `entry.id === 'v2.0'`. */ (entry) => entry.id === 'v2.0',
    );
    expect(archive.openapi).toBeUndefined();
    await verifyOpenApiArchive(value.docsRoot, archive);
  } finally {
    await rm(value.root, { recursive: true, force: true });
  }
});

it('hashes every canonical locale and changes the digest when a non-English translation changes', /** Verify hashes every canonical locale and changes the digest when a non-English translation changes. */ async () => {
  const first = await fixture();
  const second = await fixture();
  try {
    await preparePublication(first);
    const digest = createHash('sha256');
    for (const locale of Object.keys(registry).sort()) {
      for (const slug of ['overview', 'api-reference']) {
        const body = await readFile(join(first.sourceDocsRoot, locale, 'docs/next', slug + '.md'), 'utf8');
        digest.update(locale + '/' + slug + '\0' + body);
      }
    }
    const original = JSON.parse(await readFile(join(first.docsRoot, 'versions.json'), 'utf8'));
    const originalDigest = original.versions.find(
      /** Find the entry matching `version.id === 'v2.0'`. */ (version) => version.id === 'v2.0',
    ).contentDigest;
    expect(originalDigest).toBe(digest.digest('hex'));
    await writeFile(join(second.sourceDocsRoot, 'fr/docs/next/overview.md'), '# Présentation\nTexte révisé.\n');
    second.request.docsRevision = second.commit(second.sourceDocsRoot);
    await preparePublication(second);
    const changed = JSON.parse(await readFile(join(second.docsRoot, 'versions.json'), 'utf8'));
    expect(
      changed.versions.find(/** Find the entry matching `version.id === 'v2.0'`. */ (version) => version.id === 'v2.0')
        .contentDigest,
    ).not.toBe(originalDigest);
  } finally {
    await rm(first.root, { recursive: true, force: true });
    await rm(second.root, { recursive: true, force: true });
  }
});

it('rejects incomplete archived translations on retry without changing the manifest', /** Verify rejects incomplete archived translations on retry without changing the manifest. */ async () => {
  const value = await fixture();
  try {
    await preparePublication(value);
    const before = await readFile(join(value.docsRoot, 'versions.json'), 'utf8');
    await rm(join(value.docsRoot, 'ur/docs/v2.0/overview.md'));
    await expect(preparePublication(value)).rejects.toThrow();
    expect(await readFile(join(value.docsRoot, 'versions.json'), 'utf8')).toBe(before);
  } finally {
    await rm(value.root, { recursive: true, force: true });
  }
});

it('rejects changed archived content on retry', /** Verify rejects changed archived content on retry. */ async () => {
  const value = await fixture();
  try {
    await preparePublication(value);
    await writeFile(join(value.docsRoot, 'ja/docs/v2.0/overview.md'), '# Changed archive\n');
    await expect(preparePublication(value)).rejects.toThrow('Published documentation content changed');
  } finally {
    await rm(value.root, { recursive: true, force: true });
  }
});

it('rejects mismatched source locale coverage before writing an archive', /** Verify rejects mismatched source locale coverage before writing an archive. */ async () => {
  const value = await fixture();
  try {
    const locales = { ...registry };
    delete locales.ja;
    await writeFile(join(value.sourceDocsRoot, 'locales.json'), JSON.stringify(locales));
    value.request.docsRevision = value.commit(value.sourceDocsRoot);
    const before = await readFile(join(value.docsRoot, 'versions.json'), 'utf8');
    await expect(preparePublication(value)).rejects.toThrow('locale registry differs');
    expect(await readFile(join(value.docsRoot, 'versions.json'), 'utf8')).toBe(before);
    await expect(readFile(join(value.docsRoot, 'en/docs/v2.0/overview.md'), 'utf8')).rejects.toThrow();
  } finally {
    await rm(value.root, { recursive: true, force: true });
  }
});

it('uses application and documentation from one exact monorepo revision', /** Verify that nested documentation sources share the application release identity. */ async () => {
  const value = await fixture({ api: false });
  try {
    const sourceDocsRoot = join(value.appRoot, 'apps/website/content');
    await cp(value.sourceDocsRoot, sourceDocsRoot, {
      recursive: true,
      /** Exclude the standalone fixture repository metadata when importing its content. */
      filter: (source) => !source.split('/').includes('.git'),
    });
    const revision = value.commit(value.appRoot);
    const request = { tag: value.request.tag, revision, docsRevision: revision };
    await preparePublication({ ...value, sourceDocsRoot, request });
    const manifest = JSON.parse(await readFile(join(value.docsRoot, 'versions.json'), 'utf8'));
    const archive = manifest.versions.find(
      /** Select the archive generated for this application release. */ (entry) => entry.id === 'v2.0',
    );
    expect(archive.revision).toBe(revision);
    expect(archive.docsSourceRevision).toBe(revision);
    expect(value.git(value.appRoot, 'status', '--porcelain')).toBe('');
  } finally {
    await rm(value.root, { recursive: true, force: true });
  }
});

it('revalidates exact-source Markdown when retrying a recorded current publication', /** Reject a modified archive even when its stored request and schema still match. */ async () => {
  const value = await fixture();
  try {
    await preparePublication(value);
    await mkdir(join(value.root, '.changeset'));
    await writeFile(join(value.websiteRoot, 'docs-publications.json'), '{}');
    const options = { ...value, repositoryRoot: value.root };
    expect(await recordPublication(options)).toBe(true);
    expect(await recordPublication(options)).toBe(false);
    const manifest = await readFile(join(value.websiteRoot, 'content/versions.json'), 'utf8');
    await writeFile(join(value.websiteRoot, 'content/ja/docs/v2.0/overview.md'), '# Changed archive\n');
    await expect(recordPublication(options)).rejects.toThrow('Published documentation content changed');
    expect(await readFile(join(value.websiteRoot, 'content/versions.json'), 'utf8')).toBe(manifest);
  } finally {
    await rm(value.root, { recursive: true, force: true });
  }
});
