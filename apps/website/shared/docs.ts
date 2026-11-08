import manifest from '../content/versions.json' with { type: 'json' };
/** Public documentation versions; internal previews never enter navigation or search. */
export const docVersions = manifest.versions.filter(
  /** Keep entries matching `version.status !== 'preview'`. */ (version) => version.status !== 'preview',
);
export const docVersionsByNewest = [...docVersions].sort(
  /** Handle each [...docVersions].sort callback invocation. */ (a, b) => {
    if (a.status === 'preview') return -1;
    if (b.status === 'preview') return 1;
    return b.id.localeCompare(a.id, 'en', { numeric: true });
  },
);
export const stableDocVersion = manifest.stable;
export const docSlugs = [...new Set(docVersions.flatMap(/** Evaluate `version.slugs`. */ (version) => version.slugs))];
/** Find a published version, returning undefined for previews and unknown identifiers. */
export function getDocVersion(id: string) {
  return docVersions.find(/** Find the entry matching `version.id === id`. */ (version) => version.id === id);
}
/** Build the canonical unlocalized route for a released documentation page. */
export function docPath(version: string, slug = 'overview') {
  return `/docs/${version}/${slug}`;
}
