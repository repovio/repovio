import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { recordPublication } from './record-publication.mjs';

const [tag, applicationRoot] = process.argv.slice(2);
if (!/^repovio@\d+\.\d+\.\d+$/.test(tag || '') || !applicationRoot) {
  throw new Error('Usage: docs:promote repovio@<version> <exact-release-checkout>');
}
const appRoot = resolve(applicationRoot);
const repositoryRoot = resolve('../..');
const revision = execFileSync('git', ['rev-parse', `${tag}^{commit}`], { cwd: appRoot, encoding: 'utf8' }).trim();
const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: appRoot, encoding: 'utf8' }).trim();
if (revision !== head) throw new Error('Release checkout must match the exact application tag');
const request = { tag, revision, docsRevision: revision };
const records = JSON.parse(await readFile('docs-publications.json', 'utf8'));
if (records[tag]) {
  if (records[tag].applicationRevision !== revision || records[tag].docsSourceRevision !== revision) {
    throw new Error('Published request identity cannot change');
  }
  await recordPublication({ request, appRoot, websiteRoot: process.cwd(), repositoryRoot });
  console.log('Documentation publication already recorded.');
} else {
  await mkdir('.publication', { recursive: true });
  const requestFile = resolve('.publication/request.json');
  await writeFile(requestFile, JSON.stringify(request));
  execFileSync(
    process.execPath,
    ['scripts/promote-docs.mjs', requestFile, appRoot, resolve('content'), resolve(appRoot, 'apps/website/content')],
    { stdio: 'inherit' },
  );
  await recordPublication({ request, appRoot, websiteRoot: process.cwd(), repositoryRoot });
}
