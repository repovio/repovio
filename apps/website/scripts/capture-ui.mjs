import { chromium, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { format, resolveConfig } from 'prettier';
import { productCaptureResponse, productCaptureTargets } from './product-capture-fixtures.mjs';

/** Capture the real application with isolated, synthetic API responses and source provenance. */
export async function captureUi({ sourceRoot, baseUrl, outputRoot }) {
  const revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: sourceRoot, encoding: 'utf8' }).trim();
  const sourceFiles = execFileSync(
    'git',
    [
      'ls-files',
      '--cached',
      '--others',
      '--exclude-standard',
      '-z',
      'apps/web',
      'package.json',
      'pnpm-lock.yaml',
      'pnpm-workspace.yaml',
    ],
    {
      cwd: sourceRoot,
      encoding: 'utf8',
    },
  )
    .split('\0')
    .filter(Boolean)
    .sort();
  const digest = createHash('sha256');
  for (const name of sourceFiles) {
    digest.update(name);
    try {
      digest.update(await readFile(resolve(sourceRoot, name)));
    } catch {
      digest.update('removed');
    }
  }
  const sourceTreeDigest = digest.digest('hex');
  const browser = await chromium.launch();
  const files = [];
  const workingTreeDirty = Boolean(
    execFileSync('git', ['status', '--porcelain', '--', 'apps/web', 'package.json', 'pnpm-lock.yaml'], {
      cwd: sourceRoot,
      encoding: 'utf8',
    }).trim(),
  );
  try {
    for (const locale of ['en', 'de']) {
      for (const mode of ['light', 'dark']) {
        const context = await browser.newContext({
          viewport: { width: 1440, height: 1000 },
          locale,
          colorScheme: mode,
        });
        await context.addCookies(
          ['repovio-locale'].map(
            /** Map each entry to `({ name, value: locale, url: baseUrl })`. */ (name) => ({
              name,
              value: locale,
              url: baseUrl,
            }),
          ),
        );
        await context.addInitScript(
          /** Handle each context.addInitScript callback invocation. */ ({ mode }) => {
            if (window.top !== window || !['localhost', '127.0.0.1'].includes(window.location.hostname)) return;
            localStorage.setItem('repovio.access-token', 'synthetic-capture-token');
            localStorage.setItem('ezrepo.access-token', 'synthetic-capture-token');
            localStorage.setItem('nuxt-color-mode', mode);
          },
          { mode },
        );
        const page = await context.newPage();
        page.on('pageerror', /** Evaluate `console.error(error.message)`. */ (error) => console.error(error.message));
        await page.routeWebSocket(
          /\/socket\.io\//,
          /** Handle each page.routeWebSocket callback invocation. */ (route) => {
            route.send(
              `0${JSON.stringify({ maxPayload: 1000000, pingInterval: 25000, pingTimeout: 20000, sid: 'capture', upgrades: [] })}`,
            );
            route.onMessage(
              /** Handle each route.onMessage callback invocation. */ (message) => {
                const packet = message.toString();
                if (packet === '2') route.send('3');
                if (!packet.startsWith('40/status,')) return;
                route.send('40/status,{"sid":"capture-status"}');
                route.send(
                  `42/status,${JSON.stringify(['system-status', { activity: null, runningWorkflowCount: 3, updatedAt: '2026-11-05T10:02:00.000Z' }])}`,
                );
              },
            );
          },
        );
        const failedRun = {
          id: 'fixture-run-1',
          workflowName: 'Build and test',
          displayTitle: 'Build and test',
          status: 'FAILED',
          providerRunId: '101',
          awaitingApproval: false,
          reviewUrl: null,
          repository: {
            id: 'fixture-repo',
            name: 'demo-api',
            owner: 'example',
            url: 'https://github.com/example/demo-api',
          },
          provider: { id: 'fixture-provider', displayName: 'GitHub', providerType: 'GITHUB' },
          url: 'https://github.com/example/demo-api/actions/runs/101',
          providerCreatedAt: '2026-11-05T10:00:00.000Z',
          startedAt: '2026-11-05T10:00:00.000Z',
          completedAt: '2026-11-05T10:02:00.000Z',
          durationMs: 120000,
        };
        await page.route(
          '**/api/v1/**',
          /** Handle each page.route callback invocation. */ async (route) => {
            const path = new URL(route.request().url()).pathname.replace('/api/v1', '');
            let json;
            const productResponse = productCaptureResponse(path, failedRun);
            if (productResponse !== undefined) json = productResponse;
            else if (path === '/auth/me')
              json = {
                id: 'fixture-user',
                role: 'SYSTEM_ADMIN',
                username: 'demo',
                firstName: 'Demo',
                lastName: 'User',
              };
            else if (path === '/auth/setup-status') json = { initialized: true };
            else if (path === '/auth/oidc/status') json = { enabled: false };
            else if (path === '/dashboard/failures' || path === '/dashboard/latest-runs') json = [failedRun];
            else if (path === '/dashboard/summary')
              json = {
                awaitingApprovalCount: 2,
                completedCount: 24,
                medianDurationMs: 90000,
                queuedCount: 1,
                runningCount: 2,
                securityAlerts: { code: 2, critical: 1, dependency: 3, high: 2, secret: 1 },
                statuses: { cancelled: 0, failed: 3, skipped: 1, success: 20, unknown: 0 },
                successRate: 83.33,
                totalRunDurationMs: 5400000,
              };
            else if (path === '/dashboard/trend')
              json = Array.from(
                { length: 7 },
                /** Evaluate `({ bucketStart: `2026-11-0${index + 1}T00:00:00.000Z`, successCount: index + 2, errorCount: index % 3, })`. */ (
                  _,
                  index,
                ) => ({
                  bucketStart: `2026-11-0${index + 1}T00:00:00.000Z`,
                  successCount: index + 2,
                  errorCount: index % 3,
                }),
              );
            else if (path === '/issues/summary') json = { assigned: 3, open: 8, recentlyUpdated: 5, stale: 2 };
            else if (path === '/pull-requests/summary')
              json = { drafts: 1, failedWorkflows: 2, open: 4, workflowApprovalRequired: 1 };
            else if (path === '/workflow-runs/needs-attention')
              json = {
                items: [],
                meta: { itemCount: 0, page: 1, pageCount: 0, perPage: 25, hasNextPage: false, hasPrevPage: false },
              };
            else if (path === '/version/latest') json = { latest: null };
            else if (path === '/settings') json = { defaultDateTimeFormat: 'medium', retentionDays: 90 };
            else if (path.endsWith('/filter-options'))
              json = { assignees: [], authors: [], labels: [], milestones: [] };
            else if (path === '/repositories' || path === '/pull-requests')
              json = {
                items: [],
                meta: { hasNextPage: false, hasPrevPage: false, itemCount: 0, page: 1, pageCount: 0, perPage: 1000 },
              };
            else if (path === '/system-status') json = { api: 'AVAILABLE', repositories: [] };
            else json = [];
            await route.fulfill({ json });
          },
        );
        // Unknown external requests cannot reach a real provider while rendering fixtures.
        await page.route(
          /^https?:\/\/(?!localhost|127\.0\.0\.1|\[::1\])/,
          /** Evaluate `route.abort()`. */ (route) => route.abort(),
        );
        for (const target of productCaptureTargets) {
          console.log(`Capturing ${target.name} ${locale} ${mode}`);
          await page.goto(new URL(target.path, baseUrl).href);
          await expect(page.locator('#main-content')).toBeVisible({ timeout: 30000 });
          await expect(page.getByText(target.text, { exact: true }).first()).toBeVisible();
          await expect(page.locator('html')).toHaveClass(new RegExp(mode));
          await page.evaluate(/** Evaluate `document.fonts.ready`. */ () => document.fonts.ready);
          const name = `${target.name}-${locale}-${mode}.png`;
          await mkdir(outputRoot, { recursive: true });
          await page.screenshot({ path: resolve(outputRoot, name), animations: 'disabled' });
          files.push({
            name,
            sha256: createHash('sha256')
              .update(await readFile(resolve(outputRoot, name)))
              .digest('hex'),
          });
        }
        await context.close();
      }
    }
    const provenance = {
      schema: 1,
      workingTreeDirty,
      revision,
      sourceTreeDigest,
      syntheticData: true,
      locales: ['en', 'de'],
      themes: ['light', 'dark'],
      files,
    };
    const capturePath = resolve(outputRoot, 'capture.json');
    await writeFile(
      capturePath,
      await format(JSON.stringify(provenance), { ...(await resolveConfig(capturePath)), parser: 'json' }),
    );
    return provenance;
  } finally {
    await browser.close();
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  await captureUi({
    sourceRoot: process.env.APP_SOURCE || '../..',
    baseUrl: process.env.APP_CAPTURE_URL || 'http://localhost:3000',
    outputRoot: process.env.CAPTURE_OUTPUT || 'public/images/product',
  });
}
