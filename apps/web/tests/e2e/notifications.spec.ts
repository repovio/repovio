import { expect, test, type Page } from '@playwright/test';

const pageMeta = { hasNextPage: false, hasPrevPage: false, itemCount: 1, page: 1, pageCount: 1, perPage: 10 };

/** Mocks shell. */
async function mockShell(page: Page): Promise<void> {
  await page.addInitScript(
    /** Initializes browser-side authentication and preferences before page scripts run. */ () =>
      window.localStorage.setItem('repovio.access-token', 'playwright-access-token'),
  );
  await page.route(
    '**/api/v1/auth/me',
    /** Supplies the mocked response for `/api/v1/auth/me`. */ (route) =>
      route.fulfill({
        json: {
          avatarUpdatedAt: null,
          firstName: null,
          id: 'user-1',
          lastName: null,
          role: 'SYSTEM_ADMIN',
          username: 'admin',
        },
      }),
  );
  await page.route(
    '**/api/v1/health',
    /** Supplies the mocked response for `/api/v1/health`. */ (route) =>
      route.fulfill({ json: { api: 'ok', database: 'ok', providers: [], status: 'ok' } }),
  );
  await page.route(
    '**/api/v1/version/latest',
    /** Supplies the mocked response for `/api/v1/version/latest`. */ (route) =>
      route.fulfill({ json: { latest: null } }),
  );
  await page.route(
    '**/api/v1/settings',
    /** Supplies the mocked response for `/api/v1/settings`. */ (route) =>
      route.fulfill({ json: { dateTimeFormat: 'LOCALE_MEDIUM', workflowRunRetentionDays: 90 } }),
  );
  await page.route(
    '**/api/v1/dashboard/**',
    /** Supplies the mocked response for `/api/v1/dashboard/**`. */ (route) => route.fulfill({ json: [] }),
  );
  await page.route(
    '**/api/v1/browser-push',
    /** Supplies the mocked response for `/api/v1/browser-push`. */ (route) =>
      route.fulfill({ json: { available: false, publicKey: null, subscriptionCount: 0 } }),
  );
  await page.route(
    '**/api/v1/notification-channels/manageable-repositories',
    /** Supplies the mocked response for `/api/v1/notification-channels/manageable-repositories`. */ (route) =>
      route.fulfill({ json: [{ id: 'repository-1', name: 'repovio', owner: 'tobiaswaelde' }] }),
  );
  await page.route(
    '**/api/v1/users**',
    /** Supplies the mocked response for `/api/v1/users**`. */ (route) =>
      route.fulfill({
        json: {
          items: [{ id: 'user-1', username: 'admin' }],
          meta: pageMeta,
        },
      }),
  );
}

test('shows global channel events and system-wide delivery history', /** Verifies shows global channel events and system-wide delivery history. */ async ({
  page,
}) => {
  await mockShell(page);
  let channelQueryUrl: URL | undefined;
  await page.route(
    '**/api/v1/notification-channels/query**',
    /** Supplies the mocked response for `/api/v1/notification-channels/query**`. */ (route) => {
      channelQueryUrl = new URL(route.request().url());
      return route.fulfill({
        json: {
          items: [
            {
              browserRecipients: [],
              canManage: true,
              createdAt: '2026-09-14T10:00:00Z',
              enabled: true,
              eventSubscriptions: [
                { eventType: 'WORKFLOW_RUN_FAILED', repositoryIds: [], workflowPatterns: ['deploy-*'] },
              ],
              id: 'channel-1',
              name: 'Operations',
              requiresReconfiguration: false,
              type: 'GOTIFY',
              updatedAt: '2026-09-14T10:00:00Z',
              urlScheme: 'gotifys',
            },
          ],
          meta: pageMeta,
        },
      });
    },
  );
  await page.route(
    '**/api/v1/notification-channels/preview',
    /** Supplies the mocked response for `/api/v1/notification-channels/preview`. */ async (route) => {
      expect(route.request().postDataJSON()).toEqual({
        eventSubscriptions: [{ eventType: 'WORKFLOW_RUN_FAILED', repositoryIds: [], workflowPatterns: ['deploy-*'] }],
      });
      await route.fulfill({
        json: {
          matches: [
            {
              eventType: 'WORKFLOW_RUN_FAILED',
              id: 'run-1',
              repositoryName: 'repovio',
              repositoryOwner: 'tobiaswaelde',
              url: 'https://example.com/run/1',
              workflowName: 'deploy-production',
            },
          ],
          status: 'MATCHES',
        },
      });
    },
  );
  await page.route(
    '**/api/v1/notification-deliveries/query**',
    /** Supplies the mocked response for `/api/v1/notification-deliveries/query**`. */ (route) =>
      route.fulfill({
        json: {
          items: [
            {
              attempts: [
                {
                  attempt: 1,
                  browserPushSubscriptionId: null,
                  createdAt: '2026-09-14T10:00:00Z',
                  deliveredAt: null,
                  deviceLabel: null,
                  error: 'Apprise notification delivery failed.',
                  id: 'attempt-1',
                  notificationChannelId: 'channel-1',
                  notificationChannelName: 'Operations',
                  notificationChannelType: 'GOTIFY',
                },
              ],
              createdAt: '2026-09-14T10:00:00Z',
              eventType: 'WORKFLOW_RUN_FAILED',
              finalError: 'The notification channel failed.',
              id: 'delivery-1',
              kind: 'EVENT',
              nextAttemptAt: null,
              notificationChannelId: 'channel-1',
              notificationChannelName: 'Operations',
              notificationChannelType: 'GOTIFY',
              repositoryId: 'repository-1',
              repositoryName: 'repovio',
              repositoryOwner: 'tobiaswaelde',
              requestedByUsername: null,
              status: 'FAILED',
              subjectKind: 'WORKFLOW_RUN',
              subjectTitle: 'deploy-production',
              subjectUrl: 'https://example.com/run/1',
              updatedAt: '2026-09-14T10:00:00Z',
            },
          ],
          meta: pageMeta,
        },
      }),
  );

  await page.goto('/notifications');
  const primaryNavigation = page.getByRole('navigation', { name: 'Primary navigation' });
  await expect(primaryNavigation.getByRole('button', { name: 'Notifications' })).toHaveAttribute(
    'aria-expanded',
    'true',
  );
  const notificationNavigation = primaryNavigation.getByRole('region', { name: 'Notifications' });
  await expect(notificationNavigation.getByRole('link', { name: 'Channels', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(page.locator('[data-page-navigation]')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Rules', exact: true })).toHaveCount(0);
  await expect(page.getByRole('cell', { name: 'Operations' })).toBeVisible();
  await expect(page.getByText('Workflow failed', { exact: true })).toBeVisible();
  const channelFields = channelQueryUrl?.searchParams.get('fields')?.split(',') ?? [];
  expect(channelFields).toEqual(expect.arrayContaining(['urlScheme', 'browserRecipients', 'eventSubscriptions']));
  expect(channelFields).not.toContain('target');
  expect(channelFields).not.toContain('events');

  const addChannel = page.getByRole('button', { name: 'Add channel' });
  await addChannel.click();
  const dialog = page.getByRole('dialog', { name: 'Add notification channel' });
  await expect(dialog.getByText('Events', { exact: true })).toBeVisible();
  await expect(dialog.getByRole('checkbox', { name: 'Dependency alert opened' })).toBeVisible();
  await expect(dialog.getByRole('checkbox', { name: 'Secret scanning alert resolved' })).toBeVisible();
  await expect(dialog.locator(':focus')).toHaveCount(1);
  await dialog.getByRole('textbox', { name: /^Name\*?$/ }).fill('Operations');
  await dialog.getByRole('textbox', { name: 'SMTP server' }).fill('smtp.example.com');
  await dialog.getByRole('textbox', { name: 'From address' }).fill('repovio@example.com');
  await dialog.getByRole('textbox', { name: 'Recipients' }).fill('operations@example.com');
  await dialog.getByRole('checkbox', { name: 'Workflow failed' }).check();
  await expect(dialog.getByText('Repository filters')).toBeVisible();
  await expect(dialog.getByText('Workflow patterns')).toBeVisible();
  await dialog.getByRole('textbox', { name: 'Workflow patterns' }).fill('deploy-*');
  await dialog.getByRole('button', { name: 'Preview matching runs' }).click();
  await expect(dialog.getByText('1 recent workflow runs match this rule.')).toBeVisible();
  await expect(dialog.getByRole('link', { name: /tobiaswaelde\/repovio · deploy-production/ })).toHaveAttribute(
    'href',
    'https://example.com/run/1',
  );
  await page.keyboard.press('Escape');
  await expect(addChannel).toBeFocused();

  await notificationNavigation.getByRole('link', { name: 'Delivery history', exact: true }).click();
  await expect(page.getByText('deploy-production')).toBeVisible();
  await page.getByRole('button', { name: 'View delivery details' }).click();
  await expect(page.getByRole('dialog', { name: 'Delivery details' })).toContainText(
    'Apprise notification delivery failed.',
  );
  await page.setViewportSize({ height: 844, width: 390 });
  await expect(page.getByRole('dialog', { name: 'Delivery details' })).toBeVisible();
});

test('redirects the removed rules route to global channels', /** Verifies redirects the removed rules route to global channels. */ async ({
  page,
}) => {
  await mockShell(page);
  await page.route(
    '**/api/v1/notification-channels/query**',
    /** Supplies the mocked response for `/api/v1/notification-channels/query**`. */ (route) =>
      route.fulfill({ json: { items: [], meta: { ...pageMeta, itemCount: 0, pageCount: 0 } } }),
  );

  await page.goto('/notifications/rules');

  await expect(page).toHaveURL(/\/notifications$/);
});

for (const locale of ['en', 'de'] as const) {
  test(`validates notification destinations before save and preview (${locale})`, /** Verifies validates notification destinations before save and preview ([locale]). */ async ({
    page,
    baseURL,
  }, testInfo) => {
    await mockShell(page);
    await page.context().addCookies([{ name: 'repovio-locale', value: locale, url: baseURL! }]);
    if (locale === 'de') await page.setViewportSize({ height: 844, width: 390 });
    const labels =
      locale === 'de'
        ? {
            add: 'Kanal hinzufügen',
            error: 'Gib einen gültigen Wert ein.',
            from: 'Absenderadresse',
            preview: 'Passende Läufe anzeigen',
            recipients: 'Empfänger',
            save: 'Speichern',
            smtp: 'SMTP-Server',
            workflow: 'Workflow fehlgeschlagen',
          }
        : {
            add: 'Add channel',
            error: 'Enter a valid value.',
            from: 'From address',
            preview: 'Preview matching runs',
            recipients: 'Recipients',
            save: 'Save',
            smtp: 'SMTP server',
            workflow: 'Workflow failed',
          };
    let createRequests = 0;
    let previewRequests = 0;
    let releaseCreation: (() => void) | undefined;
    const creationGate = new Promise<void>(
      /** Retains the response resolver so this test controls request completion. */ (resolve) => {
        releaseCreation = resolve;
      },
    );
    await page.route(
      '**/api/v1/notification-channels/query**',
      /** Supplies the mocked response for `/api/v1/notification-channels/query**`. */ (route) =>
        route.fulfill({ json: { items: [], meta: { ...pageMeta, itemCount: 0, pageCount: 0 } } }),
    );
    await page.route(
      '**/api/v1/notification-channels/preview',
      /** Supplies the mocked response for `/api/v1/notification-channels/preview`. */ async (route) => {
        previewRequests++;
        await route.fulfill({ json: { matches: [], status: 'NO_RESULTS' } });
      },
    );
    await page.route(
      '**/api/v1/notification-channels',
      /** Supplies the mocked response for `/api/v1/notification-channels`. */ async (route) => {
        if (route.request().method() !== 'POST') return route.fulfill({ json: [] });
        createRequests++;
        expect(route.request().postDataJSON()).toEqual({
          browserRecipientUserIds: [],
          configuration: {
            from: 'repovio@example.com',
            port: 587,
            recipients: ['operations@example.com'],
            security: 'STARTTLS',
            smtpHost: 'smtp.example.com',
          },
          enabled: true,
          eventSubscriptions: [{ eventType: 'WORKFLOW_RUN_FAILED', repositoryIds: [], workflowPatterns: [] }],
          name: 'Operations',
          type: 'EMAIL',
        });
        await creationGate;
        await route.fulfill({
          json: {
            browserRecipients: [],
            canManage: true,
            createdAt: '2026-11-05T10:00:00.000Z',
            enabled: true,
            eventSubscriptions: [],
            id: 'validated-channel',
            name: 'Operations',
            requiresReconfiguration: false,
            type: 'EMAIL',
            updatedAt: '2026-11-05T10:00:00.000Z',
            urlScheme: 'mailtos',
          },
        });
      },
    );

    const ready = page.waitForResponse(
      /** Evaluates `response.url().includes('/api/v1/notification-channels/query')` when page.waitForResponse invokes this callback. */ (
        response,
      ) => response.url().includes('/api/v1/notification-channels/query'),
    );
    await page.goto('/notifications');
    await ready;
    await page.getByRole('button', { name: labels.add, exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox', { name: /^Name\*?$/ }).fill('  Operations  ');
    await dialog.getByRole('textbox', { name: labels.smtp }).fill('smtp.example.com');
    await dialog.getByRole('textbox', { name: labels.from }).fill('repovio@example.com');
    const recipients = dialog.getByRole('textbox', { name: labels.recipients });
    await recipients.fill('invalid-address');
    await recipients.press('Tab');
    await expect(recipients).toHaveAttribute('aria-invalid', 'true');
    const workflow = dialog.getByRole('checkbox', { name: labels.workflow, exact: true });
    await workflow.click();
    await expect(workflow).toBeChecked();
    const save = dialog.getByRole('button', { name: labels.save, exact: true });
    await save.click();
    await expect(recipients).toHaveAttribute('aria-invalid', 'true');
    await expect(dialog.getByText(labels.error, { exact: true })).toBeVisible();
    expect(createRequests).toBe(0);
    await dialog.getByRole('button', { name: labels.preview, exact: true }).click();
    await expect(recipients).toHaveAttribute('aria-invalid', 'true');
    expect(previewRequests).toBe(0);
    await recipients.scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath(`notification-validation-${locale}.png`), fullPage: true });

    await recipients.fill('operations@example.com');
    await save.click();
    await expect
      .poll(/** Evaluates `createRequests` when expect.poll invokes this callback. */ () => createRequests)
      .toBe(1);
    await expect(save).toBeDisabled();
    await expect(dialog).toBeVisible();
    releaseCreation?.();
    await expect(dialog).not.toBeVisible();
  });
}
