import { expect, test } from '@playwright/test';

for (const locale of ['en', 'de'] as const) {
  test(`GitHub App setup, loading, connection and rotation (${locale})`, /** Verifies App setup, request loading, installation connection, and credential rotation in each supported test locale. */ async ({
    page,
    context,
  }, testInfo) => {
    await context.addCookies([{ name: 'repovio-locale', value: locale, domain: '127.0.0.1', path: '/' }]);
    if (locale === 'de') await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(
      /** Initializes browser-side authentication and preferences before page scripts run. */ () =>
        window.localStorage.setItem('repovio.access-token', 'test-token'),
    );
    await page.route(
      '**/api/v1/auth/me',
      /** Supplies the mocked response for `** /api/v1/auth/me`. */ (route) =>
        route.fulfill({ json: { id: 'admin', role: 'SYSTEM_ADMIN', username: 'admin' } }),
    );
    await page.route(
      /\/api\/v1\/provider-accounts(?:\?.*)?$/,
      /** Supplies the mocked response for the intercepted request. */ (route) =>
        route.fulfill({ json: { items: [], meta: { itemCount: 0, pageCount: 1 } } }),
    );
    let configured = false;
    let connected = false;
    let failRefresh = true;
    let releaseSave: (() => void) | undefined;
    const saveGate = new Promise<void>(
      /** Retains the save response resolver so the test can inspect pending form controls. */ (resolve) => {
        releaseSave = resolve;
      },
    );
    /** Builds safe App metadata reflecting the current persisted-configuration fixture. */
    const config = () => ({
      configured,
      appId: configured ? '12' : null,
      slug: configured ? 'repovio-test' : null,
      installationUrl: configured ? 'https://github.com/apps/repovio-test/installations/new' : null,
      webhookUrl: 'https://repovio.example.com/api/v1/webhooks/github-app',
    });
    await page.route(
      '**/api/v1/github-app',
      /** Supplies the mocked response for `** /api/v1/github-app`. */ async (route) => {
        if (route.request().method() === 'PUT') {
          const input = route.request().postDataJSON();
          expect(input.appId).toBe('12');
          expect(input.slug).toBe('repovio-test');
          if (!configured) {
            expect(input.privateKey).toContain('PRIVATE KEY');
            await saveGate;
          } else expect(input.privateKey).toBeUndefined();
          configured = true;
        }
        if (route.request().method() === 'DELETE') configured = false;
        await route.fulfill({ json: config() });
      },
    );
    await page.route(
      '**/api/v1/github-app/installations',
      /** Supplies the mocked response for `** /api/v1/github-app/installations`. */ async (route) => {
        if (route.request().method() === 'POST') {
          expect(route.request().postDataJSON()).toEqual({ installationId: '42', displayName: 'example App' });
          connected = true;
          await route.fulfill({ json: { id: 'account' } });
        } else if (failRefresh) {
          failRefresh = false;
          await route.fulfill({ status: 503, json: { message: 'Unavailable' } });
        } else
          await route.fulfill({ json: [{ installationId: '42', account: 'example', suspended: false, connected }] });
      },
    );
    await page.goto('/admin/providers');
    await page.getByRole('button', { name: 'GitHub App', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'GitHub App', exact: true })).toBeVisible();
    await dialog.getByLabel(locale === 'en' ? 'App ID' : 'App-ID', { exact: true }).fill('12');
    await dialog.getByLabel(locale === 'en' ? 'App slug' : 'App-Slug', { exact: true }).fill('repovio-test');
    await dialog
      .getByLabel(locale === 'en' ? 'Private key (PEM)' : 'Privater Schlüssel (PEM)', { exact: true })
      .fill('-----BEGIN PRIVATE KEY-----\nsynthetic\n-----END PRIVATE KEY-----');
    await dialog
      .getByLabel(locale === 'en' ? 'Webhook secret' : 'Webhook-Geheimnis', { exact: true })
      .fill('synthetic-webhook-secret');
    const save = dialog.getByRole('button', { name: locale === 'en' ? 'Verify and save' : 'Prüfen und speichern' });
    await save.click();
    await expect(save).toBeDisabled();
    await expect(save.locator('[data-slot="leadingIcon"]')).toBeVisible();
    releaseSave?.();
    await expect(save).toBeEnabled();
    await expect(
      dialog.getByLabel(locale === 'en' ? 'Private key (PEM)' : 'Privater Schlüssel (PEM)', { exact: true }),
    ).toHaveValue('');
    const install = dialog.getByRole('link', {
      name: locale === 'en' ? 'Install on GitHub' : 'Auf GitHub installieren',
    });
    await expect(install).toHaveAttribute('href', 'https://github.com/apps/repovio-test/installations/new');
    const refresh = dialog.getByRole('button', {
      name: locale === 'en' ? 'Refresh installations' : 'Installationen aktualisieren',
    });
    await refresh.click();
    await expect(dialog.getByRole('alert')).toContainText(
      locale === 'en' ? 'Request failed' : 'Anfrage fehlgeschlagen',
    );
    await refresh.click();
    await expect(dialog.getByText('example', { exact: true })).toBeVisible();
    await dialog.getByLabel('Name (example)', { exact: true }).fill('example App');
    await dialog.getByRole('button', { name: locale === 'en' ? 'Connect' : 'Verbinden', exact: true }).click();
    await expect(
      dialog.getByRole('button', { name: locale === 'en' ? 'Connected' : 'Verbunden', exact: true }),
    ).toBeDisabled();
    await page.screenshot({ path: testInfo.outputPath(`github-app-${locale}.png`), fullPage: true });
    await save.click();
    await expect(save).toBeEnabled();
    expect(
      await page.evaluate(
        /** Reads or updates browser state for the github app scenario. */ () =>
          document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });
}
