import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getReleaseHeadings } from '../../app/util/release-notes';
import { readReleaseNotes, validateReleaseNotes } from '../../scripts/check-release-notes.mjs';

/** Exercise source validation without changing the canonical repository changelog. */
describe('canonical application release source', /** Verify the canonical source contract. */ () => {
  /** Compare numeric version components rather than lexical ordering. */
  it('accepts semantic descending versions and category headings', /** Verify the canonical source contract. */ () => {
    expect(validateReleaseNotes('# Changelog\n\n## 2.10.0\n\n### Minor Changes\n\n- New\n\n## 2.9.0\n')).toEqual([
      '2.10.0',
      '2.9.0',
    ]);
  });
  /** Keep valid empty history distinct from an unavailable source. */
  it('accepts a deliberate empty changelog', /** Verify the canonical source contract. */ () => {
    expect(validateReleaseNotes('# Changelog\n')).toEqual([]);
  });
  /** Reject ambiguous or unpublished release headings before building. */
  it.each([
    '# Changelog\n## 2.0.0\n## 2.0.0',
    '# Changelog\n## 2.9.0\n## 2.10.0',
    '# Changelog\n## Unreleased',
    '# Changelog\n## 2.0',
    'not a changelog',
  ])(
    'rejects invalid source %s',
    /** Reject invalid release source. */ (source) => {
      expect(/** Verify the canonical source contract. */ () => validateReleaseNotes(source)).toThrow();
    },
  );
  /** Preserve complete Markdown prose and surface actual filesystem failures. */
  it('reads full content and rejects missing or unreadable sources', /** Verify the canonical source contract. */ () => {
    const dir = mkdtempSync(join(tmpdir(), 'repovio-release-notes-'));
    try {
      const path = join(dir, 'CHANGELOG.md');
      const source = '# Changelog\n\n## 1.0.0\n\n### Patch Changes\n\n- Summary\n\n  Migration paragraph.\n';
      writeFileSync(path, source);
      expect(readReleaseNotes(path)).toBe(source);
      expect(/** Verify the canonical source contract. */ () => readReleaseNotes(join(dir, 'missing.md'))).toThrow();
      expect(/** Verify the canonical source contract. */ () => readReleaseNotes(dir)).toThrow();
    } finally {
      rmSync(dir, { recursive: true });
    }
  });
  /** Canonical source must satisfy the same contract as isolated fixtures. */
  it('validates the actual application history', /** Verify the canonical source contract. */ () => {
    expect(validateReleaseNotes(readReleaseNotes()).length).toBeGreaterThan(1);
  });
});

/** Keep release navigation in sync with renderer output and preserve all provided metadata. */
describe('rendered release navigation', /** Verify heading adaptation rather than recreating Markdown parsing. */ () => {
  it('retains renderer identifiers, source order, and metadata', /** Keep actual numeric-heading normalization intact. */ () => {
    const release = {
      id: '_230',
      text: '2.3.0',
      depth: 2,
      children: [{ id: 'minor-changes', text: 'Minor Changes', depth: 3 }],
    };
    const old = { id: '_020', text: '0.2.0', depth: 2, children: [] };
    expect(
      getReleaseHeadings([release, { id: 'category', text: 'Patch Changes', depth: 3, children: [] }, old]),
    ).toEqual([release, old]);
    expect(getReleaseHeadings([])).toEqual([]);
    expect(getReleaseHeadings([release])[0]).toBe(release);
  });
});
