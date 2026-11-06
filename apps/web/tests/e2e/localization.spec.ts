import { expect, test } from '@playwright/test';

const languageFlags = [
  ['English', 'gb'],
  ['Deutsch', 'de'],
  ['Español', 'es'],
  ['Français', 'fr'],
  ['Italiano', 'it'],
  ['Nederlands', 'nl'],
  ['Polski', 'pl'],
  ['Português', 'pt'],
] as const;

for (const theme of ['light', 'dark'] as const) {
  for (const width of [390, 1440]) {
    /** Exercise locale selection, its persisted cookie, and invalid-cookie English fallback. */
    test(`language flags and persisted locale (${theme}, ${width}px)`, /** Verifies language flags and persisted locale ([theme], [width]px). */ async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript(
        /** Initializes browser-side authentication and preferences before page scripts run. */ (theme) =>
          window.localStorage.setItem('nuxt-color-mode', theme),
        theme,
      );
      await page.addInitScript(
        /** Initializes browser-side authentication and preferences before page scripts run. */ () =>
          window.localStorage.setItem('repovio.access-token', 'playwright-access-token'),
      );
      await page.route(
        '**/api/v1/**',
        /** Supplies the mocked response for `/api/v1/**`. */ (route) =>
          route.fulfill({ json: { items: [], meta: { itemCount: 0, pageCount: 0 } } }),
      );
      await page.route(
        '**/api/v1/dashboard/awaiting-approval',
        /** Supplies the mocked response for `/api/v1/dashboard/awaiting-approval`. */ (route) =>
          route.fulfill({ json: [] }),
      );
      await page.route(
        '**/api/v1/health',
        /** Supplies the mocked response for `/api/v1/health`. */ (route) =>
          route.fulfill({ json: { api: 'ok', database: 'ok', providers: [], status: 'ok' } }),
      );
      await page.route(
        '**/api/v1/version/latest',
        /** Supplies the mocked response for `/api/v1/version/latest`. */ (route) =>
          route.fulfill({ json: { latest: '1.0.1' } }),
      );
      await page.route(
        /\/api\/v1\/provider-accounts(?:\?.*)?$/,
        /** Supplies the mocked response for the intercepted request. */ async (route) => {
          await route.fulfill({
            contentType: 'application/json',
            json: {
              items: [],
              meta: { hasNextPage: false, hasPrevPage: false, itemCount: 0, page: 1, pageCount: 0, perPage: 10 },
            },
          });
        },
      );
      await page.route(
        '**/api/v1/provider-accounts/authentication-options',
        /** Supplies the mocked response for `/api/v1/provider-accounts/authentication-options`. */ async (route) => {
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
      await page.getByRole('button', { name: 'playwright' }).click();
      await page.mouse.move(0, 0);
      await page.getByRole('menuitem', { name: 'Language', exact: true }).focus();
      await page.keyboard.press('ArrowRight');
      await expect(page.locator('html')).toHaveClass(new RegExp(theme));
      for (const [name, country] of languageFlags) {
        const item = page.getByRole('menuitemcheckbox', { name, exact: true });
        await expect(item).toBeVisible();
        await expect(item).toHaveAttribute('aria-checked', String(country === 'gb'));
        const flag = item.locator('img');
        await expect(flag).toHaveAttribute('src', `/flags/${country}.svg`);
        await expect(flag).toHaveAttribute('alt', '');
        await expect(flag).toBeVisible();
        await expect
          .poll(
            /** Evaluates `flag.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)` when expect .poll invokes this callback. */ () =>
              flag.evaluate(
                /** Reads or updates browser state for the localization scenario. */ (image: HTMLImageElement) =>
                  image.complete && image.naturalWidth > 0,
              ),
          )
          .toBe(true);
        await expect
          .poll(
            /** Evaluates `(await flag.boundingBox())?.width` when expect.poll invokes this callback. */ async () =>
              (await flag.boundingBox())?.width,
          )
          .toBe(24);
        const bounds = await flag.boundingBox();
        expect(bounds?.width).toBe(24);
        expect(bounds?.height).toBe(18);
        expect(bounds!.x).toBeGreaterThanOrEqual(0);
        expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
      }
      await page.screenshot({ path: testInfo.outputPath('language-flags.png') });
      const spanish = page.getByRole('menuitemcheckbox', { name: 'Español', exact: true });
      await spanish.focus();
      await page.keyboard.press('Enter');
      await expect(spanish).toHaveAttribute('aria-checked', 'true');
      await expect(page.getByRole('menuitemcheckbox', { name: 'English', exact: true })).toHaveAttribute(
        'aria-checked',
        'false',
      );

      await expect(page.locator('main').getByText('Cuentas de proveedores', { exact: true }).first()).toBeVisible();
      await expect(page.getByRole('menu', { name: 'Idioma' })).toBeVisible();
      await expect
        .poll(
          /** Evaluates `(await page.context().cookies()).find((cookie) => cookie.name === 'repovio-locale')?.value` when expect .poll invokes this callback. */ async () =>
            (await page.context().cookies()).find(
              /** Finds the first entry matching `cookie.name === 'repovio-locale'`. */ (cookie) =>
                cookie.name === 'repovio-locale',
            )?.value,
        )
        .toBe('es');

      await page.reload();
      await expect(page.locator('main').getByText('Cuentas de proveedores', { exact: true }).first()).toBeVisible();

      await page.context().clearCookies();
      await page.context().addCookies([{ name: 'repovio-locale', value: 'unsupported', url: page.url() }]);
      await page.reload();
      await expect(page.locator('main').getByText('Provider accounts', { exact: true }).first()).toBeVisible();
    });
  }
}
