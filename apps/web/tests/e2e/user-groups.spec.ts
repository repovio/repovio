import { expect, test } from '@playwright/test';

for (const locale of ['en', 'de']) {
  test(`manages local groups, members, and repository grants (${locale})`, /** Exercises the complete administrative group workflow with synthetic API fixtures. */ async ({
    page,
  }) => {
    const de = locale === 'de';
    const group = {
      id: '00000000-0000-4000-8000-000000000001',
      name: 'Readers',
      createdAt: '2026-11-06T10:00:00.000Z',
      updatedAt: '2026-11-06T10:00:00.000Z',
    };
    const user = { id: '00000000-0000-4000-8000-000000000002', username: 'ada', role: 'VIEWER', authProvider: 'LOCAL' };
    let created = false;
    let member = false;
    let grant = false;
    let currentRole = 'VIEWER';
    await page.addInitScript(
      /** Seeds locale and the synthetic administrator session. */ (locale) => {
        localStorage.setItem('repovio.access-token', 'synthetic');
        document.cookie = `repovio-locale=${locale}; path=/`;
      },
      locale,
    );
    await page.route(
      '**/api/v1/**',
      /** Prevents fixture tests from reaching actual API or provider services. */ (route) =>
        route.fulfill({ json: { items: [], meta: { itemCount: 0, pageCount: 0 } } }),
    );
    await page.route(
      '**/api/v1/auth/me',
      /** Supplies a safe synthetic administrator. */ (route) =>
        route.fulfill({ json: { id: 'admin', username: 'admin', role: 'SYSTEM_ADMIN', authProvider: 'LOCAL' } }),
    );
    await page.route(
      '**/api/v1/settings',
      /** Supplies presentation settings. */ (route) => route.fulfill({ json: { dateTimeFormat: 'LOCALE_MEDIUM' } }),
    );
    await page.route(
      /\/api\/v1\/user-groups(?:\?.*)?$/,
      /** Persists the synthetic group and provides table and picker queries. */ async (route) => {
        if (route.request().method() === 'POST') {
          expect(route.request().postDataJSON()).toEqual({ name: 'Readers' });
          created = true;
          await route.fulfill({ status: 201, json: group });
        } else
          await route.fulfill({
            json: { items: created ? [group] : [], meta: { itemCount: created ? 1 : 0, pageCount: 1 } },
          });
      },
    );
    await page.route(
      `**/api/v1/user-groups/${group.id}`,
      /** Persists a renamed group or confirms deletion. */ async (route) => {
        if (route.request().method() === 'DELETE') {
          created = false;
          await route.fulfill({ status: 204 });
        } else {
          group.name = route.request().postDataJSON().name;
          await route.fulfill({ json: group });
        }
      },
    );
    await page.route(
      /\/api\/v1\/users(?:\?.*)?$/,
      /** Supplies a paginated account candidate. */ (route) =>
        route.fulfill({ json: { items: [user], meta: { itemCount: 1, pageCount: 1 } } }),
    );
    await page.route(
      new RegExp(`/api/v1/user-groups/${group.id}/members(?:\\?.*)?$`),
      /** Supplies current safe member metadata. */ (route) =>
        route.fulfill({ json: { items: member ? [user] : [], meta: { itemCount: member ? 1 : 0, pageCount: 1 } } }),
    );
    await page.route(
      `**/api/v1/user-groups/${group.id}/members/${user.id}`,
      /** Records idempotent member addition or removal. */ async (route) => {
        member = route.request().method() === 'PUT';
        await route.fulfill({ status: 204 });
      },
    );
    await page.route(
      '**/api/v1/repositories/repository-1',
      /** Supplies the repository detail. */ (route) =>
        route.fulfill({
          json: {
            id: 'repository-1',
            name: 'repovio',
            owner: 'fixture',
            url: 'https://example.com/repo',
            enabled: true,
            members: [],
            workflowRunCount: 0,
            workflowRunRetentionDays: null,
            issueRetentionDays: null,
            pullRequestRetentionDays: null,
            lastSyncAt: null,
            syncIntervalSeconds: 1800,
            syncState: {
              status: 'IDLE',
              scopes: [],
              attempt: 0,
              lastError: null,
              requestedAt: null,
              startedAt: null,
              progressPhase: null,
              progressCurrent: 0,
              progressTotal: null,
            },
          },
        }),
    );
    await page.route(
      '**/api/v1/repositories/webhook-configurations',
      /** Supplies no configured webhook secrets. */ (route) => route.fulfill({ json: [] }),
    );
    await page.route(
      '**/api/v1/repositories/repository-1/workflow-filters',
      /** Supplies no workflow filters. */ (route) => route.fulfill({ json: [] }),
    );
    await page.route(
      '**/api/v1/repositories/repository-1/memberships',
      /** Supplies no direct memberships. */ (route) => route.fulfill({ json: [] }),
    );
    await page.route(
      '**/api/v1/repositories/repository-1/group-memberships',
      /** Supplies inherited repository assignments. */ (route) =>
        route.fulfill({
          json: grant
            ? [{ id: 'grant', groupId: group.id, repositoryId: 'repository-1', role: currentRole, group }]
            : [],
        }),
    );
    await page.route(
      `**/api/v1/repositories/repository-1/group-memberships/${group.id}`,
      /** Persists or removes one inherited grant. */ async (route) => {
        grant = route.request().method() === 'PUT';
        if (grant) {
          currentRole = route.request().postDataJSON().role;
          await route.fulfill({
            json: { id: 'grant', groupId: group.id, repositoryId: 'repository-1', role: currentRole, group },
          });
        } else await route.fulfill({ status: 204 });
      },
    );
    await page.goto('/admin/user-groups');
    await page.getByRole('button', { name: de ? 'Neue Gruppe' : 'New group', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Name', { exact: true }).fill('Readers');
    await dialog.getByRole('button', { name: de ? 'Neue Gruppe' : 'New group', exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('cell', { name: 'Readers', exact: true })).toBeVisible();
    await page.getByRole('button', { name: de ? 'Gruppe umbenennen' : 'Rename group' }).click();
    await dialog.getByLabel('Name', { exact: true }).fill('Maintainers');
    await dialog.getByRole('button', { name: de ? 'Gruppe umbenennen' : 'Rename group', exact: true }).click();
    await expect(dialog).toBeHidden();
    await page.getByRole('button', { name: de ? 'Mitglieder verwalten' : 'Manage members' }).click();
    await dialog.getByRole('combobox').click();
    await page.getByRole('option', { name: 'ada' }).click();
    await dialog.getByRole('button', { name: de ? 'Mitglied hinzufügen' : 'Add member', exact: true }).click();
    await expect(dialog.getByText('ada', { exact: true })).toBeVisible();
    await dialog.getByRole('button', { name: de ? 'ada aus Gruppe entfernen' : 'Remove ada from group' }).click();
    await page
      .getByRole('dialog', { name: de ? 'Entfernen bestätigen' : 'Confirm removal' })
      .getByRole('button', { name: de ? 'Entfernen' : 'Remove', exact: true })
      .click();
    await expect(
      dialog.getByText(de ? 'Diese Gruppe hat keine Mitglieder.' : 'This group has no members.'),
    ).toBeVisible();
    await page.keyboard.press('Escape');
    await page.goto('/repositories/repository-1');
    const card = page
      .locator('[data-slot="root"]')
      .filter({ has: page.getByRole('heading', { name: de ? 'Gruppenzugriff' : 'Group access', exact: true }) })
      .last();
    await card.getByRole('combobox', { name: de ? 'Gruppe auswählen' : 'Select a group', exact: true }).click();
    await page.getByRole('option', { name: 'Maintainers' }).click();
    await card.getByRole('button', { name: de ? 'Gruppe zuweisen' : 'Assign group', exact: true }).click();
    await expect(card.getByText('Maintainers', { exact: true })).toBeVisible();
    await card
      .getByRole('combobox', { name: de ? 'Repository-Rolle für Maintainers' : 'Repository role for Maintainers' })
      .click();
    await page.getByRole('option', { name: de ? 'Repository-Verwaltung' : 'Repository manager', exact: true }).click();
    await expect
      .poll(/** Waits until the asynchronous role mutation is persisted. */ () => currentRole)
      .toBe('MANAGER');
    await card
      .getByRole('button', { name: de ? 'Zugriff für Maintainers entfernen' : 'Remove access for Maintainers' })
      .click();
    await page
      .getByRole('dialog', { name: de ? 'Entfernen bestätigen' : 'Confirm removal' })
      .getByRole('button', { name: de ? 'Entfernen' : 'Remove', exact: true })
      .click();
    await expect(
      card.getByText(
        de ? 'Keine Gruppen haben Zugriff auf dieses Repository.' : 'No groups have access to this repository.',
      ),
    ).toBeVisible();
    await page.goto('/admin/user-groups');
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByRole('button', { name: de ? 'Neue Gruppe' : 'New group', exact: true })).toBeVisible();
    await page.screenshot({ path: test.info().outputPath(`groups-${locale}-mobile.png`), fullPage: true });
    await page.getByRole('button', { name: de ? 'Löschen' : 'Delete', exact: true }).click();
    await page
      .getByRole('dialog', { name: de ? 'Entfernen bestätigen' : 'Confirm removal' })
      .getByRole('button', { name: de ? 'Entfernen' : 'Remove', exact: true })
      .click();
    await expect.poll(/** Waits for the confirmed group deletion. */ () => created).toBe(false);
  });
}
