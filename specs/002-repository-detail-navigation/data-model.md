# Data Model: Repository Detail Navigation and Table Interactions

**Issue**: [#62](https://github.com/repovio/repovio/issues/62)

**Related design**: [plan.md](plan.md), [UI contract](contracts/ui.md).

## Existing Domain Data

No database schema or wire DTO changes are required. Use existing types from
`apps/web/app/types/api/resources.ts` and shared contracts. Presentation context must not become a new domain entity.

| Entity                | Existing fields used                                                                        | Relationships and restrictions                                      |
| --------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Repository detail     | `id`, `owner`, `name`, `url`, `enabled`, retention/configuration, `syncState`, `lastSyncAt` | One Repository is the detail-route context; existing access applies |
| Workflow Run          | `id`, `repositoryId`, workflow identity/title, status, timestamps, `url`                    | Belongs to a Repository; no internal run detail page is added       |
| Issue                 | `id`, `repositoryId`, number, title, state, actors, labels, updated time, `url`             | Existing Issue detail destination                                   |
| Pull Request          | `id`, `repositoryId`, number, title, state, workflow/review fields, `url`                   | Existing Pull Request detail destination                            |
| Security Alert        | `id`, `repositoryId`, `kind`, title, severity, state, `providerUrl`                         | Existing Alert detail destination; Manager/Administrator visibility |
| Security availability | `repositoryId`, `kind`, `availability`, `reason`, `lastSuccessfulSyncAt`                    | Existing supporting metadata; match Repository and kind together    |
| User access           | Global Role plus existing direct/group Repository access                                    | Existing API reads remain authoritative                             |

The field list describes data already owned by existing DTOs, not a proposal to redefine complete DTOs or select secrets.
Settings reuses existing webhook configuration, Workflow Filter, Repository Membership, and User Group grant types.

## Route-Local Presentation State

### RepositoryDetailContext

Planned owner: `app/composables/api/repository-detail.ts`, with its public presentation type in
`app/types/repository-detail.ts`.

- Identity: immutable current `repositoryId` for a parent lifecycle.
- Data: readonly current `RepositoryDetail` once loaded; absent while loading, denied, or failed.
- Status: loading, failed, forbidden/not-found, refresh pending, and sync pending using current UI behavior.
- Operations: typed reload, merge/update, refresh, and sync operations; delete success returns to the Repository list.
- Lifetime: provided by the Repository parent, consumed by child sections, disposed on Repository exit/change.
- Validation: no child data loads before parent authorization succeeds; late generations cannot publish state.

Administrator webhook request state is local to Settings, not shared context loaded for every section. Errors there do
not hide Repository identity or other section content. Sensitive webhook values keep their existing component lifecycle.

### RepositorySection

Allowed section identities are `overview`, `workflow-runs`, `issues`, `pull-requests`, `security-alerts`, and `settings`.
The URL determines the section; do not persist a competing active-tab value. Role-derived navigation is computed from
existing authentication state. Overview has exact matching rather than remaining active on every child path.

### ScopedTableIdentity

Fields are `repositoryId`, resource section, and security `kind` when applicable. The identity determines the immutable
persistence name and component lifecycle key. It does not contain search, page, or other mutable user filter values.
Global tables keep their current identity names. Scope changes dispose the previous instance and start with no rows.

### SecurityCategorySelection

Allowed values are the existing `SecurityAlertKind` values `DEPENDENCY`, `CODE`, and `SECRET`. The address is the source
of truth. Absent, repeated, nonstring, or invalid kind values normalize to `DEPENDENCY`. User changes create history;
normalization replaces the current address. Neither operation imports unrelated queries from another section.

### Table Query State

- Immutable constraints: Repository ID, plus security kind where applicable.
- Mutable state: current search, user filters, sorting, page size, and column configuration.
- Page: positive integer route query, default 1; invalid values become 1. Successful responses clamp an unavailable page
  to the last available page, or 1 when no pages exist. A category/section navigation starts without inherited page.
- Persistence: existing Query Kit keys, namespaced by `ScopedTableIdentity` for Repository views.
- Composition: immutable constraints AND search/category constraints AND user filtering. No override precedence may
  discard Repository scope; an incompatible user filter produces no matches.

## State Transitions

| Transition                           | Required behavior                                                                      |
| ------------------------------------ | -------------------------------------------------------------------------------------- |
| Detail idle to loading               | Clear previous identity data; invalidate earlier request generations                   |
| Loading to ready                     | Publish only a current authorized response; allow child section mounting               |
| Loading to denied/failed             | Keep child content unmounted; show existing access/error feedback                      |
| Ready to different Repository        | Dispose old context/table instances and invalidate late responses                      |
| Same Repository to different section | Retain valid Repository context; replace section content and scoped table identity     |
| Security category change             | Normalize kind, start page 1, replace table identity, retain Repository identity       |
| Pagination/filter change             | Keep table instance; use Query Kit's existing latest-request behavior                  |
| Scoped query failure                 | Show an error; hide retained rows that could misrepresent current results; allow retry |
| Settings unmount                     | Invalidate supporting requests; keep existing sensitive-value reset behavior           |

Security availability has four presentation outcomes: known unavailable, unknown/not-yet-synchronized, supporting-data
load failure, and available. Only an available successful list with no rows is the ordinary no-findings state. Missing
metadata alone must not imply availability, and an error must not be converted into a zero count.

## Compatibility

No migration, data backfill, new secret storage, retention policy, or Provider-side state transition. Existing local
configuration and synchronization operations retain their contracts. Persisted global table keys are unchanged; new
scoped keys can remain unused after rollback without affecting server data or global views.
