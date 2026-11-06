import { Module } from '@nestjs/common';
import { CaslModule } from '../../casl/casl.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { UserGroupsQueryService } from './user-groups-query.service.js';
import { RepositoryGroupsController, UserGroupsController } from './user-groups.controller.js';
import { UserGroupsService } from './user-groups.service.js';

/** Registers local group administration and repository assignment APIs. */
@Module({
  imports: [CaslModule, AuthModule],
  controllers: [UserGroupsController, RepositoryGroupsController],
  providers: [UserGroupsService, UserGroupsQueryService],
})
export class UserGroupsModule {}
