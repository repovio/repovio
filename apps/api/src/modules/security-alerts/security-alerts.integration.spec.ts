import { ForbiddenException } from '@nestjs/common';

import { CaslAbilityFactory } from '../../casl/casl-ability.factory.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { TestDatabaseService } from '../../prisma/test-database.service.js';
import type { AuthenticatedUser } from '../auth/types.js';
import { SecurityAlertsQueryService } from './security-alerts-query.service.js';
import { SecurityAlertsController } from './security-alerts.controller.js';

describe.each(['direct', 'group'] as const)(
  'security-alert authorization integration',
  /** Groups scenarios for security-alert authorization integration. */ (grantSource) => {
    const prisma = new PrismaService();
    const database = new TestDatabaseService(prisma);

    /**
     * Seed equivalent authorization through either direct membership or a local access group.
     * @param input - User, repository and role for the synthetic grant.
     * @returns The persisted fixture grant, without affecting other repositories.
     */
    async function createMembership(input: {
      data: { userId: string; repositoryId: string; role: 'VIEWER' | 'MANAGER' };
    }): Promise<unknown> {
      if (grantSource === 'direct') return prisma.repositoryMembership.create(input);
      return prisma.userGroup.create({
        data: {
          name: `fixture-${input.data.userId}-${input.data.repositoryId}`,
          members: { create: { userId: input.data.userId } },
          repositories: { create: { repositoryId: input.data.repositoryId, role: input.data.role } },
        },
      });
    }

    const alerts = new SecurityAlertsQueryService(prisma, new CaslAbilityFactory());
    const controller = new SecurityAlertsController(prisma, alerts);
    let users: Record<'admin' | 'manager' | 'viewer', AuthenticatedUser>;
    let visibleAlertId: string;

    beforeAll(/** Prepares shared test state for beforeAll. */ async () => prisma.onModuleInit());
    beforeEach(
      /** Prepares shared test state for beforeEach. */ async () => {
        await database.cleanup();
        const account = await prisma.providerAccount.create({
          data: { displayName: 'GitHub', encryptedAccessToken: 'encrypted-token', providerType: 'GITHUB' },
        });
        const [visibleRepository, hiddenRepository] = await Promise.all([
          prisma.repository.create({
            data: {
              name: 'visible',
              owner: 'repovio',
              providerAccountId: account.id,
              providerRepositoryId: 'visible',
              url: 'https://github.test/repovio/visible',
            },
          }),
          prisma.repository.create({
            data: {
              name: 'hidden',
              owner: 'repovio',
              providerAccountId: account.id,
              providerRepositoryId: 'hidden',
              url: 'https://github.test/repovio/hidden',
            },
          }),
        ]);
        const [admin, manager, viewer] = await Promise.all([
          prisma.user.create({ data: { passwordHash: 'hash', role: 'SYSTEM_ADMIN', username: 'admin' } }),
          prisma.user.create({ data: { passwordHash: 'hash', role: 'MANAGER', username: 'manager' } }),
          prisma.user.create({ data: { passwordHash: 'hash', role: 'VIEWER', username: 'viewer' } }),
        ]);
        await Promise.all([
          createMembership({
            data: { repositoryId: visibleRepository.id, role: 'MANAGER', userId: manager.id },
          }),
          createMembership({
            data: { repositoryId: visibleRepository.id, role: 'VIEWER', userId: viewer.id },
          }),
          prisma.securityAlertSyncState.create({
            data: { availability: 'UNAVAILABLE', kind: 'SECRET', repositoryId: visibleRepository.id },
          }),
        ]);
        const now = new Date('2026-09-29T00:00:00Z');
        /** Creates alert. */
        const createAlert = (repositoryId: string, providerAlertId: string, title: string) =>
          prisma.securityAlert.create({
            data: {
              identifiers: [],
              kind: 'DEPENDENCY',
              providerAlertId,
              providerCreatedAt: now,
              providerUpdatedAt: now,
              providerUrl: `https://github.test/alert/${providerAlertId}`,
              repositoryId,
              severity: 'HIGH',
              state: 'OPEN',
              title,
            },
          });
        const [visibleAlert] = await Promise.all([
          createAlert(visibleRepository.id, 'visible', 'Visible alert'),
          createAlert(hiddenRepository.id, 'hidden', 'Hidden alert'),
        ]);
        users = {
          admin: { authProvider: 'LOCAL' as const, id: admin.id, role: admin.role, username: admin.username },
          manager: { authProvider: 'LOCAL' as const, id: manager.id, role: manager.role, username: manager.username },
          viewer: { authProvider: 'LOCAL' as const, id: viewer.id, role: viewer.role, username: viewer.username },
        };
        visibleAlertId = visibleAlert.id;
      },
    );
    afterAll(/** Restores shared test state for afterAll. */ async () => prisma.onModuleDestroy());

    it.each([
      ['admin', 2],
      ['manager', 1],
    ] as const)(
      '%s sees only permitted alerts',
      /** Verifies %s sees only permitted alerts. */ async (role, count) => {
        const ability = await alerts.getReadAbility(users[role]);
        await expect(alerts.findMany({}, ability)).resolves.toHaveLength(count);
      },
    );

    it('blocks viewers even when they have repository membership', /** Verifies blocks viewers even when they have repository membership. */ async () => {
      await expect(alerts.getReadAbility(users.viewer)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('returns permission-scoped summaries, filters, and safe details', /** Verifies returns permission-scoped summaries, filters, and safe details. */ async () => {
      await expect(controller.summary({ user: users.manager })).resolves.toMatchObject({
        open: { CODE: 0, DEPENDENCY: 1, SECRET: 0 },
        unavailableRepositories: 1,
      });
      await expect(controller.filterOptions({ user: users.manager })).resolves.toMatchObject({
        repositories: [{ name: 'visible', owner: 'repovio' }],
      });
      await expect(controller.findById({ user: users.manager }, visibleAlertId)).resolves.toMatchObject({
        description: null,
        title: 'Visible alert',
      });
    });
  },
);
