import { Module } from '@nestjs/common';

import { CaslAbilityFactory } from './casl-ability.factory.js';
import { PoliciesGuard } from './policies.guard.js';

/** Registers the casl module providers and imports with Nest. */ @Module({
  providers: [CaslAbilityFactory, PoliciesGuard],
  exports: [CaslAbilityFactory, PoliciesGuard],
})
export class CaslModule {}
