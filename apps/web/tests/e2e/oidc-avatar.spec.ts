import { expect, test } from '@playwright/test';

for (const locale of ['en', 'de']) {
  for (const theme of ['light', 'dark']) {
    test(`shows provider avatars and compact layout (${locale}, ${theme})`, /** Inspect shared identity surfaces with a synthetic OIDC account. */ async ({
      page,
    }) => {
      const de = locale === 'de';
      await page.setViewportSize({ width: de ? 390 : 1440, height: 900 });
      await page.addInitScript(
        /** Initialize authentication and theme without real credentials. */ (mode) => {
          localStorage.setItem('repovio.access-token', 'synthetic-token');
          localStorage.setItem('nuxt-color-mode', mode);
        },
        theme,
      );
      await page
        .context()
        .addCookies([
          { name: 'repovio-locale', value: locale, url: test.info().project.use.baseURL ?? 'http://localhost:3000' },
        ]);
      const user = {
        authProvider: 'OIDC',
        avatarSource: 'OIDC',
        avatarUpdatedAt: '2026-11-07T00:00:00.000Z',
        firstName: 'Vera',
        lastName: 'Viewer',
        id: 'oidc-fixture',
        username: 'oidc_synthetic_identifier',
        role: 'SYSTEM_ADMIN',
        createdAt: '2026-11-07T00:00:00.000Z',
        updatedAt: '2026-11-07T00:00:00.000Z',
      };
      await page.route(
        '**/api/v1/auth/me',
        /** Supply the synthetic signed-in identity. */ (route) => route.fulfill({ json: user }),
      );
      await page.route(
        /\/api\/v1\/users(?:\?.*)?$/,
        /** Supply the administration row with provider avatar metadata. */ (route) =>
          route.fulfill({ json: { items: [user], meta: { itemCount: 1, pageCount: 1 } } }),
      );
      await page.route(
        '**/api/v1/users/oidc-fixture/avatar**',
        /** Serve a synthetic image through the authenticated avatar route. */ (route) =>
          route.fulfill({
            contentType: 'image/svg+xml',
            body: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="#7958e8"/></svg>',
          }),
      );
      await page.goto('/admin/users');
      await expect(page.getByRole('button', { name: 'Vera Viewer', exact: true })).toBeVisible();
      await expect(page.locator('tbody img[src^="blob:"]')).toBeVisible();
      await page.screenshot({ path: test.info().outputPath(`users-${locale}-${theme}.png`), fullPage: true });
      await page.goto('/admin/settings');
      const navigation = page.locator('[data-page-navigation]');
      await expect(navigation).toHaveCSS('padding-top', '0px');
      await expect(navigation).toHaveCSS('padding-bottom', '0px');
      await expect(
        page.getByText(
          de
            ? 'Das Profilbild deines Identitätsanbieters wird verwendet.'
            : 'Using the profile picture from your identity provider.',
        ),
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: de ? 'Profilbild entfernen' : 'Remove profile picture', exact: true }),
      ).toHaveCount(0);
      await page.screenshot({ path: test.info().outputPath(`settings-${locale}-${theme}.png`), fullPage: true });
    });
  }
}
