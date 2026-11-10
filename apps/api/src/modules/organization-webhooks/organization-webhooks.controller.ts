import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import {
  ApiCreateOrganizationWebhookSchema,
  ApiOrganizationWebhookDraftSchema,
  ApiOrganizationWebhookSchema,
  ApiRotateOrganizationWebhookSchema,
  type OrganizationWebhook,
  type OrganizationWebhookDraft,
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
   * Preview a callback without creating a local or provider resource.
   * @param req Authenticated caller, checked for administrator access by the service.
   * @param id Provider account owning future configuration.
   * @returns Uncacheable callback identity and canonical public URL.
   * @throws ForbiddenException Administrator access is required.
   * @throws NotFoundException The connection does not exist.
   */
  @Get('draft')
  @Header('Cache-Control', 'no-store')
  @SchemaResponse(ApiOrganizationWebhookDraftSchema)
  @ApiErrorResponses()
  draft(
    @Req() req: { user: AuthenticatedUser },
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<OrganizationWebhookDraft> {
    return this.webhooks.draft(req.user, id);
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
