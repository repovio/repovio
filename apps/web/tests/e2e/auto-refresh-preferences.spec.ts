import { expect, test } from '@playwright/test';
import { mockRefreshApplication } from './fixtures/auto-refresh';

for (const locale of ['en', 'de'])
  for (const width of [390, 1440])
    for (const theme of ['light', 'dark']) {
      test(`refresh preference ${locale} ${width} ${theme}`, /** Verify localized responsive keyboard and persistence behavior. */ async ({
        page,
      }, testInfo) => {
        const { counts } = await mockRefreshApplication(page);
        await page
          .context()
          .addCookies([{ name: 'repovio-locale', value: locale, url: String(testInfo.project.use.baseURL) }]);
        await page.addInitScript(
          /** Select the requested theme before rendering. */ (value) => localStorage.setItem('nuxt-color-mode', value),
          theme,
        );
        await page.setViewportSize({ width, height: 900 });
        await page.clock.install();
        await page.goto('/issues');
        const trigger = page.locator('[data-auto-refresh-control]');
        await expect(trigger).toHaveAccessibleName(
          locale === 'de' ? /Automatische Aktualisierung/ : /Automatic refresh/,
        );
        await trigger.focus();
        await page.keyboard.press('Enter');
        const selected = page.locator('input[name="auto-refresh-interval"][value="15000"]');
        await expect(selected).toBeChecked();
        await page.locator('input[value="30000"]').check();
        await page.screenshot({ path: testInfo.outputPath('refresh-preference.png') });
        await page.keyboard.press('Escape');
        await expect(trigger).toBeFocused();
        expect(
          await page.evaluate(
            /** Inspect only the persisted cadence. */ () => localStorage.getItem('repovio:auto-refresh:interval-ms'),
          ),
        ).toBe('30000');
        await page.reload();
        await expect(trigger).toHaveAccessibleName(/30/);
        await trigger.click();
        await page.locator('input[value="0"]').check();
        await page.keyboard.press('Escape');
        await expect(
          page.getByRole('button', { name: locale === 'de' ? 'Aktualisieren' : 'Refresh', exact: true }),
        ).toBeEnabled();
        const before = counts.issues;
        await page.clock.runFor(300000);
        expect(counts.issues).toBe(before);
        expect(
          await page.evaluate(
            /** Check the navbar introduced no horizontal page overflow. */ () =>
              document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
      });
    }
