import {
  ApiSaveRepositoryGroupSchema,
  ApiSaveUserGroupSchema,
  ApiUserGroupQuerySchema,
  ApiUserGroupSchema,
} from '@repovio/schemas';
import { createZodDto } from '../../util/schema-dto.js';

/** Validated paginated access group query. */
export class UserGroupQueryDto extends createZodDto(ApiUserGroupQuerySchema) {}
/** Explicit group projection used by Query Kit. */
export class UserGroupDto extends createZodDto(ApiUserGroupSchema) {}
/** Validated create and rename payload. */
export class SaveUserGroupDto extends createZodDto(ApiSaveUserGroupSchema) {}
/** Validated repository group role. */
export class SaveRepositoryGroupDto extends createZodDto(ApiSaveRepositoryGroupSchema) {}
