import { ApiPullRequestQuerySchema } from '@repovio/schemas';
import { createZodDto } from '../../../util/schema-dto.js';

/** Paginated pull-request query with text search and AND-combined labels. */
export class PullRequestQueryDto extends createZodDto(ApiPullRequestQuerySchema) {}
