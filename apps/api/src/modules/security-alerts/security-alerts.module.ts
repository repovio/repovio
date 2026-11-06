import { Module } from '@nestjs/common';

import { CaslModule } from '../../casl/casl.module.js';
import { SecurityAlertsQueryService } from './security-alerts-query.service.js';
import { SecurityAlertsController } from './security-alerts.controller.js';

/** Registers the security alerts module providers and imports with Nest. */ @Module({
  imports: [CaslModule],
  controllers: [SecurityAlertsController],
  providers: [SecurityAlertsQueryService],
  exports: [SecurityAlertsQueryService],
})
export class SecurityAlertsModule {}
