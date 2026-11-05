import 'reflect-metadata';

import cookie from '@fastify/cookie';
import { NestFactory, Reflector } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { apiReference } from '@scalar/nestjs-api-reference';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';

import { AppModule } from './app.module.js';
import { ENV } from './config/env.js';
import { getCorsOrigins } from './config/http.js';
import { HttpExceptionFilter } from './filters/http-exception.filter.js';
import { configureApiRoutes, createApiDocument } from './openapi/document.js';
import { PrismaExceptionFilter } from './prisma/prisma-exception.filter.js';
import { PublicQueryPipe } from './util/resource-contract.js';
import { WireInterceptor } from './util/wire.interceptor.js';

/**
 * Configure and start the Nest HTTP API, validation, documentation, and graceful shutdown.
 *
 * @returns A promise that resolves when the operation completes.
 */
export async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), { rawBody: true });

  await app.register(cookie);

  configureApiRoutes(app);
  app.enableShutdownHooks();
  app.enableCors({ origin: getCorsOrigins(ENV.CORS_ORIGIN) });
  app.useGlobalPipes(new PublicQueryPipe(), new ZodValidationPipe());
  app.useGlobalInterceptors(new ZodSerializerInterceptor(app.get(Reflector)), new WireInterceptor());
  app.useGlobalFilters(new PrismaExceptionFilter(), new HttpExceptionFilter());

  const document = createApiDocument(app, ENV.PUBLIC_URL);

  app.use(
    '/docs',
    apiReference({
      content: document,
      hideClientButton: true,
      metaData: {
        title: 'Repovio API',
      },
      telemetry: false,
      withFastify: true,
    }),
  );

  await app.listen(ENV.PORT, '0.0.0.0');
}

void bootstrap();
