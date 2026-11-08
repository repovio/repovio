import { expect, test } from '@playwright/test';

for (const locale of ['en', 'de'] as const) {
  for (const width of [390, 1440]) {
    test(`GitLab OAuth conversion, recovery, pending protection (${locale}, ${width})`, /** Verify synthetic browser flows across locales and responsive layouts. */ async ({
      page,
      context,
    }, testInfo) => {
      const baseURL = testInfo.project.use.baseURL ?? 'http://127.0.0.1:3039';
      await context.addCookies([{ name: 'repovio-locale', value: locale, url: baseURL }]);
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript(
        /** Supply a synthetic signed-in browser identity. */ () =>
          window.localStorage.setItem('repovio.access-token', 'synthetic-browser-token'),
      );
      await page.route(
        '**/api/v1/auth/me',
        /** Authenticate the synthetic browser fixture. */ (route) =>
          route.fulfill({ json: { id: 'admin', username: 'admin', role: 'SYSTEM_ADMIN' } }),
      );
      await page.route(
        '**/api/v1/provider-accounts/authentication-options',
        /** Advertise the configured GitLab OAuth client. */ (route) =>
          route.fulfill({ json: { oauthProviderTypes: ['GITLAB'] } }),
      );
      let oauthStatus = 'NONE';
      const account = {
        id: 'synthetic-gitlab',
        providerType: 'GITLAB',
        displayName: 'Synthetic GitLab',
        authenticationMethod: 'TOKEN',
        baseUrl: 'https://gitlab.example.test',
        enabled: true,
        lastSyncAt: null,
      };
      await page.route(
        /\/api\/v1\/provider-accounts(?:\?.*)?$/,
        /** Supply the real table wire shape with synthetic connection metadata. */ (route) => {
          expect(route.request().url()).toContain('oauthStatus');
          return route.fulfill({
            json: { items: [{ ...account, oauthStatus }], meta: { itemCount: 1, pageCount: 1 } },
          });
        },
      );
      let release!: () => void;
      let gate = new Promise<void>(
        /** Hold the start response for pending-state assertions. */ (resolve) => {
          release = resolve;
        },
      );
      let failure = true;
      await page.route(
        '**/api/v1/provider-accounts/synthetic-gitlab/oauth',
        /** Simulate a failed start followed by an OAuth round trip. */ async (route) => {
          expect(route.request().method()).toBe('POST');
          expect(route.request().postDataJSON()).toEqual({});
          await gate;
          if (failure) {
            await route.fulfill({ status: 503, json: { message: 'Synthetic unavailable client' } });
            return;
          }
          oauthStatus = 'CONNECTED';
          await route.fulfill({ json: { authorizationUrl: `${baseURL}/admin/providers?oauth=connected` } });
        },
      );
      await page.goto('/admin/providers');
      const connect = page.getByRole('button', {
        name: locale === 'en' ? 'Connect with GitLab OAuth' : 'Mit GitLab OAuth verbinden',
        exact: true,
      });
      await expect(connect).toBeEnabled();
      await connect.click();
      await expect(connect).toBeDisabled();
      await expect(connect.locator('.animate-spin')).toBeVisible();
      await expect(
        page.getByRole('button', { name: locale === 'en' ? 'Disable' : 'Deaktivieren', exact: true }),
      ).toBeDisabled();
      await expect(
        page.getByRole('button', { name: locale === 'en' ? 'Delete' : 'Löschen', exact: true }),
      ).toBeDisabled();
      release();
      await expect(connect).toBeEnabled();
      await expect(page.getByRole('alert')).toBeVisible();
      failure = false;
      gate = Promise.resolve();
      await connect.click();
      await expect(page).toHaveURL(/oauth=connected/);
      const reauthorize = page.getByRole('button', {
        name: locale === 'en' ? 'Reauthorize' : 'Erneut autorisieren',
        exact: true,
      });
      await expect(reauthorize).toBeEnabled();
      oauthStatus = 'REAUTHORIZATION_REQUIRED';
      await page.goto('/admin/providers');
      await expect(
        page.getByText(locale === 'en' ? 'Reauthorization required' : 'Erneute Autorisierung erforderlich', {
          exact: true,
        }),
      ).toBeVisible();
      await reauthorize.focus();
      await expect(reauthorize).toBeFocused();
      await page.screenshot({ path: testInfo.outputPath(`gitlab-oauth-${locale}-${width}.png`), fullPage: true });
      await reauthorize.press('Enter');
      await expect(page).toHaveURL(/oauth=connected/);
      await expect(
        page.getByText(locale === 'en' ? 'Reauthorization required' : 'Erneute Autorisierung erforderlich', {
          exact: true,
        }),
      ).toHaveCount(0);
      await page.goto('/admin/providers?oauth=cancelled');
      await expect(
        page.getByText(
          locale === 'en'
            ? 'GitLab authorization cancelled. Existing connection preserved.'
            : 'GitLab-Autorisierung abgebrochen. Die bestehende Verbindung bleibt erhalten.',
          { exact: true },
        ),
      ).toBeVisible();
      await expect(reauthorize).toBeEnabled();
      await page.goto('/admin/providers?oauth=failed');
      await expect(reauthorize).toBeEnabled();
    });
  }
}
