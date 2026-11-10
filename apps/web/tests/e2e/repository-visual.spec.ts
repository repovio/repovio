import { expect, test } from '@playwright/test';
import { mockRepositoryApplication } from './fixtures/repository-detail';
import { expectTableHover } from './fixtures/table-hover';

for (const locale of ['en', 'de']) {
  for (const theme of ['light', 'dark']) {
    for (const width of [390, 1102, 1440]) {
      test(`Repository navigation and table ${locale} ${theme} ${width}`, /** Verify actual localized controls and horizontal navigation in both themes. */ async ({
        page,
        baseURL,
      }, testInfo) => {
        await mockRepositoryApplication(
          page,
          'SYSTEM_ADMIN',
          'repository-with-a-very-long-name-for-responsive-navigation-and-table-validation',
        );
        await page
          .context()
          .addCookies([{ name: 'repovio-locale', value: locale, url: baseURL ?? 'http://localhost:3000' }]);
        await page.addInitScript(
          /** Initialize the real color-mode preference. */ (value) => localStorage.setItem('nuxt-color-mode', value),
          theme,
        );
        await page.setViewportSize({ width, height: 900 });
        await page.goto('/repositories/repository-1/issues');
        const navigation = page.getByRole('navigation', {
          name: locale === 'de' ? 'Repository-Navigation' : 'Repository navigation',
          exact: true,
        });
        await expect(navigation.getByRole('link')).toHaveCount(6);
        await expect(page.locator('tbody')).toContainText('issues repository-1');
        await expectTableHover(page, page.getByRole('table'));
        const settings = navigation.getByRole('link').last();
        await settings.focus();
        await expect(settings).toBeFocused();
        expect(
          await page.evaluate(
            /** Confirm no horizontal document overflow hides controls. */ () =>
              document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        await expect(
          navigation.getByRole('link', { name: locale === 'de' ? 'Warnungen' : 'Alerts', exact: true }),
        ).toHaveAttribute('href', '/repositories/repository-1/security-alerts');
        await page.screenshot({
          path: testInfo.outputPath(`repository-${locale}-${theme}-${width}.png`),
          fullPage: true,
          animations: 'disabled',
        });
        await settings.click();
        await expect(settings).toHaveAttribute('aria-current', 'page');
        const sections = page.getByRole('navigation', {
          name: locale === 'de' ? 'Bereiche der Repository-Einstellungen' : 'Repository settings sections',
          exact: true,
        });
        await expect(sections.getByRole('link')).toHaveCount(5);
        await expect(
          page.locator('[data-settings-section="general"]').getByRole('heading', { name: /^team\// }),
        ).toHaveCount(0);
        for (let index = 0; index < 5; index++) {
          const link = sections.getByRole('link').nth(index);
          await link.focus();
          await expect(link).toBeFocused();
          await page.keyboard.press('Enter');
          await expect(link).toHaveAttribute('data-active');
          await expect(sections.locator('a[data-active]')).toHaveCount(1);
          const panel = page.locator('[data-settings-section]:visible');
          await expect(panel).toHaveCount(1);
          expect(
            await page.evaluate(
              /** Check document containment independently of scrollable strips/tables. */ () =>
                document.documentElement.scrollWidth <= innerWidth,
            ),
          ).toBe(true);
          await page.screenshot({
            path: testInfo.outputPath(`settings-${index}-${locale}-${theme}-${width}.png`),
            fullPage: true,
            animations: 'disabled',
          });
        }
      });
    }
  }
}
