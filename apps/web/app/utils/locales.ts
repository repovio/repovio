import { ar, bn, de, en, es, fr, hi, id, it, ja, nl, pl, pt, pt_br, ru, ur, zh_cn } from '@nuxt/ui/locale';

import { getAppLocale } from '../../shared/locales';

const uiLocales = { en, de, es, fr, it, nl, pl, pt, zh_cn, hi, ar, bn, pt_br, id, ur, ru, ja };

/** Resolve built-in component messages using the app registry and English fallback. */
export function getUiLocale(code: string): (typeof uiLocales)[keyof typeof uiLocales] {
  return uiLocales[getAppLocale(code).ui];
}
