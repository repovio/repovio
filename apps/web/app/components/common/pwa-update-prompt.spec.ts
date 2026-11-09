import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { expect, it } from 'vitest';
import { compileScript, parse } from 'vue/compiler-sfc';

it('keeps the actual prompt setup inert when the PWA plugin is unavailable', /** Execute the component's compiled setup; browser tests separately cover its real template. */ async () => {
  const source = readFileSync(new URL('./pwa-update-prompt.vue', import.meta.url), 'utf8');
  const { descriptor } = parse(source);
  const script = compileScript(descriptor, { id: 'pwa-absent-plugin-test' });
  const compiled = ts.transpileModule(script.content, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {} as {
    default: {
      setup: (
        props: object,
        context: { expose: () => void },
      ) => {
        needsRefresh: { value: boolean };
        updating: { value: boolean };
        updateFailed: { value: boolean };
        activateUpdate: () => Promise<void>;
      };
    };
  };
  runInNewContext(compiled, {
    exports,
    require: createRequire(import.meta.url),
    /** Supply the normal translation boundary without altering component logic. */
    useI18n: () => ({ t: String }),
    /** Model development/startup environments without the optional plugin. */
    useNuxtApp: () => ({}),
  });
  const state = exports.default.setup(
    {},
    { /** Setup does not need a mounted parent in this branch. */ expose: () => {} },
  );
  expect(state.needsRefresh.value).toBe(false);
  await state.activateUpdate();
  expect(state.updating.value).toBe(false);
  expect(state.updateFailed.value).toBe(false);
});
