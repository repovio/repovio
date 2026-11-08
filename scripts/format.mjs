import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath, URL } from 'node:url';

import { ESLint } from 'eslint';
import pluginVue from 'eslint-plugin-vue';
import * as prettier from 'prettier';
import ts from 'typescript';
import tseslint from 'typescript-eslint';

import prettierConfig from '../prettier.config.mjs';
import { vueFormatRules, vueLayoutPlugin } from './vue-format-rules.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { parse, compileTemplate } = createRequire(new URL('../apps/web/package.json', import.meta.url))(
  'vue/compiler-sfc',
);
const vueFormatter = new ESLint({
  cwd: root,
  overrideConfigFile: true,
  overrideConfig: [
    ...pluginVue.configs['flat/base'],
    {
      files: ['**/*.vue'],
      plugins: { repovio: vueLayoutPlugin },
      languageOptions: { parserOptions: { parser: tseslint.parser } },
      rules: vueFormatRules,
    },
  ],
  fix: true,
});

/** Collect whitespace-sensitive element bodies so formatting cannot change their rendered text. */
function preservedBodies(text) {
  const parser = pluginVue.configs['flat/base'].find(
    /** Finds the first entry matching `config.languageOptions?.parser`. */ (config) => config.languageOptions?.parser,
  ).languageOptions.parser;
  const document = parser
    .parseForESLint(text, { ecmaVersion: 'latest', sourceType: 'module', parser: tseslint.parser })
    .services.getDocumentFragment();
  const bodies = [];
  /** Visits preserved bodies. */
  function visit(node) {
    if (node.type !== 'VElement') return;
    if (['pre', 'textarea'].includes(node.name) && node.endTag) {
      bodies.push({ start: node.startTag.range[1], end: node.endTag.range[0] });
      return;
    }
    for (const child of node.children) visit(child);
  }
  for (const child of document.children) visit(child);
  return bodies;
}

/** Normalize compiled render code so formatting cannot silently change interpolation or binding semantics. */
function renderContract(text, file) {
  const { descriptor, errors } = parse(text, { filename: file });
  if (errors.length) throw new Error(`${file}: Invalid Vue component: ${errors.join('; ')}`);
  if (!descriptor.template) return '';
  const compiled = compileTemplate({
    source: descriptor.template.content,
    filename: file,
    id: 'repovio-format',
    compilerOptions: { hoistStatic: false, comments: false },
  });
  if (compiled.errors.length) throw new Error(`${file}: Invalid Vue template: ${compiled.errors.join('; ')}`);
  return ts
    .createPrinter({ removeComments: true })
    .printFile(ts.createSourceFile('render.js', compiled.code, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS));
}

/**
 * Compute the complete canonical representation without writing to the source file.
 * @param text - Original file bytes decoded as UTF-8.
 * @param file - Absolute or repository-relative path used to select formatting and Vue parsing.
 * @returns Canonical source text after Prettier and the Vue layout pass.
 * @throws Error When parsing fails, layout diagnostics remain, or compiled template semantics change.
 */
export async function formatSource(text, file) {
  const preserved = file.endsWith('.vue')
    ? preservedBodies(text).map(
        /** Projects each entry using `text.slice(start, end)`. */ ({ start, end }) => text.slice(start, end),
      )
    : [];
  const formatted = await prettier.format(text, {
    ...prettierConfig,
    ...(file.endsWith('.vue') ? { htmlWhitespaceSensitivity: 'ignore' } : {}),
    filepath: file,
  });
  if (!file.endsWith('.vue')) return formatted;
  const [result] = await vueFormatter.lintText(formatted, { filePath: resolve(root, file) });
  if (result.errorCount)
    throw new Error(
      `${file}: Vue formatting failed: ${result.messages.map(/** Projects each entry using `message.message`. */ (message) => message.message).join('; ')}`,
    );
  let output = result.output ?? formatted;
  const targets = preservedBodies(output);
  for (let index = targets.length - 1; index >= 0; index--) {
    const { start, end } = targets[index];
    output = output.slice(0, start) + preserved[index] + output.slice(end);
  }
  if (renderContract(text, file) !== renderContract(output, file)) {
    throw new Error(
      `${file}: Formatting changes the compiled template. Preserve significant text with a narrowly justified Vue layout exception.`,
    );
  }
  return output;
}

/**
 * Format repository-owned files, returning changed paths; check mode never writes files.
 * @param write - Whether to persist canonical output; false only reports differences.
 * @param files - Optional explicit path list; otherwise inspect tracked and nonignored untracked files.
 * @returns Paths whose source differs from canonical output, including paths fixed in write mode.
 * @throws Error When files cannot be read or their canonical representation cannot be computed.
 */
export async function formatRepository(write = false, files) {
  const candidates =
    files ??
    execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {
      cwd: root,
      encoding: 'utf8',
    })
      .split('\0')
      .filter(Boolean);
  const changed = [];
  for (const file of candidates) {
    const path = resolve(root, file);
    const info = await prettier.getFileInfo(path, { ignorePath: resolve(root, '.prettierignore') });
    if (info.ignored || !info.inferredParser) continue;
    const original = readFileSync(path, 'utf8');
    const formatted = await formatSource(original, path);
    if (formatted === original) continue;
    changed.push(file);
    if (write) writeFileSync(path, formatted);
  }
  return changed;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const write = process.argv.includes('--write');
  const changed = await formatRepository(write);
  if (changed.length) process.stdout.write(`${changed.join('\n')}\n`);
  if (!write && changed.length) process.exitCode = 1;
  else process.stdout.write(write ? `Formatted ${changed.length} files.\n` : 'Canonical formatting check passed.\n');
}
