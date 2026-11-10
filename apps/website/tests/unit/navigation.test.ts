import { describe, expect, it } from 'vitest';
import manifest from '../../content/versions.json' with { type: 'json' };
import {
  buildGuideNavigation,
  getDocEntries,
  getGuideSection,
  resolveDocRedirect,
  type GuideNavigationNode,
} from '../../shared/docs-navigation';

const stable = manifest.stable;

describe('explicit documentation hierarchy', /** Verify explicit documentation hierarchy. */ () => {
  it('matches the application sections and includes every published destination once', /** Verify matches the application sections and includes every published destination once. */ () => {
    const entries = getDocEntries(stable);
    expect(entries.map(/** Map each entry to `entry.slug`. */ (entry) => entry.slug).sort()).toEqual(
      manifest.versions
        .find(/** Find the entry matching `version.id === stable`. */ (version) => version.id === stable)!
        .slugs.slice()
        .sort(),
    );
    expect([
      ...new Set(
        entries
          .filter(/** Keep entries matching `entry.tab === 'guides'`. */ (entry) => entry.tab === 'guides')
          .map(/** Map each entry to `entry.section`. */ (entry) => entry.section),
      ),
    ]).toEqual(['overview', 'operations', 'administration']);
    expect(
      entries
        .filter(
          /** Keep entries matching `entry.group === 'workflowRuns'`. */ (entry) => entry.group === 'workflowRuns',
        )
        .map(/** Map each entry to `entry.slug`. */ (entry) => entry.slug),
    ).toEqual(['workflow-runs', 'awaiting-approval', 'needs-attention']);
  });

  it('does not expose preview or unknown versions', /** Verify does not expose preview or unknown versions. */ () => {
    expect(getDocEntries('next')).toEqual([]);
    expect(getDocEntries('v99.0')).toEqual([]);
  });

  it('places every Guide page exactly once under its application destination', /** Verify places every Guide page exactly once under its application destination. */ () => {
    const entries = getDocEntries(stable).map(
      /** Map each entry to `({ ...entry, title: entry.slug, to: `/de/docs/${stable}/${entry.slug}`, })`. */ (
        entry,
      ) => ({
        ...entry,
        title: entry.slug,
        to: `/de/docs/${stable}/${entry.slug}`,
      }),
    );
    const nodes = buildGuideNavigation(entries, [], /** Return `key` when invoked. */ (key) => key);
    expect(nodes.map(/** Map each entry to `node.id`. */ (node) => node.id)).toEqual([
      'dashboard',
      'workflowRuns',
      'issues',
      'pullRequests',
      'securityAlerts',
      'repositories',
      'jobs',
      'notifications',
      'providerAccounts',
      'users',
      'settings',
    ]);
    /** Compute `destinations` as `items.flatMap((node) => [...(node.to ? [node.to] : []), ...destinations(node.children)])`. */
    const destinations = (items: GuideNavigationNode[]): string[] =>
      items.flatMap(
        /** Evaluate `[...(node.to ? [node.to] : []), ...destinations(node.children)]`. */ (node) => [
          ...(node.to ? [node.to] : []),
          ...destinations(node.children),
        ],
      );
    expect(destinations(nodes).sort()).toEqual(
      entries
        .filter(/** Keep entries matching `entry.tab === 'guides'`. */ (entry) => entry.tab === 'guides')
        .map(/** Map each entry to `entry.to`. */ (entry) => entry.to)
        .sort(),
    );
    expect(getGuideSection('repositories')).toBe('operations');
    expect(
      nodes.find(/** Find the entry matching `node.id === 'workflowRuns'`. */ (node) => node.id === 'workflowRuns')?.to,
    ).toBeUndefined();
    expect(
      nodes
        .find(/** Find the entry matching `node.id === 'repositories'`. */ (node) => node.id === 'repositories')
        ?.children.map(/** Map each entry to `node.id`. */ (node) => node.id),
    ).toEqual(['provider-webhooks']);
    expect(buildGuideNavigation([], [], /** Return `key` when invoked. */ (key) => key)).toEqual([]);
  });

  it('uses localized H2 text and valid encoded fragments without duplicating the landing page', /** Verify uses localized H2 text and valid encoded fragments without duplicating the landing page. */ () => {
    const entries = getDocEntries(stable)
      .filter(/** Keep entries matching `entry.slug === 'guide-issues'`. */ (entry) => entry.slug === 'guide-issues')
      .map(
        /** Map each entry to `({ ...entry, title: 'Issues', to: `/de/docs/${stable}/${entry.slug}`, })`. */ (
          entry,
        ) => ({
          ...entry,
          title: 'Issues',
          to: `/de/docs/${stable}/${entry.slug}`,
        }),
      );
    const nodes = buildGuideNavigation(
      entries,
      [
        {
          path: `/docs/${stable}/guide-issues`,
          links: [
            { id: 'übersicht', text: 'Übersicht', depth: 2 },
            { id: 'nested', text: 'Nested', depth: 3 },
          ],
        },
      ],
      /** Return `'Issues'` when invoked. */ () => 'Issues',
    );
    expect(nodes[0]?.children).toEqual([
      {
        id: 'guide-issues#übersicht',
        title: 'Übersicht',
        to: `/de/docs/${stable}/guide-issues#%C3%BCbersicht`,
        children: [],
      },
    ]);
  });

  it('preserves old English and German destination bookmarks', /** Verify preserves old English and German destination bookmarks. */ () => {
    expect(resolveDocRedirect('guide-workflow-queues', '#needs-attention')).toEqual({
      slug: 'needs-attention',
      hash: '',
    });
    expect(resolveDocRedirect('guide-workflow-queues', '#alle-l%C3%A4ufe')).toEqual({
      slug: 'workflow-runs',
      hash: '',
    });
    expect(resolveDocRedirect('guide-administration', '#benutzer-und-rechte')).toEqual({ slug: 'users', hash: '' });
    expect(resolveDocRedirect('guide-issues-pull-requests', '#pull-requests-and-merge-requests')?.slug).toBe(
      'guide-pull-requests',
    );
  });

  it('retains unknown fragments and does not treat object prototype keys as routes', /** Verify retains unknown fragments and does not treat object prototype keys as routes. */ () => {
    expect(resolveDocRedirect('guide-administration', '#unknown')).toEqual({
      slug: 'provider-accounts',
      hash: '#unknown',
    });
    expect(resolveDocRedirect('constructor')).toBeUndefined();
    expect(resolveDocRedirect('provider-accounts', '#benutzer-und-rechte')).toEqual({ slug: 'users', hash: '' });
    expect(resolveDocRedirect('guide-administration', '#%')).toEqual({ slug: 'provider-accounts', hash: '#%' });
  });
});

/** Public release navigation must remain localized without modifying archived manifests. */
describe('release history interface locales', /** Check every declared website language. */ () => {
  it('provides all release interface keys for every supported locale', /** Verify real locale files rather than allowing fallback masking. */ async () => {
    const { readFile } = await import('node:fs/promises');
    const registry = JSON.parse(await readFile(new URL('../../content/locales.json', import.meta.url), 'utf8'));
    for (const code of Object.keys(registry)) {
      const messages = JSON.parse(await readFile(new URL(`../../i18n/locales/${code}.json`, import.meta.url), 'utf8'));
      for (const key of [
        'releaseNotes',
        'releaseNotesDescription',
        'releaseNotesEnglish',
        'releaseNotesEmpty',
        'releaseNotesVersions',
      ]) {
        expect(messages[key], `${code}: ${key}`).toBeTruthy();
      }
    }
  });
});
