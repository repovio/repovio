import { expect, test } from '@playwright/test';

import { appLocales } from '../../shared/locales';
import { languageFlags, localeMessages, mockLocalization } from './fixtures/localization';

for (const route of [
  { heading: 'Sign in', initialized: true, path: '/auth/signin', translatedHeading: 'Anmelden' },
  { heading: 'First-run setup', initialized: false, path: '/auth/setup', translatedHeading: 'Ersteinrichtung' },
]) {
  test(`changes and persists public preferences on ${route.path}`, /** Verifies changes and persists public preferences on [route.path]. */ async ({
    page,
  }, testInfo) => {
    await page.route(
      '**/api/v1/auth/setup-status',
      /** Supplies the mocked response for `/api/v1/auth/setup-status`. */ (request) =>
        request.fulfill({ json: { initialized: route.initialized } }),
    );
    await page.route(
      '**/api/v1/auth/oidc/status',
      /** Supplies the mocked response for `/api/v1/auth/oidc/status`. */ (request) =>
        request.fulfill({ json: { enabled: false } }),
    );
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
    await page.goto(route.path);
    await expect(page.getByRole('heading', { name: route.heading, exact: true })).toBeVisible();

    const languageSelect = page.getByRole('combobox', { name: 'Language', exact: true });
    await expect(languageSelect).toContainText('English');
    await expect(languageSelect.locator('img')).toHaveAttribute('src', '/flags/gb.svg');
    const flagBounds = await languageSelect.locator('img').boundingBox();
    const labelBounds = await languageSelect.locator('[data-slot="value"]').boundingBox();
    expect(labelBounds!.x - (flagBounds!.x + flagBounds!.width)).toBeGreaterThanOrEqual(4);
    await languageSelect.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('option')).toHaveCount(appLocales.length);
    for (const [name, country] of languageFlags) {
      const option = page.getByRole('option', { name, exact: true });
      await option.scrollIntoViewIfNeeded();
      await expect(option).toBeVisible();
      await expect(option).toHaveAttribute('aria-selected', String(country === 'gb'));
      const flag = option.locator('img');
      await expect(flag).toHaveAttribute('src', `/flags/${country}.svg`);
      await expect(flag).toHaveAttribute('alt', '');
      await expect
        .poll(
          /** Evaluates `flag.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)` when expect .poll invokes this callback. */ () =>
            flag.evaluate(
              /** Reads or updates browser state for the auth preferences scenario. */ (image: HTMLImageElement) =>
                image.complete && image.naturalWidth > 0,
            ),
        )
        .toBe(true);
    }
    await page.keyboard.press('Home');
    await expect(page.getByRole('option', { name: 'English', exact: true })).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('option', { name: 'Deutsch', exact: true })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { name: route.translatedHeading, exact: true })).toBeVisible();
    const translatedSelect = page.getByRole('combobox', { name: 'Sprache', exact: true });
    await expect(translatedSelect).toBeFocused();
    await expect(translatedSelect).toContainText('Deutsch');
    await expect(translatedSelect.locator('img')).toHaveAttribute('src', '/flags/de.svg');
    await expect
      .poll(
        /** Evaluates `(await page.context().cookies()).find((cookie) => cookie.name === 'repovio-locale')?.value` when expect .poll invokes this callback. */ async () =>
          (await page.context().cookies()).find(
            /** Finds the first entry matching `cookie.name === 'repovio-locale'`. */ (cookie) =>
              cookie.name === 'repovio-locale',
          )?.value,
      )
      .toBe('de');
    await page.reload();
    await expect(page.getByRole('heading', { name: route.translatedHeading, exact: true })).toBeVisible();
    await expect(translatedSelect).toContainText('Deutsch');

    await expect(
      page.getByRole('button', { name: 'Darstellung: Dunkel. Zu System wechseln.', exact: true }),
    ).toBeVisible();
    for (const theme of [
      { current: 'Dunkel', label: 'System', next: 'Hell', icon: 'device-desktop', value: 'system' },
      { current: 'System', label: 'Hell', next: 'Dunkel', icon: 'sun', value: 'light' },
      { current: 'Hell', label: 'Dunkel', next: 'System', icon: 'moon', value: 'dark' },
      { current: 'Dunkel', label: 'System', next: 'Hell', icon: 'device-desktop', value: 'system' },
    ]) {
      const themeButton = page.getByRole('button', {
        name: `Darstellung: ${theme.current}. Zu ${theme.label} wechseln.`,
        exact: true,
      });
      await themeButton.focus();
      await page.keyboard.press('Enter');
      const updatedButton = page.getByRole('button', {
        name: `Darstellung: ${theme.label}. Zu ${theme.next} wechseln.`,
        exact: true,
      });
      await expect(updatedButton).toBeFocused();
      await expect(updatedButton.locator(`[class~="i-tabler:${theme.icon}"]`)).toBeVisible();
      await expect
        .poll(
          /** Evaluates `page.evaluate(() => window.localStorage.getItem('nuxt-color-mode'))` when expect.poll invokes this callback. */ () =>
            page.evaluate(
              /** Reads or updates browser state for the auth preferences scenario. */ () =>
                window.localStorage.getItem('nuxt-color-mode'),
            ),
        )
        .toBe(theme.value);
      await page.reload();
      await expect(updatedButton).toBeVisible();
      await expect(page.locator('html')).toHaveClass(new RegExp(theme.value === 'dark' ? 'dark' : 'light'));

      if (theme.value !== 'system') {
        for (const viewport of [
          { height: 900, width: 1440 },
          { height: 844, width: 390 },
        ]) {
          await page.setViewportSize(viewport);
          await expect(updatedButton).toBeInViewport();
          await expect(translatedSelect).toBeInViewport();
          expect(
            await page.evaluate(
              /** Reads or updates browser state for the auth preferences scenario. */ () =>
                document.documentElement.scrollWidth,
            ),
          ).toBeLessThanOrEqual(viewport.width);
          await page.screenshot({
            animations: 'disabled',
            path: testInfo.outputPath(`${theme.value}-${viewport.width}.png`),
            fullPage: true,
          });
          await translatedSelect.click();
          await expect(page.getByRole('option', { name: 'Deutsch', exact: true })).toHaveAttribute(
            'aria-selected',
            'true',
          );
          await page.screenshot({
            animations: 'disabled',
            path: testInfo.outputPath(`${theme.value}-${viewport.width}-select.png`),
            fullPage: true,
          });
          await page.keyboard.press('Escape');
          await expect(translatedSelect).toBeFocused();
        }
      }
    }

    await page.emulateMedia({ colorScheme: 'dark' });
    await expect(page.locator('html')).toHaveClass(/dark/);
    await translatedSelect.click();
    await page.getByRole('option', { name: 'English', exact: true }).click();
    await expect(page.getByRole('heading', { name: route.heading, exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Theme: System. Switch to Light.', exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: route.heading, exact: true })).toBeVisible();
  });
}

test('keeps the language select busy while its locale is loading', /** Verifies keeps the language select busy while its locale is loading. */ async ({
  page,
}) => {
  await page.route(
    '**/api/v1/auth/setup-status',
    /** Supplies the mocked response for `/api/v1/auth/setup-status`. */ (route) =>
      route.fulfill({ json: { initialized: true } }),
  );
  await page.route(
    '**/api/v1/auth/oidc/status',
    /** Supplies the mocked response for `/api/v1/auth/oidc/status`. */ (route) =>
      route.fulfill({ json: { enabled: false } }),
  );
  /** Releases the deferred locale response used by this scenario. */
  let releaseLocale: () => void = () => {};
  const localeReleased = new Promise<void>(
    /** Exposes the control that releases the delayed locale download. */ (resolve) => {
      releaseLocale = resolve;
    },
  );
  /** Selects the requested locale for this response fixture. */
  let localeRequested: () => void = () => {};
  const localePending = new Promise<void>(
    /** Signals when the locale download has started. */ (resolve) => {
      localeRequested = resolve;
    },
  );
  await page.route(
    /\/de\.json(?:\?|$)/,
    /** Supplies the mocked response for the intercepted request. */ async (route) => {
      localeRequested();
      await localeReleased;
      await route.continue();
    },
  );
  await page.goto('/auth/signin');
  await page.getByRole('combobox', { name: 'Language', exact: true }).click();
  await page.getByRole('option', { name: 'Deutsch', exact: true }).click();
  try {
    await localePending;
    await expect(page.getByRole('combobox')).toBeDisabled();
    await expect(page.getByRole('combobox').locator('.animate-spin')).toBeVisible();
  } finally {
    releaseLocale();
  }
  await expect(page.getByRole('combobox', { name: 'Sprache', exact: true })).toBeEnabled();
  await expect(page.getByRole('heading', { name: 'Anmelden', exact: true })).toBeVisible();
});

for (const entry of appLocales) {
  for (const initialized of [true, false]) {
    test(`selects ${entry.code} on ${initialized ? 'sign-in' : 'setup'}`, /** Exercise each public selector with actual translated form text. */ async ({
      page,
    }) => {
      const messages = localeMessages(entry.code);
      await mockLocalization(page, { initialized });
      await page.goto(initialized ? '/auth/signin' : '/auth/setup');
      await page.getByRole('combobox', { name: 'Language', exact: true }).click();
      const option = page.getByRole('option', { name: entry.name, exact: true });
      await option.scrollIntoViewIfNeeded();
      await option.click();
      await expect(
        page.getByRole('heading', { name: initialized ? messages.auth.signIn : messages.auth.setup, exact: true }),
      ).toBeVisible();
      await expect(page.getByRole('combobox', { name: messages.layout.language, exact: true })).toContainText(
        entry.name,
      );
      await expect(page.getByLabel(messages.auth.username, { exact: false }).first()).toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('lang', entry.language);
      await expect(page.locator('html')).toHaveAttribute('dir', entry.dir);
      expect(
        (await page.context().cookies()).find(
          /** Read the actual saved preference. */ (cookie) => cookie.name === 'repovio-locale',
        )?.value,
      ).toBe(entry.code);
    });
  }
}
