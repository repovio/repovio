import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// Exercise unpublished UI in an isolated copy; never add a fake release to the real content manifest.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const temporaryRoot = await mkdtemp(resolve(tmpdir(), 'repovio-api-website-'));
const temporary = resolve(temporaryRoot, 'apps/website');
const version = 'v99.1';
const excluded = new Set([
  '.git',
  'node_modules',
  '.nuxt',
  '.output',
  '.data',
  '.cache',
  'test-results',
  'playwright-report',
  '.publication',
]);
try {
  // Preserve the same root changelog relationship as local and Docker website builds.
  await mkdir(temporary, { recursive: true });
  await cp(resolve(root, '../../CHANGELOG.md'), resolve(temporaryRoot, 'CHANGELOG.md'));
  await cp(root, temporary, {
    recursive: true,
    /** Return `!relative(root, source) .split(sep) .some((part) => excluded.has(part))` when invoked. */
    filter: (source) =>
      !relative(root, source)
        .split(sep)
        .some(/** Check whether an entry matches `excluded.has(part)`. */ (part) => excluded.has(part)),
  });
  await symlink(resolve(root, 'node_modules'), resolve(temporary, 'node_modules'), 'dir');
  const content = resolve(temporary, 'content');
  const manifest = JSON.parse(await readFile(resolve(content, 'versions.json'), 'utf8'));
  const schema = await readFile(resolve(root, 'tests/fixtures/openapi.json'));
  await mkdir(resolve(content, 'openapi'), { recursive: true });
  await writeFile(resolve(content, `openapi/${version}.json`), schema);
  // A preview file deliberately exists to verify that the bundler cannot expose it.
  await writeFile(resolve(content, 'openapi/next.json'), schema);
  manifest.versions.push({
    id: version,
    release: '99.1.0',
    revision: 'a'.repeat(40),
    status: 'archived',
    slugs: ['api-access', 'api-reference'],
    openapi: {
      file: `openapi/${version}.json`,
      revision: 'a'.repeat(40),
      sha256: createHash('sha256').update(schema).digest('hex'),
    },
  });
  const realVersion = process.env.API_REFERENCE_SCHEMA_FILE ? 'v99.2' : '';
  if (realVersion) {
    const realSchema = await readFile(resolve(process.env.API_REFERENCE_SCHEMA_FILE));
    const entry = manifest.versions.at(-1);
    manifest.versions.push({
      ...entry,
      id: realVersion,
      release: '99.2.0',
      openapi: {
        ...entry.openapi,
        file: `openapi/${realVersion}.json`,
        sha256: createHash('sha256').update(realSchema).digest('hex'),
      },
    });
    await writeFile(resolve(content, `openapi/${realVersion}.json`), realSchema);
  }
  await writeFile(resolve(content, 'versions.json'), JSON.stringify(manifest, null, 2) + '\n');
  const locales = Object.keys(JSON.parse(await readFile(resolve(content, 'locales.json'), 'utf8')));
  for (const target of [version, realVersion].filter(Boolean))
    for (const locale of locales) {
      await mkdir(resolve(content, locale, 'docs', target), { recursive: true });
      for (const slug of ['api-access', 'api-reference']) {
        const body = await readFile(resolve(content, locale, 'docs/next', `${slug}.md`), 'utf8');
        await writeFile(
          resolve(content, locale, 'docs', target, `${slug}.md`),
          body.replaceAll('/docs/next/', `/docs/${target}/`),
        );
      }
    }
  const port = await new Promise(
    /** Reserve an ephemeral loopback port for the isolated reference test server. */ (resolvePort, reject) => {
      const server = createServer();
      server.once('error', reject);
      server.listen(
        0,
        '127.0.0.1',
        /** Handle each server.listen callback invocation. */ () => {
          const port = server.address().port;
          server.close(
            /** Evaluate `(error ? reject(error) : resolvePort(port))`. */ (error) =>
              error ? reject(error) : resolvePort(port),
          );
        },
      );
    },
  );
  const options = {
    cwd: temporary,
    stdio: 'inherit',
    env: {
      ...process.env,
      CI: 'true',
      API_REFERENCE_FIXTURE_VERSION: version,
      API_REFERENCE_REAL_VERSION: realVersion,
      PLAYWRIGHT_PORT: String(port),
    },
  };
  execFileSync('pnpm', ['build'], options);
  execFileSync(
    'pnpm',
    ['exec', 'playwright', 'test', 'tests/e2e/api-reference.spec.ts', '--max-failures=1', ...process.argv.slice(2)],
    options,
  );
} finally {
  await rm(resolve(root, 'test-results/api-reference'), { recursive: true, force: true });
  await mkdir(resolve(root, 'test-results/api-reference'), { recursive: true });
  for (const directory of ['test-results', 'playwright-report']) {
    await cp(resolve(temporary, directory), resolve(root, 'test-results/api-reference', directory), {
      recursive: true,
    }).catch(
      /** Handle each cp(resolve(temporary, directory), resolve(root, 'test-results/api-reference', directory), { recursive: true, }).catch callback invocation. */ () => {},
    );
  }
  await rm(temporaryRoot, { recursive: true, force: true });
}
