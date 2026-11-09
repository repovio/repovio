import { expect, test } from '@playwright/test';
import { mockRepositoryApplication } from './fixtures/repository-detail';

test('application buttons and portaled dialog controls show the pointer cursor', /** Check actual Nuxt UI controls and their computed styles. */ async ({
  page,
}) => {
  await mockRepositoryApplication(page);
  await page.goto('/repositories');
  await expect(page.locator('tbody tr[data-selected]').first()).toBeVisible({ timeout: 15_000 });
  const buttons = page.getByRole('button');
  expect(await buttons.count()).toBeGreaterThan(0);
  for (const button of await buttons.all()) {
    if ((await button.isVisible()) && (await button.isEnabled())) {
      await expect(button).toHaveCSS('cursor', 'pointer');
    }
  }
  const iconButton = page.locator('button[aria-label]').first();
  await expect(iconButton).toHaveCSS('cursor', 'pointer');
  await page.getByRole('button', { name: 'Sort', exact: true }).click();
  const sorting = page.locator('.qk-table-sorting-popover');
  await expect(sorting).toBeVisible();
  await expect(sorting.getByRole('button', { name: 'Add sort' })).toBeDisabled();
  await expect(sorting.getByRole('button', { name: 'Add sort' })).toHaveCSS('cursor', 'not-allowed');
  await page.keyboard.press('Escape');
  await page.keyboard.press('?');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button').first()).toHaveCSS('cursor', 'pointer');
});

test('shared cursor rule covers button semantics and preserves disabled states and overrides', /** Exercise native selector variants against the application stylesheet. */ async ({
  page,
}) => {
  await mockRepositoryApplication(page);
  await page.goto('/repositories');
  await expect(page.locator('tbody tr[data-selected]').first()).toBeVisible({ timeout: 15_000 });
  await page.evaluate(
    /** Add isolated controls without changing application behavior. */ () => {
      const fixture = document.createElement('section');
      fixture.id = 'cursor-fixture';
      fixture.innerHTML = `
      <button>Enabled</button>
      <input type="button" value="Button">
      <input type="submit" value="Submit">
      <input type="reset" value="Reset">
      <span role="button" tabindex="0">Role button</span>
      <button disabled>Disabled</button>
      <button aria-disabled="true">ARIA disabled</button>
      <span role="button" data-disabled>Data disabled</span>
      <fieldset disabled><button>Disabled by fieldset</button></fieldset>
      <button style="cursor: wait">Explicit cursor</button>
      <input type="text" value="Text">
    `;
      document.body.append(fixture);
    },
  );
  const fixture = page.locator('#cursor-fixture');
  for (const control of await fixture.locator('button, input:not([type="text"]), [role="button"]').all()) {
    const label = await control.textContent();
    if (label === 'Explicit cursor') {
      await expect(control).toHaveCSS('cursor', 'wait');
    } else if ((await control.isEnabled()) && (await control.getAttribute('data-disabled')) === null) {
      await expect(control).toHaveCSS('cursor', 'pointer');
    } else {
      await expect(control).not.toHaveCSS('cursor', 'pointer');
    }
  }
  await expect(fixture.locator('input[type="text"]')).not.toHaveCSS('cursor', 'pointer');
});
