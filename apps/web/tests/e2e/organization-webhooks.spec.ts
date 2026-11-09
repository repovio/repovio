import { expect, test } from '@playwright/test';

for (const { locale, width } of [
  { locale: 'en', width: 1440 },
  { locale: 'de', width: 390 },
] as const) {
  test(`organization webhook setup and repository badge (${locale}, ${width}px)`, /** Verify localized configuration, pending/error states, and repository inheritance. */ async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.context().addCookies([{ name: 'repovio-locale', value: locale, url: testInfo.project.use.baseURL! }]);
    await page.addInitScript(
      /** Supply synthetic authentication without real credentials. */ () => {
        localStorage.setItem('repovio.access-token', 'synthetic-test-token');
      },
    );
    const providerId = '11111111-1111-4111-8111-111111111111';
    const repositoryId = '22222222-2222-4222-8222-222222222222';
    const webhookId = '33333333-3333-4333-8333-333333333333';
    const provider = {
      id: providerId,
      providerType: 'GITLAB',
      displayName: 'Synthetic GitLab',
      enabled: true,
      baseUrl: 'https://example.test',
      lastSyncAt: null,
    };
    let configured = false;
    let firstLoad = true;
    let releaseCreate: (() => void) | undefined;
    const createPending = new Promise<void>(
      /** Retain the resolver to verify the full request's loading state. */ (resolve) => {
        releaseCreate = resolve;
      },
    );
    const hook = {
      id: webhookId,
      providerAccountId: providerId,
      providerType: 'GITLAB',
      scope: 'acme',
      callbackUrl: 'https://repovio.example.test/api/webhooks/organization/' + webhookId,
      lastDeliveryAt: null,
    };
    const requests: string[] = [];
    const errors: string[] = [];
    page.on(
      'pageerror',
      /** Retain unexpected runtime failures so mocks cannot conceal UI errors. */ (error) =>
        errors.push(error.message),
    );
    const repository = {
      id: repositoryId,
      providerAccountId: providerId,
      providerRepositoryId: '42',
      owner: 'acme/team',
      name: 'synthetic-repo',
      enabled: true,
      url: 'https://example.test/acme/team/synthetic-repo',
      lastSyncAt: null,
      members: [],
      workflowRunCount: 0,
    };
    await page.route(
      '**/api/v1/**',
      /** Provide deterministic synthetic API state; real backend coverage lives in integration tests. */ async (
        route,
      ) => {
        const path = new URL(route.request().url()).pathname;
        const method = route.request().method();
        requests.push(`${method} ${path}`);
        let json: unknown;
        if (path.endsWith('/auth/me')) json = { id: 'admin', username: 'playwright', role: 'SYSTEM_ADMIN' };
        else if (path.endsWith('/authentication-options')) json = { oauthProviderTypes: [] };
        else if (path === '/api/v1/provider-accounts')
          json = { items: [provider], meta: { itemCount: 1, pageCount: 1 } };
        else if (path.includes('/organization-webhooks')) {
          if (method === 'GET' && firstLoad) {
            firstLoad = false;
            await route.fulfill({ status: 503, json: {} });
            return;
          }
          if (method === 'POST') {
            expect(route.request().postDataJSON().scope).toBe('acme');
            expect(route.request().postDataJSON().webhookSecret).toHaveLength(64);
            await createPending;
            configured = true;
            json = hook;
          } else if (method === 'PATCH') {
            expect(Object.keys(route.request().postDataJSON())).toEqual(['webhookSecret']);
            json = hook;
          } else if (method === 'DELETE') {
            configured = false;
            await route.fulfill({ status: 204 });
            return;
          } else json = configured ? [hook] : [];
        } else if (path === '/api/v1/repositories/webhook-configurations') {
          json = [
            {
              repositoryId,
              providerType: 'GITLAB',
              configured: true,
              source: configured ? 'ORGANIZATION' : 'REPOSITORY',
              organizationWebhook: configured ? { id: webhookId, providerAccountId: providerId, scope: 'acme' } : null,
              callbackUrl: hook.callbackUrl,
              lastDeliveryAt: null,
            },
          ];
        } else if (path === '/api/v1/repositories') {
          json = { items: [repository], meta: { itemCount: 1, pageCount: 1 } };
        } else if (path === `/api/v1/repositories/${repositoryId}`) json = repository;
        else if (path === '/api/v1/users' || path === '/api/v1/user-groups')
          json = { items: [], meta: { itemCount: 0, pageCount: 0 } };
        else if (path.endsWith('/workflow-filters') || path.endsWith('/memberships') || path.endsWith('/group-grants'))
          json = [];
        else {
          await route.abort();
          return;
        }
        await route.fulfill({ json });
      },
    );

    await page.goto('/admin/providers');
    const title = locale === 'de' ? 'Organisations-Webhooks' : 'Organization webhooks';
    const trigger = page.getByRole('button', { name: title, exact: true });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: title, exact: true });
    await expect(dialog.getByRole('heading', { name: title })).toBeVisible();
    await expect(dialog.getByRole('alert')).toBeVisible();
    await dialog
      .getByRole('button', { name: locale === 'de' ? 'Organisations-Webhooks laden' : 'Load organization webhooks' })
      .click();
    await expect(dialog.getByText(/Premium/)).toBeVisible();
    await dialog
      .getByRole('textbox', { name: locale === 'de' ? 'Vollständiger Gruppenpfad' : 'Full group path' })
      .fill('acme');
    await dialog.getByRole('button', { name: locale === 'de' ? 'Secret generieren' : 'Generate secret' }).click();
    const add = dialog.getByRole('button', {
      name: locale === 'de' ? 'Organisations-Webhook hinzufügen' : 'Add organization webhook',
      exact: true,
    });
    await add.click();
    await expect(add).toBeDisabled();
    await expect(add.locator('[data-slot="leadingIcon"]')).toBeVisible();
    releaseCreate?.();
    const rotate = dialog.getByRole('button', {
      name: locale === 'de' ? 'Secret wechseln' : 'Rotate secret',
      exact: true,
    });
    await expect(rotate).toBeDisabled();
    await expect(
      dialog.getByRole('textbox', { name: locale === 'de' ? 'Vollständiger Gruppenpfad' : 'Full group path' }),
    ).toHaveAttribute('readonly');
    await expect(dialog.locator('input[readonly]').first()).toHaveValue(hook.callbackUrl);
    await dialog.getByRole('checkbox').check();
    await rotate.click();
    await expect(rotate).toBeDisabled();
    await page.screenshot({ path: testInfo.outputPath(`organization-dialog-${locale}.png`), fullPage: true });
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();

    await page.goto('/repositories');
    const badge = page.locator('tbody').getByText(locale === 'de' ? 'Organisation' : 'Organization', { exact: true });
    await badge.scrollIntoViewIfNeeded();
    await expect(badge).toBeVisible();
    await expect(badge).toHaveClass(/text-blue-600/);
    const colors = await badge.evaluate(
      /** Compare actual badge color to an explicit blue utility in the current theme. */ (element) => {
        const reference = document.createElement('span');
        reference.className = 'text-blue-600 dark:text-blue-400';
        document.body.append(reference);
        const result = { actual: getComputedStyle(element).color, expected: getComputedStyle(reference).color };
        reference.remove();
        return result;
      },
    );
    expect(colors.actual).toBe(colors.expected);
    await page.screenshot({ path: testInfo.outputPath(`organization-badge-${locale}.png`), fullPage: true });
    await page
      .getByRole('button', { name: locale === 'de' ? 'Repository bearbeiten' : 'Edit repository', exact: true })
      .click();
    const inherited = page.getByText(locale === 'de' ? 'Organisations-Webhook: acme' : 'Organization webhook: acme', {
      exact: true,
    });
    await inherited.scrollIntoViewIfNeeded();
    await expect(inherited).toBeVisible();
    await expect(
      page.getByRole('textbox', { name: locale === 'de' ? 'Signing-Secret' : 'Signing secret', exact: true }),
    ).toHaveCount(0);
    const management = page.getByRole('link', {
      name: locale === 'de' ? 'Anbieter-Webhooks verwalten' : 'Manage provider webhooks',
    });
    await expect(management).toHaveAttribute('href', '/admin/providers');
    await management.click();
    await trigger.click();
    await dialog.getByRole('button', { name: locale === 'de' ? 'Webhook verwalten' : 'Manage webhook' }).click();
    await expect(dialog.locator('input[autocomplete="new-password"]')).toHaveValue('');
    await dialog
      .getByRole('button', { name: locale === 'de' ? 'Konfiguration entfernen' : 'Remove configuration' })
      .click();
    await page.getByRole('button', { name: locale === 'de' ? 'Entfernen' : 'Remove', exact: true }).click();
    await expect(
      dialog.getByText(
        locale === 'de' ? 'Keine Organisations-Webhooks konfiguriert.' : 'No organization webhooks configured.',
      ),
    ).toBeVisible();
    await page.keyboard.press('Escape');
    await page.goto('/repositories');
    await expect(
      page.locator('tbody').getByText(locale === 'de' ? 'Konfiguriert' : 'Configured', { exact: true }),
    ).toBeVisible();
    await expect(badge).toHaveCount(0);
    expect(
      requests.some(
        /** Confirm that rotation used the scoped endpoint. */ (request) =>
          request === `PATCH /api/v1/provider-accounts/${providerId}/organization-webhooks/${webhookId}`,
      ),
    ).toBe(true);
    expect(errors).toEqual([]);
  });
}

test('viewers cannot access organization administration or repository webhook configuration', /** Verify route and column gating independently from backend authorization tests. */ async ({
  page,
}) => {
  const configurationRequests: string[] = [];
  await page.addInitScript(
    /** Authenticate a synthetic viewer. */ () =>
      localStorage.setItem('repovio.access-token', 'synthetic-viewer-token'),
  );
  await page.route(
    '**/api/v1/**',
    /** Return viewer metadata while retaining evidence of forbidden configuration requests. */ async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path.includes('webhook')) configurationRequests.push(path);
      if (path.endsWith('/auth/me'))
        await route.fulfill({ json: { id: 'viewer', username: 'viewer', role: 'VIEWER' } });
      else if (path === '/api/v1/repositories')
        await route.fulfill({ json: { items: [], meta: { itemCount: 0, pageCount: 0 } } });
      else await route.abort();
    },
  );
  await page.goto('/repositories');
  await expect(page.getByRole('columnheader', { name: 'Webhook', exact: true })).toHaveCount(0);
  await page.goto('/admin/providers');
  await expect(page).toHaveURL('/');
  expect(configurationRequests).toEqual([]);
});
