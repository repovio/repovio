# Data Model: Global Auto Refresh

## Persistent preference

| Field           | Contract                                                                                        |
| --------------- | ----------------------------------------------------------------------------------------------- |
| Storage key     | `repovio:auto-refresh:interval-ms`                                                              |
| Value           | Numeric union `0 \| 15000 \| 30000 \| 60000 \| 300000`                                          |
| Default         | `15000`                                                                                         |
| Meaning of zero | Disable interval refresh; preserve manual and existing sync-completion refresh                  |
| Scope           | Browser/origin, shared across supported routes; no server persistence                           |
| Validation      | Reject strings, objects, non-finite numbers, negatives, and unlisted values after JSON decoding |
| Failure         | Missing/invalid/inaccessible storage uses an in-memory 15000 default; writes are best effort    |

No API schema, Prisma entity, migration, permission, or server settings change.

## Transient refresh target

A mounted view owns a unique registration token, refresh callback returning `Promise<void>`, reactive busy state covering
all relevant reads, and an active/disposed generation. The coordinator owns a registration set, current interval,
visibility/connectivity state, next deadline, and at most one shared refresh promise per target.

A target groups the view's existing table/list and summary reads. It does not store rows or API credentials. The typed API
composables remain owners of data and query state. Persistent preferences belong in `app/store`; browser presentation and
scheduling belong in `app/composables/app`.

## State transitions

- Mount: initialize existing data once, register active target; schedule only after initial work settles.
- Eligible and idle: wait the full selected interval, then execute the target refresh.
- Running: manual/timer/sync triggers join the active promise; already-busy query work causes scheduled ticks to be skipped.
- Complete or failed: clear pending state in `finally`, retain existing error behavior, start the next full interval.
- Interval change: cancel the old deadline and start the new interval; Off cancels scheduled work without aborting user work.
- Hidden/offline: cancel scheduled work, remember one pending catch-up need; preserve explicit manual semantics.
- Resume eligible: perform one catch-up refresh, or join/skip existing work, then restart the full interval.
- Deactivate/unmount/sign-out: unregister, clear deadlines/listeners when unused, invalidate obsolete generations; no late
  result may affect a newly selected resource. Already-issued HTTP requests may finish but cannot schedule new work.

Maintain generation/abort protection at data-owning async boundaries where existing loaders lack it. A timer-only
single-flight guard cannot prevent stale writes or requests initiated independently by query watchers.
