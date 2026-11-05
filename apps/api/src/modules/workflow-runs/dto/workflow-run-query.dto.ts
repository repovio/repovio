import { ApiWorkflowRunQuerySchema } from '@repovio/schemas';
import { createZodDto } from '../../../util/schema-dto.js';

/** Paginated workflow-run query with an optional workflow-name search term. */
export class WorkflowRunQueryDto extends createZodDto(ApiWorkflowRunQuerySchema) {}
