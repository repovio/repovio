import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { RepositoryGroupGrant, UserGroup } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { AuthenticatedUser } from '../auth/types.js';
import type { SaveRepositoryGroupDto, SaveUserGroupDto } from './dto.js';

/** Maintains local access groups without modifying direct repository memberships. */
@Injectable()
export class UserGroupsService {
  /**
   * Initialize local group persistence.
   * @param prisma - Application database client.
   */
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Require system administrator access before querying group data.
   * @param user - Current authenticated identity.
   * @returns Nothing when the identity may administer groups.
   * @throws ForbiddenException - Caller is not a system administrator.
   */
  assertAdmin(user: AuthenticatedUser): void {
    if (user.role !== 'SYSTEM_ADMIN') throw new ForbiddenException('System administrator access is required.');
  }

  /**
   * Create a named access group.
   * @param user - Current administrator identity.
   * @param input - Validated group name.
   * @returns Persisted group metadata.
   * @throws ForbiddenException - Caller is not an administrator.
   */
  async create(user: AuthenticatedUser, input: SaveUserGroupDto): Promise<UserGroup> {
    this.assertAdmin(user);
    return this.prisma.userGroup.create({ data: input });
  }

  /**
   * Rename an existing group without changing its grants.
   * @param user - Current administrator identity.
   * @param id - Group identifier.
   * @param input - Validated replacement name.
   * @returns Updated group metadata.
   * @throws ForbiddenException - Caller is not an administrator.
   */
  async rename(user: AuthenticatedUser, id: string, input: SaveUserGroupDto): Promise<UserGroup> {
    this.assertAdmin(user);
    return this.prisma.userGroup.update({ where: { id }, data: input });
  }

  /**
   * Delete a group and its inherited grants, retaining direct assignments.
   * @param user - Current administrator identity.
   * @param id - Group identifier.
   * @returns Completion after cascading group deletion.
   * @throws ForbiddenException - Caller is not an administrator.
   */
  async remove(user: AuthenticatedUser, id: string): Promise<void> {
    this.assertAdmin(user);
    await this.prisma.userGroup.delete({ where: { id } });
  }

  /**
   * Validate administrator access and group existence before member queries.
   * @param user - Current administrator identity.
   * @param id - Group identifier.
   * @returns Existing safe group metadata.
   * @throws ForbiddenException - Caller is not an administrator.
   * @throws NotFoundException - Group no longer exists.
   */
  async requireGroup(user: AuthenticatedUser, id: string): Promise<UserGroup> {
    this.assertAdmin(user);
    const group = await this.prisma.userGroup.findUnique({ where: { id } });
    if (!group) throw new NotFoundException('User group not found.');
    return group;
  }

  /**
   * Add an existing local or OIDC account to a group idempotently.
   * @param user - Current administrator identity.
   * @param groupId - Group identifier.
   * @param userId - Existing account identifier.
   * @returns Completion after membership persistence.
   * @throws ForbiddenException - Caller is not an administrator.
   * @throws NotFoundException - Group or account no longer exists.
   */
  async addMember(user: AuthenticatedUser, groupId: string, userId: string): Promise<void> {
    await this.requireGroup(user, groupId);
    if (!(await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } })))
      throw new NotFoundException('User not found.');
    await this.prisma.userGroupMember.upsert({
      where: { groupId_userId: { groupId, userId } },
      create: { groupId, userId },
      update: {},
    });
  }

  /**
   * Remove one membership without touching other groups or direct grants.
   * @param user - Current administrator identity.
   * @param groupId - Group identifier.
   * @param userId - Account identifier.
   * @returns Completion after idempotent removal.
   * @throws ForbiddenException - Caller is not an administrator.
   * @throws NotFoundException - Group no longer exists.
   */
  async removeMember(user: AuthenticatedUser, groupId: string, userId: string): Promise<void> {
    await this.requireGroup(user, groupId);
    await this.prisma.userGroupMember.deleteMany({ where: { groupId, userId } });
  }

  /**
   * List group grants for one existing repository.
   * @param user - Current administrator identity.
   * @param repositoryId - Repository identifier.
   * @returns Group grants with safe group metadata.
   * @throws ForbiddenException - Caller is not an administrator.
   * @throws NotFoundException - Repository no longer exists.
   */
  async listRepositoryGroups(
    user: AuthenticatedUser,
    repositoryId: string,
  ): Promise<Array<RepositoryGroupGrant & { group: UserGroup }>> {
    await this.requireRepository(user, repositoryId);
    return this.prisma.repositoryGroupGrant.findMany({
      where: { repositoryId },
      include: { group: true },
      orderBy: { group: { name: 'asc' } },
    });
  }

  /**
   * Set the repository role inherited by every member of a group.
   * @param user - Current administrator identity.
   * @param repositoryId - Repository identifier.
   * @param groupId - Group identifier.
   * @param input - Validated repository role, independent of the user's global role.
   * @returns Persisted grant with safe group metadata.
   * @throws ForbiddenException - Caller is not an administrator.
   * @throws NotFoundException - Repository or group no longer exists.
   */
  async setRepositoryGroup(
    user: AuthenticatedUser,
    repositoryId: string,
    groupId: string,
    input: SaveRepositoryGroupDto,
  ): Promise<RepositoryGroupGrant & { group: UserGroup }> {
    await this.requireRepository(user, repositoryId);
    await this.requireGroup(user, groupId);
    return this.prisma.repositoryGroupGrant.upsert({
      where: { repositoryId_groupId: { repositoryId, groupId } },
      create: { repositoryId, groupId, role: input.role },
      update: { role: input.role },
      include: { group: true },
    });
  }

  /**
   * Remove a repository group grant without deleting its group or other assignments.
   * @param user - Current administrator identity.
   * @param repositoryId - Repository identifier.
   * @param groupId - Group identifier.
   * @returns Completion after idempotent grant removal.
   * @throws ForbiddenException - Caller is not an administrator.
   * @throws NotFoundException - Repository no longer exists.
   */
  async removeRepositoryGroup(user: AuthenticatedUser, repositoryId: string, groupId: string): Promise<void> {
    await this.requireRepository(user, repositoryId);
    await this.prisma.repositoryGroupGrant.deleteMany({ where: { repositoryId, groupId } });
  }

  /**
   * Check administration and repository existence before accessing grants.
   * @param user - Current administrator identity.
   * @param id - Repository identifier.
   * @returns Completion when the repository exists.
   * @throws ForbiddenException - Caller is not an administrator.
   * @throws NotFoundException - Repository no longer exists.
   */
  private async requireRepository(user: AuthenticatedUser, id: string): Promise<void> {
    this.assertAdmin(user);
    if (!(await this.prisma.repository.findUnique({ where: { id }, select: { id: true } })))
      throw new NotFoundException('Repository not found.');
  }
}
