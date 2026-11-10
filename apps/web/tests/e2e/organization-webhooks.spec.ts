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
            expect(Object.keys(route.request().postDataJSON()).sort()).toEqual(['scope', 'webhookSecret']);
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
    const trigger = page.getByRole('button', {
      name: locale === 'de' ? 'Aktionen für Synthetic GitLab' : 'Actions for Synthetic GitLab',
      exact: true,
    });
    await trigger.click();
    await page.getByRole('menuitem', { name: title, exact: true }).click();
    const dialog = page.getByRole('dialog', { name: title, exact: true });
    await expect(dialog.getByRole('heading', { name: title })).toBeVisible();
    await expect(dialog.getByRole('alert')).toBeVisible();
    await dialog
      .getByRole('button', { name: locale === 'de' ? 'Organisations-Webhooks laden' : 'Load organization webhooks' })
      .click();
    await expect(dialog.getByText(/Premium/)).toBeVisible();
    const form = dialog.locator('form');
    const callback = form.getByRole('textbox', {
      name: locale === 'de' ? 'Callback-URL' : 'Callback URL',
      exact: true,
    });
    await expect(callback).toHaveCount(1);
    await expect(callback).toHaveAttribute('readonly');
    await expect(callback).toHaveValue('');
    await expect(callback).not.toHaveAttribute('required');
    await expect(
      form.getByRole('button', { name: locale === 'de' ? 'Callback-URL kopieren' : 'Copy callback URL' }),
    ).toBeDisabled();
    await expect(
      form.getByText(
        locale === 'de'
          ? 'Speichere diese Konfiguration, um ihre Callback-URL zu erhalten.'
          : 'Save this configuration to get its callback URL.',
      ),
    ).toBeVisible();
    await callback.scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath(`organization-callback-empty-${locale}.png`), fullPage: true });
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
    await expect(callback).toHaveValue('');
    releaseCreate?.();
    const rotate = dialog.getByRole('button', {
      name: locale === 'de' ? 'Secret wechseln' : 'Rotate secret',
      exact: true,
    });
    await expect(rotate).toBeDisabled();
    await expect(
      dialog.getByRole('textbox', { name: locale === 'de' ? 'Vollständiger Gruppenpfad' : 'Full group path' }),
    ).toHaveAttribute('readonly');
    await expect(callback).toHaveValue(hook.callbackUrl);
    await expect(
      dialog
        .locator('li')
        .getByRole('textbox', { name: locale === 'de' ? 'Callback-URL' : 'Callback URL', exact: true }),
    ).toHaveValue(hook.callbackUrl);
    await dialog.getByRole('checkbox').check();
    await rotate.click();
    await expect(rotate).toBeDisabled();
    await expect(callback).toHaveValue(hook.callbackUrl);
    await callback.scrollIntoViewIfNeeded();
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
    await page.getByRole('menuitem', { name: title, exact: true }).click();
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

for (const { locale, width } of [
  { locale: 'en', width: 1440 },
  { locale: 'de', width: 390 },
] as const) {
  test(`organization callback selection, copying, and recovery (${locale}, ${width}px)`, /** Verify form callbacks across failures and selection changes without provider requests. */ async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.context().addCookies([{ name: 'repovio-locale', value: locale, url: testInfo.project.use.baseURL! }]);
    const copied: string[] = [];
    await page.exposeFunction(
      'recordCopiedCallback',
      /** Record the actual clipboard write independently of displayed text. */ (value: string) => copied.push(value),
    );
    await page.addInitScript(
      /** Authenticate a synthetic administrator and provide a deterministic clipboard. */ () => {
        localStorage.setItem('repovio.access-token', 'synthetic-test-token');
        Object.defineProperty(navigator, 'clipboard', {
          configurable: true,
          value: {
            /** Forward browser clipboard writes to the test recorder. */
            writeText: (value: string) =>
              (window as unknown as { recordCopiedCallback: (text: string) => Promise<void> }).recordCopiedCallback(
                value,
              ),
          },
        });
      },
    );
    const provider = {
      id: '11111111-1111-4111-8111-111111111111',
      providerType: 'GITLAB',
      displayName: 'Synthetic GitLab',
      enabled: true,
      baseUrl: 'https://example.test',
      lastSyncAt: null,
    };
    const first = {
      id: '33333333-3333-4333-8333-333333333333',
      providerAccountId: provider.id,
      providerType: 'GITLAB',
      scope: 'acme',
      callbackUrl: 'https://public.example.test/api/webhooks/organization/33333333-3333-4333-8333-333333333333',
      lastDeliveryAt: null,
    };
    const second = {
      ...first,
      id: '44444444-4444-4444-8444-444444444444',
      scope: 'another-organization',
      callbackUrl:
        'https://organization-webhook-callback-with-a-long-public-hostname.example.test/api/webhooks/organization/44444444-4444-4444-8444-444444444444',
    };
    const created = {
      ...first,
      id: '55555555-5555-4555-8555-555555555555',
      scope: 'new-organization',
      callbackUrl: 'https://public.example.test/api/webhooks/organization/55555555-5555-4555-8555-555555555555',
    };
    let configurations = [first, second];
    let failCreate = true;
    let failRotation = true;
    let mutations = 0;
    const runtimeErrors: string[] = [];
    page.on('pageerror', /** Retain unexpected client-side exceptions. */ (error) => runtimeErrors.push(error.message));
    await page.route(
      '**/api/v1/**',
      /** Exercise existing typed client paths with synthetic success and failure responses. */ async (route) => {
        const path = new URL(route.request().url()).pathname;
        const method = route.request().method();
        if (path.endsWith('/auth/me')) {
          await route.fulfill({ json: { id: 'admin', username: 'playwright', role: 'SYSTEM_ADMIN' } });
        } else if (path.endsWith('/authentication-options')) {
          await route.fulfill({ json: { oauthProviderTypes: [] } });
        } else if (path === '/api/v1/provider-accounts') {
          await route.fulfill({ json: { items: [provider], meta: { itemCount: 1, pageCount: 1 } } });
        } else if (path.includes('/organization-webhooks')) {
          if (method === 'POST') {
            mutations++;
            expect(Object.keys(route.request().postDataJSON()).sort()).toEqual(['scope', 'webhookSecret']);
            expect(route.request().postDataJSON().scope).toBe(created.scope);
            if (failCreate) {
              failCreate = false;
              await route.fulfill({ status: 503, json: {} });
            } else {
              configurations = [...configurations, created];
              await route.fulfill({ json: created });
            }
          } else if (method === 'PATCH') {
            mutations++;
            expect(path.endsWith(`/${second.id}`)).toBe(true);
            expect(Object.keys(route.request().postDataJSON())).toEqual(['webhookSecret']);
            if (failRotation) {
              failRotation = false;
              await route.fulfill({ status: 503, json: {} });
            } else await route.fulfill({ json: second });
          } else if (method === 'DELETE') {
            mutations++;
            expect(path.endsWith(`/${created.id}`)).toBe(true);
            configurations = configurations.filter(
              /** Remove only the requested configuration. */ (hook) => hook.id !== created.id,
            );
            await route.fulfill({ status: 204 });
          } else await route.fulfill({ json: configurations });
        } else await route.abort();
      },
    );

    await page.goto('/admin/providers');
    const title = locale === 'de' ? 'Organisations-Webhooks' : 'Organization webhooks';
    const trigger = page.getByRole('button', {
      name: locale === 'de' ? 'Aktionen für Synthetic GitLab' : 'Actions for Synthetic GitLab',
      exact: true,
    });
    await trigger.click();
    await page.getByRole('menuitem', { name: title, exact: true }).click();
    const dialog = page.getByRole('dialog', { name: title, exact: true });
    const form = dialog.locator('form');
    const callback = form.getByRole('textbox', {
      name: locale === 'de' ? 'Callback-URL' : 'Callback URL',
      exact: true,
    });
    const copy = form.getByRole('button', {
      name: locale === 'de' ? 'Callback-URL kopieren' : 'Copy callback URL',
      exact: true,
    });
    const scope = form.getByRole('textbox', {
      name: locale === 'de' ? 'Vollständiger Gruppenpfad' : 'Full group path',
    });
    const secret = form.locator('input[autocomplete="new-password"]');
    const help = form.getByText(
      locale === 'de'
        ? 'Speichere diese Konfiguration, um ihre Callback-URL zu erhalten.'
        : 'Save this configuration to get its callback URL.',
    );
    await expect(callback).toHaveValue('');
    await expect(copy).toBeDisabled();
    await expect(help).toBeVisible();
    await scope.fill(created.scope);
    await secret.fill('synthetic-signing-secret-for-browser-tests');
    const add = form.getByRole('button', {
      name: locale === 'de' ? 'Organisations-Webhook hinzufügen' : 'Add organization webhook',
      exact: true,
    });
    await add.click();
    await expect(dialog.getByRole('alert')).toBeVisible();
    await expect(callback).toHaveValue('');
    await expect(copy).toBeDisabled();
    await expect(scope).toHaveValue(created.scope);
    await expect(secret).toHaveValue('synthetic-signing-secret-for-browser-tests');
    await add.click();
    await expect(callback).toHaveValue(created.callbackUrl);
    await expect(help).toHaveCount(0);
    await expect(copy).toHaveAttribute('type', 'button');
    await callback.focus();
    await expect(callback).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(copy).toBeFocused();
    await page.keyboard.press('Enter');
    await expect.poll(/** Observe the actual clipboard side effect. */ () => copied).toEqual([created.callbackUrl]);
    expect(mutations).toBe(2);

    await form
      .getByRole('button', { name: locale === 'de' ? 'Weitere Organisation hinzufügen' : 'Add another organization' })
      .click();
    await expect(callback).toHaveValue('');
    await expect(copy).toBeDisabled();
    await expect(help).toBeVisible();
    const manageName = locale === 'de' ? 'Webhook verwalten' : 'Manage webhook';
    await dialog
      .locator('li')
      .filter({ has: page.getByText(first.scope, { exact: true }) })
      .getByRole('button', { name: manageName })
      .click();
    await expect(callback).toHaveValue(first.callbackUrl);
    await copy.click();
    await expect.poll(/** Check selection-specific clipboard output. */ () => copied.at(-1)).toBe(first.callbackUrl);
    await dialog
      .locator('li')
      .filter({ has: page.getByText(second.scope, { exact: true }) })
      .getByRole('button', { name: manageName })
      .click();
    await expect(callback).toHaveValue(second.callbackUrl);
    await copy.click();
    await expect
      .poll(/** Check the second configuration's exact public address. */ () => copied.at(-1))
      .toBe(second.callbackUrl);
    expect(mutations).toBe(2);
    await page.evaluate(
      /** Simulate a denied clipboard write without changing server state. */ () => {
        navigator.clipboard.writeText = /** Reject the attempted copy. */ async () => {
          throw new Error('Synthetic clipboard denial');
        };
      },
    );
    await copy.click();
    await expect(
      page.getByText(locale === 'de' ? 'Der Wert konnte nicht kopiert werden.' : 'The value could not be copied.', {
        exact: true,
      }),
    ).toBeVisible();
    expect(copied).toHaveLength(3);
    await secret.fill('synthetic-replacement-signing-secret');
    await form.getByRole('checkbox').check();
    const rotate = form.getByRole('button', {
      name: locale === 'de' ? 'Secret wechseln' : 'Rotate secret',
      exact: true,
    });
    await rotate.click();
    await expect(dialog.getByRole('alert')).toBeVisible();
    await expect(callback).toHaveValue(second.callbackUrl);
    await expect(secret).toHaveValue('synthetic-replacement-signing-secret');
    await rotate.click();
    await expect(rotate).toBeDisabled();
    await expect(callback).toHaveValue(second.callbackUrl);
    await expect(callback).toHaveAttribute('readonly');
    await callback.scrollIntoViewIfNeeded();
    const overflows = await dialog.evaluate(
      /** Inspect the dialog and each ancestor of the long input for horizontal overflow. */ (element) =>
        [element, ...element.querySelectorAll('form, form input')].some(
          /** Native inputs scroll their text internally; containers must remain within their bounds. */ (node) =>
            !(node instanceof HTMLInputElement) && node.scrollWidth > node.clientWidth + 1,
        ),
    );
    expect(overflows).toBe(false);
    await page.screenshot({ path: testInfo.outputPath(`organization-callback-long-${locale}.png`), fullPage: true });
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
    await trigger.click();
    await page.getByRole('menuitem', { name: title, exact: true }).click();
    await expect(callback).toHaveValue('');
    await expect(copy).toBeDisabled();
    await expect(help).toBeVisible();
    await dialog
      .locator('li')
      .filter({ has: page.getByText(created.scope, { exact: true }) })
      .getByRole('button', { name: manageName })
      .click();
    await form
      .getByRole('button', { name: locale === 'de' ? 'Konfiguration entfernen' : 'Remove configuration' })
      .click();
    await page.getByRole('button', { name: locale === 'de' ? 'Entfernen' : 'Remove', exact: true }).click();
    await expect(callback).toHaveValue('');
    await expect(copy).toBeDisabled();
    await expect(help).toBeVisible();
    expect(mutations).toBe(5);
    expect(runtimeErrors).toEqual([]);
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
