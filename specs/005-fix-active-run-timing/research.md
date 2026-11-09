# Research: Active Workflow Run Timing

## Matching source defect

- Decision: Normalize Forgejo status before interpreting final timing.
- Evidence: `apps/api/src/modules/providers/forgejo/forgejo-actions.adapter.ts:506-535` accepts every truthy `stopped`
  string, subtracts `started`, and only then normalizes status. An epoch timestamp is truthy and produces a negative
  duration when the run started recently.
- Rationale: This source defect explains the reported pair of symptoms without needing a generic date-format change.
- Alternatives considered: Frontend-only masking leaves invalid persistence and API values; replacing the epoch with
  the current time invents a completion event. Neither is sufficient.
- Limitation: No live provider payload or browser reproduction was obtained during planning.

## Active final timing

- Decision: QUEUED/RUNNING runs expose null completion and null final duration. No elapsed clock.
- Rationale: The existing UI displays persisted final timing; a positive provider duration is not proof of completion.
- Evidence: `forgejo-actions.adapter.spec.ts:195-231` currently expects 3,000 ms for an approval-waiting run. Change
  that assertion intentionally and retain its approval metadata assertions.
- Alternatives considered: A live elapsed counter requires new refresh behavior and product semantics outside this bug.

## Invalid and valid terminal values

- Decision: Missing/malformed/epoch-sentinel completion becomes null. Completion before a valid start becomes null;
  a duration derived from that interval is unavailable. Negative/nonfinite durations become null, never zero.
  Valid independent terminal duration, including zero, remains valid.
- Rationale: Null means unavailable; zero means a valid measured duration.
- Alternatives considered: Clamping creates false data; hiding all terminal timing discards valid history.

## Existing persisted and cached rows

- Decision: Normalize active final timing on existing API read projections and defensively in shared run-row
  presentation. Correct storage via existing sync upserts, without a bulk data migration.
- Evidence: `sync.service.ts:559-560` forwards normalized timing into persistence. Both
  `workflow-runs/table-page.vue:429-438` and `dashboard/latest-runs.vue:89-104` currently guard only null timing.
- Rationale: Users must see the correction before a row is synchronized again; stale cached payloads also need safe
  presentation. Existing schema/DTO nullability already represents absence.
- Alternatives considered: A production cleanup requires operational scope; waiting for polling leaves visible bad rows.

## Verification and integration scope

- Decision: Reuse Jest, Vitest and Playwright, existing localization keys and existing read-only integrations.
- Rationale: This is a focused normalization/display bug with no new library or external API usage.
- Alternatives considered: New dependencies, schema changes and broad provider redesign add no necessary capability.
- All design clarifications resolved from local source and the reported scope; no external API claims are needed.

## Aggregate boundary

- Evidence: `apps/api/src/modules/dashboard/dashboard.service.ts:156` aggregates persisted run durations.
- Decision: The persistence invariant removes active bad durations on normal synchronization. This plan does not
  claim a bulk correction of historical terminal records or retained aggregates before synchronization.
- Rationale: The reported scope concerns run-row completion and duration. Any historical repair needs separate
  evidence and explicit operational scope; do not silently rewrite stored history.
