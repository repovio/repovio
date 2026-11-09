# Research: Repository Detail Navigation and Table Interactions

**Date**: 2026-11-09

**Issue**: [#62](https://github.com/repovio/repovio/issues/62)

**Specification**: [spec.md](spec.md)

## Research Scope

Read-only repository and installed-package research covered nested Repository routes, existing table behavior,
permissions, query isolation, security availability, localization, and verification. Two research agents investigated
Repository pages and table interactions independently, as required by `speckit-plan`. No application code was changed.

## R1: Reuse the Nested Page Pattern

**Decision**: Keep the Repository detail route as a shared parent, introduce six child pages, and render the children
through `NuxtPage`. Use the existing `LayoutPage` navigation toolbar and `UNavigationMenu` for section links.

**Rationale**: The application already uses this arrangement for settings. A shared parent owns Repository identity,
authorization state, and action feedback while section addresses remain directly accessible. Use a parent key based on
Repository ID and child content keys based on Repository, section, and security category; exclude pagination queries.

**Alternatives considered**: Query-only tabs fail the requirement for section pages. Six independent detail pages
duplicate Repository loading and actions. A single monolithic tab component would continue mixing unrelated sections.

**Evidence**:

- [Page shell](../../apps/web/app/components/layout/page.vue), lines 20-22: existing navigation toolbar slot.
- [Settings routes](../../apps/web/app/pages/admin/settings.vue), lines 11-25: navigation and nested page precedent.
- [Repository detail](../../apps/web/app/pages/repositories/[id].vue), lines 61-99 and 147-183: current cards and loading.
- [Nuxt nested routes](https://github.com/nuxt/nuxt/blob/main/docs/2.directory-structure/1.app/1.pages.md): nested page
  rendering and explicit page keys, consulted through Context7. Local project conventions remain authoritative.

## R2: Keep Repository Context Local to the Detail Route

**Decision**: A feature API composable owns typed Repository detail state and existing refresh/sync/update behavior.
Provide that context to descendants from the parent route; do not introduce app-wide persistent Repository selection.
Load administrator webhook metadata only when Settings mounts. Render child content only after Repository access loads.

**Rationale**: Current Repository loading eagerly fetches optional webhook configuration for administrators even on
Overview. Separating Settings requests avoids unnecessary privileged data loading. Request-generation checks, including
unmount invalidation, prevent stale A-to-B-to-A responses from overwriting current detail state.

**Alternatives considered**: A global Pinia store unnecessarily extends selection lifetime. ID equality alone cannot
distinguish an earlier request when the same Repository is revisited. Loading every section up front adds unused requests.

**Evidence**: [Repository detail](../../apps/web/app/pages/repositories/[id].vue), lines 147-183; existing
[admin middleware](../../apps/web/app/middleware/admin.ts) and [manager middleware](../../apps/web/app/middleware/manager.ts).

## R3: Embed Existing Tables without Duplicating Their State

**Decision**: Introduce a small generic table-page frame with standalone and embedded modes. Standalone mode delegates
to the existing `LayoutPage` and its actions slot. Embedded mode renders a shell-free flex surface with a local table
toolbar. The three existing activity table modules use this frame and optional typed Repository scope.

**Rationale**: Existing table-page modules combine toolbar controls, Query Kit state, summaries, table, and pagination.
Changing the frame preserves their behavior and typed state while preventing nested page shells in Repository children.
The frame is only layout; it does not wrap or reimplement `UTable`, Query Kit, or record rendering.

**Alternatives considered**: Copying tables per Repository duplicates behavior. Extracting an entire new generic table
engine increases scope. Nesting a second `LayoutPage` duplicates breadcrumbs and headings.

**Evidence**: Existing [Workflow Runs](../../apps/web/app/components/modules/workflow-runs/table-page.vue),
[Work Items](../../apps/web/app/components/modules/work-items/table-page.vue), and
[Security Alerts](../../apps/web/app/components/modules/security-alerts/table-page.vue) table modules.

## R4: Enforce Fixed Scope through Existing Read Endpoints

**Decision**: Add `{ repositoryId }` to immutable table constraints, AND it with search and user filters, and add `kind`
for security tables. Hide Repository and Provider filter controls in scoped views. Preserve global endpoint behavior and
existing server authorization. Do not add endpoints, DTO fields, migrations, or Provider operations.

**Rationale**: Existing preview methods already query the list endpoints with serialized `where` containing Repository
ID. Query Kit combines static and user filters with AND. Existing controllers enforce ability-aware reads independently
of browser filtering. Supporting filter suggestions may remain globally permission-filtered; they are not record counts.

**Alternatives considered**: Filtering after pagination produces incorrect totals and incomplete results. New scoped
endpoints duplicate existing capabilities. Treating the browser's Repository ID as authorization would weaken security.

**Evidence**:

- [Typed API client](../../apps/web/app/composables/api/repovio-api.ts), lines 111-119, 249-257, 331-354.
- [Table adapter](../../apps/web/app/composables/api/table.ts), lines 14-20 and 77-91.
- [Issue reads](../../apps/api/src/modules/issues/issues.controller.ts), lines 50-64; existing Security Alert controller.
- Installed `@querry-kit/nuxt/dist/table.cjs`, lines 269-273: static and user constraints are combined.

## R5: Isolate Table Lifetimes and Persistence

**Decision**: Preserve existing global persistence names. Use `repository:<id>:<section>` for scoped state and append the
security kind for alerts. Remount the table on scope changes, not on pagination. Section and category navigation starts
without inherited `page`, `preset`, or Repository-selector queries. Direct addresses and browser history retain explicit
page values for their own context. Normalize invalid page values and clamp out-of-range pages after successful loads.

**Rationale**: Query Kit persists filters, sorting, page size, and columns under `table:<persistenceKey>:...`; route query
`page` owns pagination. Its request versioning rejects overlapping stale table responses, but errors can leave old rows.
Fresh instances on Repository/category changes prevent those rows from belonging to a new identity. Scoped failures
must hide retained rows until a successful retry. Feature-owned support requests also need generation guards.

**Alternatives considered**: Sharing global names leaks preferences and filters across contexts. Changing only a reactive
Repository filter retains the old component's records and immutable persistence key. Keying by full URL resets the table
for every page change and interferes with pagination.

**Evidence**: [Table adapter](../../apps/web/app/composables/api/table.ts), lines 77-91; installed
`@querry-kit/nuxt/dist/table.cjs`, lines 219-241 and 290-309. Work Item and Security table names currently use resource names.

## R6: Omit Global Summaries and Scope Security Availability

**Decision**: In scoped mode, omit global summary cards and summary requests, and skip the all-Repository choice request.
Reuse existing non-Repository filter options. Select security availability entries by both Repository ID and kind.
Represent unavailable, unknown/not-yet-synchronized, supporting-data error, and available-empty states distinctly.

**Rationale**: Summary methods do not accept Repository scope, but security filter options already include per-Repository,
per-kind availability, reason, and last-successful-sync metadata. Missing metadata does not establish zero findings.

**Alternatives considered**: Reusing global metrics under a Repository title is misleading. Counting a paginated subset
does not produce a complete summary. Backend summary expansion is unnecessary for the requested navigation.

**Evidence**: [Work Item support loading](../../apps/web/app/components/modules/work-items/table-page.vue), lines 435-458;
[Security support loading](../../apps/web/app/components/modules/security-alerts/table-page.vue), lines 432-440;
[Security filter metadata](../../apps/api/src/modules/security-alerts/security-alerts.controller.ts), lines 152-156 and
200-206.

## R7: Use Native Row Activation and Shared Presentation

**Decision**: Add typed `UTable @select` handlers only for Repositories, Issues/Pull Requests, and Security Alerts, using
their existing internal destinations. Retain title links. Use a small shared presentation helper for target resolution
and custom interactive-control exclusions; do not delegate clicks from the whole document or replace native row events.

**Rationale**: Installed Nuxt UI 4.12.0 ignores native interactive descendants and provides row focus plus Enter/Space
activation. Its row handler calls `preventDefault` before emitting, so the application handler must not reject every
event with `defaultPrevented`. Custom role controls, contenteditable regions, and explicit opt-outs need extra guarding.
Disabled/pending action groups must also remain isolated from row navigation.

**Alternatives considered**: A generic DOM listener loses typed records and duplicates accessibility behavior. Adding
selection handlers merely to enable hover introduces actions/focus into tables that must remain hover-only.

**Evidence**: Installed `@nuxt/ui/dist/runtime/components/Table.vue`, lines 304-318 and 387-402, and corresponding types;
[versioned row-select documentation](https://github.com/nuxt/ui/blob/v4.12.0/docs/content/docs/2.components/table.md),
consulted through Context7.

**Presentation decision**: Extend `app.config.ts` table theme slots with data-row hover independent of `data-selectable`.
Target actual body rows bearing `data-selected`, not headers, loading rows, or empty placeholders. Match the hover
background in pinned cells; preserve selection and focus feedback. Set a navigation cursor only on actual navigable data
rows. Apply equivalent utility styles to raw HTML data rows.

### Complete Table Inventory at the Planning Baseline

Paths below are relative to `apps/web/app/`. There are 16 table components: 14 `UTable` and two raw HTML tables.

| Components                                                          | Row behavior                                       |
| ------------------------------------------------------------------- | -------------------------------------------------- |
| `pages/repositories/index.vue`                                      | Navigate to Repository Overview                    |
| `components/modules/work-items/table-page.vue`                      | Navigate to existing Issue or Pull Request details |
| `components/modules/security-alerts/table-page.vue`                 | Navigate to existing Security Alert details        |
| `pages/admin/providers.vue`, `pages/admin/users.vue`                | Hover only; explicit controls unchanged            |
| `pages/notifications/index.vue`, `pages/notifications/history.vue`  | Hover only; dialogs and external links unchanged   |
| `pages/jobs.vue`, `pages/workflows/awaiting-approval.vue`           | Hover only; explicit controls unchanged            |
| `components/modules/workflow-runs/table-page.vue`                   | Hover only; Provider link unchanged                |
| `components/modules/user-groups/table.vue`                          | Hover only; dialogs unchanged                      |
| `components/modules/repositories/repository-selection-table.vue`    | Hover only; checkbox selection unchanged           |
| `components/modules/repositories/details/members-card.vue`          | Hover only; explicit administration unchanged      |
| `components/modules/repositories/details/workflow-filters-card.vue` | Hover only; explicit administration unchanged      |
| `components/modules/dashboard/latest-runs.vue`                      | Raw HTML; hover only                               |
| `components/common/dialogs/shortcuts.vue`                           | Raw HTML; hover only                               |

## R8: Preserve Existing Locales and Test Infrastructure

**Decision**: Reuse translated labels where possible. Add new messages in English and German and maintain matching keys
and translations in all eight shipped locales: en, de, es, fr, it, nl, pl, pt. Keep English/German as the primary visual
acceptance locales and retain the full locale-key parity test.

**Rationale**: The specification's English/German requirement does not remove existing languages. Existing tests require
all shipped locales to have exactly the English key set. The project already has Vitest and mocked Playwright scenarios;
no new test framework or full production stack is needed for frontend acceptance.

**Alternatives considered**: Adding keys only to two locales breaks the existing parity gate. Removing locales or relying
on missing-key fallback changes unrelated product behavior. Backend-only checks cannot verify visual navigation.

**Evidence**: [Locale parity test](../../apps/web/app/i18n/locales.spec.ts), lines 5-41;
[Nuxt configuration](../../apps/web/nuxt.config.ts); [Playwright configuration](../../apps/web/playwright.config.ts).

## Resolution

All research questions are resolved. No new dependency, schema, public API, or Provider capability is needed. Installed
code and current repository conventions take precedence over generic library examples. Product behavior remains
unimplemented; this document records design evidence, not successful application acceptance tests.
