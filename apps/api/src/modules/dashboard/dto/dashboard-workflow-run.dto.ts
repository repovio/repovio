import {
  ApiDashboardProviderSchema,
  ApiDashboardRepositorySchema,
  ApiDashboardWorkflowRunSchema,
} from '@repovio/schemas';
import { createZodDto } from '../../../util/schema-dto.js';
import { normalizeWorkflowRunTiming } from '../../workflow-runs/workflow-run-timing.js';

import { toWire } from '../../../util/to-wire.js';

import type { ProviderAccount, Repository, Workflow, WorkflowRun } from '../../../generated/prisma/client.js';

/** Safe provider identity displayed alongside a dashboard workflow run. */
export class DashboardProviderDto extends createZodDto(ApiDashboardProviderSchema) {}

/** Safe repository identity and link displayed alongside a dashboard workflow run. */
export class DashboardRepositoryDto extends createZodDto(ApiDashboardRepositorySchema) {}

/** Dashboard representation of a workflow run with repository and provider context. */
export class DashboardWorkflowRunDto extends createZodDto(ApiDashboardWorkflowRunSchema) {
  /**
   * Map a loaded dashboard workflow run to its explicit safe public representation.
   *
   * @param model - Loaded database record and relations required by the DTO mapping.
   * @returns The explicit public DTO projected from the supplied record.
   */
  static fromModel(model: DashboardWorkflowRunModel): DashboardWorkflowRunDto {
    const timing = normalizeWorkflowRunTiming(model);
    return DashboardWorkflowRunDto.schema.parse(
      toWire({
        awaitingApproval: model.awaitingApproval,
        id: model.id,
        providerRunId: model.providerRunId,
        workflowName: model.workflowName,
        workflowLifecycleState: model.workflow?.lifecycleState ?? 'UNKNOWN',
        workflowLifecycleCheckedAt: model.workflow?.lifecycleCheckedAt ?? null,
        displayTitle: model.displayTitle,
        url: model.url,
        providerCreatedAt: model.providerCreatedAt,
        startedAt: timing.startedAt,
        completedAt: timing.completedAt,
        durationMs: timing.durationMs === null ? null : Number(timing.durationMs),
        reviewUrl: model.reviewUrl,
        status: model.status,
        repository: {
          id: model.repository.id,
          owner: model.repository.owner,
          name: model.repository.name,
          url: model.repository.url,
        },
        provider: {
          id: model.repository.providerAccount.id,
          providerType: model.repository.providerAccount.providerType,
          displayName: model.repository.providerAccount.displayName,
        },
      }),
    );
  }
}

/** Workflow run with the safe repository and provider relations required by the dashboard. */
export type DashboardWorkflowRunModel = WorkflowRun & {
  workflow?: Pick<Workflow, 'lifecycleState' | 'lifecycleCheckedAt'>;
  repository: Pick<Repository, 'id' | 'name' | 'owner' | 'url'> & {
    providerAccount: Pick<ProviderAccount, 'displayName' | 'id' | 'providerType'>;
  };
};
