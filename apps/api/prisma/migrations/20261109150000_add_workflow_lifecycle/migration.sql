CREATE TYPE "WorkflowLifecycleState" AS ENUM ('UNKNOWN', 'ACTIVE', 'DISABLED', 'REMOVED');

ALTER TABLE "workflows"
ADD COLUMN "lifecycleState" "WorkflowLifecycleState" NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN "lifecycleCheckedAt" TIMESTAMP(3),
ADD COLUMN "lifecycleRawState" VARCHAR(1024);
