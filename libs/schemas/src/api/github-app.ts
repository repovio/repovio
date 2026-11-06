import { z } from 'zod';

const installationId = z.string().regex(/^[1-9]\d{0,19}$/);
/** Safe deployment-owned GitHub App configuration; secret values are write-only. */
export const GitHubAppConfigurationSchema = z.strictObject({
  configured: z.boolean(),
  appId: z.string().nullable(),
  slug: z.string().nullable(),
  installationUrl: z.string().nullable(),
  webhookUrl: z.string(),
});
/** Full configuration on first save; omitted secrets retain their encrypted values on rotation. */
export const SaveGitHubAppSchema = z.strictObject({
  appId: installationId,
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-zA-Z0-9-]+$/),
  privateKey: z.string().min(1).max(32768).optional(),
  webhookSecret: z.string().min(16).max(4096).optional(),
});
/** Installation identity discovered from the configured App, never from arbitrary callback input. */
export const GitHubAppInstallationSchema = z.strictObject({
  installationId,
  account: z.string(),
  suspended: z.boolean(),
  connected: z.boolean(),
});
/** Connect one server-verified installation to a local provider account. */
export const ConnectGitHubAppSchema = z.strictObject({
  installationId,
  displayName: z.string().trim().min(1).max(255),
});
/** Defines the git hub app configuration contract shared by its consumers. */ export type GitHubAppConfiguration =
  z.infer<typeof GitHubAppConfigurationSchema>;
/** Defines the save git hub app contract shared by its consumers. */ export type SaveGitHubApp = z.infer<
  typeof SaveGitHubAppSchema
>;
/** Defines the git hub app installation contract shared by its consumers. */ export type GitHubAppInstallation =
  z.infer<typeof GitHubAppInstallationSchema>;
/** Defines the connect git hub app contract shared by its consumers. */ export type ConnectGitHubApp = z.infer<
  typeof ConnectGitHubAppSchema
>;
