import { expect, test, type Page } from '@playwright/test';

import { getAppLocale } from '../../shared/locales';
import { localeMessages, mockLocalization, uiCloseLabel } from './fixtures/localization';

test.describe.configure({ mode: 'parallel' });

const technicalRepository = 'acme/ops.build-v2';
const runTitle = 'Build #42 (إصدار)';

/** Supply inspectable mixed-script provider values without changing them in the client fixture. */
async function mockLocalizedWorkflow(page: Page): Promise<void> {
  await page.route(
    /\/api\/v1\/workflow-runs(?:\?|$)/,
    /** Render a real table row with neutral punctuation and provider-owned text. */ (route) =>
      route.fulfill({
        json: {
          items: [
            {
              id: 'locale-run',
              providerRunId: '42',
              displayTitle: runTitle,
              workflowName: 'Release (نسخة) v2',
              status: 'SUCCESS',
              awaitingApproval: false,
              reviewUrl: null,
              providerCreatedAt: '2026-11-01T10:00:00Z',
              startedAt: '2026-11-01T10:00:00Z',
              completedAt: '2026-11-01T10:00:12Z',
              durationMs: 12000,
              repositoryId: 'locale-repository',
              repositoryOwner: 'acme',
              repositoryName: 'ops.build-v2',
              providerType: 'GITHUB',
              url: 'https://example.test/acme/ops.build-v2/actions/runs/42',
              workflowLifecycleState: 'ACTIVE',
              workflowLifecycleCheckedAt: null,
            },
          ],
          meta: { hasNextPage: false, hasPrevPage: false, itemCount: 1, page: 1, pageCount: 1, perPage: 25 },
        },
      }),
  );
}

for (const code of ['ar', 'ur']) {
  test(`isolates provider text and aligns shell controls in ${code}`, /** Verify actual direction, alignment, and unchanged technical content. */ async ({
    page,
  }, testInfo) => {
    await mockLocalization(page, { role: 'SYSTEM_ADMIN' });
    await mockLocalizedWorkflow(page);
    await page
      .context()
      .addCookies([{ name: 'repovio-locale', value: code, url: testInfo.project.use.baseURL as string }]);
    await page.goto('/workflow-runs');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    const repository = page.locator('main').getByText(technicalRepository, { exact: true });
    await expect(repository).toHaveText(technicalRepository);
    await expect(repository).toHaveAttribute('dir', 'ltr');
    expect(
      await repository.evaluate(
        /** Read native bidirectional isolation rather than transformed source text. */ (node) =>
          getComputedStyle(node).unicodeBidi,
      ),
    ).toContain('isolate');
    await expect(page.locator('main').getByText(runTitle, { exact: true })).toHaveAttribute('dir', 'auto');
    const alignment = await page
      .locator('#global-search-trigger [data-slot="label"]')
      .evaluate(/** Observe the visible search label's alignment. */ (node) => getComputedStyle(node).textAlign);
    expect(alignment).toMatch(/^(start|right)$/);
    const messages = localeMessages(code);
    const footer = page.getByRole('contentinfo', { name: messages.systemStatus.label });
    const activity = footer.getByText(messages.systemStatus.activity.IDLE, { exact: true });
    const footerBox = (await footer.boundingBox())!;
    const activityBox = (await activity.boundingBox())!;
    expect(activityBox.x - footerBox.x).toBeLessThanOrEqual(24);
    const leadingPadding = await page
      .locator('main tbody td')
      .first()
      .evaluate(
        /** Check the table's inline leading gutter in RTL. */ (node) => getComputedStyle(node).paddingInlineStart,
      );
    expect(Number.parseFloat(leadingPadding)).toBeGreaterThanOrEqual(24);
  });
}

for (const code of ['en', 'ar', 'ur', 'zh-CN', 'hi', 'bn']) {
  for (const theme of ['light', 'dark'] as const) {
    for (const width of [390, 1440]) {
      test(`visual language layout ${code} ${theme} ${width}px`, /** Capture auth, menus, technical tables, and dialogs in every required script/theme/width. */ async ({
        page,
      }, testInfo) => {
        const entry = getAppLocale(code);
        const messages = localeMessages(code);
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.addInitScript(
          /** Apply the selected theme before the application mounts. */ (theme) =>
            localStorage.setItem('nuxt-color-mode', theme),
          theme,
        );
        await mockLocalization(page);
        await page
          .context()
          .addCookies([{ name: 'repovio-locale', value: code, url: testInfo.project.use.baseURL as string }]);
        await page.goto('/auth/signin');
        await expect(page.getByRole('heading', { name: messages.auth.signIn, exact: true })).toBeVisible();
        await page.evaluate(
          /** Wait for actual script fonts before capturing their glyphs. */ async () => {
            await document.fonts.ready;
          },
        );
        await page.getByRole('combobox', { name: messages.layout.language, exact: true }).click();
        await expect(page.getByRole('option', { name: entry.name, exact: true })).toHaveAttribute(
          'aria-selected',
          'true',
        );
        await page.screenshot({ animations: 'disabled', path: testInfo.outputPath('auth-menu.png'), fullPage: true });
        await page.keyboard.press('Escape');
        await mockLocalization(page, { role: 'SYSTEM_ADMIN' });
        await mockLocalizedWorkflow(page);
        await page.goto('/workflow-runs');
        await expect(page.locator('main').getByText(runTitle, { exact: true })).toBeVisible();
        await expect(page.locator('html')).toHaveAttribute('dir', entry.dir);
        expect(
          await page.evaluate(
            /** Measure page overflow while allowing the table's own scroll container. */ () =>
              document.documentElement.scrollWidth,
          ),
        ).toBeLessThanOrEqual(width);
        await page.screenshot({
          animations: 'disabled',
          path: testInfo.outputPath('workflow-table.png'),
          fullPage: true,
        });
        await page.getByRole('button', { name: 'locale-user', exact: true }).click();
        await page
          .getByRole('menuitem', {
            name: width >= 1024 ? `${messages.shortcuts.title} ?` : messages.shortcuts.title,
            exact: true,
          })
          .click();
        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible();
        await page.screenshot({ animations: 'disabled', path: testInfo.outputPath('dialog.png'), fullPage: true });
        await dialog.getByRole('button', { name: uiCloseLabel(code), exact: true }).click();
        await expect(dialog).toBeHidden();
        await expect(page.getByRole('button', { name: 'locale-user', exact: true })).toBeFocused();
        await page.getByRole('button', { name: 'locale-user', exact: true }).click();
        await page.mouse.move(0, 0);
        await page.getByRole('menuitem', { name: messages.layout.language, exact: true }).focus();
        await page.keyboard.press(entry.dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight');
        const english = page.getByRole('menuitemcheckbox', { name: 'English', exact: true });
        await english.scrollIntoViewIfNeeded();
        await english.click();
        await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
        await expect(page.locator('main').getByText(technicalRepository, { exact: true })).toHaveText(
          technicalRepository,
        );
      });
    }
  }
}
