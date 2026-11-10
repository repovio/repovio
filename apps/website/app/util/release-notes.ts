/** Renderer-provided heading metadata; IDs are owned by Nuxt Content, not reconstructed from versions. */
export interface ReleaseHeading {
  id: string;
  text: string;
  depth: number;
}

/**
 * Select published release headings while preserving the renderer's IDs and metadata.
 * @typeParam T Full heading type supplied by the content renderer.
 * @param {T[]} headings Parsed table-of-contents links in canonical source order.
 * @returns {T[]} Published H2 releases without category headings or invented identifiers.
 */
export function getReleaseHeadings<T extends ReleaseHeading>(headings: T[]): T[] {
  return headings.filter(
    /** Match version headings without interpreting their generated IDs. */ (heading) =>
      heading.depth === 2 && /^\d+\.\d+\.\d+$/.test(heading.text),
  );
}
