import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Req } from '@nestjs/common';
import { ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import {
  ApiCreateOrganizationWebhookSchema,
  ApiOrganizationWebhookSchema,
  ApiRotateOrganizationWebhookSchema,
  type OrganizationWebhook,
} from '@repovio/schemas';
import { z } from 'zod';
import { ApiErrorResponses, SchemaResponse } from '../../util/resource-contract.js';
import { createZodDto } from '../../util/schema-dto.js';
import { Authenticated } from '../auth/authenticated.decorator.js';
import type { AuthenticatedUser } from '../auth/types.js';
import { OrganizationWebhooksService } from './organization-webhooks.service.js';

/** Namespace and write-only secret accepted for creation. */
class CreateOrganizationWebhookDto extends createZodDto(ApiCreateOrganizationWebhookSchema) {}
/** Write-only replacement secret; namespace changes are not accepted. */
class RotateOrganizationWebhookDto extends createZodDto(ApiRotateOrganizationWebhookSchema) {}

/** Administrator-only local organization webhook configuration. */
@Authenticated()
@ApiTags('organization-webhooks')
@Controller('provider-accounts/:id/organization-webhooks')
export class OrganizationWebhooksController {
  /**
   * Initialize the configuration controller.
   * @param webhooks - Service enforcing authorization and connection boundaries.
   */
  constructor(private readonly webhooks: OrganizationWebhooksService) {}

  /**
   * List configuration metadata without secrets.
   * @param req - Authenticated caller.
   * @param id - Provider connection identifier.
   * @returns Safe local configurations.
   * @throws ForbiddenException - Administrator access is required.
   * @throws NotFoundException - Connection not found.
   */
  @Get()
  @SchemaResponse(z.array(ApiOrganizationWebhookSchema))
  @ApiErrorResponses()
  list(
    @Req() req: { user: AuthenticatedUser },
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<OrganizationWebhook[]> {
    return this.webhooks.list(req.user, id);
  }

  /**
   * Create local configuration without registering a provider webhook.
   * @param req - Authenticated administrator.
   * @param id - Provider connection identifier.
   * @param body - Validated namespace and signing secret.
   * @returns Safe configuration and callback URL.
   * @throws ForbiddenException - Administrator access is required.
   * @throws NotFoundException - Connection not found.
   * @throws ConflictException - Namespace already configured.
   * @throws BadRequestException - Namespace is invalid for this provider.
   */
  @Post()
  @SchemaResponse(ApiOrganizationWebhookSchema, 201)
  @ApiErrorResponses()
  create(
    @Req() req: { user: AuthenticatedUser },
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: CreateOrganizationWebhookDto,
  ): Promise<OrganizationWebhook> {
    return this.webhooks.create(req.user, id, body);
  }

  /**
   * Rotate a scoped signing secret.
   * @param req - Authenticated administrator.
   * @param id - Provider connection identifier.
   * @param webhookId - Configuration identifier within the connection.
   * @param body - Validated replacement secret.
   * @returns Safe configuration metadata.
   * @throws ForbiddenException - Administrator access is required.
   * @throws NotFoundException - Scoped configuration not found.
   */
  @Patch(':webhookId')
  @SchemaResponse(ApiOrganizationWebhookSchema)
  @ApiErrorResponses()
  rotate(
    @Req() req: { user: AuthenticatedUser },
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('webhookId', new ParseUUIDPipe()) webhookId: string,
    @Body() body: RotateOrganizationWebhookDto,
  ): Promise<OrganizationWebhook> {
    return this.webhooks.rotate(req.user, id, webhookId, body.webhookSecret);
  }

  /**
   * Remove a scoped local hook, leaving provider resources unchanged.
   * @param req - Authenticated administrator.
   * @param id - Provider connection identifier.
   * @param webhookId - Configuration identifier within the connection.
   * @returns Resolves after local removal.
   * @throws ForbiddenException - Administrator access is required.
   * @throws NotFoundException - Scoped configuration not found.
   */
  @Delete(':webhookId')
  @HttpCode(204)
  @ApiNoContentResponse({ description: 'Local organization webhook removed; provider unchanged.' })
  @ApiErrorResponses()
  remove(
    @Req() req: { user: AuthenticatedUser },
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('webhookId', new ParseUUIDPipe()) webhookId: string,
  ): Promise<void> {
    return this.webhooks.remove(req.user, id, webhookId);
  }
}
