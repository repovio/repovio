import { z } from 'zod';
import { resourceQuerySchemas } from '../queries.js';

/** Safe local access group representation. */
export const ApiUserGroupSchema = z.strictObject({
  id: z.uuid(),
  name: z.string(),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
});
/** Values accepted when creating or renaming an access group. */
export const ApiSaveUserGroupSchema = z.strictObject({ name: z.string().trim().min(1).max(255) });
/** Validated group table query. */
export const ApiUserGroupQuerySchema = resourceQuerySchemas.UserGroup;
/** Role assigned to all members of a group for one repository. */
export const ApiSaveRepositoryGroupSchema = z.strictObject({ role: z.enum(['VIEWER', 'MANAGER']) });
/** Safe repository group assignment, separate from direct user assignments. */
export const ApiRepositoryGroupSchema = z.strictObject({
  id: z.uuid(),
  repositoryId: z.uuid(),
  groupId: z.uuid(),
  role: z.enum(['VIEWER', 'MANAGER']),
  group: ApiUserGroupSchema,
});
/** Shared group response type. */
export type UserGroup = z.infer<typeof ApiUserGroupSchema>;
/** Shared group mutation type. */
export type SaveUserGroup = z.infer<typeof ApiSaveUserGroupSchema>;
/** Shared repository group response type. */
export type RepositoryGroup = z.infer<typeof ApiRepositoryGroupSchema>;
