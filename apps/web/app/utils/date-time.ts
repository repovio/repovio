import type { ApiTimestamp, DefaultDateTimeFormat } from '../types/api/resources';

/** Format a valid API timestamp with an application-wide 24-hour display policy. */
export function formatDateTimeValue(
  timestamp: ApiTimestamp,
  format: DefaultDateTimeFormat,
  locale: string,
  timeZone?: string,
): string {
  const date = new Date(timestamp);
  if (format === 'ISO') return formatIsoDateTime(date, timeZone);

  return new Intl.DateTimeFormat(locale, {
    dateStyle: format === 'LOCALE_SHORT' ? 'short' : 'medium',
    hourCycle: 'h23',
    timeStyle: 'short',
    timeZone,
  }).format(date);
}

/** Produce a stable local ISO-style date and 24-hour time without seconds. */
function formatIsoDateTime(date: Date, timeZone?: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
    minute: '2-digit',
    month: '2-digit',
    timeZone,
    year: 'numeric',
  }).formatToParts(date);
  /** Retrieves part. */
  const getPart = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find(/** Finds the first entry matching `part.type === type`. */ (part) => part.type === type)?.value ?? '';
  return `${getPart('year')}-${getPart('month')}-${getPart('day')} ${getPart('hour')}:${getPart('minute')}`;
}
