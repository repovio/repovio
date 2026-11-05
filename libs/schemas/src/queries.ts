import { z } from 'zod';

import { queryEnums, queryFields } from './query-fields.js';

/** Nested JSON resource filter validated before the API maps it to query-service types. */
export type Filter = Record<string, unknown>;
type Field = { type: string; list: boolean; nullable: boolean };
const models: Record<string, Record<string, Field>> = queryFields;
const enums: Record<string, readonly string[]> = queryEnums;
const whereCache = new Map<string, z.ZodType<Filter>>();
const sortCache = new Map<string, z.ZodType<Filter>>();
const scalarFilterCache = new Map<string, z.ZodType>();
const selectionCache = new Map<string, z.ZodType<Filter>>();

/** Resolve the transport scalar for a documented public field. */
function scalarFor(field: Field): z.ZodType | undefined {
  if (enums[field.type]) return z.enum(enums[field.type] as [string, ...string[]]);
  switch (field.type) {
    case 'String':
      return z.string();
    case 'Int':
      return z.number().int();
    case 'BigInt':
      return z.union([z.number().int(), z.string().regex(/^-?\d+$/)]);
    case 'Float':
    case 'Decimal':
      return z.number().finite();
    case 'Boolean':
      return z.boolean();
    case 'DateTime':
      return z.iso.datetime({ offset: true });
    default:
      return undefined;
  }
}

/** Validate field-specific scalar operators without forwarding unchecked objects to Prisma. */
function scalarFilter(field: Field, scalar: z.ZodType): z.ZodType {
  const cacheKey = `${field.type}:${field.nullable}:${field.list}`;
  const cached = scalarFilterCache.get(cacheKey);
  if (cached) return cached;
  const value = field.nullable ? scalar.nullable() : scalar;
  if (field.list)
    return z.union([
      z.array(scalar),
      z.strictObject({
        equals: z.array(scalar).optional(),
        has: value.optional(),
        hasSome: z.array(scalar).optional(),
        hasEvery: z.array(scalar).optional(),
        isEmpty: z.boolean().optional(),
      }),
    ]);
  const shape: Record<string, z.ZodType> = {
    equals: value.optional(),
  };
  if (field.type !== 'Boolean') {
    shape.in = z.array(scalar).optional();
    shape.notIn = z.array(scalar).optional();
  }
  if (['String', 'Int', 'BigInt', 'Float', 'Decimal', 'DateTime'].includes(field.type)) {
    for (const name of ['lt', 'lte', 'gt', 'gte']) shape[name] = scalar.optional();
  }
  if (field.type === 'String') {
    for (const name of ['contains', 'startsWith', 'endsWith']) shape[name] = z.string().optional();
    shape.mode = z.enum(['default', 'insensitive']).optional();
  }
  const operations: z.ZodType = z
    .lazy(() => z.strictObject({ ...shape, not: z.union([value, operations]).optional() }))
    .meta({ id: `${field.type}${field.nullable ? 'Nullable' : ''}Filter` });
  const result = z.union([value, operations]);
  scalarFilterCache.set(cacheKey, result);
  return result;
}

/** Build a strict recursive filter from the endpoint's explicit public field definitions. */
export function resourceWhereFor(model: string): z.ZodType<Filter> {
  const cached = whereCache.get(model);
  if (cached) return cached;
  let schema: z.ZodType<Filter> = z.lazy(() => {
    const shape: Record<string, z.ZodType> = {};
    for (const [name, field] of Object.entries(models[model] ?? {})) {
      const scalar = scalarFor(field);
      if (scalar) shape[name] = scalarFilter(field, scalar).optional();
      else if (models[field.type]) {
        const nested = resourceWhereFor(field.type);
        shape[name] = field.list
          ? z.strictObject({ some: nested.optional(), every: nested.optional(), none: nested.optional() }).optional()
          : z
              .union([
                nested,
                z.strictObject({ is: nested.nullable().optional(), isNot: nested.nullable().optional() }),
              ])
              .nullable()
              .optional();
      }
    }
    if (model === 'SecurityAlert')
      shape.location = z.strictObject({ path: z.tuple([z.literal('path')]), equals: z.string() }).optional();
    shape.AND = z.union([schema, z.array(schema)]).optional();
    shape.OR = z.array(schema).optional();
    shape.NOT = z.union([schema, z.array(schema)]).optional();
    return z.strictObject(shape);
  });
  schema = schema.meta({ id: `${model}Where` });
  whereCache.set(model, schema);
  return schema;
}

/** Restrict ordering to scalar columns and valid relation order paths. */
function sortFor(model: string): z.ZodType<Filter> {
  const cached = sortCache.get(model);
  if (cached) return cached;
  let schema: z.ZodType<Filter> = z.lazy(() =>
    z.strictObject(
      Object.fromEntries(
        Object.entries(models[model] ?? {}).flatMap<[string, z.ZodType]>(([name, field]) => {
          if (scalarFor(field))
            return [
              [
                name,
                z
                  .union([
                    z.enum(['asc', 'desc']),
                    z.strictObject({ sort: z.enum(['asc', 'desc']), nulls: z.enum(['first', 'last']).optional() }),
                  ])
                  .optional(),
              ],
            ];
          if (models[field.type])
            return [
              [
                name,
                (field.list ? z.strictObject({ _count: z.enum(['asc', 'desc']) }) : sortFor(field.type)).optional(),
              ],
            ];
          return [];
        }),
      ),
    ),
  );
  schema = schema.meta({ id: `${model}OrderBy` });
  sortCache.set(model, schema);
  return schema;
}

/** Validate selections and nested relation options using the same public field policy. */
function selectionFor(model: string, mode: 'select' | 'include' = 'select'): z.ZodType<Filter> {
  const cacheKey = `${model}:${mode}`;
  const cached = selectionCache.get(cacheKey);
  if (cached) return cached;
  let schema: z.ZodType<Filter> = z.lazy(() =>
    z.strictObject(
      Object.fromEntries(
        Object.entries(models[model] ?? {}).flatMap<[string, z.ZodType]>(([name, field]) => {
          if (scalarFor(field)) return mode === 'select' ? [[name, z.boolean().optional()]] : [];
          if (models[field.type])
            return [
              [
                name,
                z
                  .union([
                    z.boolean(),
                    z.strictObject({
                      select: selectionFor(field.type).optional(),
                      include: selectionFor(field.type, 'include').optional(),
                      where: resourceWhereFor(field.type).optional(),
                      orderBy: z.union([sortFor(field.type), z.array(sortFor(field.type))]).optional(),
                    }),
                  ])
                  .optional(),
              ],
            ];
          return [];
        }),
      ),
    ),
  );
  schema = schema.meta({ id: `${model}${mode === 'include' ? 'Include' : 'Select'}` });
  selectionCache.set(cacheKey, schema);
  return schema;
}
const integer = z
  .union([z.number(), z.string().regex(/^\d+$/)])
  .pipe(z.coerce.number())
  .pipe(z.number().int());
/** Public pagination contract; rejects empty strings, booleans and fractional values. */
const paginationSchema = z.strictObject({
  page: integer.pipe(z.number().min(1)).default(1),
  perPage: integer.pipe(z.number().min(1).max(1000)).default(10),
  fields: z.string().optional(),
});

/** Build model-specific queries while keeping database types out of the browser. */
export function createResourceQuerySchema(model: string) {
  const scalarNames = Object.entries(models[model])
    .filter(([, field]) => Boolean(scalarFor(field)))
    .map(([name]) => name) as [string, ...string[]];
  return paginationSchema.extend({
    where: resourceWhereFor(model).optional(),
    orderBy: z.union([sortFor(model), z.array(sortFor(model))]).optional(),
    select: selectionFor(model).optional(),
    include: selectionFor(model, 'include').optional(),
    cursor: z.strictObject({ id: z.string() }).optional(),
    distinct: z.union([z.enum(scalarNames), z.array(z.enum(scalarNames))]).optional(),
  });
}
/** Endpoint-specific validated resource query contracts. */
export const resourceQuerySchemas = {
  User: createResourceQuerySchema('User'),
  ProviderAccount: createResourceQuerySchema('ProviderAccount'),
  Repository: createResourceQuerySchema('Repository'),
  WorkflowRun: createResourceQuerySchema('WorkflowRun'),
  Issue: createResourceQuerySchema('Issue'),
  PullRequest: createResourceQuerySchema('PullRequest'),
  SecurityAlert: createResourceQuerySchema('SecurityAlert'),
  NotificationChannel: createResourceQuerySchema('NotificationChannel'),
  NotificationDelivery: createResourceQuerySchema('NotificationDelivery'),
};
/** Repository-shaped default retained for API-only query schema composition. */
export const resourceQuerySchema = resourceQuerySchemas.Repository;
/** Repository-shaped filter convenience contract. */
export const resourceWhereSchema = resourceWhereFor('Repository');
