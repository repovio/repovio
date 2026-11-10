import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, rename, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';
import { test } from 'node:test';
import { URL } from 'node:url';
import { affectedAreas, changedAreas, codeqlLanguages } from './ci-areas.mjs';

/** Documentation changes exercise their renderer but never start the database. */
test('documentation selects docs and website only', /** Verify documentation selects docs and website only. */ () => {
  assert.deepEqual(affectedAreas(['apps/website/content/de/docs/next/setup.md']), {
    api: false,
    web: false,
    website: true,
    docs: true,
    root: true,
  });
});
/** API and dashboard remain independent of website releases. */
test('application changes do not rebuild the website', /** Verify application changes do not rebuild the website. */ () => {
  assert.equal(affectedAreas(['apps/api/src/main.ts']).website, false);
  assert.equal(affectedAreas(['apps/web/app/app.vue']).api, false);
  assert.equal(affectedAreas(['apps/website/app/app.vue']).api, false);
});
/** Shared contracts invalidate both application consumers. */
test('shared schemas select API and dashboard', /** Verify shared schemas select API and dashboard. */ () => {
  const areas = affectedAreas(['libs/schemas/src/index.ts']);
  assert.equal(areas.api, true);
  assert.equal(areas.web, true);
  assert.equal(areas.website, false);
});
/** Root dependency and workflow changes cannot bypass consumers. */
test('shared infrastructure checks every area', /** Verify shared infrastructure checks every area. */ () => {
  for (const path of [
    'pnpm-lock.yaml',
    'package.json',
    '.dockerignore',
    '.nvmrc',
    '.github/workflows/ci.yml',
    'scripts/ci-areas.mjs',
  ]) {
    assert.ok(Object.values(affectedAreas([path])).every(Boolean));
  }
  assert.ok(Object.values(changedAreas('0000000000')).every(Boolean));
});
/** Deletions and binary assets still select their owning application. */
test('asset paths and empty diffs are handled', /** Verify asset paths and empty diffs are handled. */ () => {
  assert.equal(affectedAreas(['apps/website/public/logo.svg']).website, true);
  assert.ok(Object.values(affectedAreas([])).every(/** Require every entry to match `!value`. */ (value) => !value));
});

/** Production Compose changes select both application services without rebuilding the standalone website. */
test('application deployment configuration selects its consumers', /** Verify application deployment dependencies. */ () => {
  const areas = affectedAreas(['compose.yml', '.env.example']);
  assert.equal(areas.api, true);
  assert.equal(areas.web, true);
  assert.equal(areas.website, false);
});

/** A cross-area rename must check both the removed source and the added destination. */
test('Git comparisons invalidate both sides of cross-area renames', /** Exercise real Git rename detection in an isolated fixture. */ async () => {
  const root = await mkdtemp(join(tmpdir(), 'repovio-ci-paths-'));
  /** Run Git only inside the disposable test repository. */
  const git = (...args) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }).trim();
  /** Record a fixture revision without any project commits or hooks. */
  const commit = () => {
    git('add', '.');
    git(
      '-c',
      'user.name=Fixture',
      '-c',
      'user.email=fixture@example.invalid',
      '-c',
      'commit.gpgsign=false',
      'commit',
      '--no-verify',
      '-qm',
      'fixture',
    );
    return git('rev-parse', 'HEAD');
  };
  try {
    git('init', '-q');
    await mkdir(join(root, 'apps/api'), { recursive: true });
    await mkdir(join(root, 'apps/website'), { recursive: true });
    await writeFile(join(root, 'apps/api/feature.ts'), 'export const fixture = true;');
    const base = commit();
    await rename(join(root, 'apps/api/feature.ts'), join(root, 'apps/website/feature.ts'));
    const head = commit();
    const cli = execFileSync(process.execPath, [new URL('./ci-areas.mjs', import.meta.url).pathname], {
      cwd: root,
      env: { ...process.env, GITHUB_OUTPUT: '', CI_BASE: base, CI_HEAD: head },
      encoding: 'utf8',
    });
    assert.match(cli, /api=true/);
    assert.match(cli, /website=true/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

/** Required CodeQL job names remain present even when their expensive scans have no affected input. */
test('CodeQL selects executable languages and conservatively handles manual runs', /** Verify language-specific source selection. */ () => {
  assert.deepEqual(codeqlLanguages(['apps/website/content/en/docs/next/setup.md']), {
    actions: false,
    'javascript-typescript': false,
  });
  assert.deepEqual(codeqlLanguages(['apps/website/app/app.vue']), {
    actions: false,
    'javascript-typescript': true,
  });
  assert.deepEqual(codeqlLanguages(['.github/workflows/ci.yml', '.github/actions/setup/action.yaml']), {
    actions: true,
    'javascript-typescript': false,
  });
  assert.ok(Object.values(codeqlLanguages(null)).every(Boolean));
});

/** Canonical application history is a direct input to the website release page. */
test('root changelog selects website validation without coupling deployments', /** Keep changelog-only edits from bypassing their renderer checks. */ () => {
  assert.deepEqual(affectedAreas(['CHANGELOG.md']), {
    api: false,
    web: false,
    website: true,
    docs: false,
    root: true,
  });
});
