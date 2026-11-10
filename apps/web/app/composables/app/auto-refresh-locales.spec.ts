import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { appLocales } from '../../../shared/locales';

it('provides refresh chrome and interpolation in every supported locale', /** Prevent fallback text masking incomplete translations. */ () => {
  for (const locale of appLocales) {
    const messages = JSON.parse(readFileSync(new URL(`../../../i18n/locales/${locale.file}`, import.meta.url), 'utf8'));
    expect(Object.keys(messages.autoRefresh).sort()).toEqual(['current', 'help', 'off', 'title']);
    expect(messages.autoRefresh.current).toContain('{interval}');
    for (const value of Object.values(messages.autoRefresh))
      expect(typeof value === 'string' && value.length > 0).toBe(true);
  }
});
