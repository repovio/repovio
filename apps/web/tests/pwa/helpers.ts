import { expect, type Page } from '@playwright/test';

/** Synthetic identities used only by browser fixtures; these are never real credentials. */
export const fixtureUsers = {
  alice: { id: 'pwa-alice', username: 'alice', role: 'VIEWER', firstName: 'Alice', lastName: 'Fixture' },
  bob: { id: 'pwa-bob', username: 'bob', role: 'VIEWER', firstName: 'Bob', lastName: 'Fixture' },
} as const;

/** Empty paginated response accepted by application list views. */
export const emptyPage = {
  items: [],
  meta: { itemCount: 0, page: 1, pageCount: 0, perPage: 10, hasNextPage: false, hasPrevPage: false },
};

/** Serve deterministic application API responses; authorization here is a mock, not a server security test. */
export async function mockApplication(page: Page): Promise<void> {
  await page.route(
    '**/api/v1/**',
    /** Return synthetic sessions and explicitly restricted resources. */ async (route) => {
      const request = route.request();
      const path = new URL(request.url()).pathname;
      const identity = request.headers().authorization === 'Bearer fixture-alice' ? 'alice' : 'bob';
      if (path.endsWith('/auth/setup-status')) return route.fulfill({ json: { initialized: true } });
      if (path.endsWith('/auth/oidc/config')) return route.fulfill({ json: { enabled: false } });
      if (path.endsWith('/auth/signin')) {
        const username = request.postDataJSON().username as keyof typeof fixtureUsers;
        return route.fulfill({ json: { accessToken: `fixture-${username}`, user: fixtureUsers[username] } });
      }
      if (path.endsWith('/auth/me')) return route.fulfill({ json: fixtureUsers[identity] });
      if (path.endsWith('/auth/signout')) return route.fulfill({ status: 204 });
      if (path.endsWith('/settings')) return route.fulfill({ json: { dateTimeFormat: 'LOCALE_MEDIUM' } });
      if (path.endsWith('/repositories/alice-only')) {
        return route.fulfill({
          status: identity === 'alice' ? 200 : 403,
          json:
            identity === 'alice'
              ? { id: 'alice-only', name: 'Private Alice fixture', owner: 'fixture' }
              : { message: 'Forbidden' },
        });
      }
      return route.fulfill({ json: emptyPage });
    },
  );
}

/** Sign in through the actual local sign-in form using a synthetic fixture account. */
export async function signIn(page: Page, username: 'alice' | 'bob'): Promise<void> {
  await page.goto('/auth/signin');
  await page.getByLabel('Username', { exact: true }).fill(username);
  await page.getByLabel('Password', { exact: true }).fill('fixture-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL('/');
}

/** Wait for activation and then reload so subsequent observations come from a controlled document. */
export async function controlPage(page: Page): Promise<void> {
  await page.evaluate(
    /** Wait for the browser registration to have an active worker. */ async () => navigator.serviceWorker.ready,
  );
  await page.reload();
  await expect
    .poll(
      /** Observe controller activation without arbitrary delays. */ () =>
        page.evaluate(/** Read the active controller state. */ () => navigator.serviceWorker.controller?.state),
    )
    .toBe('activated');
}

/** Enumerate every worker cache so exclusions are proven across all cache names. */
export async function cachedUrls(page: Page): Promise<string[]> {
  return page.evaluate(
    /** Read only request URLs; never serialize tokens or response payloads. */ async () => {
      const urls: string[] = [];
      for (const name of await caches.keys()) {
        for (const request of await (await caches.open(name)).keys()) urls.push(request.url);
      }
      return urls;
    },
  );
}

/** Assert public static caching exists while every protected/dynamic URL remains excluded. */
export async function expectPublicCachesOnly(page: Page): Promise<void> {
  const urls = await cachedUrls(page);
  expect(urls.length).toBeGreaterThan(0);
  for (const url of urls)
    expect(new URL(url).pathname).not.toMatch(
      /\/api(?:\/|$)|\/auth(?:\/|$)|\/socket\.io(?:\/|$)|\/manifest\.webmanifest$/,
    );
}
