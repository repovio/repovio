import registry from '../content/locales.json' with { type: 'json' };

/** Supported website and handbook locale identifier from the canonical documentation registry. */
export type LocaleCode = keyof typeof registry;

/** Locale metadata shared by routing, SEO, content collections, and language controls. */
export const supportedLocales = (Object.keys(registry) as LocaleCode[]).map(
  /** Map each entry to `({ ...registry[code], code, file: `${code}.json`, dir: registry[code].dir as 'ltr' | 'rtl', })`. */ (
    code,
  ) => ({
    ...registry[code],
    code,
    file: `${code}.json`,
    dir: registry[code].dir as 'ltr' | 'rtl',
  }),
);
export const defaultLocale: LocaleCode = 'en';

/** Resolve locale metadata, falling back to English for unsupported identifiers. */
export function getLocale(code: string) {
  return (
    supportedLocales.find(/** Find the entry matching `locale.code === code`. */ (locale) => locale.code === code) ||
    supportedLocales[0]!
  );
}

/** Prefix a website path with its non-default language code. */
export function localizedPath(code: string, path: string): string {
  return code === defaultLocale ? path : `/${code}${path === '/' ? '' : path}`;
}
