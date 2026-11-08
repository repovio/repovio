import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { verifyOpenApiArchive } from '../content/scripts/openapi.mjs';
import { preparePublication } from './publication.mjs';

/**
 * Record a validated archive and enqueue its independent Changesets release.
 * Current-release retries require an exact application checkout to revalidate Markdown and schema bytes.
 * A recorded superseded patch is a no-op and never overwrites the newer minor archive.
 * @returns Whether a new publication record and website-only Changeset were written.
 * @throws Error When identity, archive integrity, or the required retry source cannot be verified.
 */
export async function recordPublication({ request, websiteRoot, repositoryRoot, appRoot, sourceDocsRoot }) {
  const file = resolve(websiteRoot, 'docs-publications.json');
  const records = JSON.parse(await readFile(file, 'utf8'));
  const existing = records[request.tag];
  if (existing) {
    if (existing.applicationRevision !== request.revision || existing.docsSourceRevision !== request.docsRevision) {
      throw new Error('Published request identity cannot change');
    }
  }
  if (!/^repovio@\d+\.\d+\.\d+$/.test(request.tag)) throw new Error('Expected an application release tag');
  const manifest = JSON.parse(await readFile(resolve(websiteRoot, 'content/versions.json'), 'utf8'));
  const version = request.tag.slice('repovio@'.length);
  const minor = 'v' + version.split('.').slice(0, 2).join('.');
  const superseding = manifest.versions.find(
    /** Locate the current archive in this release's minor series. */ (entry) => entry.id === minor,
  );
  if (existing && superseding?.release.localeCompare(version, 'en', { numeric: true }) > 0) return false;
  const archive = manifest.versions.find(
    /** Find the entry matching `entry.release === request.tag.slice('repovio@'.length)`. */ (entry) =>
      entry.release === request.tag.slice('repovio@'.length),
  );
  if (!archive || archive.revision !== request.revision || archive.docsSourceRevision !== request.docsRevision) {
    throw new Error('Publication archive revision mismatch');
  }
  await verifyOpenApiArchive(resolve(websiteRoot, 'content'), archive);
  if (existing) {
    if (existing.openapiSha256 !== archive.openapi?.sha256) throw new Error('Published OpenAPI identity cannot change');
    if (!appRoot) throw new Error('Exact application checkout is required to verify an existing publication');
    await preparePublication({
      request,
      appRoot,
      docsRoot: resolve(websiteRoot, 'content'),
      websiteRoot,
      sourceDocsRoot: sourceDocsRoot || resolve(appRoot, 'apps/website/content'),
    });
    return false;
  }
  records[request.tag] = {
    schema: 2,
    applicationRevision: request.revision,
    docsSourceRevision: request.docsRevision,
    ...(archive.openapi ? { openapiSha256: archive.openapi.sha256 } : {}),
  };
  await writeFile(
    resolve(repositoryRoot, `.changeset/docs-${version}.md`),
    `---\n'@repovio/website': patch\n---\n\nPublish reviewed documentation for Repovio ${version}.\n`,
  );
  await writeFile(file, JSON.stringify(records, null, 2) + '\n');
  return true;
}
