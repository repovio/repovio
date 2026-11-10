# Data Model: Repository Settings Navigation

## Existing domain entities

Repository identity, retention overrides, webhook configuration, Workflow Filters, Repository Memberships, and
Repository Group Grants retain their current DTOs, validation, authorization, and persistence. No migration is needed.

## Client presentation state

- `section`: `general | webhook | workflow-filters | members | groups`, derived from Settings `tab` query.
- Missing section selects General. Invalid, empty, or repeated values normalize to the bare Settings address.
- `visitedSections`: sections mounted during the current Settings visit; initialize with the selected section.
- Existing card-local drafts, errors, and pending flags remain owned by those cards. Switching section hides them
  without unmounting; leaving Settings or changing Repository identity disposes the entire visit.
- Generated webhook secrets remain memory-only and must never enter URLs, browser storage, logs, or snapshots.

## State transitions

1. Enter Settings: administrator guard, resolve Repository, select section, mount its card.
2. Select another tab: push its address, mount if first visit, hide previous panel while preserving its local state.
3. Back/Forward: derive active section from URL, retaining already mounted panels for the same visit.
4. Save or mutate: existing request and validation behavior; triggering control stays loading until its awaited work ends.
5. Leave Settings/change Repository: dispose visit; stale completions cannot populate another Repository's UI.

## Unchanged interfaces

No REST endpoints, API schemas, database columns, Provider permissions, or stored resource fields change. The new
external interface is the user-visible navigation contract in [contracts/ui.md](contracts/ui.md).
