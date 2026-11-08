const timestamp = '2026-11-05T10:00:00.000Z';
const repository = {
  id: 'fixture-repo',
  name: 'demo-api',
  owner: 'example',
  url: 'https://github.com/example/demo-api',
};
/** Compute `paginated` as `({ items, meta: { hasNextPage: false, hasPrevPage: false, itemCount: items.length, page: 1, pageCount: 1, perPage: 25 }, })`. */
const paginated = (items) => ({
  items,
  meta: { hasNextPage: false, hasPrevPage: false, itemCount: items.length, page: 1, pageCount: 1, perPage: 25 },
});

/** Deterministic, secret-free responses used only by the isolated released-application capture. */
export function productCaptureResponse(path, failedRun) {
  const run = {
    ...failedRun,
    repositoryId: repository.id,
    repositoryName: repository.name,
    repositoryOwner: repository.owner,
    providerType: 'GITHUB',
    branch: 'main',
    event: 'push',
    runNumber: 101,
    attempt: 1,
    updatedAt: timestamp,
  };
  const issue = {
    id: 'fixture-issue',
    title: 'Improve build diagnostics',
    number: '42',
    state: 'OPEN',
    assignees: [],
    author: { username: 'demo', displayName: 'Demo', avatarUrl: null, url: null },
    labels: [{ name: 'maintenance', color: '0891b2', description: null }],
    milestone: null,
    closedAt: null,
    providerType: 'GITHUB',
    providerCreatedAt: timestamp,
    providerUpdatedAt: timestamp,
    repositoryId: repository.id,
    repositoryName: repository.name,
    repositoryOwner: repository.owner,
    url: 'https://github.com/example/demo-api/issues/42',
  };
  const user = {
    id: 'fixture-user',
    username: 'demo',
    firstName: 'Demo',
    lastName: 'User',
    role: 'SYSTEM_ADMIN',
    authProvider: 'LOCAL',
    avatarUpdatedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  if (path === '/workflow-runs') return paginated([run]);
  if (path === '/issues') return paginated([issue]);
  if (path === '/repositories')
    return paginated([
      {
        ...repository,
        repositoryName: repository.name,
        repositoryOwner: repository.owner,
        providerType: 'GITHUB',
        enabled: true,
      },
    ]);
  if (path === '/users')
    return paginated([
      user,
      {
        ...user,
        id: 'fixture-viewer',
        username: 'reviewer',
        firstName: 'Repository',
        lastName: 'Viewer',
        role: 'VIEWER',
      },
    ]);
  if (path === '/auth/me') return user;
  if (path === '/security-alerts')
    return paginated([
      {
        id: 'fixture-alert',
        kind: 'DEPENDENCY',
        severity: 'HIGH',
        state: 'OPEN',
        title: 'Demo dependency advisory',
        packageName: 'demo-package',
        ecosystem: 'npm',
        vulnerableRange: '<2.0.0',
        fixedVersion: '2.0.0',
        manifest: 'package-lock.json',
        identifiers: ['DEMO-ADVISORY-001'],
        location: null,
        description: null,
        resolution: null,
        resolvedAt: null,
        ruleId: null,
        scanner: null,
        secretProvider: null,
        secretType: null,
        tool: null,
        providerType: 'GITHUB',
        providerCreatedAt: timestamp,
        providerUpdatedAt: timestamp,
        providerUrl: 'https://github.com/example/demo-api/security/dependabot/1',
        repositoryId: repository.id,
        repositoryName: repository.name,
        repositoryOwner: repository.owner,
      },
    ]);
  if (path === '/security-alerts/summary')
    return {
      open: { DEPENDENCY: 1, CODE: 0, SECRET: 0 },
      severity: { CRITICAL: 0, HIGH: 1, MEDIUM: 0, LOW: 0, INFO: 0, UNKNOWN: 0 },
      unavailableRepositories: 0,
    };
  if (path === '/security-alerts/filter-options')
    return {
      availability: [],
      ecosystems: ['npm'],
      manifests: ['package-lock.json'],
      packages: ['demo-package'],
      paths: [],
      repositories: [repository],
      rules: [],
      scanners: [],
      secretProviders: [],
      secretTypes: [],
    };
  if (path === '/notification-channels' || path === '/notification-channels/query')
    return paginated([
      {
        id: 'fixture-channel',
        name: 'Engineering alerts',
        type: 'EMAIL',
        enabled: true,
        canManage: true,
        browserRecipients: [],
        createdAt: timestamp,
        updatedAt: timestamp,
        eventSubscriptions: [],
        requiresReconfiguration: false,
        urlScheme: null,
      },
    ]);
  if (path === '/browser-push') return { available: false, subscriptions: [], subscriptionCount: 0 };
  return undefined;
}

/** Capture targets use actual released routes rather than mock HTML or unpublished application screens. */
export const productCaptureTargets = [
  { name: 'dashboard', path: '/', text: 'Build and test' },
  { name: 'workflow-monitoring', path: '/workflow-runs', text: 'Build and test' },
  { name: 'issues-pull-requests', path: '/issues', text: 'Improve build diagnostics' },
  { name: 'security-alerts', path: '/alerts/dependencies', text: 'Demo dependency advisory' },
  { name: 'notifications', path: '/notifications', text: 'Engineering alerts' },
  { name: 'access-control', path: '/admin/users', text: '@reviewer' },
];
