import { expect, test, type Page } from '@playwright/test';
import { mockApplication } from './helpers';

/** Browser-only handle installed by Playwright, never by the shipped application. */
interface PromptFixture {
  calls: number;
  settle?: (success: boolean) => void;
}

/** Replace only the plugin boundary while keeping the production Vue component, Nuxt UI, and translations real. */
async function offerUpdate(page: Page): Promise<void> {
  await page.evaluate(
    /** Install a deferred activation on the existing reactive plugin object. */ () => {
      const app = document.getElementById('__nuxt') as HTMLElement & {
        __vue_app__: { $nuxt: { $pwa: { needRefresh: boolean; updateServiceWorker: () => Promise<void> } } };
      };
      const pwa = app.__vue_app__.$nuxt.$pwa;
      const state: PromptFixture = { calls: 0 };
      (window as Window & { promptFixture?: PromptFixture }).promptFixture = state;
      pwa.updateServiceWorker = /** Hold activation until the test accepts or rejects the operation. */ () => {
        state.calls++;
        return new Promise<void>(
          /** Expose only settlement, not application credentials or internals. */ (resolve, reject) => {
            state.settle = /** Finish the current operation with a controlled result. */ (success) => {
              if (success) resolve();
              else reject(new Error('Synthetic activation failure'));
            };
          },
        );
      };
      pwa.needRefresh = true;
    },
  );
}

/** Settle the pending browser-only activation stub. */
async function settleUpdate(page: Page, success: boolean): Promise<void> {
  await page.evaluate(
    /** Complete the held operation without altering the component state directly. */ (value) => {
      (window as Window & { promptFixture?: PromptFixture }).promptFixture?.settle?.(value);
    },
    success,
  );
}

for (const locale of ['en', 'de']) {
  for (const width of [390, 1440]) {
    test(`update failure, loading, retry and keyboard (${locale}, ${width})`, /** Exercise the real pending/error presentation with a deterministic plugin seam. */ async ({
      page,
    }, testInfo) => {
      const de = locale === 'de';
      await page.setViewportSize({ width, height: 900 });
      await page.context().addCookies([{ name: 'repovio-locale', value: locale, url: testInfo.project.use.baseURL! }]);
      await mockApplication(page);
      await page.goto('/auth/signin');
      await expect(page.locator('input[autocomplete="username"]')).toBeVisible();
      await offerUpdate(page);
      const prompt = page.locator('[data-pwa-update-prompt]');
      const update = prompt.getByRole('button', { name: de ? 'Aktualisieren' : 'Update', exact: true });
      const later = prompt.getByRole('button', { name: de ? 'Später' : 'Later', exact: true });
      await expect(prompt).toBeVisible();
      await update.focus();
      await expect(update).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(update).toBeDisabled();
      await expect(later).toBeDisabled();
      await update.evaluate(
        /** Native clicks on disabled controls must not start duplicate activation. */ (element) =>
          (element as HTMLButtonElement).click(),
      );
      await expect
        .poll(
          /** Read the number of actual activation calls. */ () =>
            page.evaluate(
              /** Observe the test fixture without modifying its state. */ () =>
                (window as Window & { promptFixture?: PromptFixture }).promptFixture?.calls,
            ),
        )
        .toBe(1);
      await page.screenshot({ path: testInfo.outputPath(`pending-${locale}-${width}.png`) });
      await settleUpdate(page, false);
      await expect(prompt.getByRole('status')).toContainText(de ? 'nicht' : 'could not');
      await expect(update).toBeEnabled();
      await expect(later).toBeEnabled();
      await expect(prompt).not.toContainText('pwa.updateError');
      const box = await prompt.boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(width);
      expect(
        await prompt.evaluate(
          /** Check the actual content width rather than the outer box alone. */ (element) =>
            element.scrollWidth <= element.clientWidth,
        ),
      ).toBe(true);
      await page.screenshot({ path: testInfo.outputPath(`failure-${locale}-${width}.png`) });
      await update.click();
      await expect(update).toBeDisabled();
      await settleUpdate(page, true);
      await expect(update).toBeEnabled();
      expect(
        await page.evaluate(
          /** Confirm only the explicit retry adds another operation. */ () =>
            (window as Window & { promptFixture?: PromptFixture }).promptFixture?.calls,
        ),
      ).toBe(2);
      await later.click();
      await expect(prompt).toBeHidden();
    });
  }
}
