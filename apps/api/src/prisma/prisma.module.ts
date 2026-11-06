import { Global, Module } from '@nestjs/common';

import { PrismaService } from './prisma.service.js';
import { TestDatabaseService } from './test-database.service.js';

/** Registers the prisma module providers and imports with Nest. */ @Global()
@Module({
  providers: [PrismaService, TestDatabaseService],
  exports: [PrismaService, TestDatabaseService],
})
export class PrismaModule {}
