-- Expand only: existing TOKEN and GITHUB_APP accounts retain their original behavior.
ALTER TABLE "provider_accounts"
  ADD COLUMN "encryptedRefreshToken" TEXT,
  ADD COLUMN "oauthAccessTokenExpiresAt" TIMESTAMP(3),
  ADD COLUMN "oauthClientId" TEXT,
  ADD COLUMN "oauthRedirectUri" TEXT,
  ADD COLUMN "gitlabUserId" VARCHAR(32),
  ADD COLUMN "oauthStatus" VARCHAR(32) NOT NULL DEFAULT 'NONE',
  ADD COLUMN "oauthAuthorizationRevision" INTEGER NOT NULL DEFAULT 0;
