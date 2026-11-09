# Data Model: Active Workflow Run Timing

## Existing Workflow Run

No entity, column, relation, or status is added. Repository association and provider run identity remain unchanged.

| Field           | Existing representation                                     | Planned invariant                                                      |
| --------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------- |
| `status`        | Normalized Workflow Run status                              | Existing provider normalization remains authoritative                  |
| `startedAt`     | Nullable timestamp                                          | Retain valid input; reject malformed or provider-sentinel start values |
| `completedAt`   | Nullable timestamp                                          | Null for QUEUED/RUNNING; otherwise valid nonsentinel timestamp         |
| `durationMs`    | Nullable millisecond number in transport, BigInt in storage | Null for active runs; otherwise finite and nonnegative                 |
| `providerRunId` | Provider identifier within existing run identity            | Unchanged; synchronization updates the same row                        |

Completion preceding a valid start is invalid. Missing start does not invalidate an independently valid terminal
completion or provider duration. Zero milliseconds remains valid. Missing timing must never be replaced by zero or now.
Provider-sentinel classification is run-specific; it must not become a global rule for unrelated application dates.

## State Transitions

- QUEUED: completion and final duration are null, including approval-waiting runs.
- QUEUED to RUNNING: keep final timing null; retain a valid start if provided.
- RUNNING to SUCCESS/FAILED/CANCELLED/SKIPPED: use independently validated terminal timing.
- UNKNOWN: retain only independently valid timing; never manufacture completion from status alone.
- Provider-reported return to active state: overwrite prior final timing with null using existing upsert identity.

## Existing Data Compatibility

Read projections hide final timing for already persisted active rows immediately. Presentation guards protect older
cached payloads. Existing synchronization subsequently replaces invalid active values. No database backfill, migration,
or retention change is required. Provider-specific valid terminal-duration conversions remain unchanged.

Provider submillisecond durations are rounded to the nearest millisecond only at the BigInt persistence boundary.
