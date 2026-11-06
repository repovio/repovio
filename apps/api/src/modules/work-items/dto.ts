import {
  ApiIssueSchema,
  ApiIssueSummarySchema,
  ApiPullRequestSchema,
  ApiPullRequestSummarySchema,
  ApiWorkItemActorSchema,
  ApiWorkItemFilterOptionsSchema,
  ApiWorkItemLabelSchema,
} from '@repovio/schemas';
import { createZodDto } from '../../util/schema-dto.js';

import { toWire } from '../../util/to-wire.js';

import { filterCaslFields } from '@querry-kit/nest/casl';

import { CaslAction } from '../../casl/casl-action.js';
import { CaslSubject } from '../../casl/casl-subject.js';
import type { AppAbility } from '../../casl/types.js';
import type { Issue, ProviderAccount, PullRequest, Repository } from '../../generated/prisma/client.js';

/** Provider identity safe to expose with a tracked work item. */
export class WorkItemActorDto extends createZodDto(ApiWorkItemActorSchema) {
  /**
   * Select the documented provider identity fields before validating their transport shape.
   *
   * @param actor - Persisted provider identity whose internal fields must remain private.
   * @returns The safe public identity without provider or database identifiers.
   */
  static fromModel(actor: WorkItemActorDto): WorkItemActorDto {
    return this.schema.parse({
      username: actor.username,
      displayName: actor.displayName,
      avatarUrl: actor.avatarUrl,
      url: actor.url,
    });
  }
}

/** Repository-specific provider label attached to a work item. */
export class WorkItemLabelDto extends createZodDto(ApiWorkItemLabelSchema) {
  /**
   * Select the documented provider label fields before validating their transport shape.
   *
   * @param label - Persisted provider label with possible internal relation identifiers.
   * @returns Its safe public label data.
   */
  static fromModel(label: WorkItemLabelDto): WorkItemLabelDto {
    return this.schema.parse({ name: label.name, color: label.color, description: label.description });
  }
}

interface WorkItemRelations {
  assignees: Array<{ actor: WorkItemActorDto }>;
  author: WorkItemActorDto | null;
  labels: Array<{ label: WorkItemLabelDto }>;
  repository: Pick<Repository, 'name' | 'owner'> & {
    providerAccount: Pick<ProviderAccount, 'providerType'>;
  };
}

/** Defines the issue resource model contract shared by its consumers. */ export type IssueResourceModel = Issue &
  WorkItemRelations;
/** Defines the pull request resource model contract shared by its consumers. */ export type PullRequestResourceModel =
  PullRequest & WorkItemRelations;

/** Public issue representation; descriptions are included only by detail endpoints. */
export class IssueDto extends createZodDto(ApiIssueSchema) {
  /**
   * Project one issue with optional detail-only body content.
   *
   * @param model - Loaded database record and relations required by the DTO mapping.
   * @param includeBody - Whether to expose the body reserved for detail responses.
   * @param ability - Optional cASL ability used to restrict resource access or exposed fields.
   * @returns The explicit public DTO projected from the supplied record.
   */
  static fromModel(model: IssueResourceModel, includeBody = false, ability?: AppAbility): IssueDto {
    return toWire(
      filterCaslFields(
        IssueDto.schema.parse(
          toWire({
            id: model.id,
            number: model.number,
            title: model.title,
            ...(includeBody ? { body: model.body } : {}),
            state: model.state,
            url: model.url,
            providerCreatedAt: model.providerCreatedAt,
            providerUpdatedAt: model.providerUpdatedAt,
            closedAt: model.closedAt,
            milestone: model.milestone,
            repositoryId: model.repositoryId,
            repositoryName: model.repository.name,
            repositoryOwner: model.repository.owner,
            providerType: model.repository.providerAccount.providerType,
            author: model.author ? WorkItemActorDto.fromModel(model.author) : null,
            assignees: model.assignees.map(
              /** Projects each entry using `WorkItemActorDto.fromModel(actor)`. */ ({ actor }) =>
                WorkItemActorDto.fromModel(actor),
            ),
            labels: model.labels.map(
              /** Projects each entry using `WorkItemLabelDto.fromModel(label)`. */ ({ label }) =>
                WorkItemLabelDto.fromModel(label),
            ),
          }),
        ),
        CaslSubject.Issue,
        ability,
        { action: CaslAction.Read },
      ),
    );
  }
}

/** Public pull-request representation; descriptions are included only by detail endpoints. */
export class PullRequestDto extends createZodDto(ApiPullRequestSchema) {
  /**
   * Project one pull request with optional detail-only body content.
   *
   * @param model - Loaded database record and relations required by the DTO mapping.
   * @param includeBody - Whether to expose the body reserved for detail responses.
   * @param ability - Optional cASL ability used to restrict resource access or exposed fields.
   * @returns The explicit public DTO projected from the supplied record.
   */
  static fromModel(model: PullRequestResourceModel, includeBody = false, ability?: AppAbility): PullRequestDto {
    return toWire(
      filterCaslFields(
        PullRequestDto.schema.parse(
          toWire({
            id: model.id,
            number: model.number,
            title: model.title,
            ...(includeBody ? { body: model.body } : {}),
            state: model.state,
            draft: model.draft,
            sourceBranch: model.sourceBranch,
            targetBranch: model.targetBranch,
            url: model.url,
            providerCreatedAt: model.providerCreatedAt,
            providerUpdatedAt: model.providerUpdatedAt,
            closedAt: model.closedAt,
            mergedAt: model.mergedAt,
            workflowStatus: model.workflowStatus,
            workflowApprovalRequired: model.workflowApprovalRequired,
            repositoryId: model.repositoryId,
            repositoryName: model.repository.name,
            repositoryOwner: model.repository.owner,
            providerType: model.repository.providerAccount.providerType,
            author: model.author ? WorkItemActorDto.fromModel(model.author) : null,
            assignees: model.assignees.map(
              /** Projects each entry using `WorkItemActorDto.fromModel(actor)`. */ ({ actor }) =>
                WorkItemActorDto.fromModel(actor),
            ),
            labels: model.labels.map(
              /** Projects each entry using `WorkItemLabelDto.fromModel(label)`. */ ({ label }) =>
                WorkItemLabelDto.fromModel(label),
            ),
          }),
        ),
        CaslSubject.PullRequest,
        ability,
        { action: CaslAction.Read },
      ),
    );
  }
}

/** Permission-scoped issue counters used by overview and dashboard pages. */
export class IssueSummaryDto extends createZodDto(ApiIssueSummarySchema) {}

/** Permission-scoped pull-request counters used by overview and dashboard pages. */
export class PullRequestSummaryDto extends createZodDto(ApiPullRequestSummarySchema) {}

/** Distinct visible values used to populate work-item filters. */
export class WorkItemFilterOptionsDto extends createZodDto(ApiWorkItemFilterOptionsSchema) {}
