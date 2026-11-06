import assert from 'node:assert/strict';
import { readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import process from 'node:process';
import { test } from 'node:test';

import { ESLint } from 'eslint';

import { formatRepository, formatSource } from './format.mjs';

const eslint = new ESLint();

test('canonical Vue output converges and passes the effective ESLint rules', /** Verifies canonical Vue output converges and passes the effective ESLint rules. */ async () => {
  const input = `<script setup lang="ts">const title = 'Example';</script>
<template><div
class="card"
:title="title">{{ title }}</div><span>Inline</span><Widget :title="title" /></template>`;
  const once = await formatSource(input, 'fixture.vue');
  const twice = await formatSource(once, 'fixture.vue');
  assert.equal(twice, once);
  assert.ok(once.indexOf('<template>') < once.indexOf('<script'));
  assert.match(once, /<div class="card" :title="title">\n {4}{{ title }}\n {2}<\/div>/);
  assert.match(once, /<span>Inline<\/span>/);
  const [result] = await eslint.lintText(once, { filePath: 'fixture.vue' });
  assert.equal(result.errorCount, 0, JSON.stringify(result.messages));
});

test('effective rules reject invalid block, attribute, content and delimiter layout', /** Verifies effective rules reject invalid block, attribute, content and delimiter layout. */ async () => {
  for (const [rule, input] of [
    ['vue/block-order', '<script setup lang="ts"></script>\n<template><div /></template>'],
    [
      'vue/attributes-order',
      '<template><div :title="title" class="x" /></template>\n<script setup lang="ts">const title = "x";</script>',
    ],
    ['vue/singleline-html-element-content-newline', '<template><div>Content</div></template>'],
    ['vue/html-closing-bracket-newline', '<template>\n  <Widget\n    first="one"\n    second="two" />\n</template>'],
  ]) {
    const [result] = await eslint.lintText(input, { filePath: 'fixture.vue' });
    assert.ok(
      result.messages.some(
        /** Checks whether any entry satisfies `message.ruleId === rule`. */ (message) => message.ruleId === rule,
      ),
      `${rule}: ${JSON.stringify(result.messages)}`,
    );
  }
});

test('multiline tags close on an aligned standalone line and preserve preformatted content', /** Verifies multiline tags close on an aligned standalone line and preserve preformatted content. */ async () => {
  const input = `<template><Widget first="${'a'.repeat(70)}" second="${'b'.repeat(70)}" />
<pre>  fixed\n    spaces</pre></template>`;
  const output = await formatSource(input, 'fixture.vue');
  assert.match(output, /\n {2}\/>/);
  assert.match(output, /<pre> {2}fixed\n {4}spaces<\/pre>/);
  assert.equal(await formatSource(output, 'fixture.vue'), output);
});

test('check mode reports differences without modifying bytes', /** Verifies check mode reports differences without modifying bytes. */ async () => {
  const file = `scripts/.format-fixture-${process.pid}.ts`;
  const input = 'export const value=1';
  writeFileSync(file, input);
  try {
    assert.deepEqual(await formatRepository(false, [file]), [file]);
    assert.equal(readFileSync(file, 'utf8'), input);
    assert.deepEqual(await formatRepository(true, [file]), [file]);
    assert.deepEqual(await formatRepository(false, [file]), []);
  } finally {
    unlinkSync(file);
  }
});

test('refuses render-changing whitespace and accepts a narrowly documented inline exception', /** Protect mixed interpolation text during layout fixes. */ async () => {
  const input = '<template><h2>v{{ version }}</h2></template><script setup lang="ts">const version = "1";</script>';
  await assert.rejects(formatSource(input, 'fixture.vue'), /changes the compiled template/);
  const preserved = input.replace(
    '<h2>',
    '<!-- eslint-disable-next-line vue/singleline-html-element-content-newline -- Preserve the version prefix. -->\n<h2>',
  );
  const output = await formatSource(preserved, 'fixture.vue');
  assert.match(output, /<h2>v{{ version }}<\/h2>/);
  assert.equal(await formatSource(output, 'fixture.vue'), output);
});

test('rejects multiline span content attached to a standalone delimiter', /** Cover the standard span exception without autofixing significant whitespace. */ async () => {
  const [result] = await eslint.lintText('<template>\n<span\n title="x"\n>Text</span>\n</template>', {
    filePath: 'fixture.vue',
  });
  assert.ok(
    result.messages.some(
      /** Select the delimiter-line diagnostic. */ (message) =>
        message.ruleId === 'repovio/multiline-tag-content-newline',
    ),
  );
});
