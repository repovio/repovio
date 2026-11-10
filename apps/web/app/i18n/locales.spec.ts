import { existsSync, readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';
import { createI18n } from 'vue-i18n';

import { appLocales, getAppLocale } from '../../shared/locales';
import { getUiLocale } from '../utils/locales';

const localeCodes = appLocales.map(/** Read every shipped catalog identifier. */ (entry) => entry.code);

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
    expect(appLocales.slice(0, 8).map(/** Read each configured identifier. */ (entry) => entry.code)).toEqual([
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
      expect(entry.dir).toBe(['ar', 'ur'].includes(entry.code) ? 'rtl' : 'ltr');
      expect(getUiLocale(entry.code).code.toLowerCase()).toBe(entry.ui.replace('_', '-').toLowerCase());
      expect(readFileSync(new URL(`../../public/flags/${entry.flagCountry}.svg`, import.meta.url), 'utf8')).toContain(
        '<svg',
      );
    }
  });
});

describe('website language coverage', /** Prevent the website from offering languages absent from the app. */ () => {
  it('includes every website language without removing existing app options', /** Compare real registries rather than duplicate expected additions. */ () => {
    const website = JSON.parse(readFileSync(new URL('../../../website/content/locales.json', import.meta.url), 'utf8'));
    expect(appLocales).toHaveLength(17);
    for (const code of Object.keys(website)) expect(localeCodes).toContain(code);
    expect(new Set(localeCodes).size).toBe(localeCodes.length);
  });
});

/** Flatten and validate message leaves without silently accepting arrays or other nonmessage values. */
function flattenMessages(messages: Record<string, unknown>, prefix = ''): Record<string, string> {
  return Object.fromEntries(
    Object.entries(messages).flatMap(
      /** Retain dotted paths while validating every catalog leaf. */ ([key, value]) => {
        const path = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          return Object.entries(flattenMessages(value as Record<string, unknown>, path));
        }
        if (typeof value !== 'string' || !value.trim()) throw new Error(`Invalid message: ${path}`);
        return [[path, value]];
      },
    ),
  );
}

/** Read unique named substitution identifiers, excluding escaped literal placeholders. */
function parameters(message: string): string[] {
  return [
    ...new Set(
      [...message.matchAll(/\{([a-zA-Z]\w*)\}/g)].map(
        /** Extract the named parameter from the syntax match. */ (match) => match[1]!,
      ),
    ),
  ].sort();
}

/** Check complete keys, substitutions, linked targets, and the actual installed message compiler. */
function validateCatalog(messages: Record<string, unknown>, english: Record<string, unknown>): void {
  const actual = flattenMessages(messages);
  const reference = flattenMessages(english);
  if (Object.keys(actual).sort().join('\n') !== Object.keys(reference).sort().join('\n')) {
    throw new Error('Catalog keys differ');
  }
  const i18n = createI18n<Record<string, string>, 'en', false>({
    legacy: false,
    locale: 'en',
    fallbackLocale: false,
    messages: { en: { ...actual } },
    flatJson: true,
    missingWarn: false,
  });
  for (const [key, message] of Object.entries(actual)) {
    const expected = parameters(reference[key]!);
    if (parameters(message).join(',') !== expected.join(',')) throw new Error(`Parameters differ: ${key}`);
    for (const match of message.matchAll(/@(?:\.[a-zA-Z]+)?:([\w.]+)/g)) {
      if (!(match[1]! in actual)) throw new Error(`Linked target missing: ${key}`);
    }
    const values = Object.fromEntries(
      expected.map(
        /** Provide recognizable values for real message evaluation. */ (name) => [
          name,
          name === 'count' ? 3 : 'sample',
        ],
      ),
    );
    const rendered = i18n.global.t(key, values);
    if (!rendered || rendered === key || /\{[a-zA-Z]\w*\}/.test(rendered))
      throw new Error(`Message did not render: ${key}`);
  }
}

/** Enforce website coverage and usable locale metadata/assets using fixture-injectable asset resolution. */
function validateRegistry(
  entries: readonly {
    code: string;
    language: string;
    name: string;
    file: string;
    dir: string;
    flagCountry: string;
    ui: string;
  }[],
  websiteCodes: string[],
  assetExists: (country: string) => boolean,
): void {
  const codes = entries.map(/** Read identifiers for coverage and uniqueness. */ (entry) => entry.code);
  if (
    new Set(codes).size !== codes.length ||
    websiteCodes.some(/** Find omitted website languages. */ (code) => !codes.includes(code))
  ) {
    throw new Error('Missing or duplicate locale');
  }
  for (const entry of entries) {
    if (!entry.name.trim() || !Intl.getCanonicalLocales(entry.language).length || entry.file !== `${entry.code}.json`)
      throw new Error('Invalid locale metadata');
    if (entry.dir !== (['ar', 'ur'].includes(entry.code) ? 'rtl' : 'ltr')) throw new Error('Invalid direction');
    if (getUiLocale(entry.code).code.toLowerCase().replace('-', '_') !== entry.ui) throw new Error('Invalid UI locale');
    if (!assetExists(entry.flagCountry)) throw new Error('Flag missing');
  }
}

describe('catalog validation', /** Check the shipped resources and prove failure cases actually fail. */ () => {
  it('compiles and renders every complete translated message', /** Catch syntax and parameter regressions beyond key parity. */ () => {
    const english = loadLocale('en');
    for (const code of localeCodes) validateCatalog(loadLocale(code), english);
  });

  it('rejects omitted, empty, and malformed messages and incompatible substitutions', /** Exercise actual failure paths with isolated fixtures. */ () => {
    expect(/** Validate an omitted leaf. */ () => validateCatalog({}, { hello: 'Hello' })).toThrow('Catalog keys');
    expect(/** Validate an empty leaf. */ () => validateCatalog({ hello: '' }, { hello: 'Hello' })).toThrow(
      'Invalid message',
    );
    expect(
      /** Validate a wrong placeholder. */ () => validateCatalog({ hello: 'Hello {other}' }, { hello: 'Hello {name}' }),
    ).toThrow('Parameters differ');
    expect(
      /** Validate malformed message syntax. */ () => validateCatalog({ hello: 'Hello {name' }, { hello: 'Hello' }),
    ).toThrow();
    expect(
      /** Validate a broken linked message. */ () => validateCatalog({ hello: '@:missing' }, { hello: 'Hello' }),
    ).toThrow('Linked target');
  });

  it('accepts valid linked messages, plural branches, and unchanged technical names', /** Avoid rejecting legitimate translations. */ () => {
    validateCatalog(
      { hello: 'Repovio', linked: '@:hello', count: 'none | one | {count} items' },
      { hello: 'Repovio', linked: '@:hello', count: '{count} items' },
    );
  });

  it('validates actual registration and rejects missing website languages, flags, direction, and UI mappings', /** Prove metadata failures cannot pass the coverage gate. */ () => {
    const website = Object.keys(
      JSON.parse(readFileSync(new URL('../../../website/content/locales.json', import.meta.url), 'utf8')),
    );
    /** Resolve assets from the checked-in public directory. */
    const assetExists = (country: string): boolean =>
      existsSync(new URL(`../../public/flags/${country}.svg`, import.meta.url));
    validateRegistry(appLocales, website, assetExists);
    expect(
      /** Remove one required website entry. */ () =>
        validateRegistry(
          appLocales.filter(/** Omit Arabic. */ (entry) => entry.code !== 'ar'),
          website,
          assetExists,
        ),
    ).toThrow('Missing');
    expect(
      /** Simulate an absent licensed asset. */ () =>
        validateRegistry(appLocales, website, /** Simulate a missing flag. */ () => false),
    ).toThrow('Flag');
    expect(
      /** Supply an invalid reading direction. */ () =>
        validateRegistry([{ ...appLocales[0], dir: 'rtl' }], [], assetExists),
    ).toThrow('direction');
    expect(
      /** Supply an unmapped UI identifier. */ () =>
        validateRegistry([{ ...appLocales[0], ui: 'missing' }], [], assetExists),
    ).toThrow('UI locale');
  });
});

it('ships translated prose in previously incomplete feature areas', /** Keep English fallback from masking untranslated screens. */ () => {
  const english = flattenMessages(loadLocale('en'));
  const proseKeys = [
    'dashboard.totalDurationContext',
    'jobs.errors.invalidCredentials',
    'jobs.diagnostics.description',
    'notifications.channels.dialogDescription',
    'repositoryDetails.syncStatus.description',
    'securityAlerts.description',
    'changelog.empty',
    'organizationWebhooks.secretHelp',
  ];
  for (const code of localeCodes.filter(/** Exclude the source language. */ (code) => code !== 'en')) {
    const translated = flattenMessages(loadLocale(code));
    for (const key of proseKeys) expect(translated[key], `${code}: ${key}`).not.toBe(english[key]);
  }
});
