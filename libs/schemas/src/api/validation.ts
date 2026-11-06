import { z } from 'zod';

export const oidcClaimPath = /^[A-Za-z0-9_\-.:/@#~+]+$/;

export const oidcScopeToken = /^[\x21\x23-\x5B\x5D-\x7E]+$/;

/** Preserve IsOptional's accepted null inputs without changing nonnullable output types. */
export function optionalInput<T extends z.ZodType>(schema: T) {
  return schema
    .nullish()
    .transform(/** Normalizes input using `value ?? undefined`. */ (value) => value ?? undefined)
    .optional();
}

/** Empty optional setup names were omitted after trimming by the previous request transformer. */
export const optionalNameSchema = z
  .string()
  .trim()
  .max(255)
  .nullish()
  .transform(/** Normalizes input using `value || undefined`. */ (value) => value || undefined)
  .optional();

// ISO-8601 grammar retained from validator.js (MIT), previously used through class-validator.
export const isoDateInputPattern = new RegExp(
  [
    String.raw`^([\+-]?\d{4}(?!\d{2}\b))((-?)((0[1-9]|1[0-2])(\3([12]\d|0[1-9]|3[01]))?|`,
    String.raw`W([0-4]\d|5[0-3])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6])))`,
    String.raw`([T\s]((([01]\d|2[0-3])((:?)[0-5]\d)?|24:?00)([\.,]\d+(?!:))?)?`,
    String.raw`(\17[0-5]\d([\.,]\d+)?)?([zZ]|([\+-])([01]\d|2[0-3]):?([0-5]\d)?)?)?)?$`,
  ].join(''),
);

/** Date-only, local, offset and UTC input forms remain compatible; responses use canonical UTC timestamps. */
export const isoDateInputSchema = z.string().regex(isoDateInputPattern);

/** Match the former URL validator's protocol and host policy without a server-only dependency. */
export function validInputUrl(value: string, requireHttps: boolean): boolean {
  if (!value || value.length > 2084 || /[\s<>]/.test(value)) return false;
  const hasProtocol = /^[a-z][a-z0-9+.-]*:/i.test(value);
  if (requireHttps && !/^https:\/\//i.test(value)) return false;
  if (hasProtocol && !/^(https?|ftp):\/\//i.test(value)) return false;
  if (value.startsWith('//')) return false;
  try {
    const url = new URL(hasProtocol ? value : 'https://' + value);
    const host = url.hostname;
    if (url.port && (Number(url.port) < 0 || Number(url.port) > 65535)) return false;
    if (z.ipv4().safeParse(host).success || z.ipv6().safeParse(host.replace(/^\[|\]$/g, '')).success) return true;
    const labels = host.split('.');
    return (
      labels.length > 1 &&
      labels.every(
        /** Checks whether every entry satisfies `/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(label)`. */ (label) =>
          /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(label),
      ) &&
      /^(?:[a-z]{2,}|xn--[a-z0-9-]+)$/i.test(labels.at(-1) ?? '')
    );
  } catch {
    return false;
  }
}

export const providerBaseUrlSchema = z
  .string()
  .refine(/** Validates input against `validInputUrl(value, false)`. */ (value) => validInputUrl(value, false), {
    message: 'Invalid URL.',
  });

export const httpsUrlSchema = z
  .string()
  .refine(/** Validates input against `validInputUrl(value, true)`. */ (value) => validInputUrl(value, true), {
    message: 'Invalid HTTPS URL.',
  });
