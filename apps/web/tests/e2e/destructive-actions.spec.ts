import { expect, test } from '@playwright/test';

for (const locale of ['en', 'de']) {
  test(`confirms removal, cancellation, retry, and pending protection (${locale})`, /** Exercise the real shared dialog through the users page. */ async ({
    page,
  }) => {
    const de = locale === 'de';
    await page.setViewportSize({ width: de ? 390 : 1440, height: 900 });
    await page.addInitScript(
      /** Set synthetic authentication before mounting. */ () => {
        localStorage.setItem('repovio.access-token', 'synthetic-token');
      },
    );
    await page.context().addCookies([{ name: 'repovio-locale', value: locale, domain: 'localhost', path: '/' }]);
    await page.route(
      '**/api/v1/auth/me',
      /** Supply an administrator identity. */ (route) =>
        route.fulfill({ json: { id: 'admin', username: 'Admin', role: 'SYSTEM_ADMIN' } }),
    );
    const user = {
      id: 'other',
      username: 'Ada',
      role: 'VIEWER',
      authProvider: 'LOCAL',
      firstName: null,
      lastName: null,
      avatarUpdatedAt: null,
      createdAt: '2026-11-07T00:00:00Z',
      updatedAt: '2026-11-07T00:00:00Z',
    };
    let removed = false;
    await page.route(
      /\/api\/v1\/users(?:\?.*)?$/,
      /** List the disposable synthetic account. */ (route) =>
        route.fulfill({ json: { items: removed ? [] : [user], meta: { itemCount: removed ? 0 : 1, pageCount: 1 } } }),
    );
    let requests = 0;
    let complete: (() => Promise<void>) | undefined;
    await page.route(
      '**/api/v1/users/other',
      /** Fail once and hold the retry to inspect pending behavior. */ async (route) => {
        requests += 1;
        if (requests === 1) await route.fulfill({ status: 500, json: {} });
        else
          await new Promise<void>(
            /** Hold the request until the test releases it. */ (resolve) => {
              /** Finish the synthetic deletion without deleting real data. */
              complete = /** Finish the synthetic deletion without deleting real data. */ async () => {
                removed = true;
                await route.fulfill({ status: 204 });
                resolve();
              };
            },
          );
      },
    );
    await page.goto('/admin/users');
    const trigger = page.getByRole('button', { name: de ? 'Löschen' : 'Delete', exact: true });
    const dialog = page.getByRole('dialog', { name: de ? 'Entfernen bestätigen' : 'Confirm removal' });
    await trigger.click();
    await expect(dialog).toContainText('Ada');
    expect(requests).toBe(0);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    await trigger.click();
    await dialog.getByRole('button', { name: de ? 'Abbrechen' : 'Cancel', exact: true }).click();
    await expect(dialog).toBeHidden();
    expect(requests).toBe(0);
    await trigger.click();
    const confirm = dialog.getByRole('button', { name: de ? 'Entfernen' : 'Remove', exact: true });
    await confirm.click();
    await expect(dialog.getByRole('alert')).toBeVisible();
    expect(requests).toBe(1);
    await confirm.click();
    await expect(confirm).toBeDisabled();
    await expect(dialog.getByRole('button', { name: de ? 'Abbrechen' : 'Cancel', exact: true })).toBeDisabled();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeVisible();
    await expect.poll(/** Wait for the held request to reach the route. */ () => requests).toBe(2);
    await page.screenshot({ path: test.info().outputPath(`confirmation-${locale}.png`) });
    await complete!();
    await expect(dialog).toBeHidden();
    await expect(trigger).toHaveCount(0);
    expect(requests).toBe(2);
  });
}
