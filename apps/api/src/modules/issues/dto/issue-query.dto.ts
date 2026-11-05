import { ApiIssueQuerySchema } from '@repovio/schemas';
import { createZodDto } from '../../../util/schema-dto.js';

/** Paginated issue query with text search and AND-combined labels. */
export class IssueQueryDto extends createZodDto(ApiIssueQuerySchema) {}
