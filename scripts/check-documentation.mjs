import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import pluginVue from 'eslint-plugin-vue';
import ts from 'typescript';
import tseslint from 'typescript-eslint';

export const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Identify handwritten JavaScript, TypeScript, and Vue files outside generated output.
 * @param file - Repository-relative path to classify.
 * @returns Whether the file belongs to handwritten declaration coverage.
 */
export function isDocumentationSource(file) {
  return (
    /\.(?:[cm]?[jt]sx?|vue)$/.test(file) &&
    !/(?:^|\/)(?:node_modules|vendor|generated|dist|coverage|\.nx|\.nuxt|\.output|playwright-report|test-results)(?:\/|$)/.test(
      file,
    )
  );
}

/**
 * List tracked and newly added source files, respecting repository ignore rules.
 * @param root - Git working directory to inspect.
 * @returns Repository-relative source paths, including nonignored untracked files.
 * @throws Error When Git cannot enumerate the working tree.
 */
export function documentationFiles(root = repositoryRoot) {
  return execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {
    cwd: root,
    encoding: 'utf8',
  })
    .split('\0')
    .filter(
      /** Keeps entries matching `file && isDocumentationSource(file)`. */ (file) =>
        file && isDocumentationSource(file),
    );
}

/**
 * Parse script blocks with the installed Vue parser, retaining original line and character offsets.
 * @param file - Source filename; only Vue files require script extraction.
 * @param text - Complete source text, including template and style blocks.
 * @returns Script text with nonscript characters masked while retaining UTF-16 offsets and line endings.
 * @throws Error When the Vue parser rejects the component.
 */
export function sourceText(file, text) {
  if (!file.endsWith('.vue')) return text;
  const parser = pluginVue.configs['flat/base'].find(
    /** Finds the first entry matching `config.languageOptions?.parser`. */ (config) => config.languageOptions?.parser,
  ).languageOptions.parser;
  const parsed = parser.parseForESLint(text, { ecmaVersion: 'latest', sourceType: 'module', parser: tseslint.parser });
  const scripts = parsed.services
    .getDocumentFragment()
    .children.filter(
      /** Keeps entries matching `node.type === 'VElement' && node.name === 'script'`. */ (node) =>
        node.type === 'VElement' && node.name === 'script',
    );
  const characters = text
    .split('')
    .map(
      /** Projects each entry using `character === '\n' || character === '\r' ? character : ' '`. */ (character) =>
        character === '\n' || character === '\r' ? character : ' ',
    );
  for (const script of scripts) {
    const start = script.startTag.range[1];
    const end = script.endTag?.range[0] ?? text.length;
    for (let index = start; index < end; index++) characters[index] = text[index];
  }
  return characters.join('');
}

/**
 * Select every implementation, method contract, and exported type declaration.
 * @param source - Parsed TypeScript source with parent links enabled.
 * @returns Required declarations paired with their documentation anchors.
 */
export function requiredDeclarations(source) {
  const declarations = [];
  const exportedNames = new Set();
  /** Collect local declarations exported through a separate export list. */
  function collectExports(node) {
    if (ts.isExportAssignment(node) && ts.isIdentifier(node.expression)) exportedNames.add(node.expression.text);
    if (
      ts.isExportDeclaration(node) &&
      !node.moduleSpecifier &&
      node.exportClause &&
      ts.isNamedExports(node.exportClause)
    ) {
      for (const element of node.exportClause.elements) exportedNames.add((element.propertyName ?? element.name).text);
    }
    ts.forEachChild(node, collectExports);
  }
  collectExports(source);
  /** Visits required declarations. */
  function visit(node) {
    const callable =
      ts.isFunctionDeclaration(node) ||
      ts.isFunctionExpression(node) ||
      ts.isArrowFunction(node) ||
      ts.isMethodDeclaration(node) ||
      ts.isMethodSignature(node) ||
      ts.isConstructorDeclaration(node) ||
      ts.isGetAccessorDeclaration(node) ||
      ts.isSetAccessorDeclaration(node) ||
      ts.isCallSignatureDeclaration(node) ||
      ts.isConstructSignatureDeclaration(node);
    const exportedClassExpression =
      ts.isClassExpression(node) &&
      ts.isVariableDeclaration(node.parent) &&
      node.parent.parent.parent.modifiers?.some(
        /** Recognize an exported variable whose initializer defines a public class. */
        (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
      );
    const exportedType =
      (ts.isInterfaceDeclaration(node) ||
        ts.isTypeAliasDeclaration(node) ||
        ts.isEnumDeclaration(node) ||
        ts.isClassDeclaration(node)) &&
      (exportedNames.has(node.name?.text) ||
        node.modifiers?.some(
          /** Checks whether any entry satisfies `modifier.kind === ts.SyntaxKind.ExportKeyword`. */ (modifier) =>
            modifier.kind === ts.SyntaxKind.ExportKeyword,
        ));
    if (callable || exportedType || exportedClassExpression) {
      let anchor = exportedClassExpression ? node.parent.parent.parent : node;
      if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
        if (ts.isVariableDeclaration(node.parent)) anchor = node.parent.parent.parent;
        else if (ts.isPropertyDeclaration(node.parent) || ts.isPropertyAssignment(node.parent)) anchor = node.parent;
      }
      declarations.push({ node, anchor });
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  return declarations;
}

/**
 * Find a declaration's own documentation, including comments immediately before callback expressions.
 * @param source - Parsed source containing the declaration and its original offsets.
 * @param declaration - Callable/type node and the statement or property that may carry its documentation.
 * @returns The adjacent documentation block, or null when no own comment exists.
 */
export function documentationComment(source, { node, anchor }) {
  for (const candidate of [node, anchor]) {
    const ranges = [
      ...(ts.getLeadingCommentRanges(source.text, candidate.getFullStart()) ?? []),
      ...(ts.getTrailingCommentRanges(source.text, candidate.getFullStart()) ?? []),
    ];
    const range = ranges.findLast(
      /** Evaluates `source.text.slice(entry.pos, entry.end).startsWith('/**')` when ranges.findLast invokes this callback. */ (
        entry,
      ) => source.text.slice(entry.pos, entry.end).startsWith('/**'),
    );
    if (range && !source.text.slice(range.end, candidate.getStart(source)).trim())
      return source.text.slice(range.pos, range.end);
  }
  return null;
}

/**
 * Diagnose missing purpose summaries and empty contract tags without claiming semantic proof.
 * @param file - Source path used for parsing mode and diagnostic locations.
 * @param text - Complete handwritten source text.
 * @returns Source-located coverage, syntax, and empty-tag diagnostics.
 * @throws Error When Vue script extraction fails.
 */
export function checkDocumentation(file, text) {
  const source = ts.createSourceFile(
    file,
    sourceText(file, text),
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('.jsx')
      ? ts.ScriptKind.JSX
      : /\.[cm]?js$/.test(file)
        ? ts.ScriptKind.JS
        : file.endsWith('.tsx')
          ? ts.ScriptKind.TSX
          : ts.ScriptKind.TS,
  );
  const errors = source.parseDiagnostics.map(
    /** Preserve parser diagnostics so malformed source cannot pass coverage checks. */
    (diagnostic) =>
      `${file}:${source.getLineAndCharacterOfPosition(diagnostic.start ?? 0).line + 1}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ')}`,
  );
  for (const declaration of requiredDeclarations(source)) {
    const comment = documentationComment(source, declaration);
    const summary = comment
      ?.replace(/^\/\*\*|\*\/$/g, '')
      .replace(/^\s*\* ?/gm, '')
      .split(/@[A-Za-z]/)[0]
      .trim();
    const line = source.getLineAndCharacterOfPosition(declaration.node.getStart(source)).line + 1;
    if (!summary) errors.push(`${file}:${line}: Missing documentation purpose summary.`);
    if (comment) {
      const documented = ts.createSourceFile(
        'comment.ts',
        `${comment}\nfunction documented() {}`,
        ts.ScriptTarget.Latest,
        true,
      );
      const doc = ts.getJSDocCommentsAndTags(documented.statements[0]).find(ts.isJSDoc);
      for (const tag of doc?.tags ?? []) {
        if (!['param', 'return', 'returns', 'throws', 'typeParam'].includes(tag.tagName.text)) continue;
        const description =
          typeof tag.comment === 'string'
            ? tag.comment
            : tag.comment
                ?.map(
                  /** Join linked documentation fragments for tag-presence validation. */
                  (part) => part.text,
                )
                .join('');
        if (!description?.replace(/^\s*-\s*/, '').trim())
          errors.push(`${file}:${line}: Empty documentation contract tag.`);
      }
    }
  }
  return errors;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const files = documentationFiles();
  const errors = files.flatMap(
    /** Flattens entries produced by `checkDocumentation(file, readFileSync(resolve(repositoryRoot, file), 'utf8'))`. */ (
      file,
    ) => checkDocumentation(file, readFileSync(resolve(repositoryRoot, file), 'utf8')),
  );
  if (errors.length) {
    process.stderr.write(`${errors.join('\n')}\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write(`Documentation check passed (${files.length} handwritten source files).\n`);
  }
}
