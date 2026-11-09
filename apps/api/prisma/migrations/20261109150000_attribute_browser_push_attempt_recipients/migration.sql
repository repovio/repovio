-- Nullable attribution preserves old writers and deliberately leaves legacy attempts unattributed.
ALTER TABLE "notification_delivery_attempts" ADD COLUMN "recipientUserId" UUID;
ALTER TABLE "notification_delivery_attempts" ADD CONSTRAINT "notification_delivery_attempts_recipientUserId_fkey"
  FOREIGN KEY ("recipientUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "notification_attempt_recipient_delivery_created_idx"
  ON "notification_delivery_attempts"("recipientUserId", "notificationDeliveryId", "createdAt");
