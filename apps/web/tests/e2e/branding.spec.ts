import { expect, test } from '@playwright/test';

for (const mode of ['light', 'dark'] as const) {
  for (const locale of ['en', 'de']) {
    for (const width of [390, 1440]) {
      test(`renders Branch R in ${mode}, ${locale}, at ${width}px`, /** Verifies renders Branch R in [mode], [locale], at [width]px. */ async ({
        page,
      }, testInfo) => {
        await page.setViewportSize({ width, height: 900 });
        await page
          .context()
          .addCookies([{ name: 'repovio-locale', value: locale, url: testInfo.project.use.baseURL! }]);
        await page.addInitScript(
          /** Initializes browser-side authentication and preferences before page scripts run. */ (value) =>
            localStorage.setItem('nuxt-color-mode', value),
          mode,
        );
        await page.route(
          '**/api/v1/auth/setup-status',
          /** Supplies the mocked response for `/api/v1/auth/setup-status`. */ (route) =>
            route.fulfill({ json: { initialized: true } }),
        );
        await page.route(
          '**/api/v1/auth/oidc/config',
          /** Supplies the mocked response for `/api/v1/auth/oidc/config`. */ (route) =>
            route.fulfill({ json: { enabled: false } }),
        );
        await page.goto('/auth/signin');

        const brand = page.getByRole('link', { name: 'Repovio', exact: true });
        const image = brand.locator('img:visible');
        await expect(image).toHaveAttribute('src', `/logo-wordmark-${mode}.svg`);
        await expect
          .poll(
            /** Evaluates `image.evaluate((element) => (element as HTMLImageElement).naturalWidth)` when expect .poll invokes this callback. */ () =>
              image.evaluate(
                /** Reads or updates browser state for the branding scenario. */ (element) =>
                  (element as HTMLImageElement).naturalWidth,
              ),
          )
          .toBeGreaterThan(0);
        await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#4f46ff');
        const primary = await page.evaluate(
          /** Reads or updates browser state for the primary scenario. */ () =>
            getComputedStyle(document.documentElement).getPropertyValue('--color-indigo-500').trim(),
        );
        const secondary = await page.evaluate(
          /** Reads or updates browser state for the secondary scenario. */ () =>
            getComputedStyle(document.documentElement).getPropertyValue('--color-emerald-500').trim(),
        );
        expect(primary).toBe('#4f46ff');
        expect(secondary).toBe('#2ee6a6');
        expect(
          await page.evaluate(
            /** Reads or updates browser state for the branding scenario. */ () =>
              document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        await page.screenshot({ path: testInfo.outputPath(`branding-${mode}-${locale}-${width}.png`) });
      });
    }
  }
}
