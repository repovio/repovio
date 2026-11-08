import { describe, expect, it } from 'vitest';
import { validateOpenApi } from '../../content/scripts/openapi.mjs';
import { apiEndpoints, filterApiEndpoints, resolveApiReference, type ApiDocument } from '../../shared/openapi';
import fixture from '../fixtures/openapi.json' with { type: 'json' };
const document = fixture as ApiDocument;

describe('native API reference', /** Verify native API reference. */ () => {
  it('validates the exported contract including nested and recursive references', /** Verify validates the exported contract including nested and recursive references. */ () => {
    expect(validateOpenApi(fixture)).toBe(fixture);
    expect(
      /** Return `validateOpenApi({ ...fixture, components: {} })` when invoked. */ () =>
        validateOpenApi({ ...fixture, components: {} }),
    ).toThrow('Unresolved');
    expect(
      /** Return `validateOpenApi({ ...fixture, paths: {} })` when invoked. */ () =>
        validateOpenApi({ ...fixture, paths: {} }),
    ).toThrow('Invalid');
    expect(
      /** Return `validateOpenApi({ ...fixture, external: { $ref: 'https://example.invalid/schema' } })` when invoked. */ () =>
        validateOpenApi({ ...fixture, external: { $ref: 'https://example.invalid/schema' } }),
    ).toThrow('local');
  });
  it('inherits parameters and security while honoring operation overrides', /** Verify inherits parameters and security while honoring operation overrides. */ () => {
    const endpoints = apiEndpoints(document);
    expect(endpoints).toHaveLength(3);
    const read = endpoints[0]!;
    expect(read.parameters).toHaveLength(2);
    expect(read.parameters![0]!.schema!.format).toBe('uuid');
    expect(read.security).toEqual([{ bearer: [] }]);
    expect(endpoints[2]!.security).toEqual([]);
    expect(new Set(endpoints.map(/** Map each entry to `endpoint.anchor`. */ (endpoint) => endpoint.anchor)).size).toBe(
      3,
    );
    expect(apiEndpoints(document)[0]!.anchor).toBe(read.anchor);
  });
  it('searches multiple terms across method, path, tags, and descriptions', /** Verify searches multiple terms across method, path, tags, and descriptions. */ () => {
    const endpoints = apiEndpoints(document);
    expect(filterApiEndpoints(endpoints, 'GET recursive')).toHaveLength(1);
    expect(filterApiEndpoints(endpoints, 'PATCH items')).toHaveLength(1);
    expect(filterApiEndpoints(endpoints, 'readiness')).toHaveLength(1);
    expect(filterApiEndpoints(endpoints, 'does-not-exist')).toEqual([]);
    expect(filterApiEndpoints(endpoints, '  ')).toHaveLength(3);
  });
  it('resolves escaped references and terminates cyclic aliases without mutating input', /** Verify resolves escaped references and terminates cyclic aliases without mutating input. */ () => {
    const source = { $ref: '#/components/schemas/A~1B~0C' };
    const doc: ApiDocument = {
      ...document,
      components: {
        schemas: {
          'A/B~C': { type: 'string' },
          A: { $ref: '#/components/schemas/B' },
          B: { $ref: '#/components/schemas/A' },
        },
      },
    };
    expect(resolveApiReference(source, doc)).toMatchObject({ type: 'string' });
    expect(source).toEqual({ $ref: '#/components/schemas/A~1B~0C' });
    expect(resolveApiReference({ $ref: '#/components/schemas/A' }, doc).$ref).toBeDefined();
    expect(resolveApiReference({ $ref: '#/components/schemas/__proto__' }, doc).$ref).toBeDefined();
  });
});
