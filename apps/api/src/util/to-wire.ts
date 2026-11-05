/** Recursively serialize dates at explicit public mapping boundaries. */
export type WireValue<T> = T extends Date
  ? string
  : T extends readonly (infer U)[]
    ? WireValue<U>[]
    : T extends object
      ? { [K in keyof T]: WireValue<T[K]> }
      : T;

/**
 * Convert public mapped data to JSON-compatible transport values without exposing model fields.
 *
 * @param value - Explicitly mapped public data to normalize.
 * @returns The same public fields with dates encoded as ISO strings.
 * @typeParam T - Original mapped value shape.
 */
export function toWire<T>(value: T): WireValue<T> {
  if (value instanceof Date) return value.toISOString() as WireValue<T>;
  if (Array.isArray(value)) return value.map((item) => toWire(item)) as WireValue<T>;
  if (value !== null && typeof value === 'object')
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, toWire(item)])) as WireValue<T>;
  return value as WireValue<T>;
}
