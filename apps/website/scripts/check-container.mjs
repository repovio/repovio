import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const image = process.env.CONTAINER_IMAGE || 'repovio-website:ci';
const name = `repovio-website-check-${randomUUID()}`;
/** Compute `docker` as `execFileSync('docker', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()`. */
const docker = (...args) =>
  execFileSync('docker', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const manifest = JSON.parse(await readFile('content/versions.json', 'utf8'));
let started = false;
try {
  docker(
    'run',
    '--detach',
    '--rm',
    '--name',
    name,
    '--read-only',
    '--tmpfs',
    '/tmp',
    '--cap-drop',
    'ALL',
    '--security-opt',
    'no-new-privileges:true',
    '-p',
    '127.0.0.1::3000',
    image,
  );
  started = true;
  const port = docker('port', name, '3000/tcp').split(':').at(-1);
  const origin = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      if ((await fetch(origin, { signal: AbortSignal.timeout(2000) })).ok) {
        ready = true;
        break;
      }
    } catch {
      /* The isolated container may still be starting. */
    }
    await new Promise(/** Return `setTimeout(resolve, 100)` when invoked. */ (resolve) => setTimeout(resolve, 100));
  }
  assert(ready, 'Website container did not become ready');
  assert.equal(docker('exec', name, 'id', '-u'), '1000', 'Website must run unprivileged');
  for (const [path, marker] of [
    ['/', 'Your repositories.'],
    ['/de', 'Deine Repositories.'],
    [`/docs/${manifest.stable}/installation`, '<article'],
    [`/de/docs/${manifest.stable}/installation`, '<article'],
  ]) {
    const response = await fetch(origin + path, { signal: AbortSignal.timeout(5000) });
    assert.equal(response.status, 200, path);
    assert((await response.text()).includes(marker), `Missing content at ${path}`);
  }
  assert.equal((await fetch(origin + '/docs/next/overview')).status, 404);
  console.log('Read-only, unprivileged Docker runtime, EN/DE docs and preview exclusion verified.');
} catch (error) {
  if (started) console.error(docker('logs', name).slice(-2000));
  throw error;
} finally {
  if (started) docker('stop', name);
}
