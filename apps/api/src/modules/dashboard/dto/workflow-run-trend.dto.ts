import {
  ApiDashboardPeriodQuerySchema,
  ApiWorkflowRunTrendBucketSchema,
  ApiWorkflowRunTrendQuerySchema,
} from '@repovio/schemas';
import { createZodDto } from '../../../util/schema-dto.js';

/** UTC granularity used to group completed workflow runs in dashboard trends. */
export const trendBucketSizes = ['hour', 'day', 'week'] as const;
export type TrendBucketSize = (typeof trendBucketSizes)[number];

/** Requested inclusive time range for permission-aware dashboard aggregates. */
export class DashboardPeriodQueryDto extends createZodDto(ApiDashboardPeriodQuerySchema) {}

/** Requested time range and UTC bucket size for the workflow-run trend endpoint. */
export class WorkflowRunTrendQueryDto extends createZodDto(ApiWorkflowRunTrendQuerySchema) {}

/** Success and error counts for one UTC trend interval. */
export class WorkflowRunTrendBucketDto extends createZodDto(ApiWorkflowRunTrendBucketSchema) {}
