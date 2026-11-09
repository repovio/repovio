import { createHash } from 'node:crypto';

import { jest } from '@jest/globals';
import { ForbiddenException, ServiceUnavailableException } from '@nestjs/common';
import { WebPushError } from 'web-push';

import type { PrismaService } from '../../prisma/prisma.service.js';
import type { CredentialEncryptionService } from '../../security/credential-encryption.service.js';
import type { NotificationPayload } from './notification-channel-adapter.js';

const sendNotification = jest.fn<() => Promise<unknown>>();

jest.unstable_mockModule(
  'web-push',
  /** Isolates transport requests while retaining the provider error class. */ () => ({
    WebPushError,
    sendNotification,
  }),
);

const { BrowserPushService } = await import('./browser-push.service.js');

const payload: NotificationPayload = {
  eventType: 'TEST',
  occurredAt: new Date('2026-11-09T12:00:00Z'),
  provider: 'GITHUB',
  repository: 'Repovio',
  subject: 'Test notification',
  subjectUrl: 'https://example.com/subject',
};
const device = {
  id: 'device-a',
  userId: 'user-a',
  endpointHash: 'endpoint-hash',
  encryptedEndpoint: 'https://push.example.com/subscription',
  encryptedAuth: 'auth',
  encryptedP256dh: 'key',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('BrowserPushService', /** Groups scenarios for BrowserPushService. */ () => {
  beforeEach(
    /** Clears transport outcomes between independent cases. */ () => {
      sendNotification.mockReset();
      sendNotification.mockResolvedValue(undefined);
    },
  );

  it('looks up enrollment by endpoint hash and authenticated owner only', /** Verifies ownership is part of the database restriction. */ async () => {
    const { service, prisma } = createService();
    prisma.browserPushSubscription.count.mockResolvedValue(1);
    const endpoint = 'https://push.example.com/subscription';
    await expect(service.enrolled('user-a', endpoint)).resolves.toEqual({ enrolled: true });
    expect(prisma.browserPushSubscription.count).toHaveBeenCalledWith({
      where: { endpointHash: createHash('sha256').update(endpoint).digest('hex'), userId: 'user-a' },
    });
    prisma.browserPushSubscription.count.mockResolvedValue(0);
    await expect(service.enrolled('user-a', endpoint)).resolves.toEqual({ enrolled: false });
  });

  it("does not use another recipient's successful device to hide missing enrollment", /** Verifies per-user enrollment failure despite global successes. */ async () => {
    const { service } = createService();
    await expect(service.sendToUser('user-a', payload, new Set(['foreign-device']))).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(sendNotification).not.toHaveBeenCalled();
  });

  it("excludes only the current recipient's successfully delivered devices", /** Verifies the current User’s device set controls retries. */ async () => {
    const { service, prisma } = createService();
    prisma.browserPushSubscription.findMany.mockResolvedValue([device]);
    await expect(service.sendToUser('user-a', payload, new Set([device.id]))).resolves.toEqual([]);
    expect(prisma.browserPushSubscription.findMany).toHaveBeenCalledWith({ where: { userId: 'user-a' } });
    expect(sendNotification).not.toHaveBeenCalled();
  });

  it.each([404, 410])(
    'records expired target %s as failed after safe retirement',
    /** Verifies expired subscriptions are neither successful nor referenced after removal. */ async (statusCode) => {
      const { service, prisma } = createService();
      prisma.browserPushSubscription.findMany.mockResolvedValue([device]);
      sendNotification.mockRejectedValue(
        new WebPushError('secret endpoint rejected', statusCode, {}, 'secret body', device.encryptedEndpoint),
      );
      await expect(service.sendToUser('user-a', payload, new Set())).resolves.toEqual([
        {
          delivered: false,
          error: 'Browser push subscription expired.',
          recordAttempt: true,
          subscriptionId: null,
          targetId: device.id,
        },
      ]);
      expect(prisma.browserPushSubscription.deleteMany).toHaveBeenCalledWith({ where: { id: device.id } });
    },
  );

  it('keeps a previously accepted recipient satisfied after their last device is removed', /** Verifies trusted recipient attribution survives later device deletion. */ async () => {
    const { service } = createService();
    await expect(service.sendToUser('user-a', payload, new Set(['removed-own-device']), true)).resolves.toEqual([]);
    expect(sendNotification).not.toHaveBeenCalled();
  });

  it('still retries registered failed devices after another personal device was accepted', /** Verifies previous recipient acceptance does not skip remaining live failed targets. */ async () => {
    const { service, prisma } = createService();
    prisma.browserPushSubscription.findMany.mockResolvedValue([device]);
    sendNotification.mockRejectedValue(new Error('retryable transport detail'));
    await expect(service.sendToUser('user-a', payload, new Set(['removed-own-device']), true)).resolves.toEqual([
      {
        delivered: false,
        error: 'Browser push delivery failed.',
        recordAttempt: true,
        subscriptionId: device.id,
        targetId: device.id,
      },
    ]);
    expect(sendNotification).toHaveBeenCalledTimes(1);
  });

  it('retains a valid failed device for retry and sanitizes its error', /** Verifies retriable transport errors do not expose credentials. */ async () => {
    const { service, prisma } = createService();
    prisma.browserPushSubscription.findMany.mockResolvedValue([device]);
    sendNotification.mockRejectedValue(new Error('secret transport detail'));
    await expect(service.sendToUser('user-a', payload, new Set())).resolves.toEqual([
      {
        delivered: false,
        error: 'Browser push delivery failed.',
        recordAttempt: true,
        subscriptionId: device.id,
        targetId: device.id,
      },
    ]);
    expect(prisma.browserPushSubscription.deleteMany).not.toHaveBeenCalled();
  });

  /** Creates service. */
  function createService(existingUserId?: string) {
    const prisma = {
      browserPushSubscription: {
        count: jest.fn<() => Promise<number>>().mockResolvedValue(0),
        findMany: jest.fn<() => Promise<(typeof device)[]>>().mockResolvedValue([]),
        deleteMany: jest.fn<() => Promise<{ count: number }>>().mockResolvedValue({ count: 1 }),
        findUnique: jest
          .fn<() => Promise<{ userId: string } | null>>()
          .mockResolvedValue(existingUserId ? { userId: existingUserId } : null),
        upsert: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      },
    };
    const credentials = {
      decrypt: jest.fn(/** Returns the already-decrypted fixture value. */ (value: string) => value),
      encrypt: jest.fn(
        /** Provides isolated encrypt behavior for this test fixture. */ (value: string) => `encrypted:${value}`,
      ),
    };
    return {
      credentials,
      prisma,
      service: new BrowserPushService(
        prisma as unknown as PrismaService,
        credentials as unknown as CredentialEncryptionService,
      ),
    };
  }

  it('encrypts browser endpoint and key material before persistence', /** Verifies encrypts browser endpoint and key material before persistence. */ async () => {
    const { credentials, prisma, service } = createService();
    await service.register('user-a', {
      endpoint: 'https://push.example.com/subscription',
      keys: { auth: 'auth-secret', p256dh: 'public-key' },
    });

    expect(credentials.encrypt).toHaveBeenCalledTimes(3);
    expect(prisma.browserPushSubscription.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          encryptedAuth: 'encrypted:auth-secret',
          encryptedEndpoint: 'encrypted:https://push.example.com/subscription',
          encryptedP256dh: 'encrypted:public-key',
          userId: 'user-a',
        }),
      }),
    );
  });

  it('does not transfer an existing endpoint between users', /** Verifies does not transfer an existing endpoint between users. */ async () => {
    const { service } = createService('user-b');
    await expect(
      service.register('user-a', {
        endpoint: 'https://push.example.com/subscription',
        keys: { auth: 'auth-secret', p256dh: 'public-key' },
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
