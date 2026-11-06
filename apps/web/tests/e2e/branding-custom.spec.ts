import { expect, test, type Page } from '@playwright/test';
import { brandingDefaults } from '../../shared/branding';

const custom = {
  ...brandingDefaults,
  brandName: 'Example Forge',
  brandDescription: 'Our workflow dashboard',
  brandTitleTemplate: '%s | Example Forge',
  brandLogoLight: '/logo.svg',
  brandLogoDark: '/logo.svg',
  brandLogoCompact: '/favicon.svg',
  brandFavicon: '/favicon.svg',
  brandProductUrl: 'https://example.test',
  brandDocsUrl: '',
  brandRepositoryUrl: '',
  themePrimary: 'rose',
  themeSecondary: 'amber',
  themeNeutral: 'slate',
  themeRadius: '8px',
  themeFontFamily: 'Arial, sans-serif',
  themeDisplayFontFamily: 'monospace',
};

/** Mock provider/application resources while keeping Nuxt branding and rendering real. */
async function prepare(page: Page, authenticated = false): Promise<void> {
  await page.route(
    '**/api/branding',
    /** Supply validated custom metadata at the public contract boundary. */ (route) => route.fulfill({ json: custom }),
  );
  if (authenticated)
    await page.addInitScript(
      /** Establish a synthetic local session. */ () => localStorage.setItem('repovio.access-token', 'branding-test'),
    );
  await page.route(
    '**/api/v1/**',
    /** Supply deterministic application responses without contacting providers. */ (route) => {
      const path = new URL(route.request().url()).pathname;
      let json: unknown = [];
      if (path.endsWith('/auth/me')) json = { id: 'test', username: 'test', role: 'VIEWER' };
      else if (path.endsWith('/auth/setup-status')) json = { initialized: true };
      else if (path.endsWith('/auth/oidc/config')) json = { enabled: false };
      else if (path.endsWith('/settings'))
        json = {
          dateTimeFormat: 'LOCALE_MEDIUM',
          issueRetentionDays: 90,
          pullRequestRetentionDays: 90,
          workflowRunRetentionDays: 90,
        };
      else if (path.endsWith('/dashboard/summary'))
        json = {
          statuses: {},
          awaitingApprovalCount: 0,
          medianDurationMs: null,
          totalRunDurationMs: 0,
          completedCount: 0,
          queuedCount: 0,
          runningCount: 0,
          successRate: 0,
        };
      else if (path.endsWith('/issues/summary') || path.endsWith('/pull-requests/summary')) json = {};
      return route.fulfill({ json });
    },
  );
}

for (const mode of ['light', 'dark']) {
  for (const locale of ['en', 'de']) {
    for (const width of [390, 1440]) {
      test(`custom branding in ${mode}, ${locale}, at ${width}px`, /** Verify custom assets, metadata, palette variables, typography, and brand scope. */ async ({
        page,
      }, testInfo) => {
        await page.setViewportSize({ width, height: 900 });
        await page
          .context()
          .addCookies([{ name: 'repovio-locale', value: locale, url: testInfo.project.use.baseURL! }]);
        await page.addInitScript(
          /** Preserve the user's chosen color mode. */ (value) => localStorage.setItem('nuxt-color-mode', value),
          mode,
        );
        await prepare(page);
        await page.goto('/auth/signin');
        const logo = page
          .getByRole('link', { name: custom.brandName, exact: true })
          .filter({ has: page.locator('img') });
        await expect(logo.locator('img:visible')).toHaveAttribute('src', '/logo.svg');
        await expect(logo.locator('img:visible')).toHaveJSProperty('complete', true);
        await expect(page).toHaveTitle(/ \| Example Forge$/);
        await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', custom.brandDescription);
        await expect(page.locator('link[rel="icon"]')).toHaveCount(1);
        await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/favicon.svg');
        await expect(page.locator('a[href="https://example.test"]')).toHaveText(custom.brandName);
        await expect(
          page.getByText(
            locale === 'de'
              ? 'Melde dich mit deinen Repovio-Zugangsdaten an.'
              : 'Use your Repovio credentials to continue.',
          ),
        ).toBeVisible();
        const styles = await page.evaluate(
          /** Read computed variables after runtime theme application. */ () => {
            const style = getComputedStyle(document.documentElement);
            return {
              radius: style.getPropertyValue('--ui-radius').trim(),
              font: style.getPropertyValue('--font-sans').trim(),
              primary: style.getPropertyValue('--ui-primary').trim(),
              palette: style
                .getPropertyValue(
                  document.documentElement.classList.contains('dark') ? '--color-rose-400' : '--color-rose-500',
                )
                .trim(),
              overflow: document.documentElement.scrollWidth > innerWidth,
            };
          },
        );
        expect(styles.radius).toBe('8px');
        expect(styles.font).toBe('Arial, sans-serif');
        expect(styles.primary).toBe(styles.palette);
        expect(styles.palette).not.toBe('');
        expect(styles.overflow).toBe(false);
        await page.screenshot({ path: testInfo.outputPath('custom-branding.png') });
      });
    }
  }
}

for (const locale of ['en', 'de']) {
  test(`custom expanded and collapsed sidebar in ${locale}`, /** Verify compact branding and hidden optional links without changing release source. */ async ({
    page,
  }, testInfo) => {
    await page.context().addCookies([{ name: 'repovio-locale', value: locale, url: testInfo.project.use.baseURL! }]);
    await prepare(page, true);
    await page.goto('/');
    const logo = page.getByRole('link', { name: custom.brandName, exact: true });
    await expect(logo.locator('img:visible')).toHaveAttribute('src', '/logo.svg');
    await expect(page.locator('[data-sidebar-footer] a')).toHaveCount(0);
    await page.screenshot({ path: testInfo.outputPath('custom-sidebar-expanded.png') });
    await page
      .getByRole('button', { name: locale === 'de' ? 'Seitenleiste einklappen' : 'Collapse sidebar', exact: true })
      .click();
    await expect(logo.locator('img:visible')).toHaveAttribute('src', '/favicon.svg');
    await page.screenshot({ path: testInfo.outputPath('custom-sidebar-collapsed.png') });
    await page
      .getByRole('button', { name: locale === 'de' ? 'Seitenleiste ausklappen' : 'Expand sidebar', exact: true })
      .click();
    await expect(logo.locator('img:visible')).toHaveAttribute('src', '/logo.svg');
  });
}

for (const mode of ['light', 'dark']) {
  for (const locale of ['en', 'de']) {
    test(`custom mobile sidebar in ${mode}, ${locale}`, /** Verify the narrow-screen navigation drawer keeps the configured brand and keyboard dismissal. */ async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width: 390, height: 900 });
      await page.context().addCookies([{ name: 'repovio-locale', value: locale, url: testInfo.project.use.baseURL! }]);
      await page.addInitScript(
        /** Restore the selected theme before opening mobile navigation. */ (value) =>
          localStorage.setItem('nuxt-color-mode', value),
        mode,
      );
      await prepare(page, true);
      await page.goto('/');
      const toggle = page.locator('button[data-slot="toggle"]').first();
      await toggle.click();
      const brand = page.getByRole('link', { name: custom.brandName, exact: true });
      await expect(brand).toBeInViewport({ ratio: 1 });
      await expect(brand.locator('img:visible')).toHaveAttribute('src', '/logo.svg');
      await page.screenshot({ animations: 'disabled', path: testInfo.outputPath('custom-mobile-sidebar.png') });
      await page.keyboard.press('Escape');
      await expect(brand).not.toBeVisible();
      await expect(toggle).toBeFocused();
    });
  }
}
