import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { ApiRecentNotificationsSchema } from '@repovio/schemas';
import { ZodSerializerInterceptor } from 'nestjs-zod';

import { PoliciesGuard } from '../../casl/policies.guard.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import type { AuthenticatedUser } from '../auth/types.js';
import { RecentNotificationsController } from './recent-notifications.controller.js';
import { RecentNotificationsService } from './recent-notifications.service.js';

const recipient = {
  id: 'a430980d-04a7-4fc8-951e-b9cc96455751',
  username: 'recipient',
  role: 'VIEWER',
  authProvider: 'LOCAL',
} as const;

/** Exercise authentication metadata and actual response serialization over Fastify HTTP with synthetic identity. */
describe('RecentNotificationsController HTTP', /** Group authenticated personal-history transport cases. */ () => {
  let app: NestFastifyApplication;
  const service = { recent: jest.fn().mockResolvedValue({ items: [] }) };

  beforeAll(
    /** Boot the real controller and serializer while replacing only external authentication and database work. */ async () => {
      const module = await Test.createTestingModule({
        controllers: [RecentNotificationsController],
        providers: [{ provide: RecentNotificationsService, useValue: service }],
      })
        .overrideGuard(JwtAuthGuard)
        .useValue({
          /** Require an explicit synthetic bearer header and attach its own identity to the HTTP request. */
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
          /** Keep role-neutral route policies while testing actual authentication metadata. */ canActivate: () => true,
        })
        .compile();
      app = module.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
      app.setGlobalPrefix('api/v1');
      app.useGlobalInterceptors(new ZodSerializerInterceptor(app.get(Reflector)));
      await app.init();
      await app.getHttpAdapter().getInstance().ready();
    },
  );

  beforeEach(
    /** Clear the service-call history between authenticated and denied requests. */ () => {
      service.recent.mockClear();
    },
  );

  afterAll(
    /** Release the isolated Fastify application. */ async () => {
      await app?.close();
    },
  );

  it('returns 401 without authentication and does not ask for private history', /** Verify the route retains the Authenticated guard. */ async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/notifications/recent' });
    expect(response.statusCode).toBe(401);
    expect(service.recent).not.toHaveBeenCalled();
  });

  it('returns the documented personal envelope for an authenticated Viewer', /** Verify the caller identity, HTTP status, and wire schema. */ async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/notifications/recent',
      headers: { authorization: 'Bearer synthetic-viewer' },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ items: [] });
    expect(ApiRecentNotificationsSchema.safeParse(response.json()).success).toBe(true);
    expect(service.recent).toHaveBeenCalledWith(recipient);
  });
  it('does not let request parameters select another recipient', /** Verify HTTP query parameters cannot override the authenticated identity. */ async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/notifications/recent?userId=foreign-user',
      headers: { authorization: 'Bearer synthetic-viewer' },
    });
    expect(response.statusCode).toBe(200);
    expect(service.recent).toHaveBeenCalledWith(recipient);
  });
});
