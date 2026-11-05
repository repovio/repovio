import {
  ApiSecurityAlertFilterOptionsSchema,
  ApiSecurityAlertSchema,
  ApiSecurityAlertSummarySchema,
} from '@repovio/schemas';
import { createZodDto } from '../../../util/schema-dto.js';

import { toWire } from '../../../util/to-wire.js';

import { filterCaslFields } from '@querry-kit/nest/casl';

import { CaslAction } from '../../../casl/casl-action.js';
import { CaslSubject } from '../../../casl/casl-subject.js';
import type { AppAbility } from '../../../casl/types.js';
import type { ProviderAccount, Repository, SecurityAlert } from '../../../generated/prisma/client.js';

export type SecurityAlertResourceModel = SecurityAlert & {
  repository: Pick<Repository, 'name' | 'owner'> & {
    providerAccount: Pick<ProviderAccount, 'providerType'>;
  };
};

/** Safe normalized security-alert representation. */
export class SecurityAlertDto extends createZodDto(ApiSecurityAlertSchema) {
  /**
   * Project explicitly safe normalized fields, optionally including detail text.
   *
   * @param model - Persisted normalized alert with repository metadata.
   * @param includeDescription - Whether to expose the safe normalized description.
   * @param ability - Optional ability used for field-level filtering.
   * @returns Safe public security-alert DTO.
   */
  static fromModel(
    model: SecurityAlertResourceModel,
    includeDescription = false,
    ability?: AppAbility,
  ): SecurityAlertDto {
    return toWire(
      filterCaslFields(
        SecurityAlertDto.schema.parse(
          toWire({
            ecosystem: model.ecosystem,
            fixedVersion: model.fixedVersion,
            id: model.id,
            identifiers: model.identifiers,
            kind: model.kind,
            location: ApiSecurityAlertSchema.shape.location.parse(model.location),
            manifest: model.manifest,
            packageName: model.packageName,
            providerCreatedAt: model.providerCreatedAt,
            providerType: model.repository.providerAccount.providerType,
            providerUpdatedAt: model.providerUpdatedAt,
            providerUrl: model.providerUrl,
            repositoryId: model.repositoryId,
            repositoryName: model.repository.name,
            repositoryOwner: model.repository.owner,
            resolution: model.resolution,
            resolvedAt: model.resolvedAt,
            ruleId: model.ruleId,
            scanner: model.scanner,
            secretProvider: model.secretProvider,
            secretType: model.secretType,
            severity: model.severity,
            state: model.state,
            title: model.title,
            tool: model.tool,
            vulnerableRange: model.vulnerableRange,
            ...(includeDescription ? { description: model.description } : {}),
          }),
        ),
        CaslSubject.SecurityAlert,
        ability,
        { action: CaslAction.Read },
      ),
    );
  }
}

/** Permission-scoped open alert and availability counters. */
export class SecurityAlertSummaryDto extends createZodDto(ApiSecurityAlertSummarySchema) {}

/** Visible repositories and kind-specific values used by alert filters. */
export class SecurityAlertFilterOptionsDto extends createZodDto(ApiSecurityAlertFilterOptionsSchema) {}
