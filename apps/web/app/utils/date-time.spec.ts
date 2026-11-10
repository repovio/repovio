import { describe, expect, it } from 'vitest';

import { formatDateTimeValue } from './date-time';

describe('formatDateTimeValue', /** Groups scenarios for formatDateTimeValue. */ () => {
  const timestamp = '2026-09-09T13:05:00.000Z';

  it('formats the short localized option with a 24-hour clock', /** Verifies formats the short localized option with a 24-hour clock. */ () => {
    expect(formatDateTimeValue(timestamp, 'LOCALE_SHORT', 'en-US', 'UTC')).toBe('9/9/26, 13:05');
  });

  it('formats the medium localized option with a 24-hour clock', /** Verifies formats the medium localized option with a 24-hour clock. */ () => {
    expect(formatDateTimeValue(timestamp, 'LOCALE_MEDIUM', 'en-US', 'UTC')).toBe('Sep 9, 2026, 13:05');
  });

  it('formats the stable ISO option with a 24-hour clock', /** Verifies formats the stable ISO option with a 24-hour clock. */ () => {
    expect(formatDateTimeValue(timestamp, 'ISO', 'de-DE', 'UTC')).toBe('2026-09-09 13:05');
  });

  it.each([
    ['zh-CN', '2026/9/9 13:05', '2026年9月9日 13:05'],
    ['pt-BR', '09/09/2026, 13:05', '9 de set. de 2026, 13:05'],
    ['ar', '9\u200f/9\u200f/2026، 13:05', '09\u200f/09\u200f/2026، 13:05'],
    ['ur', '9/9/26، 13:05', '9 ستمبر، 2026، 13:05'],
  ] as const)(
    'preserves localized dates and 24-hour time for %s',
    /** Check both administrator-selected localized formats against explicit locale-specific output. */ (
      locale,
      short,
      medium,
    ) => {
      expect(formatDateTimeValue(timestamp, 'LOCALE_SHORT', locale, 'UTC')).toBe(short);
      expect(formatDateTimeValue(timestamp, 'LOCALE_MEDIUM', locale, 'UTC')).toBe(medium);
    },
  );

  it.each(['zh-CN', 'pt-BR', 'ar', 'ur'])(
    'uses hour zero at midnight in localized %s formats',
    /** Reject 12-hour clocks and the alternative 24:05 midnight representation in either localized format. */ (
      locale,
    ) => {
      const midnight = '2026-09-10T00:05:00.000Z';
      expect(formatDateTimeValue(midnight, 'LOCALE_SHORT', locale, 'UTC')).toMatch(/00:05$/);
      expect(formatDateTimeValue(midnight, 'LOCALE_MEDIUM', locale, 'UTC')).toMatch(/00:05$/);
    },
  );

  it.each(['zh-CN', 'pt-BR', 'ar', 'ur'])(
    'keeps ISO output independent of the selected %s language',
    /** Preserve Latin digits, fixed component order, and 24-hour time even for RTL and non-Latin locales. */ (
      locale,
    ) => {
      expect(formatDateTimeValue(timestamp, 'ISO', locale, 'UTC')).toBe('2026-09-09 13:05');
      expect(formatDateTimeValue('2026-09-10T00:05:00.000Z', 'ISO', locale, 'UTC')).toBe('2026-09-10 00:05');
    },
  );
});
