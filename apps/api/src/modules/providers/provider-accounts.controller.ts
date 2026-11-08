import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query, Req } from '@nestjs/common';
import { ResourceQuery } from '@querry-kit/nest/core';
import {
  ApiCreateProviderAccountSchema,
  ApiCreateTrackedRepositorySchema,
  ApiProviderAccountSchema,
  ApiProviderRepositorySchema,
  ApiRepositorySchema,
  ApiStartExistingProviderOAuthSchema,
  ApiUpdateProviderAccountSchema,
  ProviderAuthenticationOptionsSchema,
  ProviderOAuthAuthorizationSchema,
} from '@repovio/schemas';
import { createZodDto } from '../../util/schema-dto.js';

import { z } from 'zod';
import {
  ApiErrorResponses,
  ApiPaginatedResponse,
  ApiResourceQuery,
  resourceFields,
  SchemaResponse,
} from '../../util/resource-contract.js';

import type { ProviderAccount } from '../../generated/prisma/client.js';

import { Authenticated } from '../auth/authenticated.decorator.js';
import type { AuthenticatedUser } from '../auth/types.js';
import { ProviderAccountDto, RepositoryDto } from '../repositories/dto/resource.dto.js';
import { ProviderAccountQueryDto } from './dto/provider-account-query.dto.js';
import { StartProviderOAuthDto, type ProviderOAuthAuthorizationDto } from './dto/provider-oauth.dto.js';
import { ProviderRepositoryDto } from './dto/provider-repository.dto.js';
import { ProviderAccountsQueryService } from './provider-accounts-query.service.js';
import { ProviderAccountsService } from './provider-accounts.service.js';
import { ProviderOAuthService } from './provider-oauth.service.js';

class CreateProviderAccountDto extends createZodDto(ApiCreateProviderAccountSchema) {}

class StartExistingProviderOAuthDto extends createZodDto(ApiStartExistingProviderOAuthSchema) {}

class UpdateProviderAccountDto extends createZodDto(ApiUpdateProviderAccountSchema) {}

class CreateTrackedRepositoryDto extends createZodDto(ApiCreateTrackedRepositorySchema) {}
/** Defines the provider accounts controller class contract. */ @Authenticated()
@Controller('provider-accounts')
export class ProviderAccountsController {
  /**
   * Initialize ProviderAccountsController with its required dependencies.
   *
   * @param accounts - Service managing local provider accounts and repository discovery.
   * @param accountQueries - Ability-aware provider account query service.
   * @param oauth - Service coordinating provider OAuth authorization and completion.
   */
  constructor(
    private readonly accounts: ProviderAccountsService,
    private readonly accountQueries: ProviderAccountsQueryService,
    private readonly oauth: ProviderOAuthService,
  ) {}

  /**
   * Query provider accounts with server-side filtering, sorting, field selection, and pagination.
   *
   * @param req - HTTP request carrying the authenticated application user.
   * @param query - Validated filters, sorting, pagination, or time-range options.
   * @returns The visible resource page and its query metadata.
   * @throws ForbiddenException - System administrator access is required.
   */
  @Get()
  @ApiResourceQuery()
  @ApiPaginatedResponse({ description: 'Configured provider accounts.', model: ProviderAccountDto })
  @ApiErrorResponses({ badRequestDescription: 'Invalid provider-account query.' })
  async query(@Req() req: { user: AuthenticatedUser }, @Query() query: ProviderAccountQueryDto) {
    const ability = this.accountQueries.getReadAbility(req.user);
    return ResourceQuery.query({
      ability,
      /** Maps map. */
      map: (account: ProviderAccount, currentAbility) => ProviderAccountDto.fromModel(account, currentAbility),
      query: this.accountQueries.toQueryOptions(query),
      schema: resourceFields(ProviderAccountDto),
      service: this.accountQueries,
    });
  }
  /**
   * Returns providers for which this installation has a configured OAuth client.
   *
   * @param req - HTTP request carrying the authenticated application user.
   * @returns The provider types with OAuth credentials configured.
   * @throws ForbiddenException - System administrator access is required.
   */
  @SchemaResponse(ProviderAuthenticationOptionsSchema)
  @Get('authentication-options')
  authenticationOptions(@Req() req: { user: AuthenticatedUser }): {
    oauthProviderTypes: Array<'GITHUB' | 'GITLAB' | 'FORGEJO'>;
  } {
    this.accounts.assertAdmin(req.user);
    return { oauthProviderTypes: this.oauth.availableProviderTypes() };
  }
  /**
   * Discover repositories accessible through an enabled provider account.
   *
   * @param req - HTTP request carrying the authenticated application user.
   * @param providerAccountId - Local identifier of the provider account.
   * @returns Discovered provider repositories with local tracking indicators.
   * @throws ForbiddenException - System administrator access is required.
   * @throws BadRequestException - Provider account is disabled.
   * @throws NotFoundException - Provider account not found.
   * @throws ProviderRequestError - When a provider read fails, including rate limiting; status and retry metadata are
   * preserved.
   * @throws TypeError - When the provider request fails at the network layer.
   * @throws Error - When no adapter is registered for the requested provider type.
   */
  @SchemaResponse(z.array(ApiProviderRepositorySchema))
  @Get(':id/repositories')
  async listRepositories(
    @Req() req: { user: AuthenticatedUser },
    @Param('id') providerAccountId: string,
  ): Promise<ProviderRepositoryDto[]> {
    return (await this.accounts.listAvailableRepositories(req.user, providerAccountId)).map(
      /** Projects each entry using `ProviderRepositoryDto.fromProvider(repository, repository.tracked)`. */ (
        repository,
      ) => ProviderRepositoryDto.fromProvider(repository, repository.tracked),
    );
  }
  /**
   * Adds a provider account with a manually supplied personal access token.
   *
   * @param req - HTTP request carrying the authenticated application user.
   * @param body - Validated request body for the operation.
   * @returns The safe representation of the created resource.
   * @throws BadRequestException - A Gitea base URL is required.
   * @throws ForbiddenException - System administrator access is required.
   * @throws ProviderRequestError - When a provider read fails, including rate limiting; status and retry metadata are
   * preserved.
   * @throws TypeError - When the provider request fails at the network layer.
   * @throws Error - When no adapter is registered for the requested provider type.
   */
  @SchemaResponse(ApiProviderAccountSchema)
  @Post()
  async create(
    @Req() req: { user: AuthenticatedUser },
    @Body() body: CreateProviderAccountDto,
  ): Promise<ProviderAccountDto> {
    return ProviderAccountDto.fromModel(await this.accounts.create(req.user, body));
  }
  /**
   * Add one repository selected from the provider's live repository list.
   *
   * @param req - HTTP request carrying the authenticated application user.
   * @param providerAccountId - Local identifier of the provider account.
   * @param body - Validated request body for the operation.
   * @returns The newly tracked repository with its initial synchronization queued.
   * @throws NotFoundException - When the selected repository is not accessible through the provider account.
   * @throws ForbiddenException - System administrator access is required.
   * @throws BadRequestException - Provider account is disabled.
   * @throws ProviderRequestError - When a provider read fails, including rate limiting; status and retry metadata are
   * preserved.
   * @throws TypeError - When the provider request fails at the network layer.
   * @throws Error - When no adapter is registered for the requested provider type.
   */
  @SchemaResponse(ApiRepositorySchema)
  @Post(':id/repositories')
  async addRepository(
    @Req() req: { user: AuthenticatedUser },
    @Param('id') providerAccountId: string,
    @Body() body: CreateTrackedRepositoryDto,
  ): Promise<RepositoryDto> {
    return RepositoryDto.fromModel(
      await this.accounts.addRepository(req.user, providerAccountId, body.providerRepositoryId),
    );
  }
  /**
   * Starts an OAuth authorization for a new provider account.
   *
   * @param req - HTTP request carrying the authenticated application user.
   * @param body - Validated request body for the operation.
   * @returns The provider authorization URL carrying signed callback state.
   * @throws ForbiddenException - System administrator access is required.
   * @throws BadRequestException - OAuth is not configured for this provider.
   */
  @SchemaResponse(ProviderOAuthAuthorizationSchema)
  @Post('oauth/authorize')
  async authorize(
    @Req() req: { user: AuthenticatedUser },
    @Body() body: StartProviderOAuthDto,
  ): Promise<ProviderOAuthAuthorizationDto> {
    return this.oauth.start(req.user, body);
  }
  /**
   * Start GitLab OAuth conversion or reauthorization for an existing Provider Account.
   * @param req - Authenticated administrator request.
   * @param id - Existing Provider Account identifier.
   * @param body - Empty validated body; target metadata is derived server-side.
   * @returns The authorization URL with encrypted target context.
   * @throws ForbiddenException - System administrator access is required.
   * @throws NotFoundException - The target account does not exist.
   * @throws BadRequestException - The target is not a matching configured GitLab instance.
   */
  @SchemaResponse(ProviderOAuthAuthorizationSchema)
  @Post(':id/oauth')
  async authorizeExisting(
    @Req() req: { user: AuthenticatedUser },
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: StartExistingProviderOAuthDto,
  ): Promise<ProviderOAuthAuthorizationDto> {
    void body;
    return this.oauth.startExisting(req.user, id);
  }

  /**
   * Update the selected local resource after authorization and validation.
   *
   * @param req - HTTP request carrying the authenticated application user.
   * @param id - Local identifier of the target record.
   * @param body - Validated request body for the operation.
   * @returns The updated resource projected into its public representation.
   * @throws BadRequestException - A Gitea base URL is required.
   * @throws ForbiddenException - System administrator access is required.
   * @throws NotFoundException - Provider account not found.
   */
  @SchemaResponse(ApiProviderAccountSchema)
  @Patch(':id')
  async update(
    @Req() req: { user: AuthenticatedUser },
    @Param('id') id: string,
    @Body() body: UpdateProviderAccountDto,
  ): Promise<ProviderAccountDto> {
    return ProviderAccountDto.fromModel(await this.accounts.update(req.user, id, body));
  }
  /**
   * Delete the selected local provider account and its dependent tracked data.
   *
   * @param req - HTTP request carrying the authenticated application user.
   * @param id - Local identifier of the target record.
   * @returns A promise that resolves when the operation completes.
   * @throws ForbiddenException - System administrator access is required.
   * @throws NotFoundException - Provider account not found.
   */
  @Delete(':id') @HttpCode(204) async remove(
    @Req() req: { user: AuthenticatedUser },
    @Param('id') id: string,
  ): Promise<void> {
    await this.accounts.remove(req.user, id);
  }
}
