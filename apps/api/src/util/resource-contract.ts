import { applyDecorators, Injectable, RequestMethod, type ArgumentMetadata, type PipeTransform } from '@nestjs/common';
import { HTTP_CODE_METADATA, METHOD_METADATA } from '@nestjs/common/constants.js';
import {
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiQuery,
  ApiResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { parseQueryObject, type FieldSchema } from '@querry-kit/nest/core';
import { createPaginatedSchema } from '@querry-kit/nest/zod';
import { ZodSerializerDto } from 'nestjs-zod';
import { z } from 'zod';
import { createZodDto } from './schema-dto.js';

/** Minimal API-only bridge accepted by resource documentation and projection. */
type SchemaDto = {
  schema: z.ZodObject;
  name: string;
  /** Constructs an instance of the runtime schema DTO. */ new (): unknown;
};

/**
 * Build Query Kit's explicit projection allowlist from a shared resource schema.
 *
 * @param dto - Nest bridge carrying the shared resource schema.
 * @returns The allowed scalar and nested projection fields.
 */
export function resourceFields(dto: SchemaDto): FieldSchema {
  /**
   * Resolve nested schema objects into an explicit Query Kit projection tree.
   *
   * @param schema - Current resource property schema.
   * @returns Its allowed nested fields, or undefined for a scalar.
   */
  const build = (schema: z.ZodType): FieldSchema | undefined => {
    if (schema instanceof z.ZodOptional || schema instanceof z.ZodNullable || schema instanceof z.ZodDefault)
      return build(schema.unwrap() as z.ZodType);
    if (schema instanceof z.ZodArray) return build(schema.element as z.ZodType);
    if (!(schema instanceof z.ZodObject)) return undefined;
    return Object.fromEntries(
      Object.entries(schema.shape).map(
        /** Projects each entry using the build mapping. */ ([key, item]) => {
          const nested = build(item as z.ZodType);
          return [key, nested ? { relation: true, fields: nested } : true];
        },
      ),
    );
  };
  return build(dto.schema) ?? {};
}

/**
 * Document and validate projected resource pages without restoring omitted fields.
 *
 * @param options - Resource bridge and response description.
 * @returns Combined response documentation and runtime validation decorators.
 */
export function ApiPaginatedResponse(options: { model: SchemaDto; description?: string }): MethodDecorator {
  const response = createZodDto(createPaginatedSchema(projectedSchema(options.model.schema)));
  Object.defineProperty(response, 'name', { value: `${options.model.name}Page` });
  return applyDecorators(
    ApiOkResponse({ type: response, description: options.description }),
    ZodSerializerDto(response),
  );
}

/**
 * Document transport-level query fields; resource-specific schemas document additional fields.
 *
 * @returns Query parameter documentation for resource endpoints.
 */
export function ApiResourceQuery(): MethodDecorator {
  return applyDecorators(
    ...['page', 'perPage', 'fields', 'where', 'orderBy', 'include', 'select', 'cursor', 'distinct'].map(
      /** Projects each entry using `ApiQuery({ name, required: false, type: String })`. */ (name) =>
        ApiQuery({ name, required: false, type: String }),
    ),
  );
}

/**
 * Document the existing safe API error statuses.
 *
 * @param options - Optional invalid-query description.
 * @returns Error response documentation decorators.
 */
export function ApiErrorResponses(options: { badRequestDescription?: string } = {}): MethodDecorator {
  return applyDecorators(
    ApiBadRequestResponse({ description: options.badRequestDescription }),
    ApiUnauthorizedResponse(),
    ApiForbiddenResponse(),
  );
}

/** Normalize structured query values before the global Zod validation pipe executes. */
@Injectable()
export class PublicQueryPipe implements PipeTransform {
  /**
   * Preserve scalar fields while decoding JSON and dotted resource query properties.
   *
   * @param value - Incoming query value before validation.
   * @param metadata - Nest argument metadata identifying query parameters.
   * @returns Normalized query properties, or the untouched non-query value.
   */
  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    if (metadata.type !== 'query' || !value || typeof value !== 'object') return value;
    const scalar: Record<string, unknown> = {};
    const structured: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      const root = key.split(/[.[\]]/)[0];
      if (['where', 'orderBy', 'include', 'select', 'cursor', 'distinct'].includes(root)) structured[key] = item;
      else scalar[key] = item;
    }
    return { ...scalar, ...parseQueryObject(structured) };
  }
}

/**
 * Remove defaults and allow only schema-known fields in permission-filtered nested responses.
 *
 * @param schema - Complete public response schema.
 * @returns Its recursively optional projection schema without defaults.
 */
export function projectedSchema(schema: z.ZodType): z.ZodType {
  if (schema instanceof z.ZodDefault) return projectedSchema(schema.unwrap() as z.ZodType);
  if (schema instanceof z.ZodOptional) return projectedSchema(schema.unwrap() as z.ZodType).optional();
  if (schema instanceof z.ZodNullable) return projectedSchema(schema.unwrap() as z.ZodType).nullable();
  if (schema instanceof z.ZodArray) return z.array(projectedSchema(schema.element as z.ZodType));
  if (schema instanceof z.ZodObject)
    return z.strictObject(
      Object.fromEntries(
        Object.entries(schema.shape).map(
          /** Projects each entry using `[key, projectedSchema(value as z.ZodType).optional()]`. */ ([key, value]) => [
            key,
            projectedSchema(value as z.ZodType).optional(),
          ],
        ),
      ),
    );
  if (schema instanceof z.ZodUnion)
    return z.union(
      schema.options.map(
        /** Projects each entry using `projectedSchema(option as z.ZodType)`. */ (option) =>
          projectedSchema(option as z.ZodType),
      ) as [z.ZodType, z.ZodType, ...z.ZodType[]],
    );
  return schema;
}

/**
 * Bind runtime response validation and OpenAPI to one shared JSON schema.
 *
 * @param schema - Canonical JSON response schema.
 * @param status - Explicit status override, otherwise inferred from Nest route metadata.
 * @returns Combined runtime serialization and response documentation decorator.
 */
export function SchemaResponse(schema: z.ZodType, status?: number): MethodDecorator {
  const response = createZodDto(schema);
  return /** Registers the schema-derived response metadata on the decorated handler. */ (
    target,
    property,
    descriptor,
  ) => {
    Object.defineProperty(response, 'name', { value: `${target.constructor.name}_${String(property)}Response` });
    const handler = descriptor.value as object;
    const responseStatus =
      status ??
      Reflect.getMetadata(HTTP_CODE_METADATA, handler) ??
      (Reflect.getMetadata(METHOD_METADATA, handler) === RequestMethod.POST ? 201 : 200);
    applyDecorators(ApiResponse({ status: responseStatus, type: response }), ZodSerializerDto(response))(
      target,
      property,
      descriptor,
    );
  };
}
