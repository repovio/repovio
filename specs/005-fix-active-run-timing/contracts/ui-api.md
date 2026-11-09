# UI and API Contract: Workflow Run Timing

## Existing Read Interfaces

Preserve existing Workflow Runs and dashboard endpoints, DTO fields, query parameters, sorting/filtering support,
repository-scoped reads, ability filtering and authentication. No endpoint or provider request is added.

| Condition                              | `completedAt`                          | `durationMs`                         | UI                            |
| -------------------------------------- | -------------------------------------- | ------------------------------------ | ----------------------------- |
| QUEUED/RUNNING with any stored timing  | null                                   | null                                 | Existing unavailable labels   |
| Terminal with valid complete timing    | Valid existing timestamp               | Nonnegative milliseconds             | Existing locale/format policy |
| Terminal with zero duration            | Valid timestamp or null                | 0                                    | Existing zero-duration format |
| Missing timing                         | null                                   | null                                 | Existing unavailable labels   |
| Malformed or epoch-sentinel completion | null                                   | Independently valid duration or null | No bogus completion date      |
| Completion before valid start          | null                                   | Valid independent duration or null   | No reversed derived duration  |
| Negative/nonfinite duration            | Independently valid completion or null | null                                 | No negative value or NaN      |

API normalization must also cover active rows persisted before this change. Keep normalized null keys present where
currently selected; do not convert them to epoch timestamps or zero. Numeric duration units remain milliseconds.
Query ordering/filtering continues using existing persisted-field semantics; this patch does not introduce live timing
filters or rewrite query infrastructure.

## Presentation

- Pass run status and timing together to shared run-specific validation; a timestamp-only null guard is insufficient.
- Reuse `workflowRuns.notAvailable` and `dashboard.durationUnknown` where appropriate in English and German.
- Keep valid duration rounding and date-format settings unchanged per surface.
- Dashboard latest runs and Workflow Runs tables must agree about availability; repository-scoped table reuse inherits it.
- Repository activity timestamps may retain their existing creation-time fallback; they must not label it completion.
- A late provider completion becomes visible through existing refresh behavior; no new timer or polling interval.

## Compatibility and Security

No schema change, added DTO field, new locale wording, write operation, secret handling, or authorization change.
Regression coverage must include old active rows, selected DTO timing fields, and repository-restricted users.
