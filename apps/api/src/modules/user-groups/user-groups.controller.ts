import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post, Put, Query, Req } from '@nestjs/common';
import { ApiNoContentResponse } from '@nestjs/swagger';
import { ResourceQuery } from '@querry-kit/nest/core';
import { ApiRepositoryGroupSchema, ApiUserGroupSchema } from '@repovio/schemas';
import { z } from 'zod';
import {
  ApiErrorResponses,
  ApiPaginatedResponse,
  ApiResourceQuery,
  resourceFields,
  SchemaResponse,
} from '../../util/resource-contract.js';
import { toWire } from '../../util/to-wire.js';
import { Authenticated } from '../auth/authenticated.decorator.js';
import { UserQueryDto } from '../auth/dto/user-query.dto.js';
import { UserDto, type UserWithAvatar } from '../auth/dto/user.dto.js';
import type { AuthenticatedUser } from '../auth/types.js';
import { UsersQueryService } from '../auth/users-query.service.js';
import { SaveRepositoryGroupDto, SaveUserGroupDto, UserGroupDto, UserGroupQueryDto } from './dto.js';
import { UserGroupsQueryService } from './user-groups-query.service.js';
import { UserGroupsService } from './user-groups.service.js';

/** Administrator-only local access group endpoints. */
@Authenticated()
@Controller('user-groups')
export class UserGroupsController {
  /**
   * Initialize group resource and membership endpoints.
   * @param groups - Administrator-scoped group persistence.
   * @param queryService - CASL-aware group resource queries.
   * @param users - CASL-aware account resource queries.
   */
  constructor(
    private readonly groups: UserGroupsService,
    private readonly queryService: UserGroupsQueryService,
    private readonly users: UsersQueryService,
  ) {}

  /**
   * Query safe group metadata with pagination and field projection.
   * @param request - Authenticated administrator request.
   * @param query - Validated Query Kit options.
   * @returns Authorized group page.
   */
  @ApiErrorResponses()
  @Get()
  @ApiResourceQuery()
  @ApiPaginatedResponse({ model: UserGroupDto })
  async query(@Req() request: { user: AuthenticatedUser }, @Query() query: UserGroupQueryDto) {
    const ability = this.queryService.getReadAbility(request.user);
    return ResourceQuery.query({
      ability,
      query: this.queryService.toQueryOptions(query),
      schema: resourceFields(UserGroupDto),
      service: this.queryService,
      /** Projects only public group metadata. */ map: (model) => toWire(model),
    });
  }

  /**
   * Create a local access group.
   * @param request - Authenticated administrator request.
   * @param body - Validated group name.
   * @returns Safe persisted group metadata.
   */
  @ApiErrorResponses()
  @Post()
  @SchemaResponse(ApiUserGroupSchema)
  async create(@Req() request: { user: AuthenticatedUser }, @Body() body: SaveUserGroupDto) {
    return toWire(await this.groups.create(request.user, body));
  }

  /**
   * Rename one group while retaining its assignments.
   * @param request - Authenticated administrator request.
   * @param id - Group UUID.
   * @param body - Validated replacement group name.
   * @returns Safe updated group metadata.
   */
  @ApiErrorResponses()
  @Put(':id')
  @SchemaResponse(ApiUserGroupSchema)
  async rename(
    @Req() request: { user: AuthenticatedUser },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: SaveUserGroupDto,
  ) {
    return toWire(await this.groups.rename(request.user, id, body));
  }

  /**
   * Delete one group and its inherited assignments.
   * @param request - Authenticated administrator request.
   * @param id - Group UUID.
   * @returns Completion after deletion.
   */
  @ApiErrorResponses()
  @Delete(':id')
  @HttpCode(204)
  @ApiNoContentResponse()
  async remove(@Req() request: { user: AuthenticatedUser }, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.groups.remove(request.user, id);
  }

  /**
   * Query one group's members without returning credential fields.
   * @param request - Authenticated administrator request.
   * @param id - Group UUID.
   * @param query - Validated user resource query.
   * @returns Authorized user page scoped to the selected group.
   */
  @ApiErrorResponses()
  @Get(':id/members')
  @ApiResourceQuery()
  @ApiPaginatedResponse({ model: UserDto })
  async members(
    @Req() request: { user: AuthenticatedUser },
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: UserQueryDto,
  ) {
    await this.groups.requireGroup(request.user, id);
    return ResourceQuery.query({
      ability: this.users.getReadAbility(request.user),
      include: { avatar: { select: { updatedAt: true } }, oidcAvatar: { select: { updatedAt: true } } },
      query: {
        ...this.users.toQueryOptions(query),
        where: { AND: [query.where ?? {}, { groupMemberships: { some: { groupId: id } } }] },
      },
      schema: resourceFields(UserDto),
      service: this.users,
      /** Maps members through the safe account DTO and current ability. */ map: (model: UserWithAvatar, ability) =>
        UserDto.fromModel(model, ability),
    });
  }

  /**
   * Add an account to a group idempotently.
   * @param request - Authenticated administrator request.
   * @param id - Group UUID.
   * @param userId - Account UUID.
   * @returns Completion after membership persistence.
   */
  @ApiErrorResponses()
  @Put(':id/members/:userId')
  @HttpCode(204)
  @ApiNoContentResponse()
  async addMember(
    @Req() request: { user: AuthenticatedUser },
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<void> {
    await this.groups.addMember(request.user, id, userId);
  }

  /**
   * Remove one account's group membership.
   * @param request - Authenticated administrator request.
   * @param id - Group UUID.
   * @param userId - Account UUID.
   * @returns Completion after membership removal.
   */
  @ApiErrorResponses()
  @Delete(':id/members/:userId')
  @HttpCode(204)
  @ApiNoContentResponse()
  async removeMember(
    @Req() request: { user: AuthenticatedUser },
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<void> {
    await this.groups.removeMember(request.user, id, userId);
  }
}

/** Administrator-only group grants for individual repositories. */
@Authenticated()
@Controller('repositories/:repositoryId/group-memberships')
export class RepositoryGroupsController {
  /**
   * Initialize repository group assignment endpoints.
   * @param groups - Administrator-scoped group persistence.
   */
  constructor(private readonly groups: UserGroupsService) {}

  /**
   * List group assignments for a repository.
   * @param request - Authenticated administrator request.
   * @param repositoryId - Repository UUID.
   * @returns Safe group assignment records.
   */
  @ApiErrorResponses()
  @Get()
  @SchemaResponse(z.array(ApiRepositoryGroupSchema))
  async list(@Req() request: { user: AuthenticatedUser }, @Param('repositoryId', ParseUUIDPipe) repositoryId: string) {
    return toWire(await this.groups.listRepositoryGroups(request.user, repositoryId));
  }

  /**
   * Create or update a group's inherited repository role.
   * @param request - Authenticated administrator request.
   * @param repositoryId - Repository UUID.
   * @param groupId - Group UUID.
   * @param body - Validated inherited repository role.
   * @returns Safe persisted group assignment.
   */
  @ApiErrorResponses()
  @Put(':groupId')
  @SchemaResponse(ApiRepositoryGroupSchema)
  async set(
    @Req() request: { user: AuthenticatedUser },
    @Param('repositoryId', ParseUUIDPipe) repositoryId: string,
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Body() body: SaveRepositoryGroupDto,
  ) {
    return toWire(await this.groups.setRepositoryGroup(request.user, repositoryId, groupId, body));
  }

  /**
   * Remove one group assignment without altering direct memberships.
   * @param request - Authenticated administrator request.
   * @param repositoryId - Repository UUID.
   * @param groupId - Group UUID.
   * @returns Completion after grant removal.
   */
  @ApiErrorResponses()
  @Delete(':groupId')
  @HttpCode(204)
  @ApiNoContentResponse()
  async remove(
    @Req() request: { user: AuthenticatedUser },
    @Param('repositoryId', ParseUUIDPipe) repositoryId: string,
    @Param('groupId', ParseUUIDPipe) groupId: string,
  ): Promise<void> {
    await this.groups.removeRepositoryGroup(request.user, repositoryId, groupId);
  }
}
