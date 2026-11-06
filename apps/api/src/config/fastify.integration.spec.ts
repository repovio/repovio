import cookie from '@fastify/cookie';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
  type RawBodyRequest,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FastifyAdapter, FileInterceptor, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Test } from '@nestjs/testing';
import { ApiIssueQuerySchema, ApiUpdateProfileSchema } from '@repovio/schemas';
import type { FastifyReply, FastifyRequest } from 'fastify';
import {
  cleanupOpenApiDoc,
  createZodDto,
  ZodSerializerDto,
  ZodSerializerInterceptor,
  ZodValidationPipe,
} from 'nestjs-zod';
import { createHmac } from 'node:crypto';
import { z } from 'zod';

import { HttpExceptionFilter } from '../filters/http-exception.filter.js';
import { PrismaExceptionFilter } from '../prisma/prisma-exception.filter.js';
import { ApiPaginatedResponse, PublicQueryPipe } from '../util/resource-contract.js';
import { WireInterceptor } from '../util/wire.interceptor.js';

const webhookSecret = 'synthetic-webhook-signing-key';
const responseSecret = 'synthetic-secret-that-must-not-be-returned';
const uploadLimit = 2 * 1024 * 1024;

class ProfileInput extends createZodDto(ApiUpdateProfileSchema) {}
class IssueQueryInput extends createZodDto(ApiIssueQuerySchema) {}
class TimestampOutput extends createZodDto(z.strictObject({ updatedAt: z.iso.datetime() })) {}
class ProjectedResource extends createZodDto(
  z.strictObject({ id: z.string(), displayName: z.string().default('must-not-be-restored') }),
) {}

/** Exercise the production transport stack without a database or provider connection. */
@Controller('fixture')
class FastifyFixtureController {
  /** Return the request after the shared profile schema has normalized it. */
  @Post('profile')
  @HttpCode(200)
  profile(@Body() body: ProfileInput): ProfileInput {
    return body;
  }

  /** Return normalized and validated resource query parameters. */
  @Get('issues')
  issues(@Query() query: IssueQueryInput): IssueQueryInput {
    return query;
  }

  /** Verify wire conversion precedes response validation. */
  @Get('timestamp')
  @ZodSerializerDto(TimestampOutput)
  timestamp(): { updatedAt: Date } {
    return { updatedAt: new Date('2026-11-05T12:00:00.000Z') };
  }

  /** Deliberately violate the response schema to verify safe error handling. */
  @Get('invalid-response')
  @ZodSerializerDto(TimestampOutput)
  invalidResponse(): { updatedAt: string } {
    return { updatedAt: responseSecret };
  }

  /** Return a projected page with fields deliberately omitted by authorization. */
  @Get('projected')
  @ApiPaginatedResponse({ model: ProjectedResource })
  projected(): unknown {
    return {
      items: [{ id: 'visible-id' }],
      meta: { page: 1, perPage: 10, itemCount: 1, pageCount: 1, hasNextPage: false, hasPrevPage: false },
    };
  }

  /** Verify a provider-style signature against original, unparsed request bytes. */
  @Post('webhook')
  @HttpCode(202)
  webhook(@Req() request: RawBodyRequest<FastifyRequest>): { accepted: boolean } {
    if (!request.rawBody) throw new BadRequestException('Raw body missing');
    const signature = createHmac('sha256', webhookSecret).update(request.rawBody).digest('hex');
    if (request.headers['x-fixture-signature'] !== signature) throw new BadRequestException('Invalid signature');
    return { accepted: true };
  }

  /** Exercise the same buffered multipart field and file limit used for avatars. */
  @Post('avatar')
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: uploadLimit, files: 1 } }))
  avatar(@UploadedFile() file?: { buffer: Buffer; mimetype: string }): { size: number; mimeType: string } {
    if (!file) throw new BadRequestException('An avatar image is required.');
    return { size: file.buffer.length, mimeType: file.mimetype };
  }

  /** Exercise Fastify cookie and redirect APIs through a real HTTP response. */
  @Get('oidc')
  oidc(@Res() response: FastifyReply): void {
    response.header('Cache-Control', 'no-store');
    response.setCookie('repovio_oidc_binding', 'synthetic-binding', {
      httpOnly: true,
      maxAge: 86_400,
      path: '/api/v1/auth/oidc',
      sameSite: 'lax',
      secure: true,
    });
    response.redirect('/auth/oidc/callback#code=opaque-code', 302);
  }
}

describe('Fastify HTTP transport integration', /** Groups scenarios for Fastify HTTP transport integration. */ () => {
  let app: NestFastifyApplication;
  let baseUrl: string;

  beforeAll(
    /** Prepares shared test state for beforeAll. */ async () => {
      const moduleRef = await Test.createTestingModule({ controllers: [FastifyFixtureController] }).compile();
      app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter(), { rawBody: true });
      await app.register(cookie);
      app.useGlobalPipes(new PublicQueryPipe(), new ZodValidationPipe());
      app.useGlobalInterceptors(new ZodSerializerInterceptor(app.get(Reflector)), new WireInterceptor());
      app.useGlobalFilters(new PrismaExceptionFilter(), new HttpExceptionFilter());
      await app.listen(0, '127.0.0.1');
      baseUrl = await app.getUrl();
    },
  );

  afterAll(/** Restores shared test state for afterAll. */ async () => app?.close());

  it('accepts and normalizes shared profile input through the actual request pipeline', /** Verifies accepts and normalizes shared profile input through the actual request pipeline. */ async () => {
    const response = await fetch(`${baseUrl}/fixture/profile`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ firstName: ' Vera ', lastName: null, username: ' viewer ' }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ firstName: 'Vera', lastName: null, username: 'viewer' });
  });

  it.each([
    { firstName: null, lastName: null, username: '   ' },
    { firstName: null, lastName: null, username: 'viewer', role: 'SYSTEM_ADMIN' },
  ])(
    'rejects invalid or unknown profile fields without exposing submitted values',
    /** Verifies rejects invalid or unknown profile fields without exposing submitted values. */ async (input) => {
      const response = await fetch(`${baseUrl}/fixture/profile`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
      });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body).toMatchObject({ error: 'BAD_REQUEST', statusCode: 400, message: expect.any(Array) });
      expect(JSON.stringify(body)).not.toContain('SYSTEM_ADMIN');
    },
  );

  it.each([
    new URLSearchParams({ where: JSON.stringify({ title: { contains: 'fix' } }), orderBy: '{"title":"asc"}' }),
    new URLSearchParams({ 'where.title.contains': 'fix', 'orderBy.title': 'asc' }),
  ])(
    'normalizes structured resource queries while preserving scalar fields',
    /** Verifies normalizes structured resource queries while preserving scalar fields. */ async (query) => {
      query.set('fields', '123');
      query.set('page', '2');
      query.set('perPage', '25');
      const response = await fetch(`${baseUrl}/fixture/issues?${query}`);

      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({
        where: { title: { contains: 'fix' } },
        orderBy: { title: 'asc' },
        fields: '123',
        page: 2,
        perPage: 25,
      });
    },
  );

  it('rejects unrecognized query properties and invalid pagination', /** Verifies rejects unrecognized query properties and invalid pagination. */ async () => {
    const response = await fetch(`${baseUrl}/fixture/issues?page=0&arbitrary=true`);
    expect(response.status).toBe(400);
  });

  it('serializes mapped dates before validating documented responses', /** Verifies serializes mapped dates before validating documented responses. */ async () => {
    const response = await fetch(`${baseUrl}/fixture/timestamp`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ updatedAt: '2026-11-05T12:00:00.000Z' });
  });

  it('returns a safe 500 for invalid response data without leaking its value', /** Verifies returns a safe 500 for invalid response data without leaking its value. */ async () => {
    const response = await fetch(`${baseUrl}/fixture/invalid-response`);
    const body = await response.text();
    expect(response.status).toBe(500);
    expect(JSON.parse(body)).toEqual({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
      statusCode: 500,
    });
    expect(body).not.toContain(responseSecret);
  });

  it('does not restore a projected field through schema defaults', /** Verifies does not restore a projected field through schema defaults. */ async () => {
    const response = await fetch(`${baseUrl}/fixture/projected`);
    expect(response.status).toBe(200);
    expect((await response.json()).items).toEqual([{ id: 'visible-id' }]);
  });

  it('generates OpenAPI from the same response schemas used at runtime', /** Verifies generates OpenAPI from the same response schemas used at runtime. */ () => {
    const document = cleanupOpenApiDoc(
      SwaggerModule.createDocument(app, new DocumentBuilder().setTitle('Transport fixture').setVersion('1').build()),
    );
    expect(document.paths['/fixture/timestamp']?.get).toBeDefined();
    expect(document.paths['/fixture/projected']?.get?.responses['200']).toHaveProperty('content.application/json');
    expect(document.components?.schemas).toBeDefined();
  });

  it('retains signed raw webhook bytes including whitespace', /** Verifies retains signed raw webhook bytes including whitespace. */ async () => {
    const body = '{\n  "repository": { "id": 42 }, "name": "synthetic"\n}\n';
    const signature = createHmac('sha256', webhookSecret).update(body).digest('hex');
    const response = await fetch(`${baseUrl}/fixture/webhook`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-fixture-signature': signature },
      body,
    });
    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ accepted: true });
  });

  it('preserves OIDC redirect, cache and binding-cookie semantics', /** Verifies preserves OIDC redirect, cache and binding-cookie semantics. */ async () => {
    const response = await fetch(`${baseUrl}/fixture/oidc`, { redirect: 'manual' });
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('/auth/oidc/callback#code=opaque-code');
    expect(response.headers.get('cache-control')).toBe('no-store');
    const binding = response.headers.get('set-cookie');
    expect(binding).toContain('repovio_oidc_binding=synthetic-binding');
    expect(binding).toContain('Max-Age=86400');
    expect(binding).toContain('Path=/api/v1/auth/oidc');
    expect(binding).toContain('HttpOnly');
    expect(binding).toContain('Secure');
    expect(binding).toContain('SameSite=Lax');
  });

  it.each([
    [uploadLimit, 200],
    [uploadLimit + 1, 413],
  ])(
    'enforces the avatar file size boundary at %i bytes',
    /** Verifies enforces the avatar file size boundary at %i bytes. */ async (size, expectedStatus) => {
      const form = new FormData();
      form.set('file', new Blob([new Uint8Array(size)], { type: 'image/png' }), 'avatar.png');
      const response = await fetch(`${baseUrl}/fixture/avatar`, { method: 'POST', body: form });

      expect(response.status).toBe(expectedStatus);
      if (expectedStatus === 200) expect(await response.json()).toEqual({ size, mimeType: 'image/png' });
      else expect(await response.json()).toMatchObject({ statusCode: 413 });
    },
  );
});
