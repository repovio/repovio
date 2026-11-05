import { Module } from '@nestjs/common';

import { CredentialEncryptionService } from './credential-encryption.service.js';

/** Provides reusable encryption for secrets stored by Repovio. */
@Module({
  providers: [CredentialEncryptionService],
  exports: [CredentialEncryptionService],
})
export class SecurityModule {}
