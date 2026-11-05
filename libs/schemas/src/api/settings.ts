import { z } from 'zod';

/** Shared ApplicationSettings boundary schema. */
export const ApiApplicationSettingsSchema = z.strictObject({
  dateTimeFormat: z.union([z.literal('LOCALE_SHORT'), z.literal('LOCALE_MEDIUM'), z.literal('ISO')]),
  issueRetentionDays: z.number(),
  pullRequestRetentionDays: z.number(),
  workflowRunRetentionDays: z.number(),
});

/** Shared UpdateApplicationSettings boundary schema. */
export const ApiUpdateApplicationSettingsSchema = z.strictObject({
  dateTimeFormat: z.union([z.literal('LOCALE_SHORT'), z.literal('LOCALE_MEDIUM'), z.literal('ISO')]),
  issueRetentionDays: z.number().int().min(1).max(3650),
  pullRequestRetentionDays: z.number().int().min(1).max(3650),
  workflowRunRetentionDays: z.number().int().min(1).max(3650),
});
