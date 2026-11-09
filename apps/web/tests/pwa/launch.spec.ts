import { expect, test } from '@playwright/test';
import { controlPage, mockApplication, signIn } from './helpers';

test('launches online and preserves authenticated deep links without installation APIs', /** Exercise real form, middleware, and routes against explicit synthetic API responses. */ async ({
  page,
}) => {
  await page.addInitScript(
    /** Simulate a browser without the optional native install event. */ () => {
      delete (window as Window & { onbeforeinstallprompt?: unknown }).onbeforeinstallprompt;
    },
  );
  await mockApplication(page);
  await page.goto('/repositories');
  await expect(page).toHaveURL('/auth/signin');
  await signIn(page, 'bob');
  await controlPage(page);
  await page.goto('/repositories');
  await expect(page.getByRole('heading', { name: 'Repositories', exact: true })).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL('/repositories');
  const denied = page.waitForResponse(
    /** Observe the actual denied repository request. */ (response) =>
      new URL(response.url()).pathname === '/api/v1/repositories/alice-only',
  );
  await page.goto('/repositories/alice-only');
  expect((await denied).status()).toBe(403);
  await expect(page.getByText('This repository was not found or is not available to you.')).toBeVisible();
  await expect(page.getByText('Private Alice fixture', { exact: true })).toHaveCount(0);
});
