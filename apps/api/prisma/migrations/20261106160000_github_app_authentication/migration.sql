ALTER TABLE "provider_accounts"
  ADD COLUMN "authenticationMethod" VARCHAR(32) NOT NULL DEFAULT 'TOKEN',
  ADD COLUMN "githubInstallationId" VARCHAR(32),
  ADD COLUMN "githubInstallationState" VARCHAR(32);
CREATE UNIQUE INDEX "provider_accounts_githubInstallationId_key" ON "provider_accounts"("githubInstallationId");
ALTER TABLE "provider_accounts" ADD CONSTRAINT "provider_accounts_authentication_check" CHECK (
  ("authenticationMethod" = 'TOKEN' AND "githubInstallationId" IS NULL AND "githubInstallationState" IS NULL)
  OR ("authenticationMethod" = 'GITHUB_APP' AND "providerType" = 'GITHUB' AND "githubInstallationId" IS NOT NULL
    AND "githubInstallationState" IS NOT NULL AND "githubInstallationState" IN ('ACTIVE', 'SUSPENDED', 'REMOVED'))
);
CREATE TABLE "github_app_configuration" (
  "id" TEXT NOT NULL DEFAULT 'default' PRIMARY KEY,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "appId" VARCHAR(32) NOT NULL,
  "slug" VARCHAR(255) NOT NULL,
  "encryptedPrivateKey" TEXT NOT NULL,
  "encryptedWebhookSecret" TEXT NOT NULL
);
CREATE TABLE "github_app_deliveries" (
  "deliveryId" VARCHAR(255) PRIMARY KEY,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "github_app_deliveries_createdAt_idx" ON "github_app_deliveries"("createdAt");
