import {
  ApiDashboardSecurityAlertSummarySchema,
  ApiDashboardStatusDistributionSchema,
  ApiDashboardSummarySchema,
} from '@repovio/schemas';
import { createZodDto } from '../../../util/schema-dto.js';

/** Open security-alert counters available only to managers and administrators. */
export class DashboardSecurityAlertSummaryDto extends createZodDto(ApiDashboardSecurityAlertSummarySchema) {}

/** Completed workflow-run counts grouped by normalized terminal status. */
export class DashboardStatusDistributionDto extends createZodDto(ApiDashboardStatusDistributionSchema) {}

/** Permission-aware workflow health summary for one requested period. */
export class DashboardSummaryDto extends createZodDto(ApiDashboardSummarySchema) {}
