import { expect, test } from '@playwright/test';

import { appLocales } from '../../shared/locales';
import { languageFlags, localeMessages, mockLocalization, uiCloseLabel } from './fixtures/localization';

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
        await item.scrollIntoViewIfNeeded();
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

for (const [index, entry] of appLocales.entries()) {
  test(`uses ${entry.code} in authenticated navigation and dialogs`, /** Exercise native names, role filtering, app messages, and built-in component localization together. */ async ({
    page,
  }) => {
    const role = (['SYSTEM_ADMIN', 'MANAGER', 'VIEWER'] as const)[index % 3]!;
    const messages = localeMessages(entry.code);
    const remoteAssets: string[] = [];
    page.on(
      'request',
      /** Record only translation/flag assets that would add an external runtime dependency. */ (request) => {
        if (/\/flags\//.test(request.url()) && new URL(request.url()).origin !== new URL(page.url()).origin)
          remoteAssets.push(request.url());
      },
    );
    await mockLocalization(page, { role });
    await page.goto('/repositories');
    await page.getByRole('button', { name: 'locale-user', exact: true }).click();
    await page.mouse.move(0, 0);
    await page.getByRole('menuitem', { name: 'Language', exact: true }).focus();
    await page.keyboard.press('ArrowRight');
    const option = page.getByRole('menuitemcheckbox', { name: entry.name, exact: true });
    await option.scrollIntoViewIfNeeded();
    await option.click();
    await expect(page.locator('main').getByText(messages.repositories.title, { exact: true }).first()).toBeVisible();
    await expect(page.locator('main').getByText(messages.repositories.empty, { exact: true })).toBeVisible();
    await expect(
      page.getByRole('link', { name: messages.systemStatus.openJobs.replace('{count}', '0'), exact: true }),
    ).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', entry.language);
    await expect(page.locator('html')).toHaveAttribute('dir', entry.dir);
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    const administration = page.locator('nav a[href="/admin/providers"]');
    await expect(administration).toHaveCount(role === 'SYSTEM_ADMIN' ? 1 : 0);
    await page.getByRole('button', { name: 'locale-user', exact: true }).click();
    await page.getByRole('menuitem', { name: `${messages.shortcuts.title} ?`, exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: messages.shortcuts.title, exact: true })).toBeVisible();
    await dialog.getByRole('button', { name: uiCloseLabel(entry.code), exact: true }).click();
    await expect(dialog).toBeHidden();
    const sections = [
      { path: '/', text: messages.dashboard.title },
      { path: '/workflow-runs', text: messages.workflowRuns.title },
      { path: '/issues', text: messages.issues.title },
      { path: '/pull-requests', text: messages.pullRequests.title },
      { path: '/alerts/dependencies', text: messages.securityAlerts.kindTitles.DEPENDENCY },
      { path: '/notifications', text: messages.notifications.title },
      { path: '/admin/settings', text: messages.settings.title },
      role === 'SYSTEM_ADMIN'
        ? { path: '/admin/providers', text: messages.providers.title }
        : { path: '/jobs', text: messages.jobs.title },
    ];
    const section = sections[index % sections.length]!;
    await page.goto(section.path);
    await expect(page.locator('main').getByText(section.text, { exact: true }).first()).toBeVisible();
    expect(remoteAssets).toEqual([]);
  });
}
