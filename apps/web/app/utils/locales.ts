import { de, en, es, fr, it, nl, pl, pt } from '@nuxt/ui/locale';

import { getAppLocale } from '../../shared/locales';

const uiLocales = { en, de, es, fr, it, nl, pl, pt };

/** Resolve built-in component messages using the app registry and English fallback. */
export function getUiLocale(code: string): (typeof uiLocales)[keyof typeof uiLocales] {
  return uiLocales[getAppLocale(code).ui];
}
