# Data Model: Workflow Lifecycle Awareness

## Workflow

| Field              | Constraint                                        | Meaning                                    |
| ------------------ | ------------------------------------------------- | ------------------------------------------ |
| lifecycleState     | WorkflowLifecycleState, required, default UNKNOWN | Last confirmed provider lifecycle state    |
| lifecycleCheckedAt | nullable DateTime                                 | Time of the last authoritative observation |
| lifecycleRawState  | nullable String, varchar(1024)                    | Raw provider state or repository CI marker |

WorkflowLifecycleState contains UNKNOWN, ACTIVE, DISABLED, and REMOVED. Existing unique identity
(repositoryId, providerWorkflowId) remains unchanged. No run or workflow is deleted by lifecycle reconciliation.

## State transitions

- Confirmed active, disabled, and removed metadata replace prior state and update the check time.
- Explicitly re-enabled Forgejo/GitLab repository CI changes repository-derived disabling to UNKNOWN.
- Missing, unsupported, unrecognized, or failed observations preserve state and check time.
- Historical run upserts never change existing lifecycle state.

## Derived current views

DISABLED and REMOVED are excluded from current attention/approval/active views and their counters. UNKNOWN and ACTIVE
remain eligible under existing status/context rules. Historical metrics and retention use unchanged run records.

## Migration and rollback

Add the enum and three columns; backfill is provided by UNKNOWN default, with null check/raw state. Apply before the new
application. Old application readers can continue using the expanded schema. Application rollback keeps added columns.
