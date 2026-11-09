# UI Contracts: Repository Detail Navigation and Table Interactions

**Issue**: [#62](https://github.com/repovio/repovio/issues/62)

**Design**: [plan.md](../plan.md), [data model](../data-model.md), [research](../research.md).

These are planned frontend interfaces, not existing new public API contracts. Existing read endpoints, DTOs,
authorization, and explicit local administration operations remain unchanged.

## Routes and Permissions

| Address                             | Section         | Access after Repository authorization |
| ----------------------------------- | --------------- | ------------------------------------- |
| `/repositories/:id`                 | Overview        | Viewer, Manager, System Administrator |
| `/repositories/:id/workflow-runs`   | Workflow Runs   | Viewer, Manager, System Administrator |
| `/repositories/:id/issues`          | Issues          | Viewer, Manager, System Administrator |
| `/repositories/:id/pull-requests`   | Pull Requests   | Viewer, Manager, System Administrator |
| `/repositories/:id/security-alerts` | Security Alerts | Manager, System Administrator         |
| `/repositories/:id/settings`        | Settings        | System Administrator                  |

`:id` is the existing opaque Repovio Repository ID, not a Provider repository name. Links must encode dynamic path
segments consistently. A Global Role alone does not grant a nonadministrator access to a Repository.

- The parent loads the permission-filtered Repository detail before child sections can request or display data.
- Existing `manager` and `admin` middleware protect restricted child routes, including direct visits. Preserve their
  current unauthorized-role redirect to `/`. Inaccessible or missing Repositories use existing denied/not-found feedback.
- Navigation displays permitted links in the table's order. Overview uses exact matching; the current link has the
  existing navigation component's active semantics and visible focus.
- Section navigation starts with its own path and no inherited `page`, `preset`, or Repository-filter query. Existing
  quick-detail addresses and legacy Repository redirects continue to function.
- A direct section address or history entry with a valid page restores that page in its own scoped table context.
- The old detail page's Settings anchor must remain useful: when the hash is `#settings`, replace with the authorized
  Settings child address. A nonadministrator follows the existing Settings access restriction; no forms are mounted.

## Security Category Query

`/repositories/:id/security-alerts?kind=DEPENDENCY|CODE|SECRET`

- The default is `DEPENDENCY`. Missing, repeated, nonstring, or invalid kind values normalize to that value using a
  replacement, with canonical `kind=DEPENDENCY` in the address.
- Selecting a category pushes its address and starts page 1. Do not carry over another category's pagination or preset.
- Reload, copied links, and browser Back/Forward restore the selected category and any valid page on that address.
- The category remains a subdivision of Security Alerts, not a seventh Repository navigation section.

## Repository Detail Context

The parent provides one typed route-local `RepositoryDetailContext`; child pages consume it through the feature API
composable. State fields and operations use explicit types and existing Repository DTOs.

| Boundary           | Required behavior                                                                |
| ------------------ | -------------------------------------------------------------------------------- |
| Identity and data  | Readonly current Repository ID and authorized `RepositoryDetail`                 |
| Load status        | Loading, load error, denied/not-found states; no stale data publication          |
| Refresh/sync state | Separate full-lifetime pending flags matching existing actions                   |
| Update operation   | Merge existing typed local settings/refresh results without losing sync metadata |
| Parent lifetime    | Repository ID changes invalidate requests and dispose old context                |
| Settings metadata  | Owned and loaded only by Settings; separate pending/error state                  |
| Delete success     | Existing local deletion semantics and return to `/repositories`                  |

The context is an internal presentation contract, not a replacement API DTO or a persistent selected-Repository model.

## Reusable Table Frame and Scope Props

`CommonTablePageFrame` has standalone and embedded modes:

| Interface                       | Contract                                                                               |
| ------------------------------- | -------------------------------------------------------------------------------------- |
| `embedded?: boolean`            | Default false; true omits `LayoutPage`, breadcrumbs, and duplicate primary heading     |
| Existing title/breadcrumb input | Preserve global page semantics; embedded content retains an accessible section name    |
| `actions` slot                  | Standalone forwards to the page toolbar; embedded renders a local `data-table-toolbar` |
| Default slot                    | Existing summary/error/table/pagination content with unchanged flex/scroll behavior    |

The existing Workflow Runs, Work Items, and Security Alerts modules gain `repositoryId?: string` and `embedded?: boolean`
while retaining their existing required props. Both are supplied by Repository children. Existing global callers omit
them. A scoped identity is immutable for a mounted table instance; remount on Repository/category changes.

- The table frame does not own records, selection, filter persistence, or native `UTable` events.
- `repositoryId` is ANDed with existing static constraints. Security kind is also immutable. User filtering cannot
  replace either constraint, including when persisted filters refer to another Repository.
- Scoped views hide Repository and Provider selectors, skip the all-Repository selector request, ignore dashboard
  presets, and skip global summary requests/cards. Other permission-filtered suggestions keep their existing contracts.
- Preserve existing global persistence keys. Scoped keys use `repository:<id>:<section>`; append `:<kind>` for alerts.
- Table identity keys exclude page and ordinary filters. Invalid page values become 1. Successful responses beyond the
  last page clamp to that page, or 1 for an empty result, without retry loops or discarded constraints.
- Scoped errors hide retained result rows until retry succeeds. Feature-owned requests invalidate stale generations
  on scope change and unmount; Query Kit remains responsible for its own overlapping table requests.

## Existing Read Requests

All addresses below remain relative to `/api/v1`. No new endpoint, query parameter, DTO field, or API documentation
change is planned. Existing parameters such as `where`, pagination, sorting, and field selection keep current formats.

| Read                                   | Planned use                                                         |
| -------------------------------------- | ------------------------------------------------------------------- |
| `GET /repositories/:id`                | Parent detail and Repository access gate                            |
| `GET /workflow-runs`                   | Existing Query Kit query with fixed Repository constraint           |
| `GET /issues`                          | Existing Query Kit query with fixed Repository constraint           |
| `GET /pull-requests`                   | Existing Query Kit query with fixed Repository constraint           |
| `GET /security-alerts`                 | Existing Query Kit query with fixed Repository and kind constraints |
| Existing Work Item filter-option reads | Keep authorized suggestions; no Repository metrics inferred         |
| `GET /security-alerts/filter-options`  | Filter returned availability by Repository ID and kind              |
| Existing Settings reads/actions        | Preserve exact existing authorization and secret handling           |

The server's ability-aware read restrictions remain authoritative independently of the frontend scope. Mocked UI
acceptance does not establish real backend authorization. No Provider-side write operation is introduced.

## Row Activation

| Data family                 | Existing internal destination | Row behavior                            |
| --------------------------- | ----------------------------- | --------------------------------------- |
| Repository                  | `/repositories/:id`           | Navigate to Overview                    |
| Issue                       | `/issues/:id`                 | Navigate to existing detail             |
| Pull Request                | `/pull-requests/:id`          | Navigate to existing detail             |
| Security Alert              | `/alerts/:id`                 | Navigate to existing detail             |
| All remaining table records | No new destination            | Hover only; explicit controls unchanged |

- Bind typed native `UTable @select` handlers using its `(event, row)` arguments. Resolve targets from `row.original`.
  Use the existing internal destination; no TanStack row-selection change accompanies navigation.
- Native focus and Enter/Space activation are retained. Title links remain separately keyboard-reachable and preserve
  native browser link actions. Repeated keydown must not produce duplicate navigation.
- Nuxt UI excludes native interactive descendants before emitting. The application helper additionally excludes custom
  interactive roles, contenteditable regions, and `data-row-navigation-ignore` controls/action groups.
- Custom opt-outs and disabled/pending action groups produce zero additional row navigations. Native events have
  already been default-prevented by Nuxt UI; do not reject them solely because `event.defaultPrevented` is true.
- Ordinary clicks on noninteractive record cells navigate once. Header, loading, empty, and expanded-content placeholder
  rows do not acquire destinations. Hover-only tables do not gain row focus, selection, dialogs, or external navigation.

## Hover and Accessibility

- Global Nuxt UI theme changes target actual body data rows bearing `data-selected`, independently of `data-selectable`.
  Preserve selection and focus styles; do not style every shared `tr` slot as a navigable record.
- Row and pinned-cell hover backgrounds use consistent semantic theme colors. Body text, controls, and pending state
  remain legible in both themes. The navigation cursor is enabled only for actual navigable data rows.
- Dashboard latest-run and shortcut-dialog HTML data rows receive equivalent utility styling. The entire baseline
  inventory is listed in [research.md](../research.md).
- Horizontal Repository navigation remains in a single scrollable row when space is limited, with visible keyboard
  focus and reachable active links. Existing mobile touch targets remain at least as usable as the current shell.
- Reuse translations when possible; new keys preserve all eight shipped locales. Verify English/German at 375-pixel and
  1440-pixel widths with long Repository names in both themes.

## Error, Empty, and Availability Semantics

1. Parent Repository failure or access denial prevents child data loading and shows existing feedback.
2. A scoped list load failure shows a retryable error and does not display retained rows as current successful results.
3. An available successful list with no matches shows the localized ordinary empty state.
4. A known unavailable security category shows a Repository/category-specific unavailable state with safe existing
   metadata. Unknown/not-yet-synchronized metadata is distinct from available-empty. Supporting-request failure is an
   error, not a zero finding count.
5. Optional Settings supporting-data failure leaves Repository identity and other sections usable.

## Compatibility and Out of Scope

Retain existing global list presentation, quick dialogs and their history, explicit action loading, Provider links,
Repository deletion flow, legacy redirects, and existing administrator permissions. There is no new Workflow Run detail
page, row-triggered editor, database migration, global state migration, dependency upgrade, or rollout automation.
