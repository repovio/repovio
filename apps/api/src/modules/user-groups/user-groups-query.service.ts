import { ForbiddenException, Injectable } from '@nestjs/common';
import { createCaslAccessibleWhere } from '@querry-kit/nest/casl';
import { QueryService, type BaseDelegateTypeMap, type QueryOptionsMap } from '@querry-kit/nest/core';

import { CaslAbilityFactory } from '../../casl/casl-ability.factory.js';
import { CaslAction } from '../../casl/casl-action.js';
import { CaslSubject } from '../../casl/casl-subject.js';
import type { AppAbility } from '../../casl/types.js';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { AuthenticatedUser } from '../auth/types.js';
import type { UserGroupQueryDto } from './dto.js';

/** Prisma delegate type map used by Query Kit for local access groups. */
export interface UserGroupTypeMap extends BaseDelegateTypeMap {
  select: Prisma.UserGroupSelect;
  include: Prisma.UserGroupInclude;
  whereInput: Prisma.UserGroupWhereInput;
  orderByWithRelationInput: Prisma.UserGroupOrderByWithRelationInput;
  whereUniqueInput: Prisma.UserGroupWhereUniqueInput;
  scalarFieldEnum: Prisma.UserGroupScalarFieldEnum;
  createInput: Prisma.UserGroupCreateInput;
  uncheckedCreateInput: Prisma.UserGroupUncheckedCreateInput;
  updateManyMutationInput: Prisma.UserGroupUpdateManyMutationInput;
  uncheckedUpdateManyInput: Prisma.UserGroupUncheckedUpdateManyInput;
  updateInput: Prisma.UserGroupUpdateInput;
  uncheckedUpdateInput: Prisma.UserGroupUncheckedUpdateInput;
  aggregateInputType: Prisma.UserGroupAggregateArgs;
}

/** Query Kit service that exposes local groups only to system administrators. */
@Injectable()
export class UserGroupsQueryService extends QueryService<
  typeof PrismaService.prototype.userGroup,
  UserGroupTypeMap,
  typeof PrismaService.prototype.userGroup,
  QueryOptionsMap<UserGroupTypeMap>,
  AppAbility,
  CaslSubject.UserGroup
> {
  /**
   * Initialize UserGroupsQueryService with its required dependencies.
   *
   * @param prisma - Database client used for persisted application state.
   * @param abilityFactory - Factory for role- and membership-aware CASL abilities.
   */
  constructor(
    prisma: PrismaService,
    private readonly abilityFactory: CaslAbilityFactory,
  ) {
    super(prisma.userGroup, {
      subject: CaslSubject.UserGroup,
      accessibleWhere: createCaslAccessibleWhere<AppAbility, CaslSubject.UserGroup, CaslAction>({
        action: CaslAction.Read,
      }),
    });
  }

  /**
   * Resolve the full group read ability for a system administrator.
   *
   * @param user - Authenticated user whose identity and permissions apply to the operation.
   * @returns The CASL ability used for resource queries and DTO projection.
   * @throws ForbiddenException - System administrator access is required.
   */
  getReadAbility(user: AuthenticatedUser): AppAbility {
    if (user.role !== 'SYSTEM_ADMIN') throw new ForbiddenException('System administrator access is required.');
    return this.abilityFactory.createForUser(user, []);
  }

  /**
   * Apply a stable default order when the table has no selected sort.
   *
   * @param query - Validated filters, sorting, pagination, or time-range options.
   * @returns Query Kit options with explicit relation loading and stable default sorting.
   */
  toQueryOptions(query: UserGroupQueryDto): QueryOptionsMap<UserGroupTypeMap>['query'] {
    return {
      ...query,
      orderBy: query.orderBy ?? [{ name: 'asc' }, { id: 'asc' }],
    } as QueryOptionsMap<UserGroupTypeMap>['query'];
  }
}
