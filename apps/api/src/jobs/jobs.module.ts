import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { JobRunnerService } from './job-runner.service.js';
import { WorkflowRunRetentionService } from './workflow-run-retention.service.js';

/** Registers the jobs module providers and imports with Nest. */ @Module({
  imports: [ScheduleModule.forRoot()],
  providers: [JobRunnerService, WorkflowRunRetentionService],
  exports: [JobRunnerService, WorkflowRunRetentionService],
})
export class JobsModule {}
