import { strict as assert } from 'node:assert';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

test('exports the real application deterministically without any network access or inherited deployment settings', async () => {
  const temporary = await mkdtemp(resolve(tmpdir(), 'repovio-openapi-check-'));
  try {
    const guard = resolve(temporary, 'guard.mjs');
    await writeFile(
      guard,
      `
      import net from 'node:net';
      import http from 'node:http';
      import https from 'node:https';
      const fail = () => { throw new Error('OpenAPI export attempted network access'); };
      net.Socket.prototype.connect = fail;
      net.Server.prototype.listen = fail;
      http.request = fail;
      https.request = fail;
      globalThis.fetch = fail;
    `,
    );
    const output = resolve(temporary, 'openapi.json');
    const options = {
      cwd: root,
      timeout: 120_000,
      env: {
        ...process.env,
        PUBLIC_URL: 'https://private-deployment.example.invalid',
        AUTH_JWT_SECRET: 'inherited-secret-must-not-appear',
        DATABASE_URL: 'invalid',
        REPOVIO_ENV_FILE: '/does/not/exist',
      },
    };
    const command = ['--import', guard, resolve(root, 'apps/api/dist/scripts/export-openapi.js'), output];
    execFileSync(process.execPath, command, options);
    const first = await readFile(output, 'utf8');
    execFileSync(process.execPath, command, options);
    assert.equal(await readFile(output, 'utf8'), first);
    const document = JSON.parse(first);
    assert.deepEqual(document.servers, [{ url: '/' }]);
    assert.ok(Object.keys(document.paths).length > 20);
    assert.ok(document.paths['/api/health']);
    assert.ok(!document.paths['/api/v1/mcp']);
    assert.ok(!first.includes('private-deployment.example.invalid'));
    assert.ok(!first.includes('inherited-secret-must-not-appear'));
    const visit = (value) => {
      if (!value || typeof value !== 'object') return;
      if (value.$ref) {
        assert.ok(value.$ref.startsWith('#/'));
        const target = value.$ref
          .slice(2)
          .split('/')
          .reduce((node, key) => node?.[key.replaceAll('~1', '/').replaceAll('~0', '~')], document);
        assert.ok(target, `Unresolved reference: ${value.$ref}`);
      }
      for (const item of Object.values(value)) visit(item);
    };
    visit(document);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});
