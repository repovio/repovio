import { Module } from '@nestjs/common';
import { CaslModule } from '../../casl/casl.module.js';
import { SecurityModule } from '../../security/security.module.js';
import { OrganizationWebhooksController } from './organization-webhooks.controller.js';
import { OrganizationWebhooksService } from './organization-webhooks.service.js';

/** Registers administrator-only local configuration without provider write capabilities. */
@Module({
  imports: [CaslModule, SecurityModule],
  controllers: [OrganizationWebhooksController],
  providers: [OrganizationWebhooksService],
})
export class OrganizationWebhooksModule {}
