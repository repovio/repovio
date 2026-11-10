import { expect, test } from '@playwright/test';
import { expectTableHover } from './fixtures/table-hover';

/** Verify the Query Kit provider table and its credential-validated add dialog. */
test('provider account table opens an add dialog with structured native controls', /** Verifies provider account table opens an add dialog with structured native controls. */ async ({
  page,
}, testInfo) => {
  let releaseAuthenticationOptions: (() => void) | undefined;
  const authenticationOptionsResponse = new Promise<void>(
    /** Retains the response resolver so this test controls request completion. */ (resolve) => {
      releaseAuthenticationOptions = resolve;
    },
  );
  await page.addInitScript(
    /** Initializes browser-side authentication and preferences before page scripts run. */ () =>
      window.localStorage.setItem('repovio.access-token', 'playwright-access-token'),
  );
  await page.route(
    /\/api\/v1\/provider-accounts(?:\?.*)?$/,
    /** Supplies the mocked response for the intercepted request. */ async (route) => {
      expect(route.request().url()).toContain('fields=');
      await route.fulfill({
        contentType: 'application/json',
        json: {
          items: [
            {
              baseUrl: null,
              displayName: 'Production GitHub',
              enabled: true,
              id: 'provider-1',
              lastSyncAt: null,
              providerType: 'GITHUB',
            },
          ],
          meta: { itemCount: 1, pageCount: 1 },
        },
      });
    },
  );
  await page.route(
    '**/api/v1/provider-accounts/authentication-options',
    /** Supplies the mocked response for `/api/v1/provider-accounts/authentication-options`. */ async (route) => {
      await authenticationOptionsResponse;
      await route.fulfill({ contentType: 'application/json', json: { oauthProviderTypes: [] } });
    },
  );
  await page.route(
    '**/api/v1/auth/me',
    /** Supplies the mocked response for `/api/v1/auth/me`. */ async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        json: { id: 'playwright-admin', role: 'SYSTEM_ADMIN', username: 'playwright' },
      });
    },
  );

  await page.goto('/admin/providers');

  const breadcrumb = page.getByRole('navigation', { name: 'breadcrumb' });
  await expect(breadcrumb).toContainText('Dashboard');
  await expect(breadcrumb).toContainText('Provider accounts');
  await expect(breadcrumb.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/');
  await expect(breadcrumb.locator('[class~="i-lucide:layout-dashboard"]')).toBeVisible();
  await expect(breadcrumb.locator('[class~="i-lucide:plug-zap"]')).toBeVisible();
  await expect(page.getByText('Production GitHub')).toBeVisible();
  await expectTableHover(page, page.getByRole('table'));
  await expect(page.getByRole('columnheader', { name: 'Webhook' })).toHaveCount(0);
  await expect(page.locator('#main-content [class~="i-tabler:brand-github"]')).toBeVisible();
  await expect(page.getByRole('button', { name: /add provider|anbieter hinzufügen/i })).toBeVisible();
  const actions = page.getByRole('button', { name: 'Actions for Production GitHub' });
  await expect(page.locator('tbody button')).toHaveCount(1);
  await actions.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('menuitem', { name: 'Organization webhooks' })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: 'Disable' })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: 'Delete' })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: /GitLab/ })).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('provider-account-actions.png'), fullPage: true });
  await page.keyboard.press('Escape');
  await expect(actions).toBeFocused();

  await page.getByRole('button', { name: 'playwright' }).click();
  await expect(page.getByText('Language', { exact: true })).toBeVisible();
  await expect(page.getByText('Theme', { exact: true })).toBeVisible();
  await page.getByText('Theme', { exact: true }).click();
  await expect(page.getByText('System', { exact: true })).toBeVisible();
  await expect(page.getByText('Light', { exact: true })).toBeVisible();
  await expect(page.getByText('Dark', { exact: true })).toBeVisible();
  await page.getByText('Light', { exact: true }).click();
  await page.keyboard.press('Shift+O');
  await expect(page.getByText('Table options', { exact: true })).toBeVisible();
  await page.keyboard.press('Shift+O');

  await page.keyboard.press('Shift+N');

  await expect(page.getByRole('heading', { name: /add provider account|anbieter-konto hinzufügen/i })).toBeVisible();
  const submitButton = page.getByRole('button', { name: 'Verify and add provider' });
  await expect(submitButton).toBeDisabled();
  await expect(submitButton.locator('[data-slot="leadingIcon"]')).toBeVisible();
  releaseAuthenticationOptions?.();
  await expect(submitButton).toBeEnabled();
  await expect(page.getByPlaceholder(/production github|produktion github/i)).toBeVisible();
  await expect(page.getByRole('combobox').first()).toBeVisible();
  await expect(page.getByPlaceholder(/read-only token|schreibgeschützten token/i)).toBeVisible();
  await expect(page.getByPlaceholder('https://provider.example.com')).toBeVisible();

  await page.getByRole('combobox').first().click();
  await page.getByRole('option', { name: 'Gitea' }).click();

  await expect(page.getByRole('option', { name: 'Gitea' })).not.toBeVisible();
  await expect(page.getByPlaceholder('https://provider.example.com')).toBeVisible();

  await page.screenshot({ path: testInfo.outputPath('provider-account-form.png'), fullPage: true });
});

test('provider menus preserve capabilities and pending row actions', /** Exercise each provider and delayed local changes through the real menu. */ async ({
  page,
}) => {
  const providers = ['GITHUB', 'GITLAB', 'FORGEJO', 'GITEA'].map(
    /** Supply one distinct account per supported provider. */ (providerType, index) => ({
      id: `account-${index}`,
      providerType,
      displayName: providerType,
      enabled: index !== 3,
      lastSyncAt: null,
    }),
  );
  let releaseUpdate: (() => void) | undefined;
  const update = new Promise<void>(
    /** Retain the mutation boundary for the loading assertion. */ (resolve) => {
      releaseUpdate = resolve;
    },
  );
  await page.addInitScript(
    /** Authenticate synthetic administration. */ () => localStorage.setItem('repovio.access-token', 'synthetic'),
  );
  await page.route(
    '**/api/v1/**',
    /** Keep all provider operations synthetic and observable. */ async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path.endsWith('/auth/me'))
        await route.fulfill({ json: { id: 'admin', role: 'SYSTEM_ADMIN', username: 'admin' } });
      else if (path.endsWith('/authentication-options')) await route.fulfill({ json: { oauthProviderTypes: [] } });
      else if (route.request().method() === 'PATCH') {
        expect(path).toBe('/api/v1/provider-accounts/account-0');
        expect(route.request().postDataJSON()).toEqual({ enabled: false });
        await update;
        providers[0]!.enabled = false;
        await route.fulfill({ json: providers[0] });
      } else if (path === '/api/v1/provider-accounts')
        await route.fulfill({ json: { items: providers, meta: { itemCount: 4, pageCount: 1 } } });
      else await route.abort();
    },
  );
  await page.goto('/admin/providers');
  await expect(page.locator('tbody button')).toHaveCount(4);
  for (const provider of providers) {
    const trigger = page.getByRole('button', { name: `Actions for ${provider.displayName}`, exact: true });
    await trigger.click();
    await expect(page.getByRole('menuitem', { name: 'Organization webhooks' })).toBeVisible();
    await expect(
      page.getByRole('menuitem', { name: provider.enabled ? 'Disable' : 'Enable', exact: true }),
    ).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Delete', exact: true })).toBeVisible();
    if (provider.providerType === 'GITLAB')
      await expect(page.getByRole('menuitem', { name: /Connect with GitLab OAuth/ })).toHaveAttribute('data-disabled');
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
  }
  const trigger = page.getByRole('button', { name: 'Actions for GITHUB', exact: true });
  await trigger.click();
  await page.getByRole('menuitem', { name: 'Disable', exact: true }).click();
  await expect(trigger).toBeDisabled();
  await expect(trigger.locator('[data-slot="leadingIcon"]')).toBeVisible();
  releaseUpdate?.();
  await expect(trigger).toBeEnabled();
  await trigger.click();
  await expect(page.getByRole('menuitem', { name: 'Enable', exact: true })).toBeVisible();
  await page.getByRole('menuitem', { name: 'Delete', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(trigger).toBeEnabled();
});
