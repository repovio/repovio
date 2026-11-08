import { execFileSync, spawn } from 'node:child_process';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { captureUi } from './capture-ui.mjs';
import { preparePublication } from './publication.mjs';

const [requestFile, appRoot, docsRoot, sourceDocsRoot] = process.argv.slice(2);
if (!requestFile || !appRoot || !docsRoot)
  throw new Error('Usage: promote-docs request.json application-root docs-root');
const request = JSON.parse(await readFile(requestFile, 'utf8'));
const plan = await preparePublication({ request, appRoot, docsRoot, websiteRoot: process.cwd(), sourceDocsRoot });
if (plan.existing) {
  console.log('Publication already staged; validating existing archive.');
}
{
  // Build from an exact checked-out revision using only synthetic data, never a deployed provider account.
  execFileSync('pnpm', ['--filter', '@repovio/web', 'build'], { cwd: appRoot, stdio: 'inherit' });
  const server = spawn(process.execPath, ['apps/web/.output/server/index.mjs'], {
    cwd: appRoot,
    env: { ...process.env, HOST: '127.0.0.1', PORT: '3013' },
    stdio: 'ignore',
  });
  try {
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      if (server.exitCode !== null) throw new Error('Capture application exited before startup');
      try {
        if ((await fetch('http://127.0.0.1:3013')).ok) {
          ready = true;
          break;
        }
      } catch {
        /* Retry only while the isolated capture server is starting. */
      }
      await new Promise(/** Return `setTimeout(resolve, 200)` when invoked. */ (resolve) => setTimeout(resolve, 200));
    }
    if (!ready) throw new Error('Capture application did not become ready');
    const outputRoot = resolve('public/images/docs', plan.id);
    await captureUi({ sourceRoot: appRoot, baseUrl: 'http://127.0.0.1:3013', outputRoot });
    await mkdir('public/images/product', { recursive: true });
    await cp(outputRoot, 'public/images/product', { recursive: true });
  } finally {
    server.kill('SIGTERM');
  }
}
await mkdir('.publication', { recursive: true });
await writeFile('.publication/result.json', JSON.stringify({ ...plan, request }, null, 2) + '\n');
