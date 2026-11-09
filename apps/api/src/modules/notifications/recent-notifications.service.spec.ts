import { ApiRecentNotificationsSchema } from '@repovio/schemas';

import { CaslAbilityFactory } from '../../casl/casl-ability.factory.js';
import type { PrismaService } from '../../prisma/prisma.service.js';
import type { AuthenticatedUser } from '../auth/types.js';
import { RecentNotificationsService } from './recent-notifications.service.js';

const userId = 'a430980d-04a7-4fc8-951e-b9cc96455751';
const repositoryId = 'b430980d-04a7-4fc8-951e-b9cc96455752';
const deliveryId = 'c430980d-04a7-4fc8-951e-b9cc96455753';
const roles = ['SYSTEM_ADMIN', 'MANAGER', 'VIEWER'] as const;

/** Create a persisted delivery with private transport metadata and one caller-owned failed attempt. */
function deliveryFixture() {
  return {
    id: deliveryId,
    createdAt: new Date('2026-11-09T12:00:00Z'),
    kind: 'EVENT',
    eventType: 'WORKFLOW_RUN_FAILED' as string | null,
    status: 'DELIVERED',
    nextAttemptAt: null as Date | null,
    finalError: 'never-expose-error',
    notificationChannel: { type: 'BROWSER_PUSH', encryptedUrl: 'never-expose-credentials' },
    repository: { id: repositoryId, owner: 'example', name: 'project' } as {
      id: string;
      owner: string;
      name: string;
    } | null,
    workflowRun: { workflowName: 'CI', url: 'https://example.com/actions/run' } as {
      workflowName: string;
      url: string;
    } | null,
    issue: null,
    pullRequest: null,
    securityAlert: null,
    attempts: [{ recipientUserId: userId, deliveredAt: null as Date | null, error: 'never-expose-device-error' }],
  };
}

/** Build a mocked database with real CASL abilities so database restrictions can be inspected. */
function serviceFixture() {
  const row = deliveryFixture();
  const prisma = {
    repositoryMembership: { findMany: jest.fn().mockResolvedValue([{ repositoryId, role: 'VIEWER' }]) },
    repositoryGroupGrant: { findMany: jest.fn().mockResolvedValue([]) },
    notificationDelivery: { findMany: jest.fn().mockResolvedValue([row]) },
  };
  return {
    row,
    prisma,
    service: new RecentNotificationsService(prisma as unknown as PrismaService, new CaslAbilityFactory()),
  };
}

/** Construct an authenticated identity with the requested application-wide role. */
function caller(role: AuthenticatedUser['role']): AuthenticatedUser {
  return { id: userId, username: 'recipient', authProvider: 'LOCAL', role };
}

describe('RecentNotificationsService', /** Group recipient projection and database authorization regressions. */ () => {
  it.each(roles)(
    'restricts %s callers to their own browser attempts before limiting',
    /** Verify even administrator queries cannot bypass recipient ownership. */ async (role) => {
      const { prisma, service } = serviceFixture();
      await service.recent(caller(role));
      expect(prisma.notificationDelivery.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({ attempts: { some: { recipientUserId: userId } } }),
              expect.objectContaining({ notificationChannel: { type: 'BROWSER_PUSH' } }),
            ]),
          }),
          select: expect.objectContaining({
            attempts: expect.objectContaining({ where: { recipientUserId: userId } }),
          }),
        }),
      );
    },
  );

  it('resolves Repository permissions again after membership revocation', /** Verify query restrictions reflect current grants rather than cached history or token roles. */ async () => {
    const { service, prisma } = serviceFixture();
    await service.recent(caller('VIEWER'));
    const before = JSON.stringify(prisma.notificationDelivery.findMany.mock.calls[0][0].where);
    expect(before).toContain(repositoryId);
    prisma.repositoryMembership.findMany.mockResolvedValue([]);
    await service.recent(caller('VIEWER'));
    const after = JSON.stringify(prisma.notificationDelivery.findMany.mock.calls[1][0].where);
    expect(after).not.toContain(repositoryId);
    expect(after).toContain('TEST');
    expect(after).toContain('repositoryId');
    expect(prisma.repositoryMembership.findMany).toHaveBeenCalledTimes(2);
    expect(prisma.repositoryGroupGrant.findMany).toHaveBeenCalledTimes(2);
  });

  it('uses inherited Repository grants without widening recipient ownership', /** Verify group access remains additive and is resolved from trusted membership records. */ async () => {
    const { service, prisma } = serviceFixture();
    prisma.repositoryMembership.findMany.mockResolvedValue([]);
    prisma.repositoryGroupGrant.findMany.mockResolvedValue([{ repositoryId, role: 'VIEWER' }]);
    await service.recent(caller('MANAGER'));
    const query = JSON.stringify(prisma.notificationDelivery.findMany.mock.calls[0][0].where);
    expect(query).toContain(repositoryId);
    expect(query).toContain(userId);
    expect(prisma.repositoryGroupGrant.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { group: { members: { some: { userId } } } } }),
    );
  });

  it('derives failed state only from the caller despite another recipient making the delivery successful', /** Verify administrative aggregate status does not leak into personal send state. */ async () => {
    const { service } = serviceFixture();
    const result = await service.recent(caller('VIEWER'));
    expect(result.items).toEqual([
      {
        id: deliveryId,
        createdAt: '2026-11-09T12:00:00.000Z',
        kind: 'EVENT',
        eventType: 'WORKFLOW_RUN_FAILED' as string | null,
        repository: { id: repositoryId, owner: 'example', name: 'project' },
        subjectTitle: 'CI',
        subjectUrl: 'https://example.com/actions/run',
        status: 'FAILED',
      },
    ]);
    expect(ApiRecentNotificationsSchema.safeParse(result).success).toBe(true);
    expect(JSON.stringify(result)).not.toContain('never-expose');
  });

  it('shows pending for a caller with no accepted device while retry remains scheduled', /** Verify retry state is distinct from terminal personal failure. */ async () => {
    const { service, row } = serviceFixture();
    row.nextAttemptAt = new Date('2026-11-09T12:01:00Z');
    expect((await service.recent(caller('VIEWER'))).items[0].status).toBe('PENDING');
  });

  it('shows accepted once for a logical delivery even when another personal device failed', /** Verify the accepted outcome survives later retries and multiple device attempts. */ async () => {
    const { service, row } = serviceFixture();
    row.attempts.push({ recipientUserId: userId, deliveredAt: new Date('2026-11-09T12:00:01Z'), error: '' });
    row.nextAttemptAt = new Date('2026-11-09T12:01:00Z');
    const result = await service.recent(caller('VIEWER'));
    expect(result.items).toHaveLength(1);
    expect(result.items[0].status).toBe('DELIVERED');
  });

  it.each(['javascript:alert(1)', 'file:///tmp/secret', 'https://name:password@example.com/path', 'not a url'])(
    'removes unsafe subject destination %s',
    /** Verify safe history links cannot expose embedded credentials or execute unexpected schemes. */ async (url) => {
      const { service, row } = serviceFixture();
      row.workflowRun!.url = url;
      const result = await service.recent(caller('VIEWER'));
      expect(result.items[0].subjectUrl).toBeNull();
    },
  );

  it('projects a personally attributed test without a Repository or source link', /** Verify test history remains meaningful without widening access to unrelated event subjects. */ async () => {
    const { service, row } = serviceFixture();
    row.kind = 'TEST';
    row.eventType = null;
    row.repository = null;
    row.workflowRun = null;
    const result = await service.recent(caller('VIEWER'));
    expect(result.items[0]).toEqual(
      expect.objectContaining({
        kind: 'TEST',
        eventType: null,
        repository: null,
        subjectUrl: null,
        subjectTitle: 'Repovio test notification',
      }),
    );
    expect(ApiRecentNotificationsSchema.safeParse(result).success).toBe(true);
  });

  it('restricts security-alert subjects separately from ordinary Repository visibility', /** Verify Viewer repository grants cannot expose restricted security alert metadata. */ async () => {
    const { service, prisma } = serviceFixture();
    await service.recent(caller('VIEWER'));
    expect(prisma.notificationDelivery.findMany.mock.calls[0][0].where.AND).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ OR: [{ securityAlertId: null }, { securityAlert: { is: { id: { in: [] } } } }] }),
      ]),
    );
  });

  it('returns an explicit empty list when the database finds no attributed visible deliveries', /** Verify empty results are valid for newly enrolled and legacy-only users. */ async () => {
    const { service, prisma } = serviceFixture();
    prisma.notificationDelivery.findMany.mockResolvedValue([]);
    await expect(service.recent(caller('VIEWER'))).resolves.toEqual({ items: [] });
  });
});
