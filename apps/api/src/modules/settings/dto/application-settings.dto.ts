import { ApiApplicationSettingsSchema, ApiUpdateApplicationSettingsSchema } from '@repovio/schemas';
import { createZodDto } from '../../../util/schema-dto.js';

/** Global application settings returned to authenticated clients. */
export class ApplicationSettingsDto extends createZodDto(ApiApplicationSettingsSchema) {}

/** Mutable global application settings available to system administrators. */
export class UpdateApplicationSettingsDto extends createZodDto(ApiUpdateApplicationSettingsSchema) {}
