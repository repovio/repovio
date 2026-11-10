import type { Page } from '@playwright/test';

/** Provide deterministic permission-scoped responses and count real browser read requests. */
export async function mockRefreshApplication(page: Page) {
  const counts: Record<string, number> = {};
  const writes: string[] = [];
  await page.addInitScript(
    /** Start with an authenticated local monitoring session. */ () => {
      localStorage.setItem('repovio.access-token', 'refresh-test-token');
    },
  );
  await page.route(
    '**/api/v1/**',
    /** Serve only synthetic API responses, never real providers. */ async (route) => {
      const request = route.request();
      const path = new URL(request.url()).pathname.replace('/api/v1/', '');
      counts[path] = (counts[path] ?? 0) + 1;
      if (request.method() !== 'GET') writes.push(`${request.method()} ${path}`);
      let body: unknown = {
        items: [],
        meta: { itemCount: 0, pageCount: 0, page: 1, perPage: 25, hasNextPage: false, hasPrevPage: false },
      };
      if (path === 'auth/me') body = { id: 'refresh-user', username: 'refresh-user', role: 'SYSTEM_ADMIN' };
      else if (path === 'auth/setup-status') body = { initialized: true };
      else if (path === 'settings') body = { dateTimeFormat: 'LOCALE_MEDIUM', workflowRunRetentionDays: 90 };
      else if (path === 'version/latest') body = { latest: null };
      else if (path === 'health') body = { api: 'ok', database: 'ok', providers: [], status: 'ok' };
      else if (path === 'dashboard/summary')
        body = {
          awaitingApprovalCount: 0,
          completedCount: counts[path],
          medianDurationMs: 1000,
          queuedCount: 0,
          runningCount: 0,
          securityAlerts: { code: 0, critical: 0, dependency: 0, high: 0, secret: 0 },
          statuses: { cancelled: 0, failed: 0, skipped: 0, success: 1, unknown: 0 },
          successRate: 100,
          totalRunDurationMs: 1000,
        };
      else if (path.startsWith('dashboard/')) body = [];
      else if (path === 'issues/summary') body = { assigned: 0, open: counts[path], recentlyUpdated: 0, stale: 0 };
      else if (path === 'pull-requests/summary')
        body = { drafts: 0, failedWorkflows: 0, open: counts[path], workflowApprovalRequired: 0 };
      else if (path === 'security-alerts/summary')
        body = {
          open: { CODE: 0, DEPENDENCY: 0, SECRET: 0 },
          severity: { CRITICAL: 0, HIGH: 0, INFO: 0, LOW: 0, MEDIUM: 0, UNKNOWN: 0 },
          unavailableRepositories: 0,
        };
      else if (path.endsWith('/filter-options'))
        body = {
          assignees: [],
          authors: [],
          labels: [],
          milestones: [],
          manifests: [],
          secretProviders: [],
          repositories: [],
          availability: [],
          ecosystems: [],
          packages: [],
          paths: [],
          rules: [],
          scanners: [],
          secretTypes: [],
          tools: [],
        };
      await route.fulfill({ json: body });
    },
  );
  return { counts, writes };
}
