import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { appLocales, getAppLocale } from '../../shared/locales';
import { getUiLocale } from '../utils/locales';

const localeCodes = ['de', 'es', 'fr', 'it', 'nl', 'pl', 'pt'] as const;

/** Return all dot-separated leaf paths in a locale message tree. */
function messageKeys(messages: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(messages).flatMap(
    /** Flattens entries produced by `typeof value === 'object' && value !== null ? messageKeys(value as Record<string, unknown>, `${prefix}${key}.`) : `${prefix}${key}``. */ ([
      key,
      value,
    ]) =>
      typeof value === 'object' && value !== null
        ? messageKeys(value as Record<string, unknown>, `${prefix}${key}.`)
        : `${prefix}${key}`,
  );
}

/** Read a JSON locale file from the checked-in translation source. */
function loadLocale(localeCode: string): Record<string, unknown> {
  return JSON.parse(readFileSync(new URL(`../../i18n/locales/${localeCode}.json`, import.meta.url), 'utf8')) as Record<
    string,
    unknown
  >;
}

describe('locale messages', /** Groups scenarios for locale messages. */ () => {
  it('keeps every shipped locale complete relative to English fallback messages', /** Verifies keeps every shipped locale complete relative to English fallback messages. */ () => {
    const englishKeys = messageKeys(loadLocale('en')).sort();

    for (const localeCode of localeCodes) {
      expect(messageKeys(loadLocale(localeCode)).sort(), localeCode).toEqual(englishKeys);
    }
  });
});

describe('locale metadata', /** Validate registration, UI mapping, and local assets together. */ () => {
  it('preserves the original language identifiers and regional flags', /** Protect saved preferences and native labels. */ () => {
    expect(appLocales.map(/** Read each configured identifier. */ (entry) => entry.code)).toEqual([
      'en',
      'de',
      'es',
      'fr',
      'it',
      'nl',
      'pl',
      'pt',
    ]);
    expect(getAppLocale('en').flagCountry).toBe('gb');
    expect(getAppLocale('pt').flagCountry).toBe('pt');
    expect(getAppLocale('unsupported').code).toBe('en');
  });

  it('resolves every UI locale and its licensed local flag', /** Check integration inputs before Nuxt builds. */ () => {
    for (const entry of appLocales) {
      expect(entry.language).toMatch(/^[a-z]{2}(?:-[A-Z]{2})?$/);
      expect(entry.name.trim()).not.toBe('');
      expect(entry.file).toBe(`${entry.code}.json`);
      expect(entry.dir).toBe('ltr');
      expect(getUiLocale(entry.code).code).toBe(entry.ui.replace('_', '-'));
      expect(readFileSync(new URL(`../../public/flags/${entry.flagCountry}.svg`, import.meta.url), 'utf8')).toContain(
        '<svg',
      );
    }
  });
});
