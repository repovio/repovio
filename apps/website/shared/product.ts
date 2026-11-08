import manifest from '../content/versions.json' with { type: 'json' };

/** Published handbook destination; product links must never target unpublished previews. */
export type ProductDocSlug = (typeof manifest.versions)[number]['slugs'][number];

/** Shared navigation, content, and capture metadata for one product capability. */
export interface ProductFeature {
  slug: string;
  titleKey: string;
  descriptionKey: string;
  icon: string;
  docs: readonly ProductDocSlug[];
  screenshot: string | null;
}

/** Ordered product capabilities; shared by overview, landing links, and both navigation variants. */
export const productFeatures = [
  {
    slug: 'dashboard',
    titleKey: 'product_dashboardTitle',
    descriptionKey: 'previewDescription',
    icon: 'i-lucide-layout-dashboard',
    docs: ['guide-dashboard'],
    screenshot: 'dashboard',
  },
  {
    slug: 'workflow-monitoring',
    titleKey: 'featureWorkflowsTitle',
    descriptionKey: 'featureWorkflowsText',
    icon: 'i-lucide-workflow',
    docs: ['workflow-runs', 'needs-attention', 'awaiting-approval'],
    screenshot: 'workflow-monitoring',
  },
  {
    slug: 'issues-pull-requests',
    titleKey: 'featureWorkTitle',
    descriptionKey: 'featureWorkText',
    icon: 'i-lucide-git-pull-request',
    docs: ['guide-issues', 'guide-pull-requests'],
    screenshot: 'issues-pull-requests',
  },
  {
    slug: 'security-alerts',
    titleKey: 'featureSecurityTitle',
    descriptionKey: 'featureSecurityText',
    icon: 'i-lucide-shield-check',
    docs: ['alerts-dependencies', 'alerts-code', 'alerts-secrets'],
    screenshot: 'security-alerts',
  },
  {
    slug: 'notifications',
    titleKey: 'featureNotificationsTitle',
    descriptionKey: 'featureNotificationsText',
    icon: 'i-lucide-bell',
    docs: ['notifications', 'notification-rules', 'notification-history'],
    screenshot: 'notifications',
  },
  {
    slug: 'access-control',
    titleKey: 'featurePermissionsTitle',
    descriptionKey: 'featurePermissionsText',
    icon: 'i-lucide-users',
    docs: ['authentication', 'users'],
    screenshot: 'access-control',
  },
  {
    slug: 'mcp',
    titleKey: 'featureMcpTitle',
    descriptionKey: 'featureMcpText',
    icon: 'i-lucide-plug',
    docs: ['mcp'],
    screenshot: null,
  },
] as const satisfies readonly ProductFeature[];

/** Accepted feature route identifier, derived from the single published registry. */
export type ProductFeatureSlug = (typeof productFeatures)[number]['slug'];

/** Public product routes, also consumed by the sitemap and route coverage tests. */
export const productPaths = [
  '/features',
  ...productFeatures.map(/** Map each entry to ``/features/${slug}``. */ ({ slug }) => `/features/${slug}`),
  '/integrations',
  '/self-hosting',
];

/** Resolve only explicit feature slugs, including when receiving an untrusted route parameter. */
export function getProductFeature(slug: string): (typeof productFeatures)[number] | undefined {
  return productFeatures.find(
    /** Find the entry matching `feature.slug === slug`. */ (feature) => feature.slug === slug,
  );
}

/** Match a localized navigation section, including handbook pages below its overview destination. */
export function isProductSectionActive(path: string, target: string, docsRoot: string): boolean {
  const section = target.startsWith(docsRoot + '/') ? docsRoot : target;
  return path === section || path.startsWith(section + '/');
}
