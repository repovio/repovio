/** Metadata shared by app registration, document direction, and accessible locale controls. */
export interface AppLocale {
  code: string;
  language: string;
  name: string;
  file: string;
  dir: 'ltr' | 'rtl';
  flagCountry: string;
  ui: string;
}

/** Supported app languages in stable selection order; catalogs remain loaded by Nuxt i18n. */
export const appLocales = [
  { code: 'en', language: 'en-US', name: 'English', file: 'en.json', dir: 'ltr', flagCountry: 'gb', ui: 'en' },
  { code: 'de', language: 'de-DE', name: 'Deutsch', file: 'de.json', dir: 'ltr', flagCountry: 'de', ui: 'de' },
  { code: 'es', language: 'es', name: 'Español', file: 'es.json', dir: 'ltr', flagCountry: 'es', ui: 'es' },
  { code: 'fr', language: 'fr-FR', name: 'Français', file: 'fr.json', dir: 'ltr', flagCountry: 'fr', ui: 'fr' },
  { code: 'it', language: 'it-IT', name: 'Italiano', file: 'it.json', dir: 'ltr', flagCountry: 'it', ui: 'it' },
  { code: 'nl', language: 'nl-NL', name: 'Nederlands', file: 'nl.json', dir: 'ltr', flagCountry: 'nl', ui: 'nl' },
  { code: 'pl', language: 'pl-PL', name: 'Polski', file: 'pl.json', dir: 'ltr', flagCountry: 'pl', ui: 'pl' },
  { code: 'pt', language: 'pt-PT', name: 'Português', file: 'pt.json', dir: 'ltr', flagCountry: 'pt', ui: 'pt' },
] as const satisfies readonly AppLocale[];

/** Supported persisted app locale identifier. */
export type AppLocaleCode = (typeof appLocales)[number]['code'];

/** Resolve app metadata with the same deterministic English fallback as message loading. */
export function getAppLocale(code: string): (typeof appLocales)[number] {
  return (
    appLocales.find(/** Match the exact persisted language identifier. */ (entry) => entry.code === code) ??
    appLocales[0]
  );
}
