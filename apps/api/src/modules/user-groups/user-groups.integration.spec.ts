import { subject } from '@casl/ability';
import { ForbiddenException } from '@nestjs/common';
import { CaslAbilityFactory } from '../../casl/casl-ability.factory.js';
import { CaslAction } from '../../casl/casl-action.js';
import { CaslSubject } from '../../casl/casl-subject.js';
import { resolveRepositoryAccess } from '../../casl/repository-access.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { TestDatabaseService } from '../../prisma/test-database.service.js';
import type { AuthenticatedUser } from '../auth/types.js';
import { UsersQueryService } from '../auth/users-query.service.js';
import { RepositoriesQueryService } from '../repositories/repositories-query.service.js';
import { UserGroupsQueryService } from './user-groups-query.service.js';
import { UserGroupsController } from './user-groups.controller.js';
import { UserGroupsService } from './user-groups.service.js';

/** Exercises group inheritance, revocation, safe queries, and database constraints in PostgreSQL. */
describe('local access group integration', /** Shares isolated database-backed group scenarios. */ () => {
  const prisma = new PrismaService();
  const database = new TestDatabaseService(prisma);
  const abilities = new CaslAbilityFactory();
  const groups = new UserGroupsService(prisma);
  const repositories = new RepositoriesQueryService(prisma, abilities);
  const controller = new UserGroupsController(
    groups,
    new UserGroupsQueryService(prisma, abilities),
    new UsersQueryService(prisma, abilities),
  );
  let admin: AuthenticatedUser;
  let viewer: AuthenticatedUser;
  let repositoryId: string;

  beforeAll(/** Opens the dedicated test connection. */ async () => prisma.onModuleInit());
  beforeEach(
    /** Creates only synthetic accounts and repositories. */ async () => {
      await database.cleanup();
      admin = await prisma.user.create({
        data: { username: 'admin', passwordHash: 'synthetic', role: 'SYSTEM_ADMIN' },
      });
      viewer = await prisma.user.create({ data: { username: 'viewer', passwordHash: 'synthetic', role: 'VIEWER' } });
      const account = await prisma.providerAccount.create({
        data: { displayName: 'fixture', encryptedAccessToken: 'synthetic', providerType: 'GITHUB' },
      });
      const repo = await prisma.repository.create({
        data: {
          name: 'visible',
          owner: 'fixture',
          providerAccountId: account.id,
          providerRepositoryId: 'visible',
          url: 'https://example.com/visible',
        },
      });
      repositoryId = repo.id;
      await prisma.repository.create({
        data: {
          name: 'hidden',
          owner: 'fixture',
          providerAccountId: account.id,
          providerRepositoryId: 'hidden',
          url: 'https://example.com/hidden',
        },
      });
    },
  );
  afterAll(/** Closes the dedicated test connection. */ async () => prisma.onModuleDestroy());

  it('merges overlapping grants, caps manager access, and revokes inherited permissions immediately', /** Proves strongest-grant and global-role semantics. */ async () => {
    const read = await groups.create(admin, { name: 'Readers' });
    const manage = await groups.create(admin, { name: 'Maintainers' });
    await groups.addMember(admin, read.id, viewer.id);
    await groups.addMember(admin, read.id, viewer.id);
    await groups.addMember(admin, manage.id, viewer.id);
    await groups.setRepositoryGroup(admin, repositoryId, read.id, { role: 'VIEWER' });
    await groups.setRepositoryGroup(admin, repositoryId, manage.id, { role: 'MANAGER' });
    expect(await resolveRepositoryAccess(prisma, viewer.id)).toEqual([{ repositoryId, role: 'MANAGER' }]);
    const viewerAbility = await repositories.getReadAbility(viewer);
    expect(await repositories.findMany({}, viewerAbility)).toHaveLength(1);
    expect(viewerAbility.can(CaslAction.Update, subject(CaslSubject.Repository, { id: repositoryId }))).toBe(false);
    const manager = { ...viewer, role: 'MANAGER' as const };
    expect(
      (await repositories.getReadAbility(manager)).can(
        CaslAction.Update,
        subject(CaslSubject.Repository, { id: repositoryId }),
      ),
    ).toBe(true);
    await groups.removeMember(admin, manage.id, viewer.id);
    expect(await resolveRepositoryAccess(prisma, viewer.id)).toEqual([{ repositoryId, role: 'VIEWER' }]);
    await groups.removeRepositoryGroup(admin, repositoryId, read.id);
    expect(await repositories.findMany({}, await repositories.getReadAbility(viewer))).toHaveLength(0);
  });

  it('retains direct assignments when deleting groups and enforces unique memberships', /** Proves migration constraints and deletion boundaries. */ async () => {
    const group = await groups.create(admin, { name: 'Readers' });
    await groups.addMember(admin, group.id, viewer.id);
    await groups.setRepositoryGroup(admin, repositoryId, group.id, { role: 'MANAGER' });
    await prisma.repositoryMembership.create({ data: { repositoryId, userId: viewer.id, role: 'VIEWER' } });
    await expect(groups.create(admin, { name: 'Readers' })).rejects.toMatchObject({ code: 'P2002' });
    await expect(
      prisma.userGroupMember.create({ data: { groupId: group.id, userId: viewer.id } }),
    ).rejects.toMatchObject({ code: 'P2002' });
    await groups.remove(admin, group.id);
    expect(await prisma.userGroupMember.count()).toBe(0);
    expect(await prisma.repositoryGroupGrant.count()).toBe(0);
    expect(await resolveRepositoryAccess(prisma, viewer.id)).toEqual([{ repositoryId, role: 'VIEWER' }]);
  });

  it('projects paginated group members without credentials and rejects non-administrators', /** Checks administrative and field-selection contracts. */ async () => {
    const group = await groups.create(admin, { name: 'Readers' });
    await groups.addMember(admin, group.id, viewer.id);
    const page = await controller.members({ user: admin }, group.id, { page: 1, perPage: 10, fields: 'id,username' });
    expect(page.items).toEqual([{ id: viewer.id, username: viewer.username }]);
    expect(JSON.stringify(page)).not.toContain('passwordHash');
    await expect(groups.create(viewer, { name: 'Forbidden' })).rejects.toThrow(ForbiddenException);
    await expect(controller.query({ user: viewer }, { page: 1, perPage: 10 })).rejects.toThrow(ForbiddenException);
    await expect(groups.setRepositoryGroup(viewer, repositoryId, group.id, { role: 'MANAGER' })).rejects.toThrow(
      ForbiddenException,
    );
  });
});
