import {
  ApiProviderAccountSchema,
  ApiRepositoryDetailSchema,
  ApiRepositoryMembershipSchema,
  ApiRepositoryMemberSummarySchema,
  ApiRepositorySchema,
  ApiRepositorySyncStateSchema,
  ApiWorkflowFilterSchema,
  ApiWorkflowRunSchema,
} from '@repovio/schemas';
import { createZodDto } from '../../../util/schema-dto.js';
import { resolveAvatarMetadata } from '../../auth/avatar-metadata.js';

import { toWire } from '../../../util/to-wire.js';

import { filterCaslFields } from '@querry-kit/nest/casl';

import { CaslAction } from '../../../casl/casl-action.js';
import { CaslSubject } from '../../../casl/casl-subject.js';
import type { AppAbility } from '../../../casl/types.js';
import type {
  ProviderAccount,
  Repository,
  RepositoryMembership,
  RepositorySyncRequest,
  User,
  Workflow,
  WorkflowFilter,
  WorkflowRun,
} from '../../../generated/prisma/client.js';

/** Public provider-account representation that deliberately excludes its access token. */
export class ProviderAccountDto extends createZodDto(ApiProviderAccountSchema) {
  /**
   * Convert a provider account to its safe public representation.
   *
   * @param model - Loaded database record and relations required by the DTO mapping.
   * @param ability - Optional cASL ability used to restrict resource access or exposed fields.
   * @returns The explicit public DTO projected from the supplied record.
   */
  static fromModel(model: ProviderAccount, ability?: AppAbility): ProviderAccountDto {
    return toWire(
      filterCaslFields(
        ProviderAccountDto.schema.parse(
          toWire({
            id: model.id,
            providerType: model.providerType,
            oauthStatus: model.oauthStatus ?? 'NONE',
            authenticationMethod: model.authenticationMethod ?? 'TOKEN',
            githubInstallationState: model.githubInstallationState ?? null,
            displayName: model.displayName,
            baseUrl: model.baseUrl,
            enabled: model.enabled,
            lastSyncAt: model.lastSyncAt,
          }),
        ),
        CaslSubject.ProviderAccount,
        ability,
        { action: CaslAction.Read },
      ),
    );
  }
}

/** Minimal safe user identity rendered in repository member avatar groups. */
export class RepositoryMemberSummaryDto extends createZodDto(ApiRepositoryMemberSummarySchema) {}

/** Public tracked-repository representation. */
export class RepositoryDto extends createZodDto(ApiRepositorySchema) {
  /**
   * Convert a tracked repository to a permission-filtered API response.
   *
   * @param model - Loaded database record and relations required by the DTO mapping.
   * @param ability - Optional cASL ability used to restrict resource access or exposed fields.
   * @returns The explicit public DTO projected from the supplied record.
   */
  static fromModel(model: RepositoryResourceModel, ability?: AppAbility): RepositoryDto {
    return toWire(
      filterCaslFields(
        RepositoryDto.schema.parse(
          toWire({
            id: model.id,
            providerRepositoryId: model.providerRepositoryId,
            owner: model.owner,
            name: model.name,
            url: model.url,
            enabled: model.enabled,
            lastSyncAt: model.lastSyncAt,
            issueRetentionDays: model.issueRetentionDays,
            pullRequestRetentionDays: model.pullRequestRetentionDays,
            workflowRunRetentionDays: model.workflowRunRetentionDays,
            providerAccountId: model.providerAccountId,
            members: (model.memberships ?? []).map(
              /** Projects each entry using the members mapping. */ (membership) => ({
                ...resolveAvatarMetadata(membership.user),
                firstName: membership.user.firstName,
                lastName: membership.user.lastName,
                userId: membership.userId,
                username: membership.user.username,
              }),
            ),
            ...(model._count ? { workflowRunCount: model._count.workflowRuns } : {}),
          }),
        ),
        CaslSubject.Repository,
        ability,
        { action: CaslAction.Read },
      ),
    );
  }
}

/** Safe synchronization state displayed on one repository detail page. */
export class RepositorySyncStateDto extends createZodDto(ApiRepositorySyncStateSchema) {}

/** Permission-filtered repository detail with safe synchronization metadata. */
export class RepositoryDetailDto extends createZodDto(ApiRepositoryDetailSchema) {
  /**
   * Convert a visible repository and its queue request into the detail response.
   *
   * @param model - Loaded repository and optional synchronization request.
   * @param syncIntervalSeconds - Configured fallback polling interval.
   * @param ability - Ability used to restrict repository fields.
   * @returns The safe repository detail representation.
   */
  static fromDetailModel(
    model: RepositoryResourceModel,
    syncIntervalSeconds: number,
    ability?: AppAbility,
  ): RepositoryDetailDto {
    const request = model.syncRequest;
    return toWire({
      ...RepositoryDto.fromModel(model, ability),
      syncIntervalSeconds,
      syncState: {
        attempt: request?.attempt ?? 0,
        lastError: request?.lastError ?? null,
        progressCurrent: request?.progressCurrent ?? null,
        progressPhase: request?.progressPhase ?? null,
        progressTotal: request?.progressTotal ?? null,
        requestedAt: request?.requestedAt ?? null,
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
          .filter(
            /** Keeps entries matching `availability === 'UNAVAILABLE'`. */ ({ availability }) =>
              availability === 'UNAVAILABLE',
          )
          .map(/** Projects each entry using `kind`. */ ({ kind }) => kind),
      },
    });
  }
}

/** Repository model with an optional workflow-run aggregate used by list endpoints. */
export type RepositoryResourceModel = Repository & {
  _count?: { workflowRuns: number };
  memberships?: Array<{
    user: {
      avatar: { updatedAt: Date } | null;
      oidcAvatar?: { updatedAt: Date } | null;
      firstName: string | null;
      lastName: string | null;
      username: string;
    };
    userId: string;
  }>;
  syncRequest?: RepositorySyncRequest | null;
  securityAlertSyncStates?: Array<{ availability: string; kind: string }>;
};

/** Public workflow-run representation used by dashboard and history endpoints. */
export class WorkflowRunDto extends createZodDto(ApiWorkflowRunSchema) {
  /**
   * Convert a normalized provider run to a permission-filtered API response.
   *
   * @param model - Loaded database record and relations required by the DTO mapping.
   * @param ability - Optional cASL ability used to restrict resource access or exposed fields.
   * @returns The explicit public DTO projected from the supplied record.
   */
  static fromModel(model: WorkflowRunResourceModel, ability?: AppAbility): WorkflowRunDto {
    return toWire(
      filterCaslFields(
        WorkflowRunDto.schema.parse(
          toWire({
            id: model.id,
            providerRunId: model.providerRunId,
            workflowName: model.workflowName,
            workflowLifecycleState: model.workflow?.lifecycleState ?? 'UNKNOWN',
            workflowLifecycleCheckedAt: model.workflow?.lifecycleCheckedAt ?? null,
            displayTitle: model.displayTitle,
            url: model.url,
            providerCreatedAt: model.providerCreatedAt,
            startedAt: model.startedAt,
            completedAt: model.completedAt,
            durationMs: model.durationMs === null ? null : Number(model.durationMs),
            status: model.status,
            repositoryId: model.repositoryId,
            repositoryName: model.repository.name,
            repositoryOwner: model.repository.owner,
            providerType: model.repository.providerAccount.providerType,
          }),
        ),
        CaslSubject.WorkflowRun,
        ability,
        { action: CaslAction.Read },
      ),
    );
  }
}

/** Workflow run with the minimal repository and provider context exposed by the resource endpoint. */
export type WorkflowRunResourceModel = Omit<
  WorkflowRun,
  | 'changeRequestCheckedAt'
  | 'changeRequestMergedAt'
  | 'changeRequestState'
  | 'changeRequestTargetBranch'
  | 'pullRequestId'
> & {
  workflow?: Pick<Workflow, 'lifecycleState' | 'lifecycleCheckedAt'>;
  repository: Pick<Repository, 'name' | 'owner'> & {
    providerAccount: Pick<ProviderAccount, 'providerType'>;
  };
};

/** Public workflow filter representation. */
export class WorkflowFilterDto extends createZodDto(ApiWorkflowFilterSchema) {
  /**
   * Convert a workflow filter to a repository-scoped API response.
   *
   * @param model - Loaded database record and relations required by the DTO mapping.
   * @param ability - Optional cASL ability used to restrict resource access or exposed fields.
   * @returns The explicit public DTO projected from the supplied record.
   */
  static fromModel(model: WorkflowFilter, ability?: AppAbility): WorkflowFilterDto {
    return toWire(
      filterCaslFields(
        WorkflowFilterDto.schema.parse(
          toWire({ id: model.id, pattern: model.pattern, mode: model.mode, repositoryId: model.repositoryId }),
        ),
        CaslSubject.Repository,
        ability,
        { action: CaslAction.Read },
      ),
    );
  }
}

/** Safe repository member representation without credential material. */
export class RepositoryMembershipDto extends createZodDto(ApiRepositoryMembershipSchema) {
  /**
   * Convert a membership and its safe user relation into a public representation.
   *
   * @param model - Loaded database record and relations required by the DTO mapping.
   * @returns The explicit public DTO projected from the supplied record.
   */
  static fromModel(
    model: RepositoryMembership & {
      user: Pick<User, 'firstName' | 'id' | 'lastName' | 'role' | 'username'> & {
        avatar: { updatedAt: Date } | null;
        oidcAvatar?: { updatedAt: Date } | null;
      };
    },
  ): RepositoryMembershipDto {
    return RepositoryMembershipDto.schema.parse(
      toWire({
        id: model.id,
        repositoryId: model.repositoryId,
        role: model.role,
        user: {
          ...resolveAvatarMetadata(model.user),
          firstName: model.user.firstName,
          id: model.user.id,
          lastName: model.user.lastName,
          role: model.user.role,
          username: model.user.username,
        },
        userId: model.userId,
      }),
    );
  }
}
