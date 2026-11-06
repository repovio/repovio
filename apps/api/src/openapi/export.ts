import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import type { OpenAPIObject } from '@nestjs/swagger';

import { AppModule } from '../app.module.js';
import { configureApiRoutes, createApiDocument } from './document.js';

/**
 * Scan real application metadata without running lifecycle hooks, jobs, or a listener.
 *
 * @returns A portable schema with deterministic key ordering and no deployment configuration.
 */
export async function exportApiDocument(): Promise<OpenAPIObject> {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
    logger: false,
    abortOnError: false,
  });
  try {
    // Do not call init or listen: database connections and scheduled work start in lifecycle hooks.
    configureApiRoutes(app);
    return JSON.parse(JSON.stringify(createApiDocument(app, '/'), sortedKeys)) as OpenAPIObject;
  } finally {
    await app.close();
  }
}

/**
 * Sort object keys recursively while preserving semantically meaningful array ordering.
 *
 * @param _key - JSON property key supplied by the serializer.
 * @param value - JSON value being serialized.
 * @returns The original value or an object with sorted keys.
 */
function sortedKeys(_key: string, value: unknown): unknown {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? Object.fromEntries(
        Object.entries(value).sort(
          /** Orders entries using `left.localeCompare(right, 'en')`. */ ([left], [right]) =>
            left.localeCompare(right, 'en'),
        ),
      )
    : value;
}
