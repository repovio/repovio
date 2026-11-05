import { createZodDto as createNestZodDto } from 'nestjs-zod';
import type { z } from 'zod';

/**
 * Create a thin Nest metadata bridge and reuse its expensive recursive OpenAPI conversion.
 *
 * @param schema - Shared request or response contract used by the bridge.
 * @returns A Zod-backed Nest class with cached OpenAPI property metadata.
 * @typeParam T - Canonical shared schema.
 */
export function createZodDto<T extends z.ZodType>(schema: T) {
  const dto = createNestZodDto(schema);
  const metadata = dto as unknown as { _OPENAPI_METADATA_FACTORY: (this: typeof dto) => Record<string, unknown> };
  const original = metadata._OPENAPI_METADATA_FACTORY;
  const cache = new WeakMap<object, Record<string, unknown>>();
  metadata._OPENAPI_METADATA_FACTORY = function () {
    const cached = cache.get(this);
    if (cached) return cached;
    const result = original.call(this);
    cache.set(this, result);
    return result;
  };
  return dto;
}
