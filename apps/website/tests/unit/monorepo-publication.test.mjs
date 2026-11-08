import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { recordPublication } from '../../scripts/record-publication.mjs';

/** Changesets, rather than documentation scripts, controls the independent website version. */
it('records monorepo provenance and emits an idempotent website-only Changeset', /** Verify records monorepo provenance and emits an idempotent website-only Changeset. */ async () => {
  const root = await mkdtemp(join(tmpdir(), 'repovio-docs-record-'));
  try {
    const websiteRoot = join(root, 'apps/website');
    await mkdir(join(websiteRoot, 'content'), { recursive: true });
    await mkdir(join(root, '.changeset'));
    const request = { tag: 'repovio@2.0.1', revision: 'a'.repeat(40), docsRevision: 'b'.repeat(40) };
    await writeFile(join(websiteRoot, 'docs-publications.json'), '{}');
    await writeFile(join(websiteRoot, 'package.json'), '{"version":"0.2.0"}');
    await writeFile(
      join(websiteRoot, 'content/versions.json'),
      JSON.stringify({
        versions: [
          {
            id: 'v2.0',
            release: '2.0.1',
            revision: request.revision,
            docsSourceRevision: request.docsRevision,
            slugs: ['overview'],
          },
        ],
      }),
    );
    const options = { request, websiteRoot, repositoryRoot: root };
    expect(await recordPublication(options)).toBe(true);
    expect(await readFile(join(websiteRoot, 'package.json'), 'utf8')).toBe('{"version":"0.2.0"}');
    const changeset = await readFile(join(root, '.changeset/docs-2.0.1.md'), 'utf8');
    expect(changeset).toContain("'@repovio/website': patch");
    expect(changeset).not.toContain("'repovio':");
    const newerManifest = {
      versions: [
        {
          id: 'v2.0',
          release: '2.0.2',
          revision: 'c'.repeat(40),
          docsSourceRevision: 'c'.repeat(40),
          slugs: ['overview'],
        },
      ],
    };
    await writeFile(join(websiteRoot, 'content/versions.json'), JSON.stringify(newerManifest));
    const beforeRecords = await readFile(join(websiteRoot, 'docs-publications.json'), 'utf8');
    expect(await recordPublication(options)).toBe(false);
    expect(await readFile(join(websiteRoot, 'docs-publications.json'), 'utf8')).toBe(beforeRecords);
    expect(await readFile(join(root, '.changeset/docs-2.0.1.md'), 'utf8')).toBe(changeset);
    await expect(recordPublication({ ...options, request: { ...request, revision: 'c'.repeat(40) } })).rejects.toThrow(
      'identity',
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
