import { ApiUserSchema } from '@repovio/schemas';
import { createZodDto } from '../../../util/schema-dto.js';

import { toWire } from '../../../util/to-wire.js';

import { filterCaslFields } from '@querry-kit/nest/casl';

import { CaslAction } from '../../../casl/casl-action.js';
import { CaslSubject } from '../../../casl/casl-subject.js';
import type { AppAbility } from '../../../casl/types.js';
import type { User } from '../../../generated/prisma/client.js';

export type UserWithAvatar = User & { avatar?: { updatedAt: Date } | null };

/** Public user representation without credential material. */
export class UserDto extends createZodDto(ApiUserSchema) {
  /**
   * Convert a persisted user to a permission-filtered public representation.
   *
   * @param model - Loaded database record and relations required by the DTO mapping.
   * @param ability - Optional cASL ability used to restrict resource access or exposed fields.
   * @returns The explicit public DTO projected from the supplied record.
   */
  static fromModel(model: UserWithAvatar, ability?: AppAbility): UserDto {
    return toWire(
      filterCaslFields(
        UserDto.schema.parse(
          toWire({
            authProvider: model.authProvider,
            avatarUpdatedAt: model.avatar?.updatedAt ?? null,
            firstName: model.firstName,
            id: model.id,
            lastName: model.lastName,
            username: model.username,
            role: model.role,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
          }),
        ),
        CaslSubject.User,
        ability,
        { action: CaslAction.Read },
      ),
    );
  }
}
