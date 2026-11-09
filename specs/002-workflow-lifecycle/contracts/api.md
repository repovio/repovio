# Contracts: Workflow Lifecycle Awareness

## Existing workflow-run responses

No route is added. Existing run DTOs and MCP run output schemas gain two optional/projectable fields:

| Field                      | Type                                  | Meaning                                                       |
| -------------------------- | ------------------------------------- | ------------------------------------------------------------- |
| workflowLifecycleState     | UNKNOWN / ACTIVE / DISABLED / REMOVED | Current last confirmed lifecycle state of the owning workflow |
| workflowLifecycleCheckedAt | ISO 8601 timestamp or null            | Latest authoritative lifecycle observation time               |

Resource and dashboard DTOs load lifecycle fields from the Workflow relation. Raw provider states remain internal.
Shared Zod schemas, field projection, OpenAPI, MCP declarations, and web types must agree. Existing status remains the
actual Workflow Run result; REMOVED and DISABLED are not run statuses.

## Internal provider adapter

listWorkflowLifecycles accepts a read-only account context, repository metadata, and distinct known workflow identities.
It returns observations containing providerWorkflowId, normalized state, and nullable rawState. Omitted identities mean
no reliable update; a missing response must never be converted into REMOVED.

Repository metadata can carry transient workflowCiEnabled (boolean or null) for reuse during the same synchronization.
It is not persisted as repository configuration or exposed as a new public field.

## Access and list semantics

Authorization remains enforced in Prisma queries. The shared lifecycle predicate applies before pagination and counting
for attention, approval, and active lists. Historical list endpoints retain inactive workflows under existing permissions.
