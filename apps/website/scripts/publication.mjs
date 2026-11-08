import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { format, resolveConfig } from 'prettier';
import { validateOpenApi, verifyOpenApiArchive } from '../content/scripts/openapi.mjs';
import { readLocales } from '../content/scripts/validate.mjs';

/** Validate a trusted release request and determine whether its immutable archive already exists. */
export function planPublication({ request, manifest, sourceRevision, docsRevision, sourceVersion }) {
  if (!/^[a-f0-9]{40}$/.test(request.revision || '') || !/^[a-f0-9]{40}$/.test(request.docsRevision || '')) {
    throw new Error('Exact application and documentation revisions are required');
  }
  const match = /^(?:repovio@|v)?(\d+)\.(\d+)\.(\d+)$/.exec(request.tag || '');
  if (!match || match.slice(1).join('.') !== sourceVersion)
    throw new Error('Release tag does not match application version');
  if (sourceRevision !== request.revision || docsRevision !== request.docsRevision)
    throw new Error('Checked-out source revision mismatch');
  const id = `v${match[1]}.${match[2]}`;
  const existing = manifest.versions.find(
    /** Find the entry matching `entry.id === id && entry.status !== 'preview'`. */ (entry) =>
      entry.id === id && entry.status !== 'preview',
  );
  if (existing && existing.release === sourceVersion) {
    if (existing.revision !== sourceRevision || existing.docsSourceRevision !== docsRevision)
      throw new Error('Publication identity changed');
    return { id, release: sourceVersion, existing: true };
  }
  if (existing && existing.release.localeCompare(sourceVersion, 'en', { numeric: true }) > 0) {
    throw new Error('Cannot replace newer documentation with an older patch');
  }
  const next = manifest.versions.find(
    /** Find the entry matching `entry.id === 'next' && entry.status === 'preview'`. */ (entry) =>
      entry.id === 'next' && entry.status === 'preview',
  );
  if (!next || next.workingTreeSource || !next.slugs.length || !/^[a-f0-9]{40}$/.test(next.revision))
    throw new Error('Reviewed next sources are required');
  return { id, release: sourceVersion, existing: false, next };
}

/** Publish to local staging directories only; remote pushes happen after all validation and captures pass. */
export async function preparePublication({ request, appRoot, docsRoot, websiteRoot, sourceDocsRoot = docsRoot }) {
  /** Compute `git` as `execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()`. */
  const git = (root, args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
  for (const source of [appRoot, sourceDocsRoot]) {
    if (git(source, ['status', '--porcelain']))
      throw new Error('Exact publication sources must have clean working trees');
  }
  const manifest = JSON.parse(await readFile(resolve(docsRoot, 'versions.json'), 'utf8'));
  const snapshot = JSON.parse(await readFile(resolve(sourceDocsRoot, 'versions.json'), 'utf8'));
  const inputManifest = {
    ...manifest,
    versions: [
      ...manifest.versions.filter(/** Keep entries matching `entry.id !== 'next'`. */ (entry) => entry.id !== 'next'),
      snapshot.versions.find(/** Find the entry matching `entry.id === 'next'`. */ (entry) => entry.id === 'next'),
    ],
  };
  const sourceVersion = JSON.parse(await readFile(resolve(appRoot, 'package.json'), 'utf8')).version;
  const plan = planPublication({
    request,
    manifest: inputManifest,
    sourceVersion,
    sourceRevision: git(appRoot, ['rev-parse', 'HEAD']),
    docsRevision: git(sourceDocsRoot, ['rev-parse', 'HEAD']),
  });
  if (!plan.existing) {
    git(appRoot, ['merge-base', '--is-ancestor', plan.next.revision, request.revision]);
    const changed = git(appRoot, ['diff', '--name-only', plan.next.revision, request.revision])
      .split('\n')
      .filter(Boolean);
    if (
      changed.some(
        /** Check whether an entry matches `!/^(package\.json|pnpm-lock\.yaml|CHANGELOG\.md|\.changeset\/|apps\/website\/|docs\/|graphify-out\/)/.test(name)`. */ (
          name,
        ) =>
          !/^(package\.json|pnpm-lock\.yaml|CHANGELOG\.md|\.changeset\/|apps\/website\/|docs\/|graphify-out\/)/.test(
            name,
          ),
      )
    ) {
      throw new Error('Next documentation is not reviewed against this application source');
    }
  }
  const locales = Object.keys(await readLocales(sourceDocsRoot)).sort();
  const currentLocales = Object.keys(await readLocales(docsRoot)).sort();
  if (JSON.stringify(locales) !== JSON.stringify(currentLocales)) {
    throw new Error('Reviewed documentation locale registry differs from the publication target');
  }
  const next =
    plan.next ||
    snapshot.versions.find(
      /** Find the entry matching `entry.id === 'next' && entry.status === 'preview'`. */ (entry) =>
        entry.id === 'next' && entry.status === 'preview',
    );
  if (
    !next ||
    next.workingTreeSource ||
    next.slugs.some(
      /** Check whether an entry matches `!/^[a-z0-9-]+$/.test(slug)`. */ (slug) => !/^[a-z0-9-]+$/.test(slug),
    )
  ) {
    throw new Error('Reviewed next sources are required');
  }
  const formatting = (await resolveConfig(resolve(sourceDocsRoot, '.prettierrc.json'))) || {};
  const sourceHash = createHash('sha256');
  const pages = [];
  // Read and format every translation before touching the archive or its publication manifest.
  for (const locale of locales) {
    for (const slug of next.slugs) {
      const input = resolve(sourceDocsRoot, locale, 'docs/next', slug + '.md');
      const body = await readFile(input, 'utf8');
      sourceHash.update(locale + '/' + slug + '\0' + body);
      const target = resolve(docsRoot, locale, 'docs', plan.id, slug + '.md');
      const published = await format(body.replaceAll('/docs/next/', `/docs/${plan.id}/`), {
        ...formatting,
        parser: 'markdown',
      });
      pages.push({ directory: resolve(docsRoot, locale, 'docs', plan.id), target, published });
    }
  }
  const contentDigest = sourceHash.digest('hex');
  if (plan.existing) {
    await verifyOpenApiArchive(
      docsRoot,
      manifest.versions.find(/** Find the entry matching `entry.id === plan.id`. */ (entry) => entry.id === plan.id),
    );
    const archive = manifest.versions.find(
      /** Find the entry matching `entry.id === plan.id`. */ (entry) => entry.id === plan.id,
    );
    if (archive.contentDigest !== contentDigest) throw new Error('Published documentation digest changed');
    for (const page of pages) {
      if ((await readFile(page.target, 'utf8')) !== page.published) {
        throw new Error('Published documentation content changed');
      }
    }
    return plan;
  }
  let openapi;
  if (next.slugs.includes('api-reference')) {
    const temporary = await mkdtemp(resolve(tmpdir(), 'repovio-openapi-'));
    try {
      const output = resolve(temporary, 'openapi.json');
      execFileSync('pnpm', ['--filter', '@repovio/api', 'openapi:export', output], {
        cwd: appRoot,
        stdio: 'inherit',
      });
      const bytes = await readFile(output);
      validateOpenApi(JSON.parse(bytes.toString('utf8')));
      const file = `openapi/${plan.id}.json`;
      await mkdir(resolve(docsRoot, 'openapi'), { recursive: true });
      await writeFile(resolve(docsRoot, file), bytes);
      openapi = { file, revision: request.revision, sha256: createHash('sha256').update(bytes).digest('hex') };
    } finally {
      await rm(temporary, { recursive: true, force: true });
    }
  }
  for (const page of pages) {
    await mkdir(page.directory, { recursive: true });
    await writeFile(page.target, page.published);
  }
  // Partial staging failures never update the published manifest.
  const currentStable = manifest.versions.find(
    /** Find the entry matching `entry.id === manifest.stable`. */ (entry) => entry.id === manifest.stable,
  );
  const newer = !currentStable || plan.release.localeCompare(currentStable.release, 'en', { numeric: true }) >= 0;
  manifest.versions = manifest.versions.filter(
    /** Keep entries matching `entry.id !== plan.id`. */ (entry) => entry.id !== plan.id,
  );
  if (newer) for (const entry of manifest.versions) if (entry.status === 'stable') entry.status = 'archived';
  manifest.versions.push({
    id: plan.id,
    release: plan.release,
    revision: request.revision,
    docsSourceRevision: request.docsRevision,
    contentDigest,
    ...(openapi ? { openapi } : {}),
    status: newer ? 'stable' : 'archived',
    slugs: next.slugs,
  });
  if (newer) manifest.stable = plan.id;
  await writeFile(
    resolve(docsRoot, 'versions.json'),
    await format(JSON.stringify(manifest), { ...formatting, parser: 'json' }),
  );
  if (resolve(docsRoot) !== resolve(websiteRoot, 'content'))
    await cp(docsRoot, resolve(websiteRoot, 'content'), {
      recursive: true,
      /** Return `!path.split('/').includes('.git')` when invoked. */
      filter: (path) => !path.split('/').includes('.git'),
    });
  return plan;
}
