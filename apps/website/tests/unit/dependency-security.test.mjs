import { strict as assert } from 'node:assert';
import { spawnSync } from 'node:child_process';
import { readdir } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { setImmediate } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';
import { it } from 'vitest';

const rootRequire = createRequire(import.meta.url);
const nuxtRequire = createRequire(rootRequire.resolve('nuxt/package.json'));
const nitroRequire = createRequire(nuxtRequire.resolve('nitropack/package.json'));
const resolverEntry = nitroRequire.resolve('@rollup/plugin-node-resolve');
const resolverRequire = createRequire(resolverEntry);
const eslintRequire = createRequire(rootRequire.resolve('eslint/package.json'));

it('excludes the reported vulnerable package ranges from the resolved lockfile', /** Verify excludes the reported vulnerable package ranges from the resolved lockfile. */ async () => {
  const lockfile = await readFile('../../pnpm-lock.yaml', 'utf8');
  assert.doesNotMatch(lockfile, /^ {2}(deepmerge@|zod@3\.|esbuild@0\.27\.)/m);
  assert.doesNotMatch(lockfile, /^ {2}glob@(9|1[0-3])\./m);
  assert.doesNotMatch(lockfile, /^ {2}glob@14\.0\.[01]:/m);
  assert.doesNotMatch(lockfile, /^ {2}minimatch@(7|8|9|10)\./m);
  assert.doesNotMatch(lockfile, /^ {2}minimatch@11\.0\.0:/m);
});

it('safely merges Rollup options, nested objects, arrays and symbol keys', /** Verify safely merges Rollup options, nested objects, arrays and symbol keys. */ () => {
  const merge = resolverRequire('@fastify/deepmerge')({ symbols: true });
  const key = Symbol('fixture');
  const defaults = { nested: { enabled: true }, conditions: ['default'], [key]: { first: true } };
  const overrides = JSON.parse('{"nested":{"__proto__":{"polluted":true},"other":2},"conditions":["fixture"]}');
  overrides[key] = { second: true };
  const merged = merge(defaults, overrides);
  assert.deepEqual(merged.conditions, ['default', 'fixture']);
  assert.deepEqual(merged.nested, { enabled: true, other: 2 });
  assert.deepEqual(merged[key], { first: true, second: true });
  assert.equal(Object.getPrototypeOf(merged.nested), Object.prototype);
  assert.equal(merged.nested.polluted, undefined);
  assert.equal({}.polluted, undefined);
  merged.nested.enabled = false;
  assert.equal(defaults.nested.enabled, true);
});

for (const format of ['commonjs', 'module']) {
  it(`bundles a dependency through the patched real Rollup resolver (${format})`, /** Verify the declared behavior. */ async () => {
    const directory = await mkdtemp(resolve(tmpdir(), 'repovio-resolver-'));
    let bundle;
    try {
      const dependency = resolve(directory, 'node_modules', 'fixture-dependency');
      await mkdir(dependency, { recursive: true });
      await writeFile(
        resolve(dependency, 'package.json'),
        JSON.stringify({
          name: 'fixture-dependency',
          type: 'module',
          exports: { fixture: './selected.js', default: './default.js' },
        }),
      );
      await writeFile(resolve(dependency, 'selected.js'), 'export const value = "fixture-selected";');
      await writeFile(resolve(dependency, 'default.js'), 'export const value = "wrong-condition";');
      await writeFile(resolve(directory, 'entry.js'), 'export { value } from "fixture-dependency";');
      const plugin =
        format === 'commonjs'
          ? nitroRequire('@rollup/plugin-node-resolve')
          : await import(pathToFileURL(resolverEntry.replace('/cjs/', '/es/')));
      bundle = await nitroRequire('rollup').rollup({
        input: resolve(directory, 'entry.js'),
        plugins: [plugin.nodeResolve({ exportConditions: ['fixture'] })],
      });
      const { output } = await bundle.generate({ format: 'es' });
      assert.ok(
        output.some(
          /** Check whether an entry matches `chunk.type === 'chunk' && chunk.code.includes('fixture-selected')`. */ (
            chunk,
          ) => chunk.type === 'chunk' && chunk.code.includes('fixture-selected'),
        ),
      );
      assert.ok(
        output.every(
          /** Require every entry to match `chunk.type !== 'chunk' || !chunk.code.includes('wrong-condition')`. */ (
            chunk,
          ) => chunk.type !== 'chunk' || !chunk.code.includes('wrong-condition'),
        ),
      );
    } finally {
      await bundle?.close();
      await rm(directory, { recursive: true, force: true });
    }
  });
}

it('uses native Zod 4 parsing and Nuxt Content JSON schema conversion', /** Verify uses native Zod 4 parsing and Nuxt Content JSON schema conversion. */ async () => {
  const { z } = await import('@nuxt/content');
  const schema = z.object({ title: z.string(), count: z.number().int(), tags: z.array(z.string()).max(2) });
  assert.ok(schema._zod, 'Content must construct native v4 schemas.');
  assert.deepEqual(schema.parse({ title: 'Fixture', count: 1, tags: ['safe'] }), {
    title: 'Fixture',
    count: 1,
    tags: ['safe'],
  });
  assert.equal(schema.safeParse({ title: 'Fixture', count: 'wrong', tags: [] }).success, false);
  const content = rootRequire.resolve('@nuxt/content');
  const { toJSONSchema } = await import(pathToFileURL(resolve(dirname(content), 'chunks/zod4.mjs')));
  const json = toJSONSchema(schema, 'Fixture').definitions.Fixture;
  assert.equal(json.properties.title.type, 'string');
  assert.equal(json.properties.count.type, 'integer');
  assert.equal(json.properties.tags.maxItems, 2);
  assert.deepEqual(json.required, ['title', 'count', 'tags']);
});

it('preserves minimatch semantics and bounds adversarial glob preprocessing', /** Verify preserves minimatch semantics and bounds adversarial glob preprocessing. */ () => {
  const { minimatch } = eslintRequire('minimatch');
  assert.ok(minimatch('src/a/b.spec.ts', 'src/**/*.spec.ts'));
  assert.ok(!minimatch('src/a/b.ts', 'src/**/*.spec.ts'));
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `const { Minimatch } = require(${JSON.stringify(eslintRequire.resolve('minimatch'))}); new Minimatch('**/../'.repeat(20) + 'a', { optimizationLevel: 2 });`,
    ],
    { timeout: 5000, encoding: 'utf8' },
  );
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr);
});

it('stops scheduling filesystem reads after glob cancellation', /** Verify stops scheduling filesystem reads after glob cancellation. */ async () => {
  const directory = await mkdtemp(resolve(tmpdir(), 'repovio-glob-'));
  try {
    for (let i = 0; i < 12; i++) {
      await mkdir(resolve(directory, String(i), 'nested'), { recursive: true });
      await writeFile(resolve(directory, String(i), 'nested', 'fixture.txt'), 'fixture');
    }
    const { glob } = nitroRequire('glob');
    assert.equal((await glob('**/*.txt', { cwd: directory })).length, 12);
    const controller = new globalThis.AbortController();
    let reads = 0;
    const fs = {
      /** Define readdir behavior. */
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

for (const format of ['commonjs', 'module']) {
  it(`enforces import boundaries with minimatch 11 (${format})`, /** Verify the declared behavior. */ async () => {
    const configRequire = createRequire(
      createRequire(rootRequire.resolve('@nuxt/eslint')).resolve('@nuxt/eslint-config'),
    );
    const entry = configRequire.resolve('eslint-plugin-import-x');
    const imported =
      format === 'commonjs'
        ? configRequire('eslint-plugin-import-x')
        : await import(pathToFileURL(entry.replace('index.cjs', 'index.js')));
    const plugin = imported.default ?? imported;
    const { Linter } = rootRequire('eslint');
    const linter = new Linter();
    /** Compute `verify` as `linter.verify(source, [ { plugins: { 'import-x': plugin }, rules: { 'import-x/no-internal-modules': ['error', options] }, }, ])`. */
    const verify = (source, options) =>
      linter.verify(source, [
        {
          plugins: { 'import-x': plugin },
          rules: { 'import-x/no-internal-modules': ['error', options] },
        },
      ]);
    assert.equal(verify("import value from 'package/private/file.js';", { forbid: ['package/private/**'] }).length, 1);
    assert.equal(verify("import value from 'package/public/file.js';", { forbid: ['package/private/**'] }).length, 0);
    assert.equal(verify("import value from 'zod/v4';", { allow: ['zod/v4'] }).length, 0);
    assert.equal(verify("import value from 'zod/v4';", { allow: ['zod/v3'] }).length, 1);
  });
}
