import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

/** Map changed repository paths to validation areas, including transitive consumers. */
export function affectedAreas(files) {
  const areas = { api: false, web: false, website: false, docs: false, root: false };
  for (const file of files) {
    if (file.startsWith('apps/website/content/')) {
      areas.docs = areas.website = true;
    } else if (file.startsWith('apps/website/')) {
      areas.website = true;
    } else if (file.startsWith('apps/api/')) {
      areas.api = true;
    } else if (file.startsWith('apps/web/')) {
      areas.web = true;
    } else if (file.startsWith('libs/') || /^(?:compose\.ya?ml|\.env\.example)$/.test(file)) {
      areas.api = areas.web = true;
    } else if (
      /^(?:package\.json|pnpm-|nx\.json|tsconfig|eslint|prettier|\.prettier|\.editorconfig|\.dockerignore|\.npmrc|\.nvmrc|\.pnpmfile|patches\/|scripts\/|\.github\/workflows\/)/.test(
        file,
      )
    ) {
      for (const area of Object.keys(areas)) areas[area] = true;
    }
    if (/\.(?:[cm]?[jt]sx?|vue|json|ya?ml|md)$/.test(file)) areas.root = true;
  }
  return areas;
}

/** List both sides of moves; null means the event has no usable comparison and requires a full check. */
export function changedFiles(base, head = 'HEAD') {
  if (!base || /^0+$/.test(base)) return null;
  return execFileSync('git', ['diff', '--no-renames', '--name-only', '-z', base, head], { encoding: 'utf8' })
    .split('\0')
    .filter(Boolean);
}

/** Select only the CodeQL languages whose executable inputs changed. */
export function codeqlLanguages(files) {
  return {
    actions:
      files === null ||
      files.some(
        /** Match workflow definitions and local composite actions. */
        (file) => /^\.github\/workflows\/.*\.ya?ml$/.test(file) || /(?:^|\/)action\.ya?ml$/.test(file),
      ),
    'javascript-typescript':
      files === null ||
      files.some(/** Match JavaScript, TypeScript, and Vue source. */ (file) => /\.(?:[cm]?[jt]sx?|vue)$/.test(file)),
  };
}

/** Resolve a trusted Git comparison; missing history conservatively checks every area. */
export function changedAreas(base, head = 'HEAD') {
  const files = changedFiles(base, head);
  return affectedAreas(files ?? ['pnpm-lock.yaml']);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const files = changedFiles(process.env.CI_BASE, process.env.CI_HEAD);
  const areas = process.env.CI_LANGUAGE
    ? { scan: codeqlLanguages(files)[process.env.CI_LANGUAGE] }
    : affectedAreas(files ?? ['pnpm-lock.yaml']);
  for (const [name, value] of Object.entries(areas)) {
    const line = `${name}=${value}\n`;
    if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, line);
    else process.stdout.write(line);
  }
}
