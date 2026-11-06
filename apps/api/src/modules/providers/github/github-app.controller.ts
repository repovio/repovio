import { Body, Controller, Delete, Get, HttpCode, Post, Put, Req } from '@nestjs/common';
import {
  ApiProviderAccountSchema,
  ConnectGitHubAppSchema,
  GitHubAppConfigurationSchema,
  GitHubAppInstallationSchema,
  SaveGitHubAppSchema,
  type GitHubAppConfiguration,
  type GitHubAppInstallation,
} from '@repovio/schemas';
import { z } from 'zod';
import { SchemaResponse } from '../../../util/resource-contract.js';
import { createZodDto } from '../../../util/schema-dto.js';
import { Authenticated } from '../../auth/authenticated.decorator.js';
import type { AuthenticatedUser } from '../../auth/types.js';
import { ProviderAccountDto } from '../../repositories/dto/resource.dto.js';
import { GitHubAppService } from './github-app.service.js';

/** Validated write-only App credentials and public configuration metadata. */
class SaveGitHubAppDto extends createZodDto(SaveGitHubAppSchema) {}
/** Administrator-selected installation identity and account display name. */
class ConnectGitHubAppDto extends createZodDto(ConnectGitHubAppSchema) {}

/** Admin-only configuration and connection endpoints for a deployment-owned GitHub App. */
@Authenticated()
@Controller('github-app')
export class GitHubAppController {
  /**
   * Initialize the App administration boundary.
   * @param app - Configuration and installation service.
   */
  constructor(private readonly app: GitHubAppService) {}

  /**
   * Read safe App setup metadata.
   * @param request - Authenticated administrator request.
   * @returns Configuration without secrets.
   * @throws ForbiddenException - Administrator access is required.
   */
  @Get()
  @SchemaResponse(GitHubAppConfigurationSchema)
  configuration(@Req() request: { user: AuthenticatedUser }): Promise<GitHubAppConfiguration> {
    return this.app.configuration(request.user);
  }

  /**
   * Save validated App settings or rotate write-only secrets.
   * @param request - Authenticated administrator request.
   * @param body - Validated identity and credentials.
   * @returns Safe configuration.
   * @throws BadRequestException - Settings or credentials are invalid.
   * @throws ConflictException - Connected installations prevent App replacement.
   * @throws ForbiddenException - Administrator access is required.
   */
  @Put()
  @SchemaResponse(GitHubAppConfigurationSchema)
  save(@Req() request: { user: AuthenticatedUser }, @Body() body: SaveGitHubAppDto): Promise<GitHubAppConfiguration> {
    return this.app.save(request.user, body);
  }

  /**
   * Remove unused local configuration without uninstalling anything on GitHub.
   * @param request - Authenticated administrator request.
   * @returns Local deletion completion.
   * @throws ConflictException - Connected installations still exist.
   * @throws ForbiddenException - Administrator access is required.
   */
  @Delete()
  @HttpCode(204)
  remove(@Req() request: { user: AuthenticatedUser }): Promise<void> {
    return this.app.remove(request.user);
  }

  /**
   * Refresh installations accessible to the configured App.
   * @param request - Authenticated administrator request.
   * @returns Safe installation choices.
   * @throws BadRequestException - App is not configured.
   * @throws ForbiddenException - Administrator access is required.
   */
  @Get('installations')
  @SchemaResponse(z.array(GitHubAppInstallationSchema))
  installations(@Req() request: { user: AuthenticatedUser }): Promise<GitHubAppInstallation[]> {
    return this.app.installations(request.user);
  }

  /**
   * Connect a server-verified installation as a local provider account.
   * @param request - Authenticated administrator request.
   * @param body - Installation identity and local display name.
   * @returns Safe provider account.
   * @throws BadRequestException - Installation is invalid or unavailable.
   * @throws ConflictException - Installation is connected or configuration changed.
   * @throws ForbiddenException - Administrator access is required.
   */
  @Post('installations')
  @SchemaResponse(ApiProviderAccountSchema, 201)
  async connect(
    @Req() request: { user: AuthenticatedUser },
    @Body() body: ConnectGitHubAppDto,
  ): Promise<ProviderAccountDto> {
    return ProviderAccountDto.fromModel(await this.app.connect(request.user, body));
  }
}
