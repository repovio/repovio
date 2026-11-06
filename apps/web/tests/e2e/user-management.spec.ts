import { expect, test } from '@playwright/test';

for (const locale of ['en', 'de']) {
  test(`creates local users and resets their passwords (${locale})`, /** Exercises local account dialogs with intercepted API requests. */ async ({
    page,
  }) => {
    const de = locale === 'de';
    await page.addInitScript(
      /** Seeds a synthetic administrator session. */ ({ locale }) => {
        localStorage.setItem('repovio.access-token', 'fixture-token');
        localStorage.setItem('repovio.locale', locale);
        document.cookie = `repovio-locale=${locale}; path=/`;
      },
      { locale },
    );
    await page.route(
      '**/api/v1/auth/me',
      /** Resolves the current synthetic administrator. */ (route) =>
        route.fulfill({ json: { id: 'admin', username: 'admin', role: 'SYSTEM_ADMIN', authProvider: 'LOCAL' } }),
    );
    await page.route(
      '**/api/v1/settings',
      /** Provides stable presentation defaults. */ (route) =>
        route.fulfill({ json: { dateTimeFormat: 'LOCALE_MEDIUM' } }),
    );
    const users = [
      {
        id: 'local',
        username: 'local',
        role: 'VIEWER',
        authProvider: 'LOCAL',
        firstName: null,
        lastName: null,
        avatarUpdatedAt: null,
        createdAt: '2026-11-06T10:00:00.000Z',
        updatedAt: '2026-11-06T10:00:00.000Z',
      },
      {
        id: 'oidc',
        username: 'external',
        role: 'VIEWER',
        authProvider: 'OIDC',
        firstName: null,
        lastName: null,
        avatarUpdatedAt: null,
        createdAt: '2026-11-06T10:00:00.000Z',
        updatedAt: '2026-11-06T10:00:00.000Z',
      },
    ];
    await page.route(
      /\/api\/v1\/users(?:\?.*)?$/,
      /** Creates or lists synthetic accounts. */ async (route) => {
        if (route.request().method() === 'POST') {
          expect(route.request().postDataJSON()).toEqual({
            username: 'ada',
            password: 'initial-password',
            role: 'VIEWER',
          });
          await route.fulfill({ status: 201, json: { ...users[0], id: 'ada', username: 'ada' } });
        } else await route.fulfill({ json: { items: users, meta: { itemCount: 2, pageCount: 1 } } });
      },
    );
    let reset = false;
    await page.route(
      '**/api/v1/users/local/password',
      /** Records the administrative password reset. */ async (route) => {
        expect(route.request().method()).toBe('PUT');
        expect(route.request().postDataJSON()).toEqual({ newPassword: 'replacement-password' });
        reset = true;
        await route.fulfill({ status: 204 });
      },
    );
    await page.goto('/admin/users');
    const create = page.getByRole('button', { name: de ? 'Neuer Benutzer' : 'New user', exact: true });
    await create.click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel(de ? 'Benutzername' : 'Username', { exact: true }).fill('ada');
    await dialog.getByLabel(de ? 'Neues Passwort' : 'New password', { exact: true }).fill('initial-password');
    await dialog.getByLabel(de ? 'Passwort bestätigen' : 'Confirm password', { exact: true }).fill('initial-password');
    await dialog.getByRole('button', { name: de ? 'Neuer Benutzer' : 'New user', exact: true }).click();
    await expect(dialog).toBeHidden();
    const resetName = de ? 'Passwort zurücksetzen' : 'Reset password';
    await expect(page.getByRole('button', { name: resetName })).toHaveCount(1);
    await page.getByRole('button', { name: resetName }).click();
    await dialog.getByLabel(de ? 'Neues Passwort' : 'New password', { exact: true }).fill('replacement-password');
    await dialog
      .getByLabel(de ? 'Passwort bestätigen' : 'Confirm password', { exact: true })
      .fill('replacement-password');
    await dialog.getByRole('button', { name: resetName, exact: true }).click();
    await expect(dialog).toBeHidden();
    expect(reset).toBe(true);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(create).toBeVisible();
    await page.screenshot({ path: test.info().outputPath(`users-${locale}-mobile.png`), fullPage: true });
  });
}
