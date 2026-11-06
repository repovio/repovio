import { Module } from '@nestjs/common';
import { CaslModule } from '../../casl/casl.module.js';
import { PullRequestsQueryService } from './pull-requests-query.service.js';
import { PullRequestsController } from './pull-requests.controller.js';

/** Registers the pull requests module providers and imports with Nest. */ @Module({
  imports: [CaslModule],
  controllers: [PullRequestsController],
  providers: [PullRequestsQueryService],
  exports: [PullRequestsQueryService],
})
export class PullRequestsModule {}
