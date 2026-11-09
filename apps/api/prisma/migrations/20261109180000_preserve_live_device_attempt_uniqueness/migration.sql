-- Old and new API writers share one uniqueness constraint while the browser device still exists.
DROP INDEX "notification_delivery_attempts_push_attempt_unique";
CREATE UNIQUE INDEX "notification_delivery_attempts_push_attempt_unique"
  ON "notification_delivery_attempts"("notificationDeliveryId", "notificationChannelId", "browserPushSubscriptionId", "attempt")
  WHERE "browserPushSubscriptionId" IS NOT NULL;
