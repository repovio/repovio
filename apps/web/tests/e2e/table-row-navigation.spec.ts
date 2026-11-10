import { expect, test } from '@playwright/test';
import { mockRepositoryApplication } from './fixtures/repository-detail';

for (const [path, destination] of [
  ['/repositories', '/repositories/repository-1'],
  ['/issues', '/issues/issues-repository-1'],
  ['/pull-requests', '/pull-requests/pull-requests-repository-1'],
  ['/alerts/dependencies', '/alerts/security-alerts-repository-1'],
  ['/repositories/repository-1/issues', '/issues/issues-repository-1'],
  ['/repositories/repository-1/pull-requests', '/pull-requests/pull-requests-repository-1'],
  ['/repositories/repository-1/security-alerts?kind=DEPENDENCY', '/alerts/security-alerts-repository-1'],
]) {
  test(`ordinary row area navigates once from ${path}`, /** Verify native row activation instead of relying on title links. */ async ({
    page,
  }) => {
    await mockRepositoryApplication(page);
    await page.goto(path);
    const row = page.locator('tbody tr[data-selected]').first();
    await expect(row).toBeVisible();
    await row
      .locator('td')
      .first()
      .click({ position: { x: 20, y: 5 } });
    await expect(page).toHaveURL(destination);
  });
}

test('row keyboard and embedded actions keep separate behavior', /** Exercise real Nuxt UI focus and action isolation. */ async ({
  page,
}) => {
  await mockRepositoryApplication(page);
  await page.goto('/repositories');
  const row = page.locator('tbody tr[data-selected]').first();
  const edit = row.getByRole('link', { name: 'Edit repository', exact: true });
  await edit.click();
  await expect(page).toHaveURL('/repositories/repository-1/settings');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goBack();
  await expect(page).toHaveURL('/repositories');
  await edit.focus();
  await edit.press('Enter');
  await expect(page).toHaveURL('/repositories/repository-1/settings');
  await page.goBack();
  await expect(page).toHaveURL('/repositories');
  await row.focus();
  await expect(row).toBeFocused();
  await row.press('Enter');
  await expect(page).toHaveURL('/repositories/repository-1');
});

test('custom controls do not navigate and Space activates a focused row once', /** Exercise browser event bubbling through the native row handler. */ async ({
  page,
}) => {
  await mockRepositoryApplication(page);
  await page.goto('/repositories');
  const row = page.locator('tbody tr[data-selected]').first();
  await expect(row).toBeVisible();
  await row
    .locator('td')
    .first()
    .evaluate(
      /** Add synthetic embedded controls to an actual rendered record cell. */ (cell) => {
        cell.insertAdjacentHTML(
          'beforeend',
          '<span role="button" tabindex="0">Custom action</span><span contenteditable="true">Editable field</span>',
        );
      },
    );
  await row.getByRole('button', { name: 'Custom action' }).click();
  await expect(page).toHaveURL('/repositories');
  await row.locator('[contenteditable]').click();
  await expect(page).toHaveURL('/repositories');
  await row.focus();
  await row.press('Space');
  await expect(page).toHaveURL('/repositories/repository-1');
});
