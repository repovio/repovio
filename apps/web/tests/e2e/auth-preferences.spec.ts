import { expect, test } from '@playwright/test';

import { appLocales } from '../../shared/locales';
import { interceptLocaleAsset, languageFlags, localeMessages, mockLocalization } from './fixtures/localization';

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

for (const target of [
  { code: 'de', name: 'Deutsch', marker: 'Anmelden' },
  { code: 'pt-BR', name: 'Português (Brasil)', marker: 'Entrar' },
]) {
  test(`keeps the language select busy while ${target.code} loads`, /** Hold the real locale asset in both development and production. */ async ({
    page,
  }) => {
    await mockLocalization(page);
    await page.goto('/auth/signin');
    await page.getByRole('combobox', { name: 'Language', exact: true }).click();
    const download = await interceptLocaleAsset(page, target.marker);
    await page.getByRole('option', { name: target.name, exact: true }).click();
    try {
      await download.started;
      await expect(page.getByRole('combobox')).toBeDisabled();
      await expect(page.getByRole('combobox').locator('.animate-spin')).toBeVisible();
    } finally {
      download.release();
    }
    const messages = localeMessages(target.code);
    await expect(page.getByRole('combobox', { name: messages.layout.language, exact: true })).toBeEnabled();
    await expect(page.getByRole('heading', { name: messages.auth.signIn, exact: true })).toBeVisible();
  });
}

test('recovers a failed locale download and keeps the saved language usable', /** Verify the real swallowed-import failure rather than a mocked setter. */ async ({
  page,
}) => {
  await mockLocalization(page);
  await page.goto('/auth/signin');
  await page.getByRole('combobox', { name: 'Language', exact: true }).click();
  const download = await interceptLocaleAsset(page, 'Entrar');
  await page.getByRole('option', { name: 'Português (Brasil)', exact: true }).click();
  await download.started;
  download.reject();
  const english = localeMessages('en');
  const error = page.getByText(english.layout.localeChangeError, { exact: true });
  await expect(error).toBeVisible();
  await expect(page.getByRole('alert').filter({ hasText: english.layout.localeChangeError })).toContainText(
    english.layout.localeChangeError,
  );
  await expect(page.getByRole('combobox', { name: 'Language', exact: true })).toBeEnabled();
  await expect(page.getByRole('combobox')).toContainText('English');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en-US');
  expect(
    (await page.context().cookies()).find(
      /** Inspect the rolled-back persisted preference. */ (cookie) => cookie.name === 'repovio-locale',
    )?.value,
  ).toBe('en');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Sign in', exact: true })).toBeVisible();
  await page.getByRole('combobox', { name: 'Language', exact: true }).click();
  await page.getByRole('option', { name: 'Português (Brasil)', exact: true }).click();
  await expect(page.getByRole('heading', { name: localeMessages('pt-BR').auth.signIn, exact: true })).toBeVisible();
});

for (const entry of appLocales) {
  for (const initialized of [true, false]) {
    test(`selects ${entry.code} on ${initialized ? 'sign-in' : 'setup'}`, /** Exercise each public selector with actual translated form text. */ async ({
      page,
    }) => {
      const messages = localeMessages(entry.code);
      await mockLocalization(page, { initialized });
      await page.goto(initialized ? '/auth/signin?locale-check=kept' : '/auth/setup?locale-check=kept');
      const originalURL = page.url();
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
      await expect(page).toHaveURL(originalURL);
      await page.reload();
      await expect(
        page.getByRole('heading', { name: initialized ? messages.auth.signIn : messages.auth.setup, exact: true }),
      ).toBeVisible();
    });
  }
}

for (const preference of [
  { language: 'zh-CN', code: 'zh-CN' },
  { language: 'pt-BR', code: 'pt-BR' },
  { language: 'pt-PT', code: 'pt' },
  { language: 'ar-SA', code: 'ar' },
  { language: 'ur-PK', code: 'ur' },
  { language: 'sv-SE', code: 'en' },
]) {
  test.describe(`browser language ${preference.language}`, /** Isolate navigator language without a saved cookie. */ () => {
    test.use({ locale: preference.language });
    test('detects supported languages and preserves English fallback', /** Exercise the actual browser-language resolver at initial app navigation. */ async ({
      page,
    }) => {
      await mockLocalization(page);
      await page.goto('/');
      const messages = localeMessages(preference.code);
      await expect(page.getByRole('heading', { name: messages.auth.signIn, exact: true })).toBeVisible();
      expect(
        (await page.context().cookies()).find(
          /** Read the detected preference. */ (cookie) => cookie.name === 'repovio-locale',
        )?.value,
      ).toBe(preference.code);
    });
  });
}
