import { Module } from '@nestjs/common';

import { HealthController } from './health.controller.js';
import { HealthService } from './health.service.js';

/** Registers the health module providers and imports with Nest. */ @Module({
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
