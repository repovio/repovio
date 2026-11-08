import navigation from '../content/navigation.json' with { type: 'json' };
import manifest from '../content/versions.json' with { type: 'json' };

/** One destination's explicit position in the public handbook. */
export interface DocNavigationEntry {
  slug: string;
  tab: 'get-started' | 'guides' | 'api';
  section: string;
  group: string | null;
  order: number;
}

/** Application destination owning a set of Guide pages; a null slug denotes an expandable group. */
export interface DocNavigationGroup {
  id: string;
  section: string;
  title: string;
  icon: string;
  slug: string | null;
}

/** Localized navigation node, shared by desktop and mobile renderers. */
export interface GuideNavigationNode {
  id: string;
  title: string;
  to?: string;
  icon?: string;
  children: GuideNavigationNode[];
}

/** Parsed content headings used for function links without exposing complete page bodies. */
export interface GuidePageHeadings {
  path: string;
  links: Array<{ id: string; text: string; depth: number }>;
}

/** Build the application hierarchy using only pages available in the selected release and locale. */
export function buildGuideNavigation(
  entries: Array<DocNavigationEntry & { title: string; to: string }>,
  headings: GuidePageHeadings[],
  translate: (key: string) => string,
): Array<GuideNavigationNode> {
  return (navigation.groups as DocNavigationGroup[]).flatMap(
    /** Handle each (navigation.groups as DocNavigationGroup[]).flatMap callback invocation. */ (group) => {
      const pages = entries.filter(
        /** Keep entries matching `entry.tab === 'guides' && entry.group === group.id`. */ (entry) =>
          entry.tab === 'guides' && entry.group === group.id,
      );
      if (!pages.length) return [];
      const pageNodes = pages.map(
        /** Map each entry to `({ id: entry.slug, title: entry.title, to: entry.to, children: (headings.find((page) => page.path.endsWith(`/${entry.slug}`))?.links || []) `. */ (
          entry,
        ): GuideNavigationNode => ({
          id: entry.slug,
          title: entry.title,
          to: entry.to,
          children: (
            headings.find(
              /** Find the entry matching `page.path.endsWith(`/${entry.slug}`)`. */ (page) =>
                page.path.endsWith(`/${entry.slug}`),
            )?.links || []
          )
            .filter(/** Keep entries matching `link.depth === 2`. */ (link) => link.depth === 2)
            .map(
              /** Map each entry to `({ id: `${entry.slug}#${link.id}`, title: link.text, to: `${entry.to}#${encodeURIComponent(link.id)}`, children: [], })`. */ (
                link,
              ) => ({
                id: `${entry.slug}#${link.id}`,
                title: link.text,
                to: `${entry.to}#${encodeURIComponent(link.id)}`,
                children: [],
              }),
            ),
        }),
      );
      const landing = pageNodes.find(
        /** Find the entry matching `page.id === group.slug`. */ (page) => page.id === group.slug,
      );
      return [
        {
          id: group.id,
          title: translate(group.title),
          icon: group.icon,
          to: landing?.to,
          children: [
            ...(landing?.children || []),
            ...pageNodes.filter(/** Keep entries matching `page !== landing`. */ (page) => page !== landing),
          ],
        },
      ];
    },
  );
}

/** Return the section owning an application navigation group. */
export function getGuideSection(group: string): string {
  return navigation.groups.find(/** Find the entry matching `item.id === group`. */ (item) => item.id === group)!
    .section;
}

/** Legacy page replacement, including old localized heading bookmarks. */
export interface DocRedirect {
  slug: string;
  hash: string;
}

/** Select entries for a released version without relying on manifest array order. */
export function getDocEntries(version: string): DocNavigationEntry[] {
  const release = manifest.versions.find(
    /** Find the entry matching `item.id === version && item.status !== 'preview'`. */ (item) =>
      item.id === version && item.status !== 'preview',
  );
  if (!release) return [];
  return (navigation.entries as DocNavigationEntry[])
    .filter(
      /** Keep entries matching `release.slugs.includes(entry.slug)`. */ (entry) => release.slugs.includes(entry.slug),
    )
    .sort(/** Order entries by `a.order - b.order`. */ (a, b) => a.order - b.order);
}

/** Resolve old combined-page URLs and English/German fragments to individual destinations. */
export function resolveDocRedirect(slug: string, hash = ''): DocRedirect | undefined {
  const redirects = navigation.redirects as Record<string, { to: string; anchors: Record<string, string> }>;
  let anchor = hash.replace(/^#/, '');
  try {
    anchor = decodeURIComponent(anchor);
  } catch {
    // Preserve malformed fragments instead of throwing during legacy navigation.
  }
  // HTTP redirects cannot see URL fragments. Resolve an inherited legacy fragment on the client after that hop.
  if (!Object.hasOwn(redirects, slug)) {
    const inherited = Object.values(redirects).find(
      /** Find the entry matching `rule.to === slug && Object.hasOwn(rule.anchors, anchor) && rule.anchors[anchor] !== slug`. */ (
        rule,
      ) => rule.to === slug && Object.hasOwn(rule.anchors, anchor) && rule.anchors[anchor] !== slug,
    );
    return inherited ? { slug: inherited.anchors[anchor]!, hash: '' } : undefined;
  }
  const rule = redirects[slug]!;
  const target = Object.hasOwn(rule.anchors, anchor) ? rule.anchors[anchor] : undefined;
  return { slug: target || rule.to, hash: target ? '' : hash };
}
