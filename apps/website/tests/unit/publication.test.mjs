import { describe, expect, it } from 'vitest';
import { planPublication } from '../../scripts/publication.mjs';

const revision = 'a'.repeat(40);
const docsRevision = 'b'.repeat(40);
/** Compute `input` as `({ request: { tag: 'repovio@2.0.0', revision, docsRevision }, sourceRevision: revision, docsRevision, sourceVersion: '2.0.0', manifest: { st`. */
const input = () => ({
  request: { tag: 'repovio@2.0.0', revision, docsRevision },
  sourceRevision: revision,
  docsRevision,
  sourceVersion: '2.0.0',
  manifest: {
    stable: 'v1.0',
    versions: [
      { id: 'v1.0', release: '1.0.1', revision: 'c'.repeat(40), status: 'stable', slugs: ['overview'] },
      { id: 'next', release: null, revision, status: 'preview', slugs: ['overview'] },
    ],
  },
});
describe('documentation publication admission', /** Verify documentation publication admission. */ () => {
  it('selects the exact minor archive for a verified release', /** Verify selects the exact minor archive for a verified release. */ () => {
    expect(planPublication(input())).toMatchObject({ id: 'v2.0', release: '2.0.0', existing: false });
  });
  it.each(['main', '../main', 'v2.0.0;echo unexpected', 'v2.0.0-beta.1'])(
    'rejects unsupported tag %s',
    /** Reject branch names, unsafe tag strings, and prerelease identifiers. */ (tag) => {
      const value = input();
      value.request.tag = tag;
      expect(/** Return `planPublication(value)` when invoked. */ () => planPublication(value)).toThrow('Release tag');
    },
  );
  it('rejects moved or incorrectly checked out source and docs revisions', /** Verify rejects moved or incorrectly checked out source and docs revisions. */ () => {
    expect(
      /** Return `planPublication({ ...input(), sourceRevision: 'c'.repeat(40) })` when invoked. */ () =>
        planPublication({ ...input(), sourceRevision: 'c'.repeat(40) }),
    ).toThrow('mismatch');
    expect(
      /** Return `planPublication({ ...input(), docsRevision: 'c'.repeat(40) })` when invoked. */ () =>
        planPublication({ ...input(), docsRevision: 'c'.repeat(40) }),
    ).toThrow('mismatch');
    const value = input();
    value.request.revision = 'main';
    expect(/** Return `planPublication(value)` when invoked. */ () => planPublication(value)).toThrow('Exact');
  });
  it('makes an identical retry a no-op and rejects identity changes', /** Verify makes an identical retry a no-op and rejects identity changes. */ () => {
    const value = input();
    value.manifest.versions.push({
      id: 'v2.0',
      status: 'stable',
      release: '2.0.0',
      revision,
      docsSourceRevision: docsRevision,
      slugs: ['overview'],
    });
    expect(planPublication(value).existing).toBe(true);
    value.request.docsRevision = 'c'.repeat(40);
    value.docsRevision = value.request.docsRevision;
    expect(/** Return `planPublication(value)` when invoked. */ () => planPublication(value)).toThrow(
      'Publication identity changed',
    );
  });
  it('does not overwrite newer patch documentation', /** Verify does not overwrite newer patch documentation. */ () => {
    const value = input();
    value.manifest.versions.push({ id: 'v2.0', release: '2.0.1', revision, status: 'stable', slugs: ['overview'] });
    expect(/** Return `planPublication(value)` when invoked. */ () => planPublication(value)).toThrow('newer');
  });
});

it('rejects documentation still marked as an uncommitted working-tree source', /** Verify rejects documentation still marked as an uncommitted working-tree source. */ () => {
  const value = input();
  value.manifest.versions.find(
    /** Find the entry matching `entry.id === 'next'`. */ (entry) => entry.id === 'next',
  ).workingTreeSource = true;
  expect(/** Return `planPublication(value)` when invoked. */ () => planPublication(value)).toThrow(
    'Reviewed next sources',
  );
});
