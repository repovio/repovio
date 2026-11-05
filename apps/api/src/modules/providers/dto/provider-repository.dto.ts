import { ApiProviderRepositorySchema } from '@repovio/schemas';
import { createZodDto } from '../../../util/schema-dto.js';

import { toWire } from '../../../util/to-wire.js';

import type { ProviderRepository } from '../provider-adapter.js';

/** A provider repository that can be added to Repovio tracking. */
export class ProviderRepositoryDto extends createZodDto(ApiProviderRepositorySchema) {
  /**
   * Map a provider response and local tracking state to a safe API response.
   *
   * @param repository - Repository identity and metadata required by the operation.
   * @param tracked - Whether the provider repository is already tracked locally.
   * @returns The provider repository DTO with its local tracking state.
   */
  static fromProvider(repository: ProviderRepository, tracked: boolean): ProviderRepositoryDto {
    return ProviderRepositoryDto.schema.parse(toWire({ ...repository, tracked }));
  }
}
