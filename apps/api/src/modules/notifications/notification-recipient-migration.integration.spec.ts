import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { CaslAbilityFactory } from '../../casl/casl-ability.factory.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { TestDatabaseService } from '../../prisma/test-database.service.js';
import { RecentNotificationsService } from './recent-notifications.service.js';

/** Exercises the additive schema and real PostgreSQL recipient restrictions. */
describe('notification recipient migration and private persistence', /** Groups disposable PostgreSQL checks. */ () => {
  const prisma = new PrismaService();
  const recent = new RecentNotificationsService(prisma, new CaslAbilityFactory());
  beforeAll(
    /** Connect only the task-owned disposable database. */ async () => {
      await prisma.onModuleInit();
    },
  );
  beforeEach(
    /** Remove only disposable test fixtures. */ async () => {
      await new TestDatabaseService(prisma).cleanup();
    },
  );
  afterAll(
    /** Release PostgreSQL connections. */ async () => {
      await prisma.onModuleDestroy();
    },
  );

  /** Create a local recipient and a browser channel without provider calls. */
  async function fixture() {
    const user = await prisma.user.create({
      data: { username: randomUUID(), passwordHash: 'synthetic-hash', role: 'VIEWER' },
    });
    const channel = await prisma.notificationChannel.create({ data: { name: randomUUID(), type: 'BROWSER_PUSH' } });
    const delivery = await prisma.notificationDelivery.create({
      data: { notificationChannelId: channel.id, deduplicationKey: randomUUID(), kind: 'TEST' },
    });
    return { user, channel, delivery };
  }

  it('keeps old writers compatible and legacy attempts unattributed', /** Checks nullable expansion semantics. */ async () => {
    const { user, channel, delivery } = await fixture();
    const attempt = await prisma.notificationDeliveryAttempt.create({
      data: { attempt: 1, notificationChannelId: channel.id, notificationDeliveryId: delivery.id },
    });
    expect(attempt.recipientUserId).toBeNull();
    expect((await recent.recent(user)).items).toEqual([]);
  });

  it('retains personal history after device deletion and clears identity on user deletion', /** Checks foreign-key lifecycle. */ async () => {
    const { user, channel, delivery } = await fixture();
    const subscription = await prisma.browserPushSubscription.create({
      data: {
        userId: user.id,
        endpointHash: 'f'.repeat(64),
        encryptedEndpoint: 'encrypted',
        encryptedAuth: 'encrypted',
        encryptedP256dh: 'encrypted',
      },
    });
    const attempt = await prisma.notificationDeliveryAttempt.create({
      data: {
        attempt: 1,
        notificationChannelId: channel.id,
        notificationDeliveryId: delivery.id,
        recipientUserId: user.id,
        browserPushSubscriptionId: subscription.id,
        deliveredAt: new Date(),
      },
    });
    await prisma.browserPushSubscription.delete({ where: { id: subscription.id } });
    const retained = await prisma.notificationDeliveryAttempt.findUniqueOrThrow({ where: { id: attempt.id } });
    expect(retained.browserPushSubscriptionId).toBeNull();
    expect(retained.recipientUserId).toBe(user.id);
    expect((await recent.recent(user)).items[0]?.status).toBe('DELIVERED');
    await prisma.user.delete({ where: { id: user.id } });
    expect(
      (await prisma.notificationDeliveryAttempt.findUniqueOrThrow({ where: { id: attempt.id } })).recipientUserId,
    ).toBeNull();
  });

  it('preserves distinct expired and deleted device targets through subscription and User removal', /** Verify stable target uniqueness survives nullable foreign-key cleanup for the same recipient and attempt. */ async () => {
    const { user, channel, delivery } = await fixture();
    const subscriptions = [];
    for (let index = 0; index < 2; index++) {
      subscriptions.push(
        await prisma.browserPushSubscription.create({
          data: {
            userId: user.id,
            endpointHash: String(index + 1).repeat(64),
            encryptedEndpoint: 'synthetic-encrypted-endpoint',
            encryptedAuth: 'synthetic-encrypted-auth',
            encryptedP256dh: 'synthetic-encrypted-public-key',
          },
        }),
      );
    }
    const expiredTargets = [randomUUID(), randomUUID()];
    for (const targetId of expiredTargets) {
      await prisma.notificationDeliveryAttempt.create({
        data: {
          attempt: 1,
          notificationChannelId: channel.id,
          notificationDeliveryId: delivery.id,
          recipientUserId: user.id,
          targetKey: `device:${targetId}`,
          error: 'Browser push subscription expired.',
        },
      });
    }
    for (const subscription of subscriptions) {
      await prisma.notificationDeliveryAttempt.create({
        data: {
          attempt: 1,
          notificationChannelId: channel.id,
          notificationDeliveryId: delivery.id,
          recipientUserId: user.id,
          browserPushSubscriptionId: subscription.id,
          targetKey: `device:${subscription.id}`,
          deliveredAt: new Date(),
        },
      });
    }
    await prisma.browserPushSubscription.deleteMany({ where: { userId: user.id } });
    const retained = await prisma.notificationDeliveryAttempt.findMany({
      where: { notificationDeliveryId: delivery.id },
    });
    expect(retained).toHaveLength(4);
    expect(
      retained.every(
        /** All nullable device links are cleared without deleting the audit trail. */ (attempt) =>
          attempt.browserPushSubscriptionId === null,
      ),
    ).toBe(true);
    expect(
      retained.every(
        /** Recipient attribution survives device removal. */ (attempt) => attempt.recipientUserId === user.id,
      ),
    ).toBe(true);
    expect(
      new Set(
        retained.map(
          /** Read stable target identity independently of device relations. */ (attempt) => attempt.targetKey,
        ),
      ).size,
    ).toBe(4);
    expect((await recent.recent(user)).items).toHaveLength(1);
    await prisma.user.delete({ where: { id: user.id } });
    const anonymized = await prisma.notificationDeliveryAttempt.findMany({
      where: { notificationDeliveryId: delivery.id },
    });
    expect(anonymized).toHaveLength(4);
    expect(
      anonymized.every(
        /** Clearing the User relation does not collide stable target keys. */ (attempt) =>
          attempt.recipientUserId === null,
      ),
    ).toBe(true);
    expect(
      new Set(
        anonymized.map(
          /** Stable keys remain distinct after both foreign keys are cleared. */ (attempt) => attempt.targetKey,
        ),
      ).size,
    ).toBe(4);
  });

  it('backfills legacy device targets idempotently without inferring recipients before device and User deletion', /** Verify the upgrade preserves old per-device audit trails while personal history remains unattributed. */ async () => {
    const { user, channel, delivery } = await fixture();
    const subscriptions = [];
    for (const marker of ['a', 'b']) {
      subscriptions.push(
        await prisma.browserPushSubscription.create({
          data: {
            userId: user.id,
            endpointHash: marker.repeat(64),
            encryptedEndpoint: 'synthetic-encrypted-endpoint',
            encryptedAuth: 'synthetic-encrypted-auth',
            encryptedP256dh: 'synthetic-encrypted-public-key',
          },
        }),
      );
    }
    await prisma.notificationDeliveryAttempt.createMany({
      data: subscriptions.map(
        /** Reproduce records written by the old API without target or recipient attribution. */ (subscription) => ({
          attempt: 1,
          notificationChannelId: channel.id,
          notificationDeliveryId: delivery.id,
          browserPushSubscriptionId: subscription.id,
          deliveredAt: new Date(),
        }),
      ),
    });
    const before = await prisma.notificationDeliveryAttempt.findMany({
      where: { notificationDeliveryId: delivery.id },
    });
    expect(before).toHaveLength(2);
    expect(
      before.every(
        /** Both fields remain null for actual legacy writes. */ (attempt) =>
          attempt.targetKey === null && attempt.recipientUserId === null,
      ),
    ).toBe(true);
    const migration = readFileSync(
      new URL(
        '../../../prisma/migrations/20261109170000_retain_legacy_push_target_identity/migration.sql',
        import.meta.url,
      ),
      'utf8',
    );
    expect(await prisma.$executeRawUnsafe(migration)).toBe(2);
    expect(await prisma.$executeRawUnsafe(migration)).toBe(0);
    const expectedKeys = subscriptions
      .map(
        /** Derive stable device identity without identifying its recipient. */ (subscription) =>
          `device:${subscription.id}`,
      )
      .sort();
    expect((await recent.recent(user)).items).toEqual([]);
    await prisma.browserPushSubscription.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
    const retained = await prisma.notificationDeliveryAttempt.findMany({
      where: { notificationDeliveryId: delivery.id },
    });
    expect(retained).toHaveLength(2);
    expect(
      retained
        .map(/** Retain target identity after both User and device removal. */ (attempt) => attempt.targetKey)
        .sort(),
    ).toEqual(expectedKeys);
    expect(
      retained.every(
        /** Historical ownership remains unknown after the upgrade. */ (attempt) =>
          attempt.recipientUserId === null && attempt.browserPushSubscriptionId === null,
      ),
    ).toBe(true);
  });

  it.each(['legacy-first', 'current-first'])(
    'rejects mixed live-device writers in %s order',
    /** Verify old and new API writers cannot duplicate one live device attempt across partial indexes. */ async (
      order,
    ) => {
      const { user, channel, delivery } = await fixture();
      const subscription = await prisma.browserPushSubscription.create({
        data: {
          userId: user.id,
          endpointHash: 'c'.repeat(64),
          encryptedEndpoint: 'synthetic-encrypted-endpoint',
          encryptedAuth: 'synthetic-encrypted-auth',
          encryptedP256dh: 'synthetic-encrypted-public-key',
        },
      });
      const legacy = {
        attempt: 1,
        notificationChannelId: channel.id,
        notificationDeliveryId: delivery.id,
        browserPushSubscriptionId: subscription.id,
      };
      const current = { ...legacy, recipientUserId: user.id, targetKey: `device:${subscription.id}` };
      const [first, second] = order === 'legacy-first' ? [legacy, current] : [current, legacy];
      try {
        await prisma.notificationDeliveryAttempt.create({ data: first });
        await expect(prisma.notificationDeliveryAttempt.create({ data: second })).rejects.toMatchObject({
          code: 'P2002',
        });
        expect(await prisma.notificationDeliveryAttempt.count({ where: { notificationDeliveryId: delivery.id } })).toBe(
          1,
        );
      } finally {
        // Keep the disposable upgrade fixture clean even when the pre-migration regression fails.
        await prisma.notificationDelivery.delete({ where: { id: delivery.id } });
      }
    },
  );

  it('still rejects duplicate legacy anonymous channel attempts', /** Verify the corrective index preserves existing anonymous attempt deduplication. */ async () => {
    const { channel, delivery } = await fixture();
    const data = { attempt: 1, notificationChannelId: channel.id, notificationDeliveryId: delivery.id };
    await prisma.notificationDeliveryAttempt.create({ data });
    await expect(prisma.notificationDeliveryAttempt.create({ data })).rejects.toMatchObject({ code: 'P2002' });
    expect(await prisma.notificationDeliveryAttempt.count({ where: { notificationDeliveryId: delivery.id } })).toBe(1);
  });

  it('limits distinct deliveries after ownership restrictions and ignores another recipient success', /** Exercises the real restricted query. */ async () => {
    const { user, channel } = await fixture();
    const other = await prisma.user.create({
      data: { username: randomUUID(), passwordHash: 'synthetic-hash', role: 'SYSTEM_ADMIN' },
    });
    for (let index = 0; index < 8; index++) {
      const delivery = await prisma.notificationDelivery.create({
        data: {
          notificationChannelId: channel.id,
          deduplicationKey: randomUUID(),
          kind: 'TEST',
          createdAt: new Date(2026, 0, index + 1),
        },
      });
      await prisma.notificationDeliveryAttempt.createMany({
        data: [
          {
            attempt: 1,
            notificationChannelId: channel.id,
            notificationDeliveryId: delivery.id,
            recipientUserId: user.id,
            targetKey: `user:${user.id}`,
          },
          {
            attempt: 2,
            notificationChannelId: channel.id,
            notificationDeliveryId: delivery.id,
            recipientUserId: user.id,
            targetKey: `user:${user.id}`,
          },
          {
            attempt: 1,
            notificationChannelId: channel.id,
            notificationDeliveryId: delivery.id,
            recipientUserId: other.id,
            targetKey: `user:${other.id}`,
            deliveredAt: new Date(),
          },
        ],
      });
    }
    const history = (await recent.recent(user)).items;
    expect(history).toHaveLength(5);
    expect(new Set(history.map(/** Extract logical identity. */ (item) => item.id)).size).toBe(5);
    expect(
      history.every(/** Other users' success cannot change this user's state. */ (item) => item.status === 'FAILED'),
    ).toBe(true);
    expect(
      (await recent.recent(other)).items.every(
        /** Administrators still see only their own successes. */ (item) => item.status === 'DELIVERED',
      ),
    ).toBe(true);
  });

  it('applies live repository revocation before exposing subject context', /** Checks actual CASL query filtering. */ async () => {
    const { user, channel } = await fixture();
    const account = await prisma.providerAccount.create({
      data: {
        displayName: randomUUID(),
        providerType: 'GITHUB',
        baseUrl: 'https://github.com',
        encryptedAccessToken: 'synthetic',
      },
    });
    const repository = await prisma.repository.create({
      data: {
        name: 'restricted',
        owner: 'synthetic',
        providerAccountId: account.id,
        providerRepositoryId: '65',
        url: 'https://github.com/synthetic/restricted',
      },
    });
    const delivery = await prisma.notificationDelivery.create({
      data: {
        notificationChannelId: channel.id,
        repositoryId: repository.id,
        deduplicationKey: randomUUID(),
        eventType: 'ISSUE_OPENED',
      },
    });
    await prisma.notificationDeliveryAttempt.create({
      data: {
        attempt: 1,
        notificationChannelId: channel.id,
        notificationDeliveryId: delivery.id,
        recipientUserId: user.id,
      },
    });
    expect((await recent.recent(user)).items).toHaveLength(0);
    await prisma.repositoryMembership.create({
      data: { userId: user.id, repositoryId: repository.id, role: 'VIEWER' },
    });
    expect((await recent.recent(user)).items).toHaveLength(1);
    await prisma.repositoryMembership.deleteMany({ where: { userId: user.id } });
    expect((await recent.recent(user)).items).toHaveLength(0);
  });

  it('installs the recipient index and can plan an attributed query', /** Checks representative query planning without production data. */ async () => {
    const indexes = await prisma.$queryRawUnsafe<Array<{ indexname: string }>>(
      "SELECT indexname FROM pg_indexes WHERE indexname = 'notification_attempt_recipient_delivery_created_idx'",
    );
    expect(indexes).toHaveLength(1);
    const plan = await prisma.$queryRawUnsafe<unknown[]>(
      'EXPLAIN SELECT "notificationDeliveryId" FROM notification_delivery_attempts WHERE "recipientUserId" = $1::uuid ORDER BY "notificationDeliveryId", "createdAt"',
      randomUUID(),
    );
    expect(plan.length).toBeGreaterThan(0);
  });
});
