import { expect, test, type Page } from '@playwright/test';
import { expectTableHover } from './fixtures/table-hover';

const pageMeta = { hasNextPage: false, hasPrevPage: false, itemCount: 1, page: 1, pageCount: 1, perPage: 10 };

/** Mocks shell. */
async function mockShell(page: Page, role: 'SYSTEM_ADMIN' | 'VIEWER' | 'MANAGER' = 'SYSTEM_ADMIN'): Promise<void> {
  await page.route(
    '**/api/v1/**',
    /** Isolate shell metadata from live services during mocked browser tests. */ (route) =>
      route.fulfill({ json: { items: [], meta: { itemCount: 0, pageCount: 1 } } }),
  );
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
          role,
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
    '**/api/v1/notifications/recent',
    /** Supplies bounded personal history independently of push capability. */ (route) =>
      route.fulfill({ json: { items: [] } }),
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
          items: [
            { id: '30b7b20a-159a-42c7-a283-0246848d5ab4', username: 'admin', firstName: 'Vera', lastName: 'Viewer' },
          ],
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
              requestedByUsername: 'viewer',
              requestedBy: { id: 'viewer', username: 'viewer', firstName: 'Vera', lastName: 'Viewer' },
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
  const notifications = primaryNavigation.getByRole('link', { name: 'Notifications', exact: true });
  await expect(notifications).toHaveCount(1);
  await expect(notifications).toHaveAttribute('href', '/notifications');
  await expect(notifications).toHaveAttribute('aria-current', 'page');
  await expect(primaryNavigation.getByRole('button', { name: 'Notifications', exact: true })).toHaveCount(0);
  await expect(primaryNavigation.getByRole('link', { name: 'Channels', exact: true })).toHaveCount(0);
  await expect(primaryNavigation.getByRole('link', { name: 'Delivery history', exact: true })).toHaveCount(0);
  await expect(page.locator('[data-page-navigation]')).toHaveCount(0);
  await expect(page.locator('[data-page-toolbar]')).toHaveCount(1);
  await expect(page.locator('[data-table-toolbar]')).toHaveCount(0);
  await expect(
    page.locator('[data-page-toolbar]').getByRole('link', { name: 'Delivery history', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Rules', exact: true })).toHaveCount(0);
  await expect(page.getByRole('cell', { name: 'Operations' })).toBeVisible();
  await expectTableHover(page, page.getByRole('table'));
  await expect(page.getByText('Workflow failed', { exact: true })).toBeVisible();
  const channelFields = channelQueryUrl?.searchParams.get('fields')?.split(',') ?? [];
  expect(channelFields).toEqual(expect.arrayContaining(['urlScheme', 'browserRecipients', 'eventSubscriptions']));
  expect(channelFields).not.toContain('target');
  expect(channelFields).not.toContain('events');

  const addChannel = page.getByRole('button', { name: 'Add channel' });
  await addChannel.click();
  const dialog = page.getByRole('dialog', { name: 'Add notification channel' });
  await expect(dialog.locator(':focus')).toHaveCount(1);
  await dialog.getByRole('textbox', { name: /^Name\*?$/ }).fill('Operations');
  await expect(dialog.getByRole('button', { name: 'Save', exact: true })).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Next', exact: true }).click();
  await dialog.getByRole('textbox', { name: 'SMTP server' }).fill('smtp.example.com');
  await dialog.getByRole('textbox', { name: 'From address' }).fill('repovio@example.com');
  await dialog.getByRole('textbox', { name: 'Recipients' }).fill('operations@example.com');
  await dialog.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(dialog.getByRole('heading', { name: 'Events', exact: true })).toBeVisible();
  await expect(dialog.getByRole('checkbox', { name: 'Dependency alert opened' })).toBeVisible();
  await expect(dialog.getByRole('checkbox', { name: 'Secret scanning alert resolved' })).toBeVisible();
  await dialog.getByRole('checkbox', { name: 'Workflow failed' }).check();
  await expect(dialog.getByText('Repository filters')).toBeVisible();
  await expect(dialog.getByText('Workflow patterns')).toBeVisible();
  await dialog.getByRole('textbox', { name: 'Workflow patterns' }).fill('deploy-*');
  await dialog.getByRole('button', { name: 'Next', exact: true }).click();
  await dialog.getByRole('button', { name: 'Preview matching runs' }).click();
  await expect(dialog.getByText('1 recent workflow runs match this rule.')).toBeVisible();
  await expect(dialog.getByRole('link', { name: /tobiaswaelde\/repovio · deploy-production/ })).toHaveAttribute(
    'href',
    'https://example.com/run/1',
  );
  await page.keyboard.press('Escape');
  await expect(addChannel).toBeFocused();

  await page.locator('[data-page-toolbar]').getByRole('link', { name: 'Delivery history', exact: true }).click();
  await expect(notifications).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('[data-page-toolbar]')).toHaveCount(1);
  await expect(page.locator('[data-table-toolbar]')).toHaveCount(0);
  await expect(page.getByText('deploy-production')).toBeVisible();
  await expectTableHover(page, page.getByRole('table'));
  await page.getByRole('button', { name: 'View delivery details' }).click();
  await expect(page.getByRole('dialog', { name: 'Delivery details' })).toContainText(
    'Apprise notification delivery failed.',
  );
  await expect(page.getByRole('dialog', { name: 'Delivery details' })).toContainText('Vera Viewer (@viewer)');
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
            next: 'Weiter',
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
            next: 'Next',
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
    const next = dialog.getByRole('button', { name: labels.next, exact: true });
    await next.click();
    await dialog.getByRole('textbox', { name: labels.smtp }).fill('smtp.example.com');
    await dialog.getByRole('textbox', { name: labels.from }).fill('repovio@example.com');
    const recipients = dialog.getByRole('textbox', { name: labels.recipients });
    await recipients.fill('invalid-address');
    await recipients.press('Tab');
    await expect(recipients).toHaveAttribute('aria-invalid', 'true');
    await next.click();
    await expect(recipients).toHaveAttribute('aria-invalid', 'true');
    await expect(dialog.getByText(labels.error, { exact: true })).toBeVisible();
    await expect(dialog.getByRole('button', { name: labels.save, exact: true })).toHaveCount(0);
    await expect(dialog.getByRole('button', { name: labels.preview, exact: true })).toHaveCount(0);
    expect(createRequests).toBe(0);
    expect(previewRequests).toBe(0);
    await recipients.scrollIntoViewIfNeeded();
    await page.screenshot({
      path: testInfo.outputPath(`notification-validation-${locale}.png`),
      fullPage: true,
      animations: 'disabled',
    });

    await recipients.fill('operations@example.com');
    await next.click();
    const workflow = dialog.getByRole('checkbox', { name: labels.workflow, exact: true });
    await workflow.click();
    await expect(workflow).toBeChecked();
    await next.click();
    await dialog.getByRole('button', { name: labels.preview, exact: true }).click();
    await expect.poll(/** Reads completed preview requests. */ () => previewRequests).toBe(1);
    const save = dialog.getByRole('button', { name: labels.save, exact: true });
    await expect(save).toBeEnabled();
    await page.screenshot({
      path: testInfo.outputPath(`notification-review-${locale}.png`),
      fullPage: true,
      animations: 'disabled',
    });
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

test('shows private navbar history with independent error, retry, empty and safe-link states', /** Exercises global notifications without browser-push availability. */ async ({
  page,
}, testInfo) => {
  await mockShell(page);
  await page.route(
    '**/api/v1/notification-channels/query**',
    /** Supplies an empty administrative table. */ (route) =>
      route.fulfill({ json: { items: [], meta: { ...pageMeta, itemCount: 0 } } }),
  );
  let historyCalls = 0;
  await page.route(
    '**/api/v1/notifications/recent',
    /** Simulates a recoverable history failure followed by empty and successful responses. */ (route) => {
      historyCalls++;
      if (historyCalls === 1) return route.fulfill({ status: 503, json: { message: 'Temporarily unavailable' } });
      return route.fulfill({
        json: {
          items:
            historyCalls === 2
              ? []
              : [
                  {
                    id: 'personal-delivery',
                    createdAt: '2026-11-09T10:00:00.000Z',
                    kind: 'TEST',
                    eventType: null,
                    repository: null,
                    subjectTitle: 'Personal test notification',
                    subjectUrl: 'https://example.com/personal',
                    status: 'DELIVERED',
                  },
                ],
        },
      });
    },
  );
  await page.goto('/notifications');
  const trigger = page.locator('[data-navbar-notifications]');
  await expect(trigger).toBeVisible();
  await expect
    .poll(
      /** Checks DOM placement immediately before the current user's dropdown trigger. */ () =>
        trigger.evaluate(
          /** Inspects adjacent navbar controls without changing their state. */ (element) =>
            element.nextElementSibling?.getAttribute('aria-label'),
        ),
    )
    .toBe('admin');
  expect(historyCalls).toBe(0);
  await trigger.click();
  const popover = page.locator('section[aria-label="Notifications"]');
  await expect(popover.getByRole('alert')).toContainText('Notification data could not be loaded.');
  await expect(page.locator('[data-page-content]').getByText('Browser notifications', { exact: true })).toHaveCount(0);
  await popover.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(popover.getByText('No recent notifications.', { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await trigger.click();
  await expect(popover.getByRole('link', { name: 'Personal test notification', exact: true })).toHaveAttribute(
    'href',
    'https://example.com/personal',
  );
  await expect(popover.getByText(/Sent means accepted by a push service/)).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath('notification-navbar-desktop.png'),
    fullPage: true,
    animations: 'disabled',
  });
});

for (const locale of ['en', 'de'] as const) {
  test(`keeps delivery history in the channel toolbar (${locale})`, /** Preserves administrative history routes while removing its personal-popover shortcut. */ async ({
    page,
    baseURL,
  }, testInfo) => {
    await mockShell(page);
    await page.context().addCookies([{ name: 'repovio-locale', value: locale, url: baseURL! }]);
    const labels =
      locale === 'de'
        ? {
            notifications: 'Benachrichtigungen',
            navigation: 'Hauptnavigation',
            history: 'Zustellverlauf',
            error: 'Die Benachrichtigungsdaten konnten nicht geladen werden.',
          }
        : {
            notifications: 'Notifications',
            navigation: 'Primary navigation',
            history: 'Delivery history',
            error: 'Notification data could not be loaded.',
          };
    let failChannels = false;
    await page.route(
      '**/api/v1/notification-channels/query**',
      /** Keeps the history entry point available through channel loading failure. */ (route) =>
        failChannels
          ? route.fulfill({ status: 503, json: { message: 'Temporarily unavailable' } })
          : route.fulfill({ json: { items: [], meta: { ...pageMeta, itemCount: 0, pageCount: 0 } } }),
    );
    await page.route(
      '**/api/v1/notification-deliveries/query**',
      /** Supplies an authorized empty history page. */ (route) =>
        route.fulfill({ json: { items: [], meta: { ...pageMeta, itemCount: 0, pageCount: 0 } } }),
    );
    await page.goto('/notifications');
    const notifications = page
      .getByRole('navigation', { name: labels.navigation })
      .getByRole('link', { name: labels.notifications, exact: true });
    const toolbar = page.locator('[data-page-toolbar]');
    const history = toolbar.getByRole('link', { name: labels.history, exact: true });
    await expect(history).toBeVisible();
    await page.locator('[data-navbar-notifications]').click();
    const popover = page.getByRole('region', { name: labels.notifications, exact: true });
    await expect(popover).toBeVisible();
    await expect(popover.getByRole('link', { name: labels.history, exact: true })).toHaveCount(0);
    await page.screenshot({
      path: testInfo.outputPath(`notifications-personal-popover-${locale}.png`),
      animations: 'disabled',
    });
    await page.keyboard.press('Escape');
    await history.click();
    await expect(page).toHaveURL(/\/notifications\/history$/);
    await expect(notifications).toHaveAttribute('aria-current', 'page');
    await page.reload();
    await expect(notifications).toHaveAttribute('aria-current', 'page');
    await toolbar.getByRole('link', { name: labels.notifications, exact: true }).click();
    await expect(page).toHaveURL(/\/notifications$/);
    await history.click();
    await expect(page).toHaveURL(/\/notifications\/history$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/notifications$/);
    await expect(notifications).toHaveAttribute('aria-current', 'page');
    await page.goForward();
    await expect(page).toHaveURL(/\/notifications\/history$/);
    await expect(notifications).toHaveAttribute('aria-current', 'page');
    await page.goto('/notifications/history');
    await expect(notifications).toHaveAttribute('aria-current', 'page');
    failChannels = true;
    await toolbar.getByRole('link', { name: labels.notifications, exact: true }).click();
    await expect(page.getByText(labels.error, { exact: true })).toBeVisible();
    await expect(history).toBeVisible();
    await history.click();
    await expect(page).toHaveURL(/\/notifications\/history$/);
  });

  for (const role of ['VIEWER', 'MANAGER'] as const) {
    test(`keeps administrative history inaccessible to ${role} (${locale})`, /** Checks localized toolbar visibility and direct-route denial for non-administrators. */ async ({
      page,
      baseURL,
    }) => {
      await mockShell(page, role);
      await page.context().addCookies([{ name: 'repovio-locale', value: locale, url: baseURL! }]);
      const labels =
        locale === 'de'
          ? {
              notifications: 'Benachrichtigungen',
              navigation: 'Hauptnavigation',
              history: 'Zustellverlauf',
              add: 'Kanal hinzufügen',
            }
          : {
              notifications: 'Notifications',
              navigation: 'Primary navigation',
              history: 'Delivery history',
              add: 'Add channel',
            };
      await page.route(
        '**/api/v1/notification-channels/query**',
        /** Supplies a permitted empty channel listing. */ (route) =>
          route.fulfill({ json: { items: [], meta: { ...pageMeta, itemCount: 0 } } }),
      );
      let historyRequests = 0;
      await page.route(
        '**/api/v1/notification-deliveries/query**',
        /** Records any unauthorized history request so route-guard regressions fail explicitly. */ (route) => {
          historyRequests++;
          return route.fulfill({ status: 403, json: { message: 'Forbidden' } });
        },
      );
      await page.goto('/notifications');
      await expect(
        page
          .getByRole('navigation', { name: labels.navigation })
          .getByRole('link', { name: labels.notifications, exact: true }),
      ).toBeVisible();
      await expect(page.locator('[data-page-toolbar]')).toHaveCount(1);
      await expect(
        page.locator('[data-page-toolbar]').getByRole('link', { name: labels.history, exact: true }),
      ).toHaveCount(0);
      await expect(page.getByRole('button', { name: labels.add, exact: true })).toHaveCount(0);
      await page.locator('[data-navbar-notifications]').click();
      await expect(
        page
          .getByRole('region', { name: labels.notifications, exact: true })
          .getByRole('link', { name: labels.history, exact: true }),
      ).toHaveCount(0);
      await page.keyboard.press('Escape');
      await page.goto('/notifications/history');
      await expect(page).toHaveURL(/\/$/);
      expect(historyRequests).toBe(0);
    });
  }
}

for (const transport of [
  { type: 'EMAIL', label: 'Email' },
  { type: 'GOTIFY', label: 'Gotify' },
  { type: 'NTFY', label: 'ntfy' },
  { type: 'DISCORD', label: 'Discord' },
  { type: 'CUSTOM_APPRISE', label: 'Custom Apprise URL' },
  { type: 'BROWSER_PUSH', label: 'Browser push' },
]) {
  test(`creates ${transport.type} through all four channel steps`, /** Exercises transport-specific fields and one final save without a workflow preview. */ async ({
    page,
  }) => {
    await mockShell(page);
    await page.route(
      '**/api/v1/browser-push',
      /** Enables channel-type selection without requesting browser permission. */ (route) =>
        route.fulfill({ json: { available: true, publicKey: 'synthetic-public-key', subscriptionCount: 0 } }),
    );
    await page.route(
      '**/api/v1/notification-channels/query**',
      /** Supplies a refreshable empty channel table. */ (route) =>
        route.fulfill({ json: { items: [], meta: { ...pageMeta, itemCount: 0 } } }),
    );
    let saves = 0;
    await page.route(
      '**/api/v1/notification-channels',
      /** Checks the transport payload and completes the one requested save. */ async (route) => {
        if (route.request().method() !== 'POST') return route.fulfill({ json: [] });
        saves++;
        const body = route.request().postDataJSON();
        expect(body.type).toBe(transport.type);
        expect(body.eventSubscriptions).toEqual([
          { eventType: 'ISSUE_OPENED', repositoryIds: [], workflowPatterns: [] },
        ]);
        if (transport.type === 'BROWSER_PUSH')
          expect(body.browserRecipientUserIds).toEqual(['30b7b20a-159a-42c7-a283-0246848d5ab4']);
        await route.fulfill({
          json: {
            ...body,
            id: 'created-channel',
            createdAt: '2026-11-09T10:00:00.000Z',
            updatedAt: '2026-11-09T10:00:00.000Z',
            browserRecipients: [],
            canManage: true,
            requiresReconfiguration: false,
            urlScheme: transport.type,
          },
        });
      },
    );
    await page.goto('/notifications');
    await page.getByRole('button', { name: 'Add channel', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Add notification channel', exact: true });
    await dialog.getByRole('textbox', { name: /^Name\*?$/ }).fill(`Synthetic ${transport.type}`);
    if (transport.type !== 'EMAIL') {
      await dialog.getByRole('combobox', { name: /^Type/ }).click();
      await page.getByRole('option', { name: transport.label, exact: true }).click();
    }
    await dialog.getByRole('button', { name: 'Next', exact: true }).click();
    if (transport.type === 'EMAIL') {
      await dialog.getByRole('textbox', { name: 'SMTP server' }).fill('smtp.example.com');
      await dialog.getByRole('textbox', { name: 'From address' }).fill('repovio@example.com');
      await dialog.getByRole('textbox', { name: 'Recipients' }).fill('operations@example.com');
    } else if (transport.type === 'GOTIFY') {
      await dialog.getByRole('textbox', { name: 'Server URL' }).fill('https://gotify.example.com');
      await dialog.getByLabel('Application token', { exact: false }).fill('synthetic-secret-token');
    } else if (transport.type === 'NTFY') {
      await dialog.getByRole('textbox', { name: 'Topic' }).fill('synthetic-topic');
    } else if (transport.type === 'DISCORD') {
      await dialog
        .getByRole('textbox', { name: 'Webhook URL' })
        .fill('https://discord.com/api/webhooks/synthetic-id/synthetic-secret-token');
    } else if (transport.type === 'CUSTOM_APPRISE') {
      await dialog.getByLabel('Apprise URL', { exact: false }).fill('jsons://synthetic-secret-token@example.com/topic');
    } else {
      await dialog.getByRole('button', { name: 'Browser recipients', exact: false }).click();
      await page.getByRole('option', { name: 'Vera Viewer (@admin)', exact: true }).click();
      await page.keyboard.press('Escape');
    }
    await dialog.getByRole('button', { name: 'Next', exact: true }).click();
    await dialog.getByRole('checkbox', { name: 'New issue', exact: true }).check();
    await dialog.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(dialog.getByRole('paragraph').filter({ hasText: /Credentials are hidden/ })).toBeVisible();
    await expect(dialog).not.toContainText('synthetic-secret-token');
    await expect(dialog.getByRole('button', { name: 'Preview matching runs', exact: true })).toHaveCount(0);
    await dialog.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(dialog).not.toBeVisible();
    expect(saves).toBe(1);
  });
}

test('shows name-first recipient summaries and refreshed names', /** Verifies named and older recipient identities in the real channel table. */ async ({
  page,
}) => {
  await mockShell(page);
  let firstName = 'Vera';
  await page.route(
    '**/api/v1/notification-channels/query**',
    /** Supplies safe current-profile identities and an older username-only recipient. */ (route) =>
      route.fulfill({
        json: {
          items: [
            {
              id: 'named',
              name: 'Named recipients',
              type: 'BROWSER_PUSH',
              enabled: true,
              urlScheme: null,
              eventSubscriptions: [],
              canManage: true,
              requiresReconfiguration: false,
              createdAt: '2026-11-09T10:00:00Z',
              updatedAt: '2026-11-09T10:00:00Z',
              browserRecipients: [
                { id: 'viewer', username: 'viewer', firstName, lastName: 'Viewer' },
                { id: 'legacy', username: 'legacy' },
              ],
            },
          ],
          meta: pageMeta,
        },
      }),
  );
  await page.goto('/notifications');
  await expect(page.getByText('Vera Viewer (@viewer), legacy', { exact: true })).toBeVisible();
  firstName = 'Updated';
  await page.reload();
  await expect(page.getByText('Updated Viewer (@viewer), legacy', { exact: true })).toBeVisible();
});

for (const locale of ['en', 'de']) {
  test(`retains named recipient selections across remote pages (${locale})`, /** Verifies configured identities, remote full-name discovery, and narrow selected labels. */ async ({
    page,
  }) => {
    const de = locale === 'de';
    await mockShell(page);
    await page.addInitScript(
      /** Apply the requested locale before mounting. */ (locale) => {
        document.cookie = `repovio-locale=${locale}; path=/`;
      },
      locale,
    );
    await page.route(
      '**/api/v1/browser-push',
      /** Enable existing browser-channel editing without browser permission. */ (route) =>
        route.fulfill({ json: { available: true, publicKey: 'synthetic', subscriptionCount: 0 } }),
    );
    await page.route(
      '**/api/v1/notification-channels/query**',
      /** Supply a configured recipient absent from candidate pages. */ (route) =>
        route.fulfill({
          json: {
            items: [
              {
                id: 'named',
                name: 'Named recipients',
                type: 'BROWSER_PUSH',
                enabled: true,
                urlScheme: null,
                eventSubscriptions: [],
                canManage: true,
                requiresReconfiguration: false,
                createdAt: '2026-11-09T10:00:00Z',
                updatedAt: '2026-11-09T10:00:00Z',
                browserRecipients: [
                  {
                    id: '30b7b20a-159a-42c7-a283-0246848d5ab5',
                    username: 'existing',
                    firstName: 'Existing',
                    lastName: 'Recipient',
                  },
                ],
              },
            ],
            meta: pageMeta,
          },
        }),
    );
    const queries: URL[] = [];
    await page.route(
      '**/api/v1/users**',
      /** Resolve beyond-100 candidates only through paginated remote discovery. */ (route) => {
        const url = new URL(route.request().url());
        queries.push(url);
        expect(url.searchParams.get('perPage')).toBe('10');
        const where = JSON.parse(url.searchParams.get('where') ?? '{}');
        const searching = where.OR?.[0]?.username?.contains === 'Jörg Wälde';
        return route.fulfill({
          json: {
            items: searching
              ? [
                  {
                    id: '30b7b20a-159a-42c7-a283-0246848d5ab6',
                    username: 'beyond',
                    firstName: ' Jörg ',
                    lastName: ' Wälde ',
                  },
                ]
              : [{ id: 'fallback', username: 'legacy' }],
            meta: { pageCount: searching ? 1 : 11, itemCount: searching ? 1 : 101 },
          },
        });
      },
    );
    await page.goto('/notifications');
    await page.getByRole('button', { name: de ? 'Kanal bearbeiten' : 'Edit channel', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: de ? 'Weiter' : 'Next', exact: true }).click();
    const trigger = dialog.getByRole('button', { name: de ? 'Browser-Empfänger' : 'Browser recipients', exact: false });
    await expect(trigger).toContainText('Existing Recipient (@existing)');
    await trigger.click();
    await page.getByRole('combobox').last().fill('Jörg Wälde');
    await page.getByRole('option', { name: 'Jörg Wälde (@beyond)', exact: true }).click();
    await page.keyboard.press('Escape');
    await expect(trigger).toContainText('Existing Recipient (@existing)');
    await expect(trigger).toContainText('Jörg Wälde (@beyond)');
    await trigger.click();
    await page.getByRole('combobox').last().fill('');
    const nextResponse = page.waitForResponse(
      /** Wait for the actual later-page response before closing the menu. */ (response) =>
        response.url().includes('/users?') && new URL(response.url()).searchParams.get('page') === '2',
    );
    await page
      .getByRole('button', { name: de ? 'Nächste Seite' : 'Next page', exact: true })
      .last()
      .click();
    await nextResponse;
    await expect(page.getByText(de ? 'Seite 2' : 'Page 2', { exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(trigger).toContainText('Jörg Wälde (@beyond)');
    expect(
      queries.some(
        /** Confirm the selector actually requested a later page. */ (url) => url.searchParams.get('page') === '2',
      ),
    ).toBe(true);
    await page.screenshot({ path: `/tmp/repovio76-recipients-wide-${locale}.png` });
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(trigger).toContainText('Existing Recipient (@existing)');
    await page.screenshot({ path: `/tmp/repovio76-recipients-narrow-${locale}.png` });
  });
}

for (const locale of ['en', 'de'] as const) {
  test(`explains and retries server push availability (${locale})`, /** Verify global setup without device support or passive enrollment. */ async ({
    page,
    baseURL,
  }) => {
    await mockShell(page);
    await page.context().addCookies([{ name: 'repovio-locale', value: locale, url: baseURL! }]);
    await page.addInitScript(
      /** Simulate a browser without device push support. */ () => {
        Reflect.deleteProperty(window, 'PushManager');
      },
    );
    const labels =
      locale === 'de'
        ? {
            add: 'Kanal hinzufügen',
            loading: 'Browser-Push-Verfügbarkeit wird geprüft…',
            unconfigured: 'Konfiguriere Web Push (VAPID) auf dem Server, bevor du diesen Typ auswählst.',
            error: 'Die Browser-Push-Verfügbarkeit konnte nicht geprüft werden.',
            retry: 'Erneut versuchen',
            type: 'Typ',
          }
        : {
            add: 'Add channel',
            loading: 'Checking Browser push availability…',
            unconfigured: 'Configure Web Push (VAPID) on the server before selecting this type.',
            error: 'Could not check Browser push availability.',
            retry: 'Retry',
            type: 'Type',
          };
    let outcome: 'unconfigured' | 'pending' | 'available' = 'unconfigured';
    let release!: () => void;
    await page.route(
      '**/api/v1/browser-push',
      /** Control readiness independently of browser capability. */ async (route) => {
        if (outcome === 'pending') {
          await new Promise<void>(
            /** Hold the request until the checking state is inspected. */ (resolve) => {
              release = resolve;
            },
          );
          return route.fulfill({ status: 503, json: { message: 'Unavailable' } });
        }
        return route.fulfill({
          json: {
            available: outcome === 'available',
            publicKey: outcome === 'available' ? 'AQID' : null,
            subscriptionCount: 0,
          },
        });
      },
    );
    await page.goto('/notifications');
    await page.getByRole('button', { name: labels.add, exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText(labels.unconfigured, { exact: true })).toBeVisible();
    await dialog.getByRole('combobox', { name: new RegExp(`^${labels.type}`) }).click();
    await expect(
      page.getByRole('option', { name: locale === 'de' ? 'Browser-Push' : 'Browser push', exact: true }),
    ).toHaveAttribute('aria-disabled', 'true');
    await page.keyboard.press('Escape');
    outcome = 'pending';
    await dialog.getByRole('button', { name: labels.retry, exact: true }).click();
    await expect(dialog.getByText(labels.loading, { exact: true })).toBeVisible();
    await expect(dialog.getByRole('button', { name: labels.retry, exact: true })).toBeDisabled();
    release();
    await expect(dialog.getByText(labels.error, { exact: true })).toBeVisible();
    outcome = 'available';
    await dialog.getByRole('button', { name: labels.retry, exact: true }).click();
    await dialog.getByRole('combobox', { name: new RegExp(`^${labels.type}`) }).click();
    await expect(
      page.getByRole('option', { name: locale === 'de' ? 'Browser-Push' : 'Browser push', exact: true }),
    ).not.toHaveAttribute('aria-disabled', 'true');
    await page.getByRole('option', { name: locale === 'de' ? 'Browser-Push' : 'Browser push', exact: true }).click();
  });
}

test('validates controlled stepper clicks and keyboard navigation', /** Future steps cannot skip validation or erase draft fields. */ async ({
  page,
}) => {
  await mockShell(page);
  await page.goto('/notifications');
  await page.getByRole('button', { name: 'Add channel', exact: true }).click();
  const dialog = page.getByRole('dialog');
  const steps = dialog.locator('[data-channel-stepper] button');
  await expect(steps).toHaveCount(4);
  await expect(steps.nth(3)).toBeDisabled();
  await steps.nth(1).click();
  await expect(dialog.getByRole('textbox', { name: /^Name/ })).toBeVisible();
  await dialog.getByRole('textbox', { name: /^Name/ }).fill('Operations');
  await steps.nth(1).focus();
  await page.keyboard.press('Enter');
  await expect(dialog.getByRole('textbox', { name: 'SMTP server' })).toBeFocused();
  await steps.nth(2).click();
  await expect(dialog.getByRole('textbox', { name: 'SMTP server' })).toBeVisible();
  await steps.nth(0).click();
  await expect(dialog.getByRole('textbox', { name: /^Name/ })).toHaveValue('Operations');
});

for (const locale of ['en', 'de'] as const) {
  test(`keeps validated footer saves pending through write and refresh (${locale})`, /** Verify footer structure, request lifetime, dismissal, and refresh-only retry. */ async ({
    page,
    baseURL,
  }, testInfo) => {
    await mockShell(page);
    await page.context().addCookies([{ name: 'repovio-locale', value: locale, url: baseURL! }]);
    const labels =
      locale === 'de'
        ? {
            add: 'Kanal hinzufügen',
            next: 'Weiter',
            name: 'Name',
            type: 'Typ',
            topic: 'Topic',
            event: 'Neues Issue',
            save: 'Speichern',
            retry: 'Erneut versuchen',
          }
        : {
            add: 'Add channel',
            next: 'Next',
            name: 'Name',
            type: 'Type',
            topic: 'Topic',
            event: 'New issue',
            save: 'Save',
            retry: 'Retry',
          };
    let saves = 0;
    let refreshes = 0;
    let release!: () => void;
    await page.route(
      '**/api/v1/notification-channels/query**',
      /** Defer the dependent list refresh after persistence. */ async (route) => {
        if (saves > 0) {
          refreshes++;
          if (refreshes === 1) {
            await new Promise<void>(
              /** Hold refresh for pending-state checks. */ (resolve) => {
                release = resolve;
              },
            );
            return route.fulfill({ status: 503, json: { message: 'Refresh failed' } });
          }
        }
        return route.fulfill({ json: { items: [], meta: { ...pageMeta, itemCount: 0 } } });
      },
    );
    await page.route(
      '**/api/v1/notification-channels',
      /** Defer the write and count persistence requests. */ async (route) => {
        saves++;
        await new Promise<void>(
          /** Hold persistence for duplicate prevention checks. */ (resolve) => {
            release = resolve;
          },
        );
        return route.fulfill({ json: { ...route.request().postDataJSON(), id: 'created-channel' } });
      },
    );
    await page.goto('/notifications');
    await page.getByRole('button', { name: labels.add, exact: true }).click();
    const dialog = page.getByRole('dialog');
    const footer = dialog.locator('[data-slot="footer"]');
    await expect(footer.getByRole('button', { name: labels.next, exact: true })).toBeVisible();
    await expect(footer.locator('form')).toHaveCount(0);
    await dialog.getByRole('textbox', { name: new RegExp(`^${labels.name}`) }).fill('Operations');
    await dialog.getByRole('combobox', { name: new RegExp(`^${labels.type}`) }).click();
    await page.getByRole('option', { name: 'ntfy', exact: true }).click();
    await footer.getByRole('button', { name: labels.next, exact: true }).click();
    const topic = dialog.getByRole('textbox', { name: labels.topic });
    await topic.press('Enter');
    expect(saves).toBe(0);
    await topic.fill('operations');
    await footer.getByRole('button', { name: labels.next, exact: true }).click();
    await dialog.getByRole('checkbox', { name: labels.event, exact: true }).check();
    await footer.getByRole('button', { name: labels.next, exact: true }).click();
    for (const width of [390, 1102]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1134 });
      await expect(footer.getByRole('button', { name: labels.save, exact: true })).toBeInViewport();
      await page.screenshot({
        path: testInfo.outputPath(`notification-footer-${locale}-${width}.png`),
        animations: 'disabled',
      });
    }
    const save = footer.getByRole('button').last();
    await save.click();
    await expect.poll(/** Wait for the held persistence request. */ () => saves).toBe(1);
    await expect(save).toBeDisabled();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('[data-channel-stepper] button').first()).toBeDisabled();
    release();
    await expect.poll(/** Wait for the held list refresh. */ () => refreshes).toBe(1);
    await expect(save).toBeDisabled();
    release();
    const retry = footer.getByRole('button', { name: labels.retry, exact: true });
    await expect(retry).toBeEnabled();
    await retry.click();
    await expect(dialog).not.toBeVisible();
    expect(saves).toBe(1);
    expect(refreshes).toBe(2);
  });
}
