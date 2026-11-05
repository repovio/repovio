import { ApiRemoteAvatarSchema } from '@repovio/schemas';
import { createZodDto } from '../../../util/schema-dto.js';

/** Remote avatar source accepted for a protected preview download. */
export class RemoteAvatarDto extends createZodDto(ApiRemoteAvatarSchema) {}
