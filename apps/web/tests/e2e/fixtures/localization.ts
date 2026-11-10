import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import type { Page } from '@playwright/test';

import type english from '../../../i18n/locales/en.json';
import { appLocales } from '../../../shared/locales';

/** Registry-derived native labels and decorative local flags used by both selector suites. */
export const languageFlags = appLocales.map(
  /** Keep assertions synchronized with actual shipped metadata. */ ({ name, flagCountry }) =>
    [name, flagCountry] as const,
);

/** Read actual source messages while retaining the validated English message shape. */
export function localeMessages(code: string): typeof english {
  return JSON.parse(readFileSync(resolve(__dirname, `../../../i18n/locales/${code}.json`), 'utf8')) as typeof english;
}

/** Isolate localization journeys from live services while preserving role-dependent frontend behavior. */
export async function mockLocalization(
  page: Page,
  options: { initialized?: boolean; role?: 'SYSTEM_ADMIN' | 'MANAGER' | 'VIEWER' } = {},
): Promise<void> {
  if (options.role)
    await page.addInitScript(
      /** Set the same synthetic session consumed by the actual auth store. */ () =>
        localStorage.setItem('repovio.access-token', 'locale-test-token'),
    );
  await page.route(
    '**/api/v1/**',
    /** Return deterministic empty resources and real-shaped shell metadata. */ async (route) => {
      const path = new URL(route.request().url()).pathname;
      let json: unknown = {
        items: [],
        meta: { itemCount: 0, pageCount: 0, page: 1, perPage: 10, hasNextPage: false, hasPrevPage: false },
      };
      if (path.endsWith('/auth/setup-status')) json = { initialized: options.initialized ?? true };
      else if (path.endsWith('/auth/oidc/status')) json = { enabled: false };
      else if (path.endsWith('/auth/me'))
        json = { id: 'locale-user', username: 'locale-user', role: options.role ?? 'VIEWER' };
      else if (path.endsWith('/health')) json = { api: 'ok', database: 'ok', providers: [], status: 'ok' };
      else if (path.endsWith('/version/latest')) json = { latest: '2.3.1' };
      else if (path.endsWith('/provider-accounts/authentication-options')) json = { oauthProviderTypes: [] };
      else if (path.includes('/dashboard/'))
        json = path.includes('/summary')
          ? {
              awaitingApprovalCount: 0,
              completedCount: 0,
              medianDurationMs: null,
              queuedCount: 0,
              runningCount: 0,
              securityAlerts: { code: 0, critical: 0, dependency: 0, high: 0, secret: 0 },
              statuses: { cancelled: 0, failed: 0, skipped: 0, success: 0, unknown: 0 },
              successRate: 0,
              totalRunDurationMs: 0,
            }
          : [];
      else if (path.endsWith('/browser-push')) json = { available: false, publicKey: null, subscriptionCount: 0 };
      else if (path.endsWith('/security-alerts/filter-options'))
        json = {
          availability: [],
          ecosystems: [],
          manifests: [],
          packages: [],
          paths: [],
          repositories: [],
          rules: [],
          scanners: [],
          secretProviders: [],
          secretTypes: [],
        };
      else if (path.endsWith('/security-alerts/summary'))
        json = {
          open: { CODE: 0, DEPENDENCY: 0, SECRET: 0 },
          severity: { CRITICAL: 0, HIGH: 0, INFO: 0, LOW: 0, MEDIUM: 0, UNKNOWN: 0 },
          unavailableRepositories: 0,
        };
      else if (path.endsWith('/settings')) json = { dateTimeFormat: 'LOCALE_MEDIUM' };
      await route.fulfill({ json });
    },
  );
}

/** Read the installed component locale contract without requiring its ESM-only export in Playwright's CommonJS worker. */
export function uiCloseLabel(code: string): string {
  const entry = appLocales.find(/** Locate the exact component locale identifier. */ (entry) => entry.code === code)!;
  const source = readFileSync(
    resolve(__dirname, `../../../node_modules/@nuxt/ui/dist/runtime/locale/${entry.ui}.js`),
    'utf8',
  );
  const close = source.match(/modal:\s*\{\s*close:\s*("[^"]*")/);
  if (!close) throw new Error(`Missing modal close message for ${code}`);
  const literal = close[1]!.replace(
    /\\x([0-9a-f]{2})/gi,
    /** Decode JavaScript hexadecimal escapes before parsing the otherwise JSON-compatible literal. */
    (_match, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)),
  );
  return JSON.parse(literal) as string;
}

/** Intercept a real locale module or JSON response by its messages, independent of dev/production filenames. */
export async function interceptLocaleAsset(
  page: Page,
  marker: string,
): Promise<{
  started: Promise<void>;
  release: () => void;
  reject: () => void;
}> {
  let notify!: () => void;
  let settle!: (failed: boolean) => void;
  let intercepted = false;
  const started = new Promise<void>(
    /** Signal the actual target message download. */ (resolve) => {
      notify = resolve;
    },
  );
  const released = new Promise<boolean>(
    /** Expose deterministic success/failure without arbitrary timers. */ (resolve) => {
      settle = resolve;
    },
  );
  await page.route(
    /(?:\.js|\.json)(?:\?|$)/,
    /** Preserve unrelated resources and hold only the selected language's actual payload. */ async (route) => {
      const response = await route.fetch();
      if (intercepted || !(await response.text()).includes(marker)) {
        await route.fulfill({ response });
        return;
      }
      intercepted = true;
      notify();
      if (await released) await route.abort('failed');
      else await route.fulfill({ response });
    },
  );
  return {
    started,
    /** Let the original locale response complete. */ release: () => settle(false),
    /** Reject the real message download. */ reject: () => settle(true),
  };
}
