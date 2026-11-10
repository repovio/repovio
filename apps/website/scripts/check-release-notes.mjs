import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const releaseNotesPath = fileURLToPath(new URL('../../../CHANGELOG.md', import.meta.url));

/**
 * Validate published application headings without rewriting or parsing their Markdown bodies.
 * @param {string} source Complete canonical changelog.
 * @returns {string[]} Published semantic versions in source order.
 * @throws {Error} When source format, uniqueness, or descending version order is invalid.
 */
export function validateReleaseNotes(source) {
  if (!/^# Changelog\s*$/m.test(source)) throw new Error('Release notes require a Changelog heading');
  const versions = [];
  let fence = '';
  for (const line of source.split('\n')) {
    const marker = line.match(/^\s{0,3}(`{3,}|~{3,})/)?.[1];
    if (marker) {
      if (!fence) fence = marker;
      else if (marker[0] === fence[0] && marker.length >= fence.length) fence = '';
      continue;
    }
    if (fence || !line.startsWith('## ')) continue;
    const version = line.slice(3).trim();
    if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version)) {
      throw new Error(`Invalid published release heading: ${version}`);
    }
    const previous = versions.at(-1);
    if (previous) {
      const currentParts = version.split('.').map(BigInt);
      const previousParts = previous.split('.').map(BigInt);
      const different = currentParts.findIndex(
        /** Find the first semantic component that differs. */ (part, index) => part !== previousParts[index],
      );
      if (different === -1 || currentParts[different] > previousParts[different]) {
        throw new Error(`Release versions must be unique and descending: ${previous}, ${version}`);
      }
    }
    versions.push(version);
  }
  return versions;
}

/**
 * Read and validate canonical Markdown without losing continuation paragraphs or nested blocks.
 * @param {string} path Source path; defaults to the repository changelog relative to this module.
 * @returns {string} Original, unmodified Markdown source.
 * @throws {Error} When the source cannot be read or its release headings are invalid.
 */
export function readReleaseNotes(path = releaseNotesPath) {
  const source = readFileSync(path, 'utf8');
  validateReleaseNotes(source);
  return source;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  readReleaseNotes();
  console.log('Canonical application release notes verified.');
}
