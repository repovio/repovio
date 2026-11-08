/** JSON Schema keywords emitted by Repovio's OpenAPI generator, preserving unrendered keywords. */
export interface ApiSchema {
  $ref?: string;
  type?: string | string[];
  title?: string;
  description?: string;
  format?: string;
  nullable?: boolean;
  enum?: unknown[];
  required?: string[];
  properties?: Record<string, ApiSchema>;
  items?: ApiSchema;
  additionalProperties?: ApiSchema | boolean;
  allOf?: ApiSchema[];
  anyOf?: ApiSchema[];
  oneOf?: ApiSchema[];
  [keyword: string]: unknown;
}
/** Define api parameter contract. */
export interface ApiParameter {
  $ref?: string;
  name: string;
  in: string;
  required?: boolean;
  description?: string;
  schema?: ApiSchema;
  content?: Record<string, ApiMedia>;
}
/** Define api media contract. */
export interface ApiMedia {
  schema?: ApiSchema;
  example?: unknown;
  examples?: Record<string, unknown>;
}
/** Define api payload contract. */
export interface ApiPayload {
  $ref?: string;
  description?: string;
  required?: boolean;
  content?: Record<string, ApiMedia>;
  headers?: Record<string, ApiParameter>;
}
/** Define api security contract. */
export type ApiSecurity = Record<string, string[]>[];
/** Define api operation contract. */
export interface ApiOperation {
  tags?: string[];
  operationId?: string;
  summary?: string;
  description?: string;
  deprecated?: boolean;
  parameters?: ApiParameter[];
  requestBody?: ApiPayload;
  responses?: Record<string, ApiPayload>;
  security?: ApiSecurity;
}
/** Define api path item contract. */
export type ApiPathItem = Partial<Record<ApiMethod, ApiOperation>> & { $ref?: string; parameters?: ApiParameter[] };
/** Define api document contract. */
export interface ApiDocument {
  openapi: string;
  info: { title: string; version: string };
  paths: Record<string, ApiPathItem>;
  security?: ApiSecurity;
  components?: {
    schemas?: Record<string, ApiSchema>;
    securitySchemes?: Record<
      string,
      { type?: string; scheme?: string; name?: string; in?: string; description?: string }
    >;
  };
}
export const apiMethods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'trace'] as const;
/** Define api method contract. */
export type ApiMethod = (typeof apiMethods)[number];
/** An operation with inherited parameters/security and a URL-safe, collision-free anchor. */
export interface ApiEndpoint extends ApiOperation {
  method: ApiMethod;
  path: string;
  anchor: string;
  group: string;
}

/** Resolve a local JSON pointer without following chains indefinitely or permitting prototype traversal. */
export function resolveApiReference<T extends { $ref?: string }>(value: T, document: ApiDocument): T {
  let current = value;
  const seen = new Set<string>();
  while (current.$ref?.startsWith('#/') && !seen.has(current.$ref)) {
    seen.add(current.$ref);
    let target: unknown = document;
    for (const part of current.$ref.slice(2).split('/')) {
      const key = part.replaceAll('~1', '/').replaceAll('~0', '~');
      target =
        target && typeof target === 'object' && Object.hasOwn(target, key)
          ? (target as Record<string, unknown>)[key]
          : undefined;
    }
    if (!target || typeof target !== 'object') break;
    current = { ...current, ...target, $ref: (target as T).$ref };
  }
  return current;
}

/** Flatten the generated paths and merge operation overrides for path-level parameters. */
export function apiEndpoints(document: ApiDocument): ApiEndpoint[] {
  return Object.entries(document.paths).flatMap(
    /** Handle each Object.entries(document.paths).flatMap callback invocation. */ ([path, rawItem]) => {
      const item = resolveApiReference(rawItem, document);
      return apiMethods.flatMap(
        /** Handle each apiMethods.flatMap callback invocation. */ (method) => {
          const operation = item[method];
          if (!operation) return [];
          const parameters = new Map<string, ApiParameter>();
          for (const raw of [...(item.parameters || []), ...(operation.parameters || [])]) {
            const parameter = resolveApiReference(raw, document);
            parameters.set(`${parameter.in}:${parameter.name}`, parameter);
          }
          return [
            {
              ...operation,
              method,
              path,
              anchor: `endpoint-${method}-${Array.from(new TextEncoder().encode(path), /** Evaluate `byte.toString(16).padStart(2, '0')`. */ (byte) => byte.toString(16).padStart(2, '0')).join('')}`,
              group: operation.tags?.[0] || '',
              parameters: [...parameters.values()],
              security: operation.security ?? document.security ?? [],
            },
          ];
        },
      );
    },
  );
}

/** Match method, path, tags, operation ID, summary, and description without case sensitivity. */
export function filterApiEndpoints(endpoints: ApiEndpoint[], query: string): ApiEndpoint[] {
  const words = query.toLocaleLowerCase('en').trim().split(/\s+/).filter(Boolean);
  return endpoints.filter(
    /** Handle each endpoints.filter callback invocation. */ (endpoint) => {
      const text = [
        endpoint.method,
        endpoint.path,
        endpoint.operationId,
        endpoint.summary,
        endpoint.description,
        ...(endpoint.tags || []),
      ]
        .join(' ')
        .toLocaleLowerCase('en');
      return words.every(/** Require every entry to match `text.includes(word)`. */ (word) => text.includes(word));
    },
  );
}
