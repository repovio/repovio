import { expect, test } from '@playwright/test';

const candidates = [
  { id: 'full', username: 'viewer', firstName: 'Vera', lastName: 'Viewer', label: 'Vera Viewer (@viewer)' },
  { id: 'duplicate', username: 'other', firstName: 'Vera', lastName: 'Viewer', label: 'Vera Viewer (@other)' },
  { id: 'first', username: 'first', firstName: 'Vera', lastName: null, label: 'Vera (@first)' },
  { id: 'last', username: 'last', firstName: null, lastName: 'Viewer', label: 'Viewer (@last)' },
  { id: 'missing', username: 'legacy', label: 'legacy' },
  { id: 'blank', username: 'blank', firstName: ' ', lastName: '\t', label: 'blank' },
  { id: 'unicode', username: 'unicode', firstName: ' Jörg ', lastName: ' Wälde ', label: 'Jörg Wälde (@unicode)' },
  { id: 'equal', username: 'equal', firstName: 'equal', lastName: null, label: 'equal' },
  {
    id: 'long',
    username: 'long',
    firstName: 'Alexandria Catherine',
    lastName: 'Montgomery-Wälde',
    label: 'Alexandria Catherine Montgomery-Wälde (@long)',
  },
];

for (const locale of ['en', 'de']) {
  test(`User identity fallback and stale discovery (${locale})`, /** Exercises shared names through real localized User selection controls. */ async ({
    page,
  }) => {
    const de = locale === 'de';
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(
      /** Initialize only synthetic session and locale state. */ (locale) => {
        localStorage.setItem('repovio.access-token', 'synthetic');
        document.cookie = `repovio-locale=${locale}; path=/`;
      },
      locale,
    );
    const group = {
      id: 'group',
      name: 'Readers',
      createdAt: '2026-11-09T10:00:00Z',
      updatedAt: '2026-11-09T10:00:00Z',
    };
    await page.route(
      '**/api/v1/**',
      /** Isolate every shell request from live services. */ (route) =>
        route.fulfill({ json: { items: [], meta: { itemCount: 0, pageCount: 1 } } }),
    );
    await page.route(
      '**/api/v1/auth/me',
      /** Supply a named OIDC administrator. */ (route) =>
        route.fulfill({
          json: {
            id: 'admin',
            username: 'admin',
            firstName: 'Admin',
            lastName: 'Person',
            role: 'SYSTEM_ADMIN',
            authProvider: 'OIDC',
          },
        }),
    );
    await page.route(
      '**/api/v1/settings',
      /** Supply stable presentation preferences. */ (route) =>
        route.fulfill({ json: { dateTimeFormat: 'LOCALE_MEDIUM' } }),
    );
    await page.route(
      /\/api\/v1\/user-groups(?:\?.*)?$/,
      /** Supply one existing local group. */ (route) =>
        route.fulfill({ json: { items: [group], meta: { itemCount: 1, pageCount: 1 } } }),
    );
    let release!: () => void;
    const staleGate = new Promise<void>(
      /** Hold the older search until the newer response has rendered. */ (resolve) => {
        release = resolve;
      },
    );
    await page.route(
      /\/api\/v1\/users(?:\?.*)?$/,
      /** Return safe synthetic identity cases and controlled search ordering. */ async (route) => {
        const where = JSON.parse(new URL(route.request().url()).searchParams.get('where') ?? '{}');
        const query = where.OR?.[0]?.username?.contains;
        if (query === 'old') await staleGate;
        const items = query === 'new' ? [candidates[6]] : candidates;
        await route.fulfill({
          json: {
            items: items.map(
              /** Omit test-only labels from transport. */ (user) => ({
                id: user.id,
                username: user.username,
                firstName: 'firstName' in user ? user.firstName : null,
                lastName: 'lastName' in user ? user.lastName : null,
                role: 'VIEWER',
                authProvider: 'LOCAL',
              }),
            ),
            meta: { itemCount: items.length, pageCount: 1 },
          },
        });
      },
    );
    await page.goto('/admin/user-groups');
    await page.getByRole('button', { name: de ? 'Mitglieder verwalten' : 'Manage members' }).click();
    const dialog = page.getByRole('dialog');
    const picker = dialog.getByRole('combobox');
    for (const user of candidates) {
      await picker.click();
      await page.getByRole('option', { name: user.label, exact: true }).click();
      await expect(picker).toContainText(user.label);
    }
    await page.screenshot({ path: `/tmp/repovio76-group-${locale}.png` });
    const search = dialog.getByRole('textbox', { name: de ? 'Benutzer suchen' : 'Search users' });
    const oldRequest = page.waitForRequest(
      /** Observe the intentionally delayed search. */ (request) =>
        request.url().includes('/users?') && request.url().includes('old'),
    );
    await search.fill('old');
    await oldRequest;
    const newResponse = page.waitForResponse(
      /** Wait for the current result before releasing the older response. */ (response) =>
        response.url().includes('/users?') && response.url().includes('new'),
    );
    await search.fill('new');
    await newResponse;
    const staleResponse = page.waitForResponse(
      /** Confirm the older result actually reaches the browser. */ (response) =>
        response.url().includes('/users?') && response.url().includes('old'),
    );
    release();
    await staleResponse;
    await picker.click();
    await expect(page.getByRole('option', { name: 'Jörg Wälde (@unicode)', exact: true })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Vera Viewer (@viewer)', exact: true })).toHaveCount(0);
  });
}
