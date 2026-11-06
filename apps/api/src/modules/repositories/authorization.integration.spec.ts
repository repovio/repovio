import { CaslAbilityFactory } from '../../casl/casl-ability.factory.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { TestDatabaseService } from '../../prisma/test-database.service.js';
import type { AuthenticatedUser } from '../auth/types.js';
import { RepositoriesQueryService } from './repositories-query.service.js';

/** Verify that repository lists and details cannot expose repositories outside persisted memberships. */
describe.each(['direct', 'group'] as const)(
  'repository authorization integration',
  /** Groups scenarios for repository authorization integration. */ (grantSource) => {
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

    const repositories = new RepositoriesQueryService(prisma, new CaslAbilityFactory());
    let users: Record<'admin' | 'viewer' | 'outsider', AuthenticatedUser>;
    let visibleRepositoryId: string;
    let hiddenRepositoryId: string;

    beforeAll(/** Prepares shared test state for beforeAll. */ async () => prisma.onModuleInit());
    beforeEach(
      /** Prepares shared test state for beforeEach. */ async () => {
        await database.cleanup();
        const providerAccount = await prisma.providerAccount.create({
          data: {
            displayName: 'Integration provider',
            encryptedAccessToken: 'encrypted-token',
            providerType: 'GITHUB',
          },
        });
        const [visibleRepository, hiddenRepository] = await Promise.all([
          prisma.repository.create({
            data: {
              name: 'visible',
              owner: 'repovio',
              providerAccountId: providerAccount.id,
              providerRepositoryId: 'visible',
              url: 'https://github.com/repovio/visible',
            },
          }),
          prisma.repository.create({
            data: {
              name: 'hidden',
              owner: 'repovio',
              providerAccountId: providerAccount.id,
              providerRepositoryId: 'hidden',
              url: 'https://github.com/repovio/hidden',
            },
          }),
        ]);
        const [admin, viewer, outsider] = await Promise.all([
          prisma.user.create({ data: { passwordHash: 'hash', role: 'SYSTEM_ADMIN', username: 'admin' } }),
          prisma.user.create({ data: { passwordHash: 'hash', role: 'VIEWER', username: 'viewer' } }),
          prisma.user.create({ data: { passwordHash: 'hash', role: 'VIEWER', username: 'outsider' } }),
        ]);
        await createMembership({
          data: { repositoryId: visibleRepository.id, role: 'VIEWER', userId: viewer.id },
        });

        users = {
          admin: { authProvider: 'LOCAL' as const, id: admin.id, role: admin.role, username: admin.username },
          outsider: {
            authProvider: 'LOCAL' as const,
            id: outsider.id,
            role: outsider.role,
            username: outsider.username,
          },
          viewer: { authProvider: 'LOCAL' as const, id: viewer.id, role: viewer.role, username: viewer.username },
        };
        visibleRepositoryId = visibleRepository.id;
        hiddenRepositoryId = hiddenRepository.id;
      },
    );
    afterAll(/** Restores shared test state for afterAll. */ async () => prisma.onModuleDestroy());

    it.each([
      ['admin', 2],
      ['viewer', 1],
      ['outsider', 0],
    ] as const)(
      'returns only repositories visible to the %s',
      /** Verifies returns only repositories visible to the %s. */ async (role, expectedCount) => {
        const ability = await repositories.getReadAbility(users[role]);
        await expect(repositories.findMany({}, ability)).resolves.toHaveLength(expectedCount);
      },
    );

    it('allows an assigned detail while hiding an unassigned repository as not found', /** Verifies allows an assigned detail while hiding an unassigned repository as not found. */ async () => {
      const ability = await repositories.getReadAbility(users.viewer);

      await expect(repositories.findById(visibleRepositoryId, {}, ability)).resolves.toMatchObject({
        id: visibleRepositoryId,
      });
      await expect(repositories.findById(hiddenRepositoryId, {}, ability)).rejects.toMatchObject({ status: 404 });
    });
  },
);
