-- CreateTable
CREATE TABLE "organization_webhooks" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scope" VARCHAR(255) NOT NULL,
    "encryptedWebhookSecret" TEXT NOT NULL,
    "providerAccountId" UUID NOT NULL,

    CONSTRAINT "organization_webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_webhook_deliveries" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveryId" VARCHAR(255) NOT NULL,
    "organizationWebhookId" UUID NOT NULL,

    CONSTRAINT "organization_webhook_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organization_webhooks_providerAccountId_scope_key" ON "organization_webhooks"("providerAccountId", "scope");

-- CreateIndex
CREATE INDEX "organization_webhook_deliveries_organizationWebhookId_creat_idx" ON "organization_webhook_deliveries"("organizationWebhookId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "organization_webhook_deliveries_organizationWebhookId_deliv_key" ON "organization_webhook_deliveries"("organizationWebhookId", "deliveryId");

-- AddForeignKey
ALTER TABLE "organization_webhooks" ADD CONSTRAINT "organization_webhooks_providerAccountId_fkey" FOREIGN KEY ("providerAccountId") REFERENCES "provider_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_webhook_deliveries" ADD CONSTRAINT "organization_webhook_deliveries_organizationWebhookId_fkey" FOREIGN KEY ("organizationWebhookId") REFERENCES "organization_webhooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
