import type { Page } from '@playwright/test';

/** Existing Global Roles exercised by Repository acceptance tests. */
export type TestRole = 'SYSTEM_ADMIN' | 'MANAGER' | 'VIEWER';

/** Build safe, distinguishable Repository fixtures without real Provider credentials. */
export function testRepository(id = 'repository-1') {
  return {
    id,
    owner: 'team',
    name: id,
    enabled: true,
    providerAccountId: 'provider-1',
    providerRepositoryId: id,
    url: `https://example.test/team/${id}`,
    members: [],
    lastSyncAt: null,
    workflowRunCount: 1,
    workflowRunRetentionDays: 30,
    issueRetentionDays: null,
    pullRequestRetentionDays: null,
    syncIntervalSeconds: 1800,
    syncState: {
      attempt: 0,
      lastError: null,
      progressCurrent: null,
      progressPhase: null,
      progressTotal: null,
      requestedAt: null,
      scopes: ['WORKFLOWS', 'ISSUES', 'PULL_REQUESTS'],
      startedAt: null,
      status: 'IDLE',
    },
  };
}

/** Mock the real application boundary with two Repositories and inspectable requests. */
export async function mockRepositoryApplication(page: Page, role: TestRole = 'SYSTEM_ADMIN', repositoryName?: string) {
  const requests: string[] = [];
  await page.addInitScript(
    /** Authenticate only inside this synthetic browser context. */ () => {
      localStorage.setItem('repovio.access-token', 'test-access-token');
    },
  );
  await page.route(
    '**/api/v1/**',
    /** Return synthetic API data, retaining real client query behavior. */ async (route) => {
      const url = new URL(route.request().url());
      const path = url.pathname.replace('/api/v1/', '');
      requests.push(url.pathname + url.search);
      let data: unknown = [];
      const repositories = [
        { ...testRepository(), ...(repositoryName ? { name: repositoryName } : {}) },
        testRepository('repository-2'),
      ];
      const emptyPage = {
        items: [],
        meta: { hasNextPage: false, hasPrevPage: false, itemCount: 0, page: 1, pageCount: 0, perPage: 25 },
      };
      if (path === 'auth/me') data = { id: 'test-user', username: 'tester', role };
      else if (path === 'settings') data = { workflowRunRetentionDays: 90, dateTimeFormat: 'LOCALE_MEDIUM' };
      else if (path === 'health') data = { status: 'ok', api: 'ok', database: 'ok', providers: [] };
      else if (path === 'version/latest') data = { latest: '999.0.0' };
      else if (path === 'repositories')
        data = { ...emptyPage, items: repositories, meta: { ...emptyPage.meta, itemCount: 2, pageCount: 1 } };
      else if (/^repositories\/repository-[12]$/.test(path))
        data = repositories.find(
          /** Return the matching Repository's current metadata. */ (repository) =>
            repository.id === path.split('/')[1],
        );
      else if (path === 'repositories/forbidden') {
        await route.fulfill({ status: 404 });
        return;
      } else if (path.endsWith('/filter-options'))
        data = {
          authors: [],
          assignees: [],
          labels: [],
          milestones: [],
          repositories,
          ecosystems: [],
          manifests: [],
          packages: [],
          paths: [],
          rules: [],
          scanners: [],
          secretProviders: [],
          secretTypes: [],
          availability: repositories.flatMap(
            /** Return independent availability for each category. */ (repository) =>
              ['DEPENDENCY', 'CODE', 'SECRET'].map(
                /** Represent a synchronized supported category. */ (kind) => ({
                  repositoryId: repository.id,
                  kind,
                  availability: 'AVAILABLE',
                  reason: null,
                  lastSuccessfulSyncAt: '2026-11-09T08:00:00Z',
                }),
              ),
          ),
        };
      else if (path === 'dashboard/summary')
        data = {
          statuses: { failed: 0, success: 0 },
          queuedCount: 0,
          runningCount: 0,
          totalRunDurationMs: 0,
          totalRuns: 0,
          successRate: 0,
          awaitingApprovalCount: 0,
        };
      else if (path.endsWith('/summary'))
        data = { open: 0, recent: 0, assigned: 0, stale: 0, severity: {}, states: {}, unavailableRepositories: 0 };
      else if (['issues', 'pull-requests', 'workflow-runs', 'security-alerts'].includes(path)) {
        const where = url.searchParams.get('where') ?? '';
        const id = where.includes('repository-2') ? 'repository-2' : 'repository-1';
        const kind = where.includes('SECRET') ? 'SECRET' : where.includes('CODE') ? 'CODE' : 'DEPENDENCY';
        const record = {
          id: `${path}-${id}`,
          repositoryId: id,
          repositoryName: id === 'repository-1' && repositoryName ? repositoryName : id,
          repositoryOwner: 'team',
          providerType: 'GITHUB',
          title: `${path} ${id}`,
          displayTitle: `Build ${id}`,
          workflowName: 'Build',
          number: '1',
          state: 'OPEN',
          status: 'SUCCESS',
          severity: 'HIGH',
          kind,
          author: null,
          assignees: [],
          labels: [],
          workflowStatus: 'SUCCESS',
          draft: false,
          workflowApprovalRequired: false,
          providerUpdatedAt: '2026-11-09T08:00:00Z',
          providerCreatedAt: '2026-11-09T08:00:00Z',
          completedAt: '2026-11-09T08:01:00Z',
          startedAt: null,
          durationMs: 60000,
          location: null,
          url: `https://example.test/${path}/1`,
          providerUrl: `https://example.test/${path}/1`,
        };
        const pageNumber = Number(url.searchParams.get('page') ?? 1);
        data = {
          items: pageNumber > 1 ? [] : [record],
          meta: { ...emptyPage.meta, itemCount: 1, pageCount: 1, page: pageNumber },
        };
      } else if (/^(issues|pull-requests|security-alerts)\//.test(path) && !path.endsWith('filter-options')) {
        data = {
          id: path.split('/')[1],
          title: 'Record details',
          number: '1',
          state: 'OPEN',
          kind: 'DEPENDENCY',
          severity: 'HIGH',
          repositoryId: 'repository-1',
          repositoryName: 'repository-1',
          repositoryOwner: 'team',
          providerType: 'GITHUB',
          author: null,
          assignees: [],
          labels: [],
          body: '',
          url: 'https://example.test/item',
          providerUrl: 'https://example.test/item',
          providerUpdatedAt: '2026-11-09T08:00:00Z',
          providerCreatedAt: '2026-11-09T08:00:00Z',
          location: null,
        };
      } else if (
        path === 'users' ||
        path === 'user-groups' ||
        path === 'provider-accounts' ||
        path.includes('needs-attention')
      )
        data = emptyPage;
      await route.fulfill({ json: data });
    },
  );
  return { requests };
}
