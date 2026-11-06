import { expect, test } from '@playwright/test';

for (const route of [
  { heading: 'Sign in', initialized: true, path: '/auth/signin', translatedHeading: 'Anmelden' },
  { heading: 'First-run setup', initialized: false, path: '/auth/setup', translatedHeading: 'Ersteinrichtung' },
]) {
  test(`changes and persists public preferences on ${route.path}`, async ({ page }, testInfo) => {
    await page.route('**/api/v1/auth/setup-status', (request) =>
      request.fulfill({ json: { initialized: route.initialized } }),
    );
    await page.route('**/api/v1/auth/oidc/status', (request) => request.fulfill({ json: { enabled: false } }));
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
    await page.goto(route.path);
    await expect(page.getByRole('heading', { name: route.heading, exact: true })).toBeVisible();

    const languageButton = page.getByRole('button', { name: 'Language', exact: true });
    await languageButton.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('menuitemcheckbox')).toHaveCount(8);
    await expect(page.getByRole('menuitemcheckbox', { name: 'English', exact: true })).toBeChecked();
    await expect(page.getByRole('menuitemcheckbox', { name: 'English', exact: true })).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('menuitemcheckbox', { name: 'Deutsch', exact: true })).toBeFocused();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: route.translatedHeading, exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sprache', exact: true })).toBeFocused();
    await expect
      .poll(async () => (await page.context().cookies()).find((cookie) => cookie.name === 'repovio-locale')?.value)
      .toBe('de');
    await page.reload();
    await expect(page.getByRole('heading', { name: route.translatedHeading, exact: true })).toBeVisible();

    for (const theme of [
      { label: 'Hell', value: 'light' },
      { label: 'Dunkel', value: 'dark' },
      { label: 'System', value: 'system' },
    ]) {
      const themeButton = page.getByRole('button', { name: 'Darstellung', exact: true });
      await themeButton.focus();
      await page.keyboard.press('Enter');
      await page.getByRole('menuitemcheckbox', { name: theme.label, exact: true }).click();
      await page.keyboard.press('Escape');
      await expect(themeButton).toBeFocused();
      await expect.poll(() => page.evaluate(() => window.localStorage.getItem('nuxt-color-mode'))).toBe(theme.value);
      await page.reload();
      await expect(page.locator('html')).toHaveClass(new RegExp(theme.value === 'dark' ? 'dark' : 'light'));
      await page.getByRole('button', { name: 'Darstellung', exact: true }).click();
      await expect(page.getByRole('menuitemcheckbox', { name: theme.label, exact: true })).toBeChecked();
      await page.keyboard.press('Escape');

      if (theme.value !== 'system') {
        for (const viewport of [
          { height: 900, width: 1440 },
          { height: 844, width: 390 },
        ]) {
          await page.setViewportSize(viewport);
          await expect(page.getByRole('button', { name: 'Darstellung', exact: true })).toBeInViewport();
          await expect(page.getByRole('button', { name: 'Sprache', exact: true })).toBeInViewport();
          expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
          await page.screenshot({ path: testInfo.outputPath(`${theme.value}-${viewport.width}.png`), fullPage: true });
        }
      }
    }

    await page.emulateMedia({ colorScheme: 'dark' });
    await expect(page.locator('html')).toHaveClass(/dark/);
    await page.getByRole('button', { name: 'Sprache', exact: true }).click();
    await page.getByRole('menuitemcheckbox', { name: 'English', exact: true }).click();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: route.heading, exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: route.heading, exact: true })).toBeVisible();
  });
}
