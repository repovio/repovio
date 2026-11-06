import { Module } from '@nestjs/common';

import { CaslModule } from '../../casl/casl.module.js';
import { SettingsController } from './settings.controller.js';
import { SettingsService } from './settings.service.js';

/** Registers the settings module providers and imports with Nest. */ @Module({
  controllers: [SettingsController],
  imports: [CaslModule],
  providers: [SettingsService],
})
export class SettingsModule {}
