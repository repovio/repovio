import { expect, test, type Page } from '@playwright/test';

const admin = {
  createdAt: '2026-09-12T08:00:00.000Z',
  firstName: 'Ada',
  id: 'playwright-admin',
  lastName: 'Lovelace',
  role: 'SYSTEM_ADMIN',
  updatedAt: '2026-09-12T08:00:00.000Z',
  username: 'playwright',
} as const;

/** Mock the authenticated shell used by MCP token management scenarios. */
async function mockShell(page: Page): Promise<void> {
  const emptyPage = {
    items: [],
    meta: { hasNextPage: false, hasPrevPage: false, itemCount: 0, page: 1, pageCount: 0, perPage: 25 },
  };
  await page.addInitScript(
    /** Initializes browser-side authentication and preferences before page scripts run. */ () =>
      window.localStorage.setItem('repovio.access-token', 'playwright-access-token'),
  );
  await page.route(
    '**/api/v1/auth/me',
    /** Supplies the mocked response for `/api/v1/auth/me`. */ (route) => route.fulfill({ json: admin }),
  );
  await page.route(
    '**/api/v1/health',
    /** Supplies the mocked response for `/api/v1/health`. */ (route) =>
      route.fulfill({ json: { api: 'ok', database: 'ok', providers: [], status: 'ok' } }),
  );
  await page.route(
    '**/api/v1/settings',
    /** Supplies the mocked response for `/api/v1/settings`. */ (route) =>
      route.fulfill({ json: { dateTimeFormat: 'LOCALE_MEDIUM', workflowRunRetentionDays: 90 } }),
  );
  await page.route(
    '**/api/v1/dashboard/awaiting-approval',
    /** Supplies the mocked response for `/api/v1/dashboard/awaiting-approval`. */ (route) =>
      route.fulfill({ json: [] }),
  );
  await page.route(
    /\/api\/v1\/(?:provider-accounts|repositories|workflow-runs)(?:\?.*)?$/,
    /** Supplies the mocked response for the intercepted request. */ (route) => route.fulfill({ json: emptyPage }),
  );
  await page.route(
    /\/api\/v1\/workflow-runs\/needs-attention(?:\?.*)?$/,
    /** Supplies the mocked response for the intercepted request. */ (route) => route.fulfill({ json: emptyPage }),
  );
}

test('creates, reveals once, lists, and revokes a personal MCP token', /** Verifies creates, reveals once, lists, and revokes a personal MCP token. */ async ({
  page,
}, testInfo) => {
  await mockShell(page);
  let tokens: unknown[] = [];
  let releaseCreation: (() => void) | undefined;
  const creationGate = new Promise<void>(
    /** Retains the response resolver so this test controls request completion. */ (resolve) => {
      releaseCreation = resolve;
    },
  );
  await page.route(
    /\/api\/v1\/mcp-tokens(?:\/[^/?]+)?(?:\?.*)?$/,
    /** Supplies the mocked response for the intercepted request. */ async (route) => {
      if (route.request().method() === 'POST') {
        await creationGate;
        const body = route.request().postDataJSON() as { expiresAt: string | null; name: string };
        const created = {
          createdAt: '2026-09-12T10:00:00.000Z',
          expiresAt: body.expiresAt,
          id: 'token-id',
          lastUsedAt: null,
          name: body.name,
          revokedAt: null,
          status: 'ACTIVE',
          token: 'repovio_mcp_one_time_secret',
          tokenPrefix: 'repovio_mcp_one_time',
          userId: admin.id,
        };
        tokens = [{ ...created, token: undefined }];
        return route.fulfill({ json: created });
      }
      if (route.request().method() === 'DELETE') {
        tokens = tokens.map(
          /** Projects each entry using `({ ...(token as object), revokedAt: new Date().toISOString(), status: 'REVOKED', })`. */ (
            token,
          ) => ({
            ...(token as object),
            revokedAt: new Date().toISOString(),
            status: 'REVOKED',
          }),
        );
        return route.fulfill({ status: 204 });
      }
      await route.fulfill({ json: tokens });
    },
  );

  await page.goto('/admin/settings/mcp');
  await expect(page.getByRole('heading', { name: 'MCP access' })).toBeVisible();
  await page.getByRole('button', { name: 'Create token' }).click();
  await page.getByRole('textbox', { name: 'Token name' }).fill('VS Code laptop');
  await page.getByLabel('Expiration').fill('2026-10-12T10:00');
  const createButton = page.getByRole('dialog').getByRole('button', { name: 'Create token' });
  await createButton.click();
  await expect(createButton).toBeDisabled();
  releaseCreation?.();
  await expect(page.getByRole('textbox', { name: 'Bearer token' })).toHaveValue('repovio_mcp_one_time_secret');
  await expect(page.getByText('Copy this token now. It will not be shown again.')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('mcp-token-created.png'), fullPage: true });
  await page.getByRole('button', { name: 'Done' }).click();
  await expect(page.getByText('VS Code laptop')).toBeVisible();
  await expect(page.getByText(/Expires /)).toBeVisible();

  await page.getByRole('button', { name: 'Revoke' }).click();
  await page
    .getByRole('dialog', { name: 'Confirm removal' })
    .getByRole('button', { name: 'Remove', exact: true })
    .click();
  await expect(page.getByText('Revoked', { exact: true })).toBeVisible();
});

test('allows an administrator to inspect and revoke user token metadata', /** Verifies allows an administrator to inspect and revoke user token metadata. */ async ({
  page,
}) => {
  await mockShell(page);
  let revoked = false;
  await page.route(
    /\/api\/v1\/users(?:\?.*)?$/,
    /** Supplies the mocked response for the intercepted request. */ (route) =>
      route.fulfill({
        json: {
          items: [admin],
          meta: { hasNextPage: false, hasPrevPage: false, itemCount: 1, page: 1, pageCount: 1, perPage: 10 },
        },
      }),
  );
  await page.route(
    /\/api\/v1\/mcp-tokens(?:\/token-id)?(?:\?.*)?$/,
    /** Supplies the mocked response for the intercepted request. */ async (route) => {
      if (route.request().method() === 'DELETE') {
        revoked = true;
        return route.fulfill({ status: 204 });
      }
      expect(route.request().url()).toContain(`userId=${admin.id}`);
      await route.fulfill({
        json: [
          {
            createdAt: '2026-09-12T10:00:00.000Z',
            expiresAt: null,
            id: 'token-id',
            lastUsedAt: null,
            name: 'Automation',
            revokedAt: revoked ? '2026-09-12T11:00:00.000Z' : null,
            status: revoked ? 'REVOKED' : 'ACTIVE',
            tokenPrefix: 'repovio_mcp_automat',
            userId: admin.id,
          },
        ],
      });
    },
  );

  await page.goto('/admin/users');
  await page.getByRole('button', { name: 'Manage MCP tokens' }).click();
  await expect(page.getByRole('heading', { name: 'MCP access tokens' })).toBeVisible();
  await expect(page.getByRole('dialog')).toContainText('Ada Lovelace (@playwright)');
  await expect(page.getByText('Automation')).toBeVisible();
  await expect(page.getByText('Active', { exact: true })).toBeVisible();
  await expect(page.getByText('Never used', { exact: false })).toBeVisible();
  await expect(page.getByText('Never expires', { exact: false })).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Revoke' }).click();
  await page
    .getByRole('dialog', { name: 'Confirm removal' })
    .getByRole('button', { name: 'Remove', exact: true })
    .click();
  await expect
    .poll(
      /** Evaluates `page.getByRole('dialog').getByRole('button', { name: 'Revoke' }).isDisabled()` when expect.poll invokes this callback. */ () =>
        page.getByRole('dialog').getByRole('button', { name: 'Revoke' }).isDisabled(),
    )
    .toBe(true);
});

for (const locale of ['en', 'de'] as const) {
  test(`validates the MCP token form before creating a token (${locale})`, /** Verifies validates the MCP token form before creating a token ([locale]). */ async ({
    page,
    baseURL,
  }, testInfo) => {
    await mockShell(page);
    await page.context().addCookies([{ name: 'repovio-locale', value: locale, url: baseURL! }]);
    if (locale === 'de') await page.setViewportSize({ height: 844, width: 390 });
    const labels =
      locale === 'de'
        ? {
            create: 'Token erstellen',
            error: 'Gib einen gültigen Wert ein.',
            name: 'Token-Name',
            token: 'Bearer-Token',
          }
        : { create: 'Create token', error: 'Enter a valid value.', name: 'Token name', token: 'Bearer token' };
    let createRequests = 0;
    let releaseCreation: (() => void) | undefined;
    const creationGate = new Promise<void>(
      /** Retains the response resolver so this test controls request completion. */ (resolve) => {
        releaseCreation = resolve;
      },
    );
    await page.route(
      /\/api\/v1\/mcp-tokens(?:\?.*)?$/,
      /** Supplies the mocked response for the intercepted request. */ async (route) => {
        if (route.request().method() !== 'POST') return route.fulfill({ json: [] });
        createRequests++;
        expect(route.request().postDataJSON()).toEqual({ expiresAt: null, name: 'Browser client' });
        await creationGate;
        await route.fulfill({
          json: {
            createdAt: '2026-11-05T10:00:00.000Z',
            expiresAt: null,
            id: 'validated-token',
            lastUsedAt: null,
            name: 'Browser client',
            revokedAt: null,
            status: 'ACTIVE',
            token: 'repovio_mcp_validated_browser_secret',
            tokenPrefix: 'repovio_mcp_validated',
            userId: admin.id,
          },
        });
      },
    );

    const ready = page.waitForResponse(
      /** Evaluates `response.url().includes('/api/v1/mcp-tokens') && response.request().method() === 'GET'` when page.waitForResponse invokes this callback. */
      (response) => response.url().includes('/api/v1/mcp-tokens') && response.request().method() === 'GET',
    );
    await page.goto('/admin/settings/mcp');
    await ready;
    await page.getByRole('button', { name: labels.create, exact: true }).click();
    const dialog = page.getByRole('dialog');
    const name = dialog.getByRole('textbox', { name: labels.name });
    await name.fill('   ');
    await name.press('Tab');
    await expect(dialog.getByText(labels.error, { exact: true })).toBeVisible();
    await expect(name).toHaveAttribute('aria-invalid', 'true');
    expect(createRequests).toBe(0);
    const create = dialog.getByRole('button', { name: labels.create, exact: true });
    await expect(create).toBeDisabled();
    await page.screenshot({ path: testInfo.outputPath(`mcp-validation-${locale}.png`), fullPage: true });

    await name.fill('  Browser client  ');
    await create.click();
    await expect
      .poll(/** Evaluates `createRequests` when expect.poll invokes this callback. */ () => createRequests)
      .toBe(1);
    await expect(create).toBeDisabled();
    await expect(dialog).toBeVisible();
    releaseCreation?.();
    await expect(dialog.getByRole('textbox', { name: labels.token, exact: true })).toHaveValue(
      'repovio_mcp_validated_browser_secret',
    );
  });
}
