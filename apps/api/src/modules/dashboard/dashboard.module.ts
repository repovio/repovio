import { Module } from '@nestjs/common';

import { CaslModule } from '../../casl/casl.module.js';
import { WorkflowRunsModule } from '../workflow-runs/workflow-runs.module.js';
import { DashboardController } from './dashboard.controller.js';
import { DashboardService } from './dashboard.service.js';

/** Registers the dashboard module providers and imports with Nest. */ @Module({
  imports: [CaslModule, WorkflowRunsModule],
  controllers: [DashboardController],
  exports: [DashboardService],
  providers: [DashboardService],
})
export class DashboardModule {}
