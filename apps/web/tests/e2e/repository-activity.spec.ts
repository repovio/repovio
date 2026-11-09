import { expect, test } from '@playwright/test';
import { mockRepositoryApplication } from './fixtures/repository-detail';

test('Repository sections keep scoped requests, categories and history', /** Verify the real route and query boundaries. */ async ({
  page,
}) => {
  const { requests } = await mockRepositoryApplication(page);
  await page.goto('/repositories/repository-1');
  const navigation = page.getByRole('navigation', { name: 'Repository navigation', exact: true });
  await expect(navigation.getByRole('link')).toHaveCount(6);
  await navigation.getByRole('link', { name: 'Issues', exact: true }).click();
  await expect(page.locator('tbody')).toContainText('issues repository-1');
  await expect(page.locator('[data-page-shell]')).toHaveCount(1);
  expect(requests.some(/** Detect unwanted global summary loading. */ (url) => url.includes('issues/summary'))).toBe(
    false,
  );
  const request = requests
    .filter(/** Inspect actual scoped table requests. */ (url) => /^\/api\/v1\/issues\?/.test(url))
    .at(-1)!;
  expect(JSON.parse(new URL(request, 'http://test').searchParams.get('where')!)).toEqual(
    expect.objectContaining({ AND: expect.arrayContaining([{ repositoryId: 'repository-1' }]) }),
  );
  await page.goto('/repositories/repository-2/issues?page=99');
  await expect(page.locator('tbody')).toContainText('issues repository-2');
  await expect(page).not.toHaveURL(/page=99/);
  await page.goto('/repositories/repository-1/security-alerts?kind=CODE');
  await expect(page.locator('tbody')).toContainText('security-alerts repository-1');
  await page
    .getByRole('navigation', { name: 'Security categories' })
    .getByRole('link', { name: 'Secret scanning alerts', exact: true })
    .click();
  await expect(page).toHaveURL(/kind=SECRET/);
  await page.goBack();
  await expect(page).toHaveURL(/kind=CODE/);
  await page.reload();
  await expect(page).toHaveURL(/kind=CODE/);
});

test('Repository navigation remains reachable in narrow and wide layouts', /** Verify responsive navigation with synthetic screenshots. */ async ({
  page,
}, testInfo) => {
  await mockRepositoryApplication(page);
  await page.goto('/repositories/repository-1');
  for (const width of [375, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const navigation = page.getByRole('navigation', { name: 'Repository navigation', exact: true });
    const settings = navigation.getByRole('link', { name: 'Repository settings', exact: true });
    await settings.focus();
    await expect(settings).toBeFocused();
    expect(
      await page.evaluate(
        /** Measure actual document overflow. */ () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`repository-${width}.png`), fullPage: true });
  }
});

test('failed scoped refresh hides retained rows and permits retry', /** Distinguish an error from successful old results. */ async ({
  page,
}) => {
  await mockRepositoryApplication(page);
  let fail = false;
  await page.route(
    '**/api/v1/issues?*',
    /** Control only the table response while retaining the real client. */ async (route) => {
      if (fail) await route.fulfill({ status: 500 });
      else await route.fallback();
    },
  );
  await page.goto('/repositories/repository-1/issues');
  await expect(page.locator('tbody')).toContainText('issues repository-1');
  fail = true;
  await page.getByRole('button', { name: 'Refresh', exact: true }).click();
  await expect(page.getByText('Work items could not be loaded.')).toBeVisible();
  await expect(page.locator('tbody')).toHaveCount(0);
  fail = false;
  await page.getByRole('button', { name: 'Refresh', exact: true }).click();
  await expect(page.locator('tbody')).toContainText('issues repository-1');
});

for (const availability of ['UNAVAILABLE', 'UNSUPPORTED', 'UNKNOWN', 'ERROR', 'AVAILABLE']) {
  test(`security distinguishes ${availability} from no findings`, /** Exercise selected-Repository availability rather than global counts. */ async ({
    page,
  }) => {
    await mockRepositoryApplication(page);
    await page.route(
      '**/api/v1/security-alerts/filter-options',
      /** Return independent metadata for the two Repositories. */ async (route) => {
        if (availability === 'ERROR') {
          await route.fulfill({ status: 500 });
          return;
        }
        await route.fulfill({
          json: {
            repositories: [],
            ecosystems: [],
            packages: [],
            manifests: [],
            paths: [],
            rules: [],
            scanners: [],
            secretTypes: [],
            secretProviders: [],
            availability: [
              {
                repositoryId: 'repository-2',
                kind: 'DEPENDENCY',
                availability: 'UNAVAILABLE',
                reason: 'Other Repository',
                lastSuccessfulSyncAt: null,
              },
              ...(availability === 'UNKNOWN'
                ? []
                : [
                    {
                      repositoryId: 'repository-1',
                      kind: 'DEPENDENCY',
                      availability,
                      reason: 'Synthetic category state',
                      lastSuccessfulSyncAt: null,
                    },
                  ]),
            ],
          },
        });
      },
    );
    await page.route(
      '**/api/v1/security-alerts?*',
      /** Return an actual successful empty list independently from metadata. */ (route) =>
        route.fulfill({ json: { items: [], meta: { itemCount: 0, pageCount: 0, page: 1, perPage: 25 } } }),
    );
    await page.goto('/repositories/repository-1/security-alerts');
    await expect(page).toHaveURL(/kind=DEPENDENCY/);
    if (availability === 'UNKNOWN')
      await expect(
        page.getByText('Availability is unknown or synchronization has not completed.').first(),
      ).toBeVisible();
    else if (availability === 'ERROR')
      await expect(page.getByText('Security alerts could not be loaded.').first()).toBeVisible();
    else if (availability === 'AVAILABLE')
      await expect(page.getByText('No security alerts match the current filters.')).toBeVisible();
    else await expect(page.getByText('Unavailable data').first()).toBeVisible();
  });
}

test('search and stored filters cannot remove fixed Repository scope', /** Inspect actual serialized requests with maliciously contradictory persisted state. */ async ({
  page,
}) => {
  const { requests } = await mockRepositoryApplication(page);
  await page.addInitScript(
    /** Seed distinct global and scoped filter preferences. */ () => {
      const filter = {
        operator: 'AND',
        filters: [{ id: 'other-repo', field: 'repositoryId', type: 'enum', operator: 'in', value: ['repository-2'] }],
      };
      localStorage.setItem('table:issues:filtering', JSON.stringify(filter));
      localStorage.setItem('table:repository:repository-1:issues:filtering', JSON.stringify(filter));
    },
  );
  await page.route(
    '**/api/v1/issues?*',
    /** An AND conflict must produce no records at the server boundary. */ async (route) => {
      const url = new URL(route.request().url());
      requests.push(url.pathname + url.search);
      await route.fulfill({ json: { items: [], meta: { itemCount: 0, pageCount: 0, page: 1, perPage: 25 } } });
    },
  );
  await page.goto('/repositories/repository-1/issues?preset=stale&repositoryId=repository-2');
  await page.getByRole('textbox', { name: 'Search work items' }).fill('specific');
  await expect
    .poll(
      /** Wait for the real debounced request. */ () =>
        requests.filter(/** Keep table requests only. */ (value) => value.startsWith('/api/v1/issues?')).at(-1),
    )
    .toContain('specific');
  const request = requests
    .filter(/** Select the latest scoped query. */ (value) => value.startsWith('/api/v1/issues?'))
    .at(-1)!;
  const where = new URL(request, 'http://test').searchParams.get('where')!;
  expect(where).toContain('repository-1');
  expect(where).toContain('repository-2');
  const parsed = JSON.parse(where);
  expect(parsed.AND).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ AND: expect.arrayContaining([{ repositoryId: 'repository-1' }]) }),
    ]),
  );
});

test('repeated security category queries normalize to the default', /** Avoid accepting the last value of ambiguous category input. */ async ({
  page,
}) => {
  await mockRepositoryApplication(page);
  await page.goto('/repositories/repository-1/security-alerts?kind=CODE&kind=SECRET');
  await expect(page).toHaveURL(/\?kind=DEPENDENCY$/);
  await expect(page.locator('tbody')).toContainText('security-alerts repository-1');
});
