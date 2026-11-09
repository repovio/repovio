import { NotificationDeliveryStatus } from '../../generated/prisma/client.js';
import type { JobRunnerService } from '../../jobs/job-runner.service.js';
import type { PrismaService } from '../../prisma/prisma.service.js';
import type { AppriseNotificationAdapter } from './apprise-notification.adapter.js';
import type { BrowserPushDeliveryResult, BrowserPushService } from './browser-push.service.js';
import { NotificationDeliveryService, notificationRetryDelayMs } from './notification-delivery.service.js';

describe('NotificationDeliveryService', /** Groups scenarios for NotificationDeliveryService. */ () => {
  /** Create an isolated test delivery with explicit browser recipients and transport outcomes. */
  function browserFixture(recipients: string[], results: BrowserPushDeliveryResult[] = []) {
    const prisma = {
      notificationDelivery: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'delivery-browser',
            createdAt: new Date('2026-11-09T12:00:00Z'),
            attempts: [],
            kind: 'TEST',
            notificationChannel: {
              enabled: true,
              id: 'channel-browser',
              type: 'BROWSER_PUSH',
              recipients: recipients.map(
                /** Wrap a trusted configured recipient for delivery. */ (id) => ({ user: { id, username: id } }),
              ),
            },
          },
        ]),
        update: jest.fn().mockResolvedValue(undefined),
      },
      notificationDeliveryAttempt: { create: jest.fn().mockResolvedValue(undefined) },
    };
    const browserPush = { sendToUser: jest.fn().mockResolvedValue(results) };
    const service = new NotificationDeliveryService(
      prisma as unknown as PrismaService,
      {} as JobRunnerService,
      { send: jest.fn() } as unknown as AppriseNotificationAdapter,
      browserPush as unknown as BrowserPushService,
    );
    return { prisma, browserPush, service };
  }

  it('attributes expired-device failure to its recipient without referencing the retired subscription', /** Verifies all-expired delivery remains failed with durable ownership. */ async () => {
    const { service, prisma } = browserFixture(
      ['user-a'],
      [
        {
          delivered: false,
          error: 'Browser push subscription expired.',
          recordAttempt: true,
          subscriptionId: null,
          targetId: 'expired-a',
        },
      ],
    );
    await service.deliverPending(['delivery-browser']);
    expect(prisma.notificationDeliveryAttempt.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        recipientUserId: 'user-a',
        deliveredAt: null,
        error: 'Browser push subscription expired.',
        targetKey: 'device:expired-a',
      }),
    });
    expect(prisma.notificationDeliveryAttempt.create.mock.calls[0][0].data).not.toHaveProperty(
      'browserPushSubscriptionId',
    );
    expect(prisma.notificationDelivery.update).toHaveBeenCalledWith({
      where: { id: 'delivery-browser' },
      data: expect.objectContaining({ status: NotificationDeliveryStatus.FAILED, nextAttemptAt: null }),
    });
  });

  it('records two expired devices as distinct stable targets after both device relations disappear', /** Verify orphaned device attempts do not collide on the recipient-level anonymous target. */ async () => {
    const { service, prisma } = browserFixture(
      ['user-a'],
      [
        {
          delivered: false,
          error: 'Browser push subscription expired.',
          recordAttempt: true,
          subscriptionId: null,
          targetId: 'expired-a',
        },
        {
          delivered: false,
          error: 'Browser push subscription expired.',
          recordAttempt: true,
          subscriptionId: null,
          targetId: 'expired-b',
        },
      ],
    );
    await service.deliverPending(['delivery-browser']);
    expect(prisma.notificationDeliveryAttempt.create).toHaveBeenCalledTimes(2);
    for (const targetKey of ['device:expired-a', 'device:expired-b']) {
      expect(prisma.notificationDeliveryAttempt.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ recipientUserId: 'user-a', targetKey, deliveredAt: null }),
      });
    }
  });

  it('records separate attributed failures for recipients without devices', /** Verifies missing enrollment does not collapse different Users into an anonymous failure. */ async () => {
    const { service, prisma, browserPush } = browserFixture(['user-a', 'user-b']);
    browserPush.sendToUser.mockRejectedValue(new Error('private transport detail'));
    await service.deliverPending(['delivery-browser']);
    expect(prisma.notificationDeliveryAttempt.create).toHaveBeenCalledTimes(2);
    for (const recipientUserId of ['user-a', 'user-b']) {
      expect(prisma.notificationDeliveryAttempt.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          recipientUserId,
          deliveredAt: null,
          error: 'Browser push delivery failed.',
          targetKey: `user:${recipientUserId}`,
        }),
      });
    }
  });

  it('finishes a mixed-recipient retry after an already-accepted recipient removes their device', /** Verifies trusted recipient acceptance keeps a removed device satisfied without excusing another User. */ async () => {
    const { service, prisma, browserPush } = browserFixture(['user-a', 'user-b']);
    const source = (await prisma.notificationDelivery.findMany())[0];
    prisma.notificationDelivery.findMany.mockResolvedValue([
      {
        ...source,
        attempts: [{ attempt: 1, recipientUserId: 'user-a', deliveredAt: new Date(), browserPushSubscriptionId: null }],
      },
    ]);
    browserPush.sendToUser.mockImplementation(
      /** Simulate a removed accepted device and a retrying second recipient. */ async (
        _userId: string,
        _payload: unknown,
        _successfulSubscriptions: Set<string>,
        recipientPreviouslyAccepted = false,
      ) => {
        if (recipientPreviouslyAccepted) return [];
        if (_userId === 'user-a') throw new Error('No subscriptions');
        return [
          { delivered: true, error: null, recordAttempt: true, subscriptionId: 'device-b', targetId: 'device-b' },
        ];
      },
    );
    await service.deliverPending(['delivery-browser']);
    expect(browserPush.sendToUser).toHaveBeenCalledWith('user-a', expect.any(Object), new Set(), true);
    expect(browserPush.sendToUser).toHaveBeenCalledWith('user-b', expect.any(Object), new Set(), false);
    expect(prisma.notificationDelivery.update).toHaveBeenCalledWith({
      where: { id: 'delivery-browser' },
      data: expect.objectContaining({ status: NotificationDeliveryStatus.DELIVERED, nextAttemptAt: null }),
    });
  });

  it('does not infer recipient acceptance from unattributed legacy attempts', /** Verifies legacy successes cannot satisfy an arbitrary missing recipient. */ async () => {
    const { service, prisma, browserPush } = browserFixture(['user-a']);
    const source = (await prisma.notificationDelivery.findMany())[0];
    prisma.notificationDelivery.findMany.mockResolvedValue([
      {
        ...source,
        attempts: [{ attempt: 1, recipientUserId: null, deliveredAt: new Date(), browserPushSubscriptionId: null }],
      },
    ]);
    browserPush.sendToUser.mockRejectedValue(new Error('No subscriptions'));
    await service.deliverPending(['delivery-browser']);
    expect(browserPush.sendToUser).toHaveBeenCalledWith('user-a', expect.any(Object), new Set(), false);
    expect(prisma.notificationDelivery.update).toHaveBeenCalledWith({
      where: { id: 'delivery-browser' },
      data: expect.objectContaining({ status: NotificationDeliveryStatus.FAILED }),
    });
  });

  it('persists each recipient outcome independently when another recipient succeeds', /** Verifies a global delivery failure does not erase an accepted User's attempt. */ async () => {
    const { service, prisma, browserPush } = browserFixture(['user-a', 'user-b']);
    browserPush.sendToUser
      .mockResolvedValueOnce([
        { delivered: true, error: null, recordAttempt: true, subscriptionId: 'device-a', targetId: 'device-a' },
      ])
      .mockRejectedValueOnce(new Error('missing device'));
    await service.deliverPending(['delivery-browser']);
    expect(prisma.notificationDeliveryAttempt.create).toHaveBeenCalledTimes(2);
    expect(prisma.notificationDeliveryAttempt.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        recipientUserId: 'user-a',
        deliveredAt: expect.any(Date),
        browserPushSubscriptionId: 'device-a',
      }),
    });
    expect(prisma.notificationDeliveryAttempt.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ recipientUserId: 'user-b', deliveredAt: null }),
    });
    expect(prisma.notificationDelivery.update).toHaveBeenCalledWith({
      where: { id: 'delivery-browser' },
      data: expect.objectContaining({ status: NotificationDeliveryStatus.FAILED }),
    });
  });

  it('uses bounded exponential retry delays', /** Verifies uses bounded exponential retry delays. */ () => {
    expect(notificationRetryDelayMs(1)).toBe(60_000);
    expect(notificationRetryDelayMs(2)).toBe(120_000);
    expect(notificationRetryDelayMs(10)).toBe(60 * 60_000);
  });

  it('records a failed attempt and schedules a retry without resending completed channels', /** Verifies records a failed attempt and schedules a retry without resending completed channels. */ async () => {
    const prisma = {
      notificationDelivery: {
        findMany: jest.fn().mockResolvedValue([
          {
            attempts: [],
            id: 'delivery-a',
            eventType: 'WORKFLOW_RUN_FAILED',
            issue: null,
            kind: 'EVENT',
            notificationChannel: {
              encryptedUrl: 'encrypted-url',
              enabled: true,
              id: 'channel-a',
              recipients: [],
              type: 'CUSTOM_APPRISE',
            },
            pullRequest: null,
            repository: {
              name: 'repovio',
              owner: 'repovio',
              providerAccount: { providerType: 'GITHUB' },
            },
            workflowRun: {
              completedAt: new Date('2026-08-26T12:00:00.000Z'),
              durationMs: 60_000,
              status: 'FAILED',
              url: 'https://github.com/repovio/repovio/actions/runs/1',
              workflowName: 'Test',
            },
          },
        ]),
        update: jest.fn().mockResolvedValue(undefined),
      },
      notificationDeliveryAttempt: { create: jest.fn().mockResolvedValue(undefined) },
    };
    const apprise = { send: jest.fn().mockRejectedValue(new Error('Apprise notification delivery failed.')) };
    const service = new NotificationDeliveryService(
      prisma as unknown as PrismaService,
      {} as JobRunnerService,
      apprise as unknown as AppriseNotificationAdapter,
      { sendToUser: jest.fn() } as unknown as BrowserPushService,
    );

    await service.deliverPending(['delivery-a']);

    expect(prisma.notificationDeliveryAttempt.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        attempt: 1,
        error: 'Apprise notification delivery failed.',
        notificationChannelId: 'channel-a',
        notificationDeliveryId: 'delivery-a',
      }),
    });
    expect(prisma.notificationDelivery.update).toHaveBeenCalledWith({
      data: expect.objectContaining({ status: NotificationDeliveryStatus.PENDING }),
      where: { id: 'delivery-a' },
    });
  });

  it('excludes browser devices that succeeded during an earlier retry attempt', /** Verifies excludes browser devices that succeeded during an earlier retry attempt. */ async () => {
    const prisma = {
      notificationDelivery: {
        findMany: jest.fn().mockResolvedValue([
          {
            attempts: [
              {
                attempt: 1,
                browserPushSubscriptionId: 'subscription-success',
                deliveredAt: new Date('2026-09-13T10:00:00.000Z'),
                notificationChannelId: 'channel-push',
              },
              {
                attempt: 1,
                browserPushSubscriptionId: 'subscription-retry',
                deliveredAt: null,
                notificationChannelId: 'channel-push',
              },
            ],
            id: 'delivery-push',
            eventType: 'WORKFLOW_RUN_FAILED',
            issue: null,
            kind: 'EVENT',
            notificationChannel: {
              enabled: true,
              id: 'channel-push',
              recipients: [{ user: { id: 'user-a', username: 'user' } }],
              type: 'BROWSER_PUSH',
            },
            pullRequest: null,
            repository: {
              name: 'repovio',
              owner: 'repovio',
              providerAccount: { providerType: 'GITHUB' },
            },
            workflowRun: {
              completedAt: new Date('2026-09-13T10:00:00.000Z'),
              durationMs: 60_000,
              status: 'FAILED',
              url: 'https://github.com/repovio/repovio/actions/runs/1',
              workflowName: 'Test',
            },
          },
        ]),
        update: jest.fn().mockResolvedValue(undefined),
      },
      notificationDeliveryAttempt: { create: jest.fn().mockResolvedValue(undefined) },
    };
    const browserPush = {
      sendToUser: jest.fn().mockResolvedValue([
        {
          delivered: true,
          error: null,
          recordAttempt: true,
          subscriptionId: 'subscription-retry',
          targetId: 'subscription-retry',
        },
      ]),
    };
    const service = new NotificationDeliveryService(
      prisma as unknown as PrismaService,
      {} as JobRunnerService,
      { send: jest.fn() } as unknown as AppriseNotificationAdapter,
      browserPush as unknown as BrowserPushService,
    );

    await service.deliverPending(['delivery-push']);

    expect(browserPush.sendToUser).toHaveBeenCalledWith(
      'user-a',
      expect.any(Object),
      new Set(['subscription-success']),
      false,
    );
    expect(prisma.notificationDeliveryAttempt.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        attempt: 2,
        browserPushSubscriptionId: 'subscription-retry',
        deliveredAt: expect.any(Date),
        recipientUserId: 'user-a',
      }),
    });
    expect(prisma.notificationDelivery.update).toHaveBeenCalledWith({
      data: expect.objectContaining({ status: NotificationDeliveryStatus.DELIVERED }),
      where: { id: 'delivery-push' },
    });
  });

  it('builds security-alert payloads only from normalized safe fields', /** Verifies builds security-alert payloads only from normalized safe fields. */ async () => {
    const prisma = {
      notificationDelivery: {
        findMany: jest.fn().mockResolvedValue([
          {
            attempts: [],
            createdAt: new Date('2026-09-29T00:00:00Z'),
            eventType: 'SECRET_ALERT_OPENED',
            id: 'delivery-alert',
            issue: null,
            kind: 'EVENT',
            notificationChannel: {
              encryptedUrl: 'encrypted-url',
              enabled: true,
              id: 'channel-a',
              recipients: [],
              type: 'CUSTOM_APPRISE',
            },
            pullRequest: null,
            repository: {
              name: 'repovio',
              owner: 'repovio',
              providerAccount: { providerType: 'GITHUB' },
            },
            securityAlert: { providerUrl: 'https://github.test/alert/1', title: 'GitHub token' },
            workflowRun: null,
          },
        ]),
        update: jest.fn().mockResolvedValue(undefined),
      },
      notificationDeliveryAttempt: { create: jest.fn().mockResolvedValue(undefined) },
    };
    const apprise = { send: jest.fn().mockResolvedValue(undefined) };
    const service = new NotificationDeliveryService(
      prisma as unknown as PrismaService,
      {} as JobRunnerService,
      apprise as unknown as AppriseNotificationAdapter,
      { sendToUser: jest.fn() } as unknown as BrowserPushService,
    );

    await service.deliverPending(['delivery-alert']);

    expect(apprise.send).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        eventType: 'SECRET_ALERT_OPENED',
        subject: 'GitHub token',
        subjectUrl: 'https://github.test/alert/1',
      }),
    );
  });
});
