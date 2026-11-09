import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { ApiBrowserPushEnrollmentSchema } from '@repovio/schemas';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';

import { PoliciesGuard } from '../../casl/policies.guard.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import type { AuthenticatedUser } from '../auth/types.js';
import { BrowserPushController } from './browser-push.controller.js';
import { BrowserPushService } from './browser-push.service.js';

const recipient = {
  id: 'a430980d-04a7-4fc8-951e-b9cc96455751',
  username: 'recipient',
  role: 'VIEWER',
  authProvider: 'LOCAL',
} as const;
const endpoint = 'https://push.example.test/current-device';
const headers = { authorization: 'Bearer synthetic-viewer' };

/** Exercise the enrollment endpoint through actual HTTP validation and response serialization. */
describe('BrowserPushController enrollment HTTP', /** Group safe current-device lookup cases. */ () => {
  let app: NestFastifyApplication;
  const service = { enrolled: jest.fn().mockResolvedValue({ enrolled: false }) };

  beforeAll(
    /** Boot the controller with real Zod pipes and synthetic authentication only. */ async () => {
      const module = await Test.createTestingModule({
        controllers: [BrowserPushController],
        providers: [{ provide: BrowserPushService, useValue: service }],
      })
        .overrideGuard(JwtAuthGuard)
        .useValue({
          /** Require authentication before any endpoint can inspect enrollment. */
          canActivate(context: ExecutionContext): boolean {
            const request = context
              .switchToHttp()
              .getRequest<{ headers: Record<string, string>; user: AuthenticatedUser }>();
            if (!request.headers.authorization) throw new UnauthorizedException();
            request.user = recipient;
            return true;
          },
        })
        .overrideGuard(PoliciesGuard)
        .useValue({
          /** Retain role-neutral lookup behavior while the service owns recipient restrictions. */ canActivate: () =>
            true,
        })
        .compile();
      app = module.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
      app.setGlobalPrefix('api/v1');
      app.useGlobalPipes(new ZodValidationPipe());
      app.useGlobalInterceptors(new ZodSerializerInterceptor(app.get(Reflector)));
      await app.init();
      await app.getHttpAdapter().getInstance().ready();
    },
  );

  beforeEach(
    /** Isolate enrollment outcomes between requests. */ () => {
      service.enrolled.mockReset();
      service.enrolled.mockResolvedValue({ enrolled: false });
    },
  );

  afterAll(
    /** Close the isolated Fastify server. */ async () => {
      await app?.close();
    },
  );

  it.each([false, true])(
    'returns only enrolled=%s for the authenticated account',
    /** Verify exact status, response schema, and trusted service identity. */ async (enrolled) => {
      service.enrolled.mockResolvedValue({ enrolled });
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/browser-push/subscriptions/status',
        headers,
        payload: { endpoint },
      });
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ enrolled });
      expect(ApiBrowserPushEnrollmentSchema.safeParse(response.json()).success).toBe(true);
      expect(service.enrolled).toHaveBeenCalledWith(recipient.id, endpoint);
    },
  );

  it.each(['unknown-device', 'foreign-owned-device'])(
    'does not expose owner metadata for %s',
    /** Verify unowned lookup responses are indistinguishable and contain no identity fields. */ async (suffix) => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/browser-push/subscriptions/status',
        headers,
        payload: { endpoint: `https://push.example.test/${suffix}` },
      });
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ enrolled: false });
      expect(Object.keys(response.json())).toEqual(['enrolled']);
      expect(service.enrolled).toHaveBeenCalledWith(recipient.id, `https://push.example.test/${suffix}`);
    },
  );

  it.each([
    {},
    { endpoint: 'http://push.example.test/insecure' },
    { endpoint: 'not a URL' },
    { endpoint: 42 },
    { endpoint, userId: 'foreign-user' },
    { endpoint, endpointHash: 'foreign-hash' },
    { endpoint: `https://push.example.test/${'x'.repeat(4096)}` },
  ])(
    'rejects invalid or extra input without performing a lookup',
    /** Verify shared strict HTTPS input validation runs on the actual HTTP boundary. */ async (payload) => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/browser-push/subscriptions/status',
        headers,
        payload,
      });
      expect(response.statusCode).toBe(400);
      expect(service.enrolled).not.toHaveBeenCalled();
    },
  );

  it('rejects malformed JSON before reaching the service', /** Verify malformed wire content cannot bypass validation. */ async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/browser-push/subscriptions/status',
      headers: { ...headers, 'content-type': 'application/json' },
      payload: '{',
    });
    expect(response.statusCode).toBe(400);
    expect(service.enrolled).not.toHaveBeenCalled();
  });

  it('requires authentication before checking even a valid endpoint', /** Verify authentication metadata remains attached to the new operation. */ async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/browser-push/subscriptions/status',
      payload: { endpoint },
    });
    expect(response.statusCode).toBe(401);
    expect(service.enrolled).not.toHaveBeenCalled();
  });
});
