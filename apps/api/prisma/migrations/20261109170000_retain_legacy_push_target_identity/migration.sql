-- Preserve existing device identity before nullable foreign keys are cleared; never infer recipient ownership.
UPDATE "notification_delivery_attempts"
SET "targetKey" = 'device:' || "browserPushSubscriptionId"::text
WHERE "targetKey" IS NULL AND "browserPushSubscriptionId" IS NOT NULL;
