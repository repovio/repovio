import {
  Body,
  ConflictException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { ResourceQuery } from '@querry-kit/nest/core';
import { ApiCreateUserSchema, ApiResetUserPasswordSchema, ApiUserSchema } from '@repovio/schemas';
import bcrypt from 'bcrypt';
import { createZodDto } from '../../util/schema-dto.js';

import {
  ApiErrorResponses,
  ApiPaginatedResponse,
  ApiResourceQuery,
  resourceFields,
  SchemaResponse,
} from '../../util/resource-contract.js';

import type { FastifyReply } from 'fastify';

import { PrismaService } from '../../prisma/prisma.service.js';
import { Authenticated } from './authenticated.decorator.js';
import { AvatarService } from './avatar.service.js';
import { UserQueryDto } from './dto/user-query.dto.js';
import { UserDto, type UserWithAvatar } from './dto/user.dto.js';
import type { AuthenticatedUser } from './types.js';
import { UsersQueryService } from './users-query.service.js';

/** Validated administrative password reset request. */
class ResetUserPasswordDto extends createZodDto(ApiResetUserPasswordSchema) {}

/** Validated local user creation request. */
class CreateUserDto extends createZodDto(ApiCreateUserSchema) {}

/** Provides safe system-administrator user management endpoints. */
@Authenticated()
@Controller('users')
export class UsersController {
  /**
   * Initialize UsersController with its required dependencies.
   *
   * @param prisma - Database client used for persisted application state.
   * @param users - Ability-aware user query service.
   * @param avatars - Service for avatar validation, storage, and download.
   */
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersQueryService,
    private readonly avatars: AvatarService,
  ) {}

  /**
   * Query system users with server-side filtering, sorting, field selection, and pagination.
   *
   * @param request - HTTP request carrying the authenticated application user.
   * @param query - Validated filters, sorting, pagination, or time-range options.
   * @returns The visible resource page and its query metadata.
   * @throws ForbiddenException - System administrator access is required.
   */
  @Get()
  @ApiResourceQuery()
  @ApiPaginatedResponse({ description: 'System users.', model: UserDto })
  @ApiErrorResponses({ badRequestDescription: 'Invalid user query.' })
  async query(@Req() request: { user: AuthenticatedUser }, @Query() query: UserQueryDto) {
    const ability = this.users.getReadAbility(request.user);
    return ResourceQuery.query({
      ability,
      include: { avatar: { select: { updatedAt: true } } },
      /** Maps map. */
      map: (user: UserWithAvatar, currentAbility) => UserDto.fromModel(user, currentAbility),
      query: this.users.toQueryOptions(query),
      schema: resourceFields(UserDto),
      service: this.users,
    });
  }
  /**
   * Return one normalized avatar to authenticated users without exposing its database record.
   *
   * @param id - Local identifier of the target record.
   * @param response - HTTP response being validated, decoded, or written.
   * @returns The normalized avatar stream with its content type and cache metadata.
   * @throws NotFoundException - Avatar not found.
   */
  @Get(':id/avatar')
  async avatar(@Param('id') id: string, @Res({ passthrough: true }) response: FastifyReply): Promise<StreamableFile> {
    const avatar = await this.avatars.get(id);
    response.headers({ 'Cache-Control': 'private, max-age=3600', ETag: `"${avatar.etag}"` });
    return new StreamableFile(Buffer.from(avatar.data), { type: 'image/webp' });
  }
  /**
   * Create a local user after verifying administrator access.
   *
   * @param request - HTTP request carrying the authenticated application user.
   * @param body - Login, initial password, profile names, and application role for the new user.
   * @returns The safe representation of the newly created user.
   * @throws ForbiddenException - System administrator access is required.
   */
  @SchemaResponse(ApiUserSchema)
  @Post()
  async create(@Req() request: { user: AuthenticatedUser }, @Body() body: CreateUserDto) {
    this.assertAdmin(request.user);
    const passwordHash = await bcrypt.hash(body.password, 12);
    try {
      return UserDto.fromModel(
        await this.prisma.user.create({
          data: {
            username: body.username,
            firstName: body.firstName,
            lastName: body.lastName,
            role: body.role,
            authProvider: 'LOCAL',
            passwordHash,
          },
        }),
      );
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
        throw new ConflictException('Username already exists.');
      }
      throw error;
    }
  }
  /**
   * Reset a local account password and invalidate its issued JWT sessions.
   * @param request - Authenticated administrator request.
   * @param id - Target local account identifier.
   * @param body - Validated replacement password, never returned or logged.
   * @returns Completion after the password and authentication version are persisted.
   * @throws ForbiddenException - Caller is not an administrator or target uses OIDC.
   * @throws NotFoundException - Target account no longer exists.
   */
  @Put(':id/password')
  @HttpCode(204)
  @ApiErrorResponses()
  async resetPassword(
    @Req() request: { user: AuthenticatedUser },
    @Param('id') id: string,
    @Body() body: ResetUserPasswordDto,
  ): Promise<void> {
    this.assertAdmin(request.user);
    const passwordHash = await bcrypt.hash(body.newPassword, 12);
    const result = await this.prisma.user.updateMany({
      where: { id, authProvider: 'LOCAL' },
      data: { passwordHash, authVersion: { increment: 1 } },
    });
    if (!result.count) {
      const target = await this.prisma.user.findUnique({ where: { id }, select: { id: true } });
      if (!target) throw new NotFoundException('User not found.');
      throw new ForbiddenException('OIDC-managed users do not have a local password.');
    }
  }
  /**
   * Delete a user after verifying system administrator access.
   *
   * @param request - HTTP request carrying the authenticated application user.
   * @param id - Local identifier of the target record.
   * @returns A promise that resolves when the operation completes.
   * @throws ForbiddenException - System administrators cannot delete their own account.
   */
  @Delete(':id') async remove(@Req() request: { user: AuthenticatedUser }, @Param('id') id: string): Promise<void> {
    this.assertAdmin(request.user);
    if (id === request.user.id) throw new ForbiddenException('System administrators cannot delete their own account.');
    await this.prisma.user.delete({ where: { id } });
  }
  /**
   * Require the system administrator role before applying an administrative operation.
   *
   * @param user - Authenticated user whose identity and permissions apply to the operation.
   * @returns No return value.
   * @throws ForbiddenException - System administrator access is required.
   */
  private assertAdmin(user: AuthenticatedUser): void {
    if (user.role !== 'SYSTEM_ADMIN') throw new ForbiddenException('System administrator access is required.');
  }
}
