import { expect, test } from '@playwright/test';
import { mockRepositoryApplication, type TestRole } from './fixtures/repository-detail';

for (const [role, count] of [
  ['VIEWER', 4],
  ['MANAGER', 5],
  ['SYSTEM_ADMIN', 6],
] as const) {
  test(`${role} has only permitted Repository sections`, /** Check visible navigation and direct role guards. */ async ({
    page,
  }) => {
    const { requests } = await mockRepositoryApplication(page, role as TestRole);
    await page.goto('/repositories/repository-1');
    await expect(
      page.getByRole('navigation', { name: 'Repository navigation', exact: true }).getByRole('link'),
    ).toHaveCount(count);
    if (role !== 'SYSTEM_ADMIN') {
      requests.length = 0;
      await page.goto('/repositories/repository-1/settings');
      await expect(page).toHaveURL('/');
      expect(requests.some(/** Find protected metadata requests. */ (url) => url.includes('webhook'))).toBe(false);
    }
    if (role === 'VIEWER') {
      await page.goto('/repositories/repository-1/security-alerts');
      await expect(page).toHaveURL('/');
    }
    requests.length = 0;
    await page.goto('/repositories/forbidden/issues');
    await expect(page.getByText('This repository was not found or is not available to you.')).toBeVisible();
    expect(requests.some(/** Detect forbidden child data loading. */ (url) => url.startsWith('/api/v1/issues?'))).toBe(
      false,
    );
  });
}

test('Settings metadata loads lazily and legacy anchors reach the guarded child', /** Preserve old entry addresses without exposing configuration to other roles. */ async ({
  page,
}) => {
  const { requests } = await mockRepositoryApplication(page);
  await page.goto('/repositories/repository-1');
  await expect(page.getByRole('navigation', { name: 'Repository navigation', exact: true })).toBeVisible();
  expect(
    requests.some(
      /** Check that Overview did not request privileged metadata. */ (url) => url.includes('webhook-configurations'),
    ),
  ).toBe(false);
  await page.goto('/repositories/repository-1#settings');
  await expect(page).toHaveURL('/repositories/repository-1/settings');
  await expect(page.getByRole('heading', { name: 'Repository settings', exact: true })).toBeVisible();
  expect(
    requests.some(
      /** Confirm metadata was loaded only on Settings entry. */ (url) => url.includes('webhook-configurations'),
    ),
  ).toBe(true);
});

test('a Viewer cannot use the legacy Settings anchor to mount configuration', /** Enforce the same direct access policy for old addresses. */ async ({
  page,
}) => {
  const { requests } = await mockRepositoryApplication(page, 'VIEWER');
  await page.goto('/repositories/repository-1#settings');
  await expect(page).toHaveURL('/');
  expect(
    requests.some(
      /** Reject privileged data requests from an unauthorized route. */ (url) =>
        url.includes('webhook-configurations'),
    ),
  ).toBe(false);
});

test('the sync button remains loading throughout its queued request', /** Verify UI pending state through the real context and client boundary. */ async ({
  page,
}) => {
  await mockRepositoryApplication(page);
  let release!: () => void;
  const gate = new Promise<void>(
    /** Retain deterministic request completion control. */ (resolve) => {
      release = resolve;
    },
  );
  await page.route(
    '**/api/v1/repositories/repository-1/sync',
    /** Hold the actual local sync request open. */ async (route) => {
      await gate;
      await route.fulfill({ json: { queuedCount: 1 } });
    },
  );
  await page.goto('/repositories/repository-1');
  const button = page.getByRole('button', { name: 'Fetch workflow runs', exact: true });
  await button.click();
  await expect(button).toBeDisabled();
  release();
  await expect(button).toBeEnabled();
  await expect(page.getByText('Pending', { exact: true })).toBeVisible();
});
