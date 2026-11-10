import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, ref, type Ref } from 'vue';

import { appLocales } from '../../../shared/locales';
import { useLocales } from './locales';

const locale = ref('en');
const toast = { add: vi.fn() };
const messages: Record<string, Record<string, unknown>> = {};
const states = new Map<string, Ref<boolean>>();
const setLocale = vi.fn();

beforeEach(
  /** Provide the real composable with isolated Vue refs and supported Nuxt boundaries. */ () => {
    locale.value = 'en';
    states.clear();
    toast.add.mockReset();
    for (const entry of appLocales) messages[entry.code] = { auth: { signIn: entry.name } };
    setLocale.mockReset().mockImplementation(
      /** Model successful library state activation. */ async (code: string) => {
        locale.value = code;
      },
    );
    vi.stubGlobal('computed', computed);
    vi.stubGlobal('useToast', /** Capture user-facing failure announcements. */ () => toast);
    vi.stubGlobal(
      'useState',
      /** Preserve shared busy state across composable consumers. */ (key: string, initialize: () => boolean) => {
        if (!states.has(key)) states.set(key, ref(initialize()));
        return states.get(key)!;
      },
    );
    vi.stubGlobal(
      'useI18n',
      /** Expose only the supported message and locale APIs used by this composable. */ () => ({
        locale,
        locales: ref(appLocales),
        setLocale,
        setLocaleCookie: vi.fn(),
        getLocaleMessage: /** Return the actual target catalog state, including failed empty loads. */ (code: string) =>
          messages[code] ?? {},
        t: /** Keep the error contract distinguishable from a raw key. */ (key: string) =>
          key === 'layout.localeChangeError' ? 'The language could not be changed. Try again.' : key,
      }),
    );
  },
);

afterEach(/** Restore global Nuxt boundaries for unrelated unit suites. */ () => vi.unstubAllGlobals());

describe('useLocales selection transaction', /** Verify loading lifetime, deduplication, and library failure recovery. */ () => {
  it('keeps every initiating control busy until the complete locale operation settles', /** Delay the actual async setter and observe all consumers. */ async () => {
    let release!: () => void;
    const pending = new Promise<void>(
      /** Expose a deterministic release boundary without timers. */ (resolve) => {
        release = resolve;
      },
    );
    setLocale.mockImplementation(
      /** Keep activation pending until the simulated download finishes. */ async (code: string) => {
        await pending;
        locale.value = code;
      },
    );
    const first = useLocales();
    const second = useLocales();
    const operation = first.handleSelectLocale('ar');
    expect(first.isChangingLocale.value).toBe(true);
    expect(second.isChangingLocale.value).toBe(true);
    expect(
      second.dropdownMenuItems.value.every(/** Check that a second selection cannot start. */ (item) => item.disabled),
    ).toBe(true);
    await second.handleSelectLocale('de');
    expect(setLocale).toHaveBeenCalledTimes(1);
    release();
    await operation;
    expect(locale.value).toBe('ar');
    expect(first.isChangingLocale.value).toBe(false);
    expect(toast.add).not.toHaveBeenCalled();
  });

  it('recovers the original selection when Nuxt swallows a failed catalog download', /** Prevent English fallback from being reported as a successful new language. */ async () => {
    messages.ar = {};
    const controls = useLocales();
    await controls.handleSelectLocale('ar');
    expect(
      setLocale.mock.calls.map(/** Inspect activation and rollback through the public setter. */ (call) => call[0]),
    ).toEqual(['ar', 'en']);
    expect(locale.value).toBe('en');
    expect(controls.isChangingLocale.value).toBe(false);
    const failure = toast.add.mock.calls[0]![0];
    expect(failure.color).toBe('error');
    const message = failure.title();
    expect(message.props.role).toBe('alert');
    expect(message.children).toBe('The language could not be changed. Try again.');
  });

  it('announces rejected setters and releases loading without unhandled rejection', /** Exercise a real rejected promise rather than only empty message state. */ async () => {
    setLocale.mockRejectedValueOnce(new Error('Network unavailable'));
    const controls = useLocales();
    await expect(controls.handleSelectLocale('ja')).resolves.toBeUndefined();
    expect(locale.value).toBe('en');
    expect(controls.isChangingLocale.value).toBe(false);
    expect(toast.add).toHaveBeenCalledOnce();
  });
});
