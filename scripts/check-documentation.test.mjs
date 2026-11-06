import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { checkDocumentation, documentationFiles, isDocumentationSource } from './check-documentation.mjs';

test('requires summaries for each handwritten callable and exported type', /** Verifies requires summaries for each handwritten callable and exported type. */ () => {
  const input = `
    export interface Contract { run(): void; }
    export type Name = string;
    export enum State { Ready }
    export class Example {
      constructor() {}
      private helper() {}
      get value() { return 1; }
      set value(input: number) {}
      arrow = () => 1;
    }
    function helper() {}
    const arrow = () => 1;
    [1].map(value => value + 1);
    register({ callback: function () {} });
  `;
  assert.equal(checkDocumentation('fixture.ts', input).length, 14);
});

test('recognizes comments on declarations, properties, and callback expressions', /** Verifies recognizes comments on declarations, properties, and callback expressions. */ () => {
  const input = `
    /** Public identity contract. */
    export interface Contract {
      /** Return the supplied value. */
      run(value: string): string;
    }
    /** Return the supplied value. */
    const identity = (value: string) => value;
    [1].map(/** Increment the input. */ (value) => value + 1);
    const object = { /** Return the default value. */ callback: () => 1 };
    /** Store the current value. */
    export class Example {
      /** Replace the current value. */
      set value(input: number) {}
    }
  `;
  assert.deepEqual(checkDocumentation('fixture.ts', input), []);
});

test('does not reuse a surrounding call comment or accept empty summaries and tags', /** Verifies does not reuse a surrounding call comment or accept empty summaries and tags. */ () => {
  const errors = checkDocumentation(
    'fixture.js',
    `
    /** Register a mapper. */
    register(() => 1);
    /** @returns A value. */
    function missingSummary() {}
    /** Return a value.
     * @returns
     */
    function emptyTag() {}
  `,
  );
  assert.equal(errors.length, 3);
});

test('preserves Vue line numbers and handles multiple script blocks without scanning template data', /** Verifies preserves Vue line numbers and handles multiple script blocks without scanning template data. */ () => {
  const input = `<template><p>{{ '() => ignored' }}</p></template>
<script lang="ts">
/** Public identifier. */
export type Identifier = string;
</script>
<script setup lang="ts">
const callback = () => 1;
</script>`;
  assert.deepEqual(checkDocumentation('fixture.vue', input), ['fixture.vue:7: Missing documentation purpose summary.']);
  assert.throws(
    /** Evaluates `checkDocumentation('broken.vue', '<script setup lang="ts">const = ;</script>')` when assert.throws invokes this callback. */ () =>
      checkDocumentation('broken.vue', '<script setup lang="ts">const = ;</script>'),
  );
});

test('checks JavaScript callbacks and TypeScript module variants', /** Verifies checks JavaScript callbacks and TypeScript module variants. */ () => {
  for (const extension of ['js', 'mjs', 'cjs', 'ts', 'mts', 'cts', 'tsx']) {
    assert.equal(isDocumentationSource(`scripts/source.${extension}`), true);
    assert.equal(checkDocumentation(`source.${extension}`, 'const callback = () => 1;').length, 1);
  }
});

test('excludes dependencies, generated output and ignored untracked files', /** Verifies excludes dependencies, generated output and ignored untracked files. */ () => {
  for (const file of [
    'node_modules/a.ts',
    'vendor/a.js',
    'apps/api/src/generated/a.ts',
    'dist/a.js',
    '.nuxt/a.ts',
    'coverage/a.js',
    'pnpm-lock.yaml',
  ]) {
    assert.equal(isDocumentationSource(file), false, file);
  }
  const root = mkdtempSync(join(tmpdir(), 'repovio-docs-'));
  try {
    execFileSync('git', ['init', '-q', root]);
    writeFileSync(join(root, '.gitignore'), 'ignored.ts\n');
    writeFileSync(join(root, 'ignored.ts'), 'function ignored() {}');
    writeFileSync(join(root, 'included.ts'), 'function included() {}');
    assert.deepEqual(documentationFiles(root), ['included.ts']);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

/** Verify separately exported types and handwritten declaration files remain in coverage. */
test('checks local export lists and handwritten declarations', /** Exercise export coverage without requiring runtime implementations. */ () => {
  assert.equal(checkDocumentation('fixture.ts', 'interface Contract {} export { Contract };').length, 1);
  assert.equal(isDocumentationSource('types.d.ts'), true);
  assert.equal(checkDocumentation('types.d.ts', 'export interface Contract {}').length, 1);
  assert.ok(checkDocumentation('broken.ts', 'const = ;').length > 0);
});

test('rejects empty parameter descriptions', /** Ensure parameter names alone cannot satisfy documentation. */ () => {
  assert.equal(
    checkDocumentation('fixture.ts', '/** Store input.\n * @param value -\n */ function store(value: string) {}')
      .length,
    1,
  );
});

test('checks exported class expressions and default export aliases', /** Keep public class contracts in declaration coverage. */ () => {
  assert.equal(checkDocumentation('fixture.ts', 'export const PublicClass = class {};').length, 1);
  assert.equal(checkDocumentation('fixture.ts', 'class PublicClass {} export default PublicClass;').length, 1);
  assert.deepEqual(
    checkDocumentation('fixture.ts', '/** Public class contract. */ export const PublicClass = class {};'),
    [],
  );
});
