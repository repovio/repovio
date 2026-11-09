import { z } from 'zod';

/** Safe organization or GitLab group webhook configuration; secrets are write-only. */
export const ApiOrganizationWebhookSchema = z.strictObject({
  id: z.uuid(),
  providerAccountId: z.uuid(),
  providerType: z.enum(['GITHUB', 'GITLAB', 'FORGEJO', 'GITEA']),
  scope: z.string(),
  callbackUrl: z.url(),
  lastDeliveryAt: z.iso.datetime({ offset: true }).nullable(),
});

/** Write-only secret input shared by creation and rotation. */
export const ApiRotateOrganizationWebhookSchema = z.strictObject({
  webhookSecret: z.string().trim().min(16).max(1024),
});

/** Immutable organization login or full GitLab group path and initial signing secret. */
export const ApiCreateOrganizationWebhookSchema = ApiRotateOrganizationWebhookSchema.extend({
  scope: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .regex(/^[\p{L}\p{N}_.-]+(?:\/[\p{L}\p{N}_.-]+)*$/u),
});

/** Public organization webhook metadata consumed by the UI and API. */
export type OrganizationWebhook = z.output<typeof ApiOrganizationWebhookSchema>;

/** Validated organization webhook creation input. */
export type CreateOrganizationWebhook = z.output<typeof ApiCreateOrganizationWebhookSchema>;

/** Validated organization webhook secret rotation input. */
export type RotateOrganizationWebhook = z.output<typeof ApiRotateOrganizationWebhookSchema>;
