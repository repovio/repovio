import { expect, test } from '@playwright/test';
import { mockRepositoryApplication } from './fixtures/repository-detail';

const tabs = ['General', 'Webhook', 'Workflow filters', 'Members', 'Group access'];
const values = ['general', 'webhook', 'workflow-filters', 'members', 'groups'];

/** Find only visible, current-visit Settings content. */
function panel(page: import('@playwright/test').Page) {
  return page.locator('[data-settings-section]:visible');
}

test('Settings tabs restore history and load sections only once per visit', /** Verify the real secondary navigation and request boundary. */ async ({
  page,
}) => {
  const { requests } = await mockRepositoryApplication(page);
  await page.goto('/repositories/repository-1/settings');
  const navigation = page.getByRole('navigation', { name: 'Repository settings sections', exact: true });
  await expect(navigation.getByRole('link')).toHaveCount(5);
  await expect(panel(page)).toHaveAttribute('data-settings-section', 'general');
  expect(
    requests.some(
      /** Detect premature privileged supporting requests. */ (url) =>
        /webhook-configurations|workflow-filters|memberships|user-groups/.test(url),
    ),
  ).toBe(false);
  const retention = page.getByRole('spinbutton', { name: 'Workflow-run retention (days)', exact: true });
  await retention.fill('77');
  for (let index = 1; index < tabs.length; index++) {
    await navigation.getByRole('link', { name: tabs[index], exact: true }).click();
    await expect(page).toHaveURL(`/repositories/repository-1/settings?tab=${values[index]}`);
    await expect(panel(page)).toHaveAttribute('data-settings-section', values[index]);
  }
  await page.goBack();
  await expect(panel(page)).toHaveAttribute('data-settings-section', 'members');
  await page.goForward();
  await expect(panel(page)).toHaveAttribute('data-settings-section', 'groups');
  await navigation.getByRole('link', { name: 'General', exact: true }).click();
  await expect(retention).toHaveValue('77');
  await expect(page.getByRole('heading', { name: 'Members', exact: true })).toHaveCount(0);
  await navigation.getByRole('link', { name: 'Webhook', exact: true }).click();
  expect(
    requests.filter(
      /** Count safe webhook metadata loads across repeated visits. */ (url) => url.includes('webhook-configurations'),
    ),
  ).toHaveLength(1);
  await expect(page).toHaveURL('/repositories/repository-1/settings?tab=webhook');
  await expect(panel(page)).toHaveAttribute('data-settings-section', 'webhook');
  await page.reload();
  await expect(panel(page)).toHaveAttribute('data-settings-section', 'webhook');
  await page.goto('/repositories/repository-2/settings');
  await expect(page.getByRole('spinbutton', { name: 'Workflow-run retention (days)', exact: true })).toHaveValue('30');
});

for (const query of ['tab=unknown', 'tab=', 'tab=members&tab=groups']) {
  test(`normalizes malformed Settings selection ${query}`, /** Preserve unrelated URL state without a redirect loop. */ async ({
    page,
  }) => {
    await mockRepositoryApplication(page);
    await page.goto(`/repositories/repository-1/settings?source=shared&${query}#details`);
    await expect(page).toHaveURL('/repositories/repository-1/settings?source=shared#details');
    await expect(panel(page)).toHaveAttribute('data-settings-section', 'general');
  });
}

for (const role of ['VIEWER', 'MANAGER'] as const) {
  test(`all Settings tabs remain administrator-only for ${role}`, /** Direct query destinations must not load restricted data. */ async ({
    page,
  }) => {
    const { requests } = await mockRepositoryApplication(page, role);
    for (const value of values) {
      requests.length = 0;
      await page.goto(`/repositories/repository-1/settings?tab=${value}`);
      await expect(page).toHaveURL('/');
      expect(
        requests.some(
          /** Reject any supporting administration data disclosure. */ (url) =>
            /webhook-configurations|workflow-filters|memberships|user-groups/.test(url),
        ),
      ).toBe(false);
    }
  });
}

test('drafts and pending mutations survive tab switches but not a new visit', /** Keep response lifetime attached to its mounted panel without persistent storage. */ async ({
  page,
}) => {
  await mockRepositoryApplication(page);
  let release!: () => void;
  const gate = new Promise<void>(
    /** Retain deterministic completion control. */ (resolve) => {
      release = resolve;
    },
  );
  let creates = 0;
  await page.route(
    '**/api/v1/repositories/repository-1/workflow-filters',
    /** Exercise the real create transport while holding its response. */ async (route) => {
      if (route.request().method() !== 'POST') return route.fulfill({ json: [] });
      creates++;
      const body = route.request().postDataJSON();
      await gate;
      await route.fulfill({ json: { id: 'filter-1', repositoryId: 'repository-1', ...body } });
    },
  );
  await page.goto('/repositories/repository-1/settings?tab=workflow-filters');
  await page.getByPlaceholder('e.g. build-*').fill('release-*');
  const navigation = page.getByRole('navigation', { name: 'Repository settings sections', exact: true });
  await navigation.getByRole('link', { name: 'General', exact: true }).click();
  await navigation.getByRole('link', { name: 'Workflow filters', exact: true }).click();
  await expect(page.getByPlaceholder('e.g. build-*')).toHaveValue('release-*');
  await page.getByRole('button', { name: 'Add workflow filter', exact: true }).click();
  await expect.poll(/** Read actual request count before switching panels. */ () => creates).toBe(1);
  await navigation.getByRole('link', { name: 'General', exact: true }).click();
  await navigation.getByRole('link', { name: 'Workflow filters', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Add workflow filter', exact: true })).toBeDisabled();
  release();
  await expect(page.getByText('release-*', { exact: true })).toBeVisible();
  expect(creates).toBe(1);
  await page.getByPlaceholder('e.g. build-*').fill('discard-*');
  await page
    .getByRole('navigation', { name: 'Repository navigation', exact: true })
    .getByRole('link', { name: 'Overview', exact: true })
    .click();
  await page
    .getByRole('navigation', { name: 'Repository navigation', exact: true })
    .getByRole('link', { name: 'Repository settings', exact: true })
    .click();
  await navigation.getByRole('link', { name: 'Workflow filters', exact: true }).click();
  await expect(page.getByPlaceholder('e.g. build-*')).toHaveValue('');
});

test('synthetic webhook drafts remain memory-only for one Settings visit', /** Retain secret input across tabs and dispose it on exit. */ async ({
  page,
}) => {
  await mockRepositoryApplication(page);
  await page.route(
    '**/api/v1/repositories/webhook-configurations',
    /** Supply safe synthetic repository webhook metadata. */ (route) =>
      route.fulfill({
        json: [
          {
            repositoryId: 'repository-1',
            providerType: 'GITHUB',
            configured: false,
            lastDeliveryAt: null,
            callbackUrl: 'https://example.test/webhook/repository-1',
          },
        ],
      }),
  );
  await page.goto('/repositories/repository-1/settings?tab=webhook');
  await page.getByRole('button', { name: 'Generate secret', exact: true }).click();
  const secret = page.getByLabel('Signing secret');
  await secret.fill('synthetic-draft-not-a-credential');
  const navigation = page.getByRole('navigation', { name: 'Repository settings sections', exact: true });
  await navigation.getByRole('link', { name: 'General', exact: true }).click();
  await expect(secret).toBeHidden();
  await navigation.getByRole('link', { name: 'Webhook', exact: true }).click();
  await expect(secret).toHaveValue('synthetic-draft-not-a-credential');
  expect(
    await page.evaluate(
      /** Inspect only synthetic persistence evidence. */ () => JSON.stringify({ ...localStorage, ...sessionStorage }),
    ),
  ).not.toContain('synthetic-draft-not-a-credential');
  await page
    .getByRole('navigation', { name: 'Repository navigation', exact: true })
    .getByRole('link', { name: 'Overview', exact: true })
    .click();
  await page
    .getByRole('navigation', { name: 'Repository navigation', exact: true })
    .getByRole('link', { name: 'Repository settings', exact: true })
    .click();
  await navigation.getByRole('link', { name: 'Webhook', exact: true }).click();
  await expect(secret).toHaveValue('');
});
