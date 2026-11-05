import { strict as assert } from 'node:assert';
import { spawnSync } from 'node:child_process';
import { readdir } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { test } from 'node:test';
import { setImmediate } from 'node:timers/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const rootRequire = createRequire(resolve(root, 'package.json'));
const apiRequire = createRequire(resolve(root, 'apps/api/package.json'));
const jestRequire = createRequire(apiRequire.resolve('jest'));
const configRequire = createRequire(jestRequire.resolve('jest-config'));
const eslintRequire = createRequire(rootRequire.resolve('eslint'));
const webRequire = createRequire(resolve(root, 'apps/web/package.json'));
const pwaRequire = createRequire(webRequire.resolve('@vite-pwa/nuxt'));
const vitePwaRequire = createRequire(pwaRequire.resolve('vite-plugin-pwa'));
const workboxRequire = createRequire(vitePwaRequire.resolve('workbox-build'));

test('the lockfile excludes the three vulnerable dependency ranges', async () => {
  const lockfile = await readFile(resolve(root, 'pnpm-lock.yaml'), 'utf8');
  assert.doesNotMatch(lockfile, /^ {2}deepmerge@/m);
  for (const [, major] of lockfile.matchAll(/^ {2}glob@(\d+)\./gm)) {
    assert.ok(Number(major) < 9 || Number(major) >= 14);
  }
  assert.doesNotMatch(lockfile, /^ {2}glob@14\.0\.[01]:/m);
  for (const [, major] of lockfile.matchAll(/^ {2}minimatch@(\d+)\./gm)) {
    assert.ok(Number(major) < 7 || Number(major) >= 11);
  }
  assert.doesNotMatch(lockfile, /^ {2}minimatch@11\.0\.0:/m);
});

test('Jest merging clones arrays and nested objects without inheriting poisoned keys', () => {
  const { mergeConfig } = jestRequire('jest-config');
  const defaults = { globals: { nested: { enabled: true } }, setupFiles: ['first'] };
  const overrides = JSON.parse('{"globals":{"__proto__":{"polluted":true},"other":2},"setupFiles":["second"]}');
  const result = mergeConfig(defaults, overrides);
  assert.deepEqual(result.setupFiles, ['first', 'second']);
  assert.deepEqual(result.globals, { nested: { enabled: true }, other: 2 });
  assert.equal(Object.getPrototypeOf(result.globals), Object.prototype);
  assert.equal(result.globals.polluted, undefined);
  assert.equal({}.polluted, undefined);
  result.globals.nested.enabled = false;
  assert.equal(defaults.globals.nested.enabled, true);
});

for (const format of ['commonjs', 'module']) {
  test(`Rollup resolves real workspace dependencies with safe merge initialization (${format})`, async () => {
    const entry = workboxRequire.resolve('@rollup/plugin-node-resolve');
    const plugin =
      format === 'commonjs'
        ? workboxRequire('@rollup/plugin-node-resolve')
        : await import(pathToFileURL(entry.replace('/cjs/', '/es/')));
    const { rollup } = workboxRequire('rollup');
    const bundle = await rollup({
      input: resolve(root, 'libs/schemas/dist/index.js'),
      plugins: [plugin.nodeResolve()],
    });
    try {
      const { output } = await bundle.generate({ format: 'es' });
      assert.ok(output.some((chunk) => chunk.type === 'chunk' && chunk.code.includes('Api')));
    } finally {
      await bundle.close();
    }
  });

  test(`nestjs-zod retains schema cloning and custom intersection array merging (${format})`, async () => {
    const entry = apiRequire.resolve('nestjs-zod');
    const nest =
      format === 'commonjs' ? apiRequire('nestjs-zod') : await import(pathToFileURL(entry.replace(/\.cjs$/, '.mjs')));
    const z = apiRequire('zod/v3');
    const schema = nest.zodV3ToOpenAPI(
      z.intersection(z.object({ name: z.string() }), z.object({ name: z.string(), enabled: z.boolean() })),
    );
    assert.deepEqual(schema.required, ['name', 'enabled']);
    assert.deepEqual(Object.keys(schema.properties), ['name', 'enabled']);
    const paths = JSON.parse(
      '{"__proto__":{"polluted":true},"/health":{"get":{"responses":{"200":{"description":"OK"}}}}}',
    );
    const document = { openapi: '3.0.0', info: { title: 'Fixture', version: '1' }, paths };
    const result = nest.cleanupOpenApiDoc(document);
    assert.equal(result.paths.polluted, undefined);
    assert.equal(Object.getPrototypeOf(result.paths), Object.prototype);
    assert.equal(result.paths['/health'].get.responses['200'].description, 'OK');
    assert.notEqual(result.paths, paths);
  });
}

test('minimatch preserves matching and bounds adversarial preprocessing', () => {
  const { minimatch } = eslintRequire('minimatch');
  assert.ok(minimatch('src/a/b.spec.ts', 'src/**/*.spec.ts'));
  assert.ok(!minimatch('src/a/b.ts', 'src/**/*.spec.ts'));
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `const { Minimatch } = require(${JSON.stringify(eslintRequire.resolve('minimatch'))}); new Minimatch('**/../'.repeat(20) + 'a', { optimizationLevel: 2 });`,
    ],
    { timeout: 5_000, encoding: 'utf8' },
  );
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr);
});

test('glob cancellation stops scheduling directory reads after rejection', async () => {
  const directory = await mkdtemp(resolve(tmpdir(), 'repovio-glob-'));
  try {
    for (let i = 0; i < 12; i++) {
      await mkdir(resolve(directory, String(i), 'nested'), { recursive: true });
      await writeFile(resolve(directory, String(i), 'nested', 'fixture.txt'), 'fixture');
    }
    const { glob } = configRequire('glob');
    assert.equal((await glob('**/*.txt', { cwd: directory })).length, 12);
    const controller = new globalThis.AbortController();
    let reads = 0;
    const fs = {
      readdir(...args) {
        reads++;
        controller.abort(new Error('fixture-abort'));
        return readdir(...args);
      },
    };
    await assert.rejects(glob('**/*', { cwd: directory, fs, signal: controller.signal }), /fixture-abort/);
    const readsAtReject = reads;
    for (let i = 0; i < 5; i++) await setImmediate();
    assert.ok(readsAtReject > 0);
    assert.equal(reads, readsAtReject);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
