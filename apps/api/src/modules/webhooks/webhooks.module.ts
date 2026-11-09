import { Module } from '@nestjs/common';

import { SecurityModule } from '../../security/security.module.js';
import { OrganizationWebhooksModule } from '../organization-webhooks/organization-webhooks.module.js';
import { ProvidersModule } from '../providers/providers.module.js';
import { GitHubAppWebhookService } from './github-app-webhook.service.js';
import { WebhookController } from './webhook.controller.js';
import { WebhookService } from './webhook.service.js';

/** Registers the webhooks module providers and imports with Nest. */ @Module({
  imports: [ProvidersModule, SecurityModule, OrganizationWebhooksModule],
  controllers: [WebhookController],
  providers: [WebhookService, GitHubAppWebhookService],
})
export class WebhooksModule {}
