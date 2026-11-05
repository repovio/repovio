import { ApiRepositoryWebhookConfigurationSchema } from '@repovio/schemas';
import { createZodDto } from '../../../util/schema-dto.js';

/** Safe repository webhook configuration metadata that never contains the signing secret. */
export class RepositoryWebhookConfigurationDto extends createZodDto(ApiRepositoryWebhookConfigurationSchema) {}
