-- Stable browser target identity survives device/User SET NULL without colliding with anonymous attempts.
ALTER TABLE "notification_delivery_attempts" ADD COLUMN "targetKey" VARCHAR(128);
DROP INDEX "notification_delivery_attempts_channel_attempt_unique";
DROP INDEX "notification_delivery_attempts_push_attempt_unique";
CREATE UNIQUE INDEX "notification_delivery_attempts_channel_attempt_unique"
  ON "notification_delivery_attempts"("notificationDeliveryId", "notificationChannelId", "attempt")
  WHERE "browserPushSubscriptionId" IS NULL AND "targetKey" IS NULL;
CREATE UNIQUE INDEX "notification_delivery_attempts_push_attempt_unique"
  ON "notification_delivery_attempts"("notificationDeliveryId", "notificationChannelId", "browserPushSubscriptionId", "attempt")
  WHERE "browserPushSubscriptionId" IS NOT NULL AND "targetKey" IS NULL;
CREATE UNIQUE INDEX "notification_attempt_stable_target_unique"
  ON "notification_delivery_attempts"("notificationDeliveryId", "notificationChannelId", "attempt", "targetKey")
  WHERE "targetKey" IS NOT NULL;
