import {
  ApiRepositorySyncJobQuerySchema,
  ApiRepositorySyncJobSchema,
  ApiRepositorySyncJobStartSchema,
  ApiRepositorySyncJobSummarySchema,
} from '@repovio/schemas';
import { createZodDto } from '../../../util/schema-dto.js';

import { toWire } from '../../../util/to-wire.js';

import type { ProviderAccount, Repository, RepositorySyncRequest } from '../../../generated/prisma/client.js';

export type RepositorySyncJobModel = Repository & {
  providerAccount: Pick<ProviderAccount, 'displayName' | 'providerType'>;
  syncRequest: RepositorySyncRequest | null;
  securityAlertSyncStates?: Array<{ availability: string; kind: string }>;
};

/** Query parameters for the paginated repository synchronization job list. */
export class RepositorySyncJobQueryDto extends createZodDto(ApiRepositorySyncJobQuerySchema) {}

/** One permanently available repository synchronization job. */
export class RepositorySyncJobDto extends createZodDto(ApiRepositorySyncJobSchema) {
  /**
   * Convert a repository and its optional queue request to the public job representation.
   *
   * @param model - Loaded database record and relations required by the DTO mapping.
   * @returns The explicit public DTO projected from the supplied record.
   */
  static fromModel(model: RepositorySyncJobModel): RepositorySyncJobDto {
    const request = model.syncRequest;
    return RepositorySyncJobDto.schema.parse(
      toWire({
        attempt: request?.attempt ?? 0,
        id: model.id,
        lastError: request?.lastError ?? null,
        progressCurrent: request?.progressCurrent ?? null,
        progressPhase: request?.progressPhase ?? null,
        progressTotal: request?.progressTotal ?? null,
        providerName: model.providerAccount.displayName,
        providerType: model.providerAccount.providerType,
        repositoryName: model.name,
        repositoryOwner: model.owner,
        requestedAt: request?.requestedAt ?? null,
        runAfter: request?.runAfter ?? null,
        scopes: request
          ? [
              ...(request.syncWorkflows ? ['WORKFLOWS' as const] : []),
              ...(request.syncIssues ? ['ISSUES' as const] : []),
              ...(request.syncPullRequests ? ['PULL_REQUESTS' as const] : []),
              ...(request.syncAlerts ? ['ALERTS' as const] : []),
            ]
          : ['WORKFLOWS', 'ISSUES', 'PULL_REQUESTS', 'ALERTS'],
        startedAt: request?.startedAt ?? null,
        status: request?.status ?? 'IDLE',
        warningKinds: (model.securityAlertSyncStates ?? [])
          .filter(({ availability }) => availability === 'UNAVAILABLE')
          .map(({ kind }) => kind),
      }),
    );
  }
}

/** Aggregate state counters for all visible repository synchronization jobs. */
export class RepositorySyncJobSummaryDto extends createZodDto(ApiRepositorySyncJobSummarySchema) {}

/** Number of repository synchronization jobs accepted by a manual start request. */
export class RepositorySyncJobStartDto extends createZodDto(ApiRepositorySyncJobStartSchema) {}
