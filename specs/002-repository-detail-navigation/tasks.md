---
description: 'Dependency-ordered implementation tasks for issue #62'
---

# Tasks: Repository Detail Navigation and Table Interactions

**Issue**: [#62](https://github.com/repovio/repovio/issues/62)

**Branch**: `codex/62-repository-detail-navigation`

**Input**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md),
[UI contract](contracts/ui.md), and [quickstart.md](quickstart.md).

**Prerequisites**: Existing issue, linked branch, selected task worktree, and matching local feature context already
exist. Reuse them; do not create a second issue, branch, or worktree.

**Tests**: Focused tests are required by the specification's acceptance scenarios, approved validation plan, and project
constitution. Write each story's regression tests before its behavior changes; confirm a meaningful missing-behavior
failure rather than a fixture/configuration failure. Run the story's checks after implementation.

**Authorization**: Product implementation was subsequently authorized through `speckit-implement`. Checked tasks record
locally verified work. The subsequent PR request authorizes committing and publishing this completed feature.
Merge, release, and deployment remain outside the requested scope.

## Format and Path Conventions

- Every task uses a checkbox, sequential ID, optional `[P]`, story label for story phases, and exact file paths.
- `[P]` marks different-file work that can run together only after the stated prerequisite batch is complete.
- Paths in task descriptions are repository-relative. New paths are planned files, not evidence of existing code.
- Preserve Node.js 26.13.0, pnpm 11.28.9, TypeScript aliases, dependency ranges, API DTOs, and Provider read-only behavior.
- Keep functions, callbacks, public types, and component contracts documented under `docs/coding-guidelines.md`.
- Inspect `git status` and relevant diffs before edits and checks. Do not discard unrelated work or alter release PRs.
- Tests may use the existing mock-first Playwright infrastructure; do not introduce another framework or real secrets.

### Locale File Set

Tasks referencing the locale set update these existing files together, reusing existing keys where possible:

- `apps/web/i18n/locales/en.json`
- `apps/web/i18n/locales/de.json`
- `apps/web/i18n/locales/es.json`
- `apps/web/i18n/locales/fr.json`
- `apps/web/i18n/locales/it.json`
- `apps/web/i18n/locales/nl.json`
- `apps/web/i18n/locales/pl.json`
- `apps/web/i18n/locales/pt.json`

## Phase 1: Setup

**Purpose**: Verify the existing task environment without reinitializing the project.

- [x] T001 Verify issue/branch/worktree identity against `specs/002-repository-detail-navigation/plan.md`.
      Confirm issue #62, actual branch `codex/62-repository-detail-navigation`, unchanged feature inputs, and
      `.specify/feature.json` selecting this feature. Read the supplied `AGENTS.md`, canonical guidelines, and glossary.
- [x] T002 Prepare the existing toolchain using `package.json`, `pnpm-lock.yaml`, and `apps/web/package.json`.
      Follow the prerequisite commands in `specs/002-repository-detail-navigation/quickstart.md`: frozen dependency install,
      schema build, Nuxt prepare, and Chromium setup. Do not change manifests, compiler aliases, or the lockfile.

**Checkpoint**: Existing task checkout and dependencies are usable; no new project scaffolding or Provider setup.

## Phase 2: Foundational Prerequisites

**Purpose**: Shared detail state, layout, and synthetic fixtures used by multiple stories.

- [x] T003 [P] Define the presentation types in `apps/web/app/types/repository-detail.ts`.
      Reuse existing DTOs. Preserve the data-model constraints "immutable current `repositoryId` for a parent lifecycle"
      and "readonly current `RepositoryDetail` once loaded; absent while loading, denied, or failed."
      Define section/context types and typed operations, not new domain entities, API DTOs, or a selected-Repository store.
- [x] T004 [P] Add context regression tests in `apps/web/app/composables/api/repository-detail.spec.ts`.
      Cover authorized load, denied/not-found/error, reload, data clearing, merge retention of synchronization metadata,
      separate action-pending lifetimes, A-to-B-to-A responses, and invalidation after unmount. Use existing test facilities.
- [x] T005 Extract route-local state into `apps/web/app/composables/api/repository-detail.ts` after T003-T004.
      Own the existing detail read and refresh/sync/update behavior, provide typed readonly context to descendants, and guard
      every asynchronous publication by request generation and lifetime. Do not load webhook metadata here. Pass T004.
- [x] T006 [P] Create the layout-only frame in `apps/web/app/components/common/table-page-frame.vue` after T005.
      Implement standalone `LayoutPage` forwarding and embedded shell-free content with `data-table-toolbar`; preserve
      title/breadcrumb/actions/default-slot semantics. `embedded` defaults to false. Do not own records or table events.
- [x] T007 [P] Add shared synthetic fixtures in `apps/web/tests/e2e/fixtures/repository-detail.ts` after T005.
      Support two distinguishable Repositories, three User roles, scoped activity, pagination, delayed/failing responses,
      and all security availability outcomes. Reuse existing shell mocks without changing unrelated test behavior.

**Checkpoint**: T003-T007 pass their applicable checks. All later stories depend on this phase. Existing global pages
are unchanged because the new frame is not yet adopted. Types/tests can be authored together; frame/fixtures can follow
in a separate parallel batch. No product behavior is considered accepted solely because a helper test passes.

## Phase 3: User Story 1 - Browse Repository Sections (P1)

**Goal**: A functional six-section Repository destination with Overview, retained Settings, and shareable navigation.

**Independent Test**: Open each permitted section directly, reload it, and use Back/Forward. Check Repository identity,
one active link, Overview content, role-filtered links, and existing quick-dialog/deletion compatibility.

**MVP boundary**: Activity children initially reuse the existing Repository-scoped activity previews. They contain real
records and existing detail/Provider links, not dummy screens. US2 replaces those previews with full tables and category
selection. This realizes the plan's navigation-first increment without creating temporarily unscoped global tables.

### Tests

- [x] T008 [P] [US1] Extend navigation scenarios in `apps/web/tests/e2e/repository-navigation.spec.ts`.
      Use T007 fixtures for direct addresses, reload, Back/Forward, exact Overview matching, four/five/six permitted links,
      existing `?repository=` dialogs, legacy Repository redirects, and the existing Settings anchor destination.
- [x] T009 [P] [US1] Cover shell scenarios in `apps/web/tests/e2e/repository-visual.spec.ts`.
      Assert one page shell/primary heading, one horizontal navigation row, visible keyboard focus, long Repository names,
      and reachable destinations at 375 and 1440 pixels. Keep existing global shell assertions.

### Implementation

- [x] T010 [US1] Build the feature shell in `apps/web/app/components/modules/repositories/details/page-shell.vue`.
      Reuse `LayoutPage` and its navigation slot. Use the exact section identities `overview`, `workflow-runs`, `issues`,
      `pull-requests`, `security-alerts`, and `settings`. Render authorized links in that order, with scrollable horizontal
      navigation and existing role restrictions. Expose the child slot only after the Repository read succeeds.
- [x] T011 [US1] Refactor the coordinator in `apps/web/app/pages/repositories/[id].vue` after T010.
      Provide T005 context, render the feature shell and `NuxtPage`, and key parent lifetime by Repository ID. Preserve head
      metadata, breadcrumbs, explicit action loading, existing error feedback, and delete-success return to `/repositories`.
      Handle `#settings` with an authorized replacement to the Settings child; do not change existing legacy redirects.
- [x] T012 [US1] Compose Overview in `apps/web/app/pages/repositories/[id]/index.vue` after T011.
      Extract its content into `apps/web/app/components/modules/repositories/details/overview-page.vue`. Retain read-only
      general metadata, synchronization status, and permitted recent activity; remove administration forms from Overview.
- [x] T013 [US1] Compose Settings in `apps/web/app/pages/repositories/[id]/settings.vue` after T011.
      Use existing `admin` middleware and a named
      `apps/web/app/components/modules/repositories/details/settings-page.vue` section. Move existing editable general,
      webhook, Workflow Filter, membership, and group-grant cards without changing permissions or API operations. Load
      optional webhook metadata only while Settings is mounted; isolate errors and invalidate late supporting responses.
- [x] T014 [US1] Fix preview destinations in `apps/web/app/components/modules/repositories/details/activity-section.vue`.
      Send section links to the matching Repository child route, preserve record/Provider destinations, and suppress a
      self-targeting section CTA when the preview itself is shown in that child. Keep scoped reads and stale-load protection.
- [x] T015 [US1] Add activity children in `apps/web/app/pages/repositories/[id]/workflow-runs.vue` after T011 and T014.
      Also create `apps/web/app/pages/repositories/[id]/issues.vue`,
      `apps/web/app/pages/repositories/[id]/pull-requests.vue`, and
      `apps/web/app/pages/repositories/[id]/security-alerts.vue`. Initially compose the corresponding existing scoped
      preview; protect Security with existing `manager` middleware. Keep route files thin and do not create new run details.
- [x] T016 [US1] Preserve entry compatibility in `apps/web/app/pages/repositories/index.vue` after T011-T015.
      Keep existing title links, quick-detail dialog query/history, settings action, and explicit Provider/toggle controls
      working with the new child routes. Do not add row navigation yet; that belongs to US3.
- [x] T017 [US1] Add navigation/section messages in `apps/web/i18n/locales/en.json` and the complete locale file set.
      Reuse existing labels, translate new keys in all eight locales, and retain parity checked by
      `apps/web/app/i18n/locales.spec.ts`. English and German are the primary visual acceptance locales.
- [x] T018 [US1] Validate US1 using `apps/web/tests/e2e/repository-navigation.spec.ts` and relevant shell/detail tests.
      Run T008-T009, T004, locale parity, and applicable Web lint/type checks. Verify direct links, real scoped previews,
      Settings composition, no unauthorized child loads, and one consistent shell. Record actual results in
      `specs/002-repository-detail-navigation/quickstart.md`; do not claim the full US2 table experience yet.

**Checkpoint**: US1 is usable independently through real scoped previews. Baseline role guards must already work;
full permission/action lifecycle regression coverage follows in US4. Do not expose Settings or Security while waiting
for that later phase.

## Phase 4: User Story 2 - Inspect Repository Activity and Security (P1)

**Goal**: Full Repository-scoped tables, isolated state, category selection, and accurate empty/error/availability states.

**Independent Test**: With two accessible Repositories, exercise all four activity families through search, filters,
sorting, pagination, category/history changes, conflicting persisted state, and delayed/failing responses. Inspect the
actual request constraints and confirm zero unrelated rows or global summary requests.

### Tests

- [x] T019 [P] [US2] Add scope/pagination cases in `apps/web/app/composables/api/table.spec.ts`.
      Cover fixed AND constraints, unchanged global identities, distinct scoped persistence names, invalid/repeated page
      queries, out-of-range response clamping, and no table remount on ordinary page changes. Test behavior, not only strings.
- [x] T020 [P] [US2] Add activity journeys in `apps/web/tests/e2e/repository-activity.spec.ts`.
      Use T007 to assert real serialized constraints after every table operation, scoped error/retry behavior, stale-response
      isolation, category normalization/restoration, and unavailable/unknown/failed-metadata/available-empty distinctions.
      Assert scoped views omit summary and all-Repository selector requests while global pages retain them.

### Implementation

- [x] T021 [US2] Add scoped state support in `apps/web/app/composables/api/table.ts` after T019-T020.
      Reuse Query Kit and preserve renderer metadata. Keep global names unchanged; support scoped names
      `repository:<id>:workflow-runs`, `repository:<id>:issues`, `repository:<id>:pull-requests`, and
      `repository:<id>:security-alerts:<kind>`. Static Repository constraints must remain ANDed with user filtering.
- [x] T022 [US2] Complete scoped pagination/lifecycle handling in `apps/web/app/composables/api/table.ts` after T021.
      Apply the model constraint "positive integer route query, default 1; invalid values become 1." Clamp successful
      out-of-range results to the last available page, or 1 for no pages, without loops. Keep existing global defaults and
      Query Kit request versioning; expose or compose scoped error handling so retained rows cannot appear successful.
- [x] T023 [P] [US2] Scope and embed Workflow Runs in `apps/web/app/components/modules/workflow-runs/table-page.vue`.
      After T022, adopt the common frame and optional `repositoryId`/`embedded` props. Combine immutable scope with existing
      search constraints, hide Repository/Provider selectors, skip all-Repository choices, and ignore global dashboard
      presets in scoped mode. Preserve global props, columns, debounce, filters, and Provider links; add no row action.
- [x] T024 [P] [US2] Scope and embed Work Items in `apps/web/app/components/modules/work-items/table-page.vue`.
      After T022, support both Issue and Pull Request tables through the common frame and scope props. Preserve global
      behavior; in scoped mode hide Repository/Provider selectors, omit global summaries and their requests, skip Repository
      choices, retain authorized filter suggestions, and guard supporting requests against stale generations/unmount.
- [x] T025 [P] [US2] Scope and embed Security in `apps/web/app/components/modules/security-alerts/table-page.vue`.
      After T022, fix Repository and kind constraints, adopt the common frame, omit global summaries/selector requests, and
      filter availability by both Repository ID and kind. Distinguish known unavailable, unknown/not-yet-synchronized,
      supporting-load failure, and available-empty. Keep existing supporting endpoint/DTOs and guard late support responses.
- [x] T026 [P] [US2] Add category navigation in `apps/web/app/pages/repositories/[id]/security-alerts.vue` after T025.
      Replace its interim preview with the scoped embedded table. Preserve the model constraint "Allowed values are the
      existing `SecurityAlertKind` values `DEPENDENCY`, `CODE`, and `SECRET`." Normalize absent, repeated, nonstring, or
      invalid kind to canonical `kind=DEPENDENCY` using replace. User selections push history, drop inherited page/preset,
      and key the table by Repository/section/kind, excluding page. Keep the Manager middleware.
- [x] T027 [P] [US2] Connect full activity tables in `apps/web/app/pages/repositories/[id]/workflow-runs.vue`.
      After T023-T025, replace interim previews there and in `apps/web/app/pages/repositories/[id]/issues.vue` and
      `apps/web/app/pages/repositories/[id]/pull-requests.vue`. Supply immutable Repository scope and embedded mode; key by
      Repository/section, excluding mutable filters/page. Preserve valid direct/history page queries and thin route files.
- [x] T028 [US2] Add scoped status/category messages in `apps/web/i18n/locales/en.json` and the complete locale file set.
      Reuse existing category and empty/error labels where possible; translate missing unknown/unavailable/retry text and
      retain `apps/web/app/i18n/locales.spec.ts` key parity. Never describe missing availability metadata as zero findings.
- [x] T029 [US2] Validate US2 using `apps/web/tests/e2e/repository-activity.spec.ts` and the existing activity suites.
      Pass T019-T020 plus relevant `work-items.spec.ts`, `security-alerts.spec.ts`, `needs-attention.spec.ts`, and
      `awaiting-approval.spec.ts` in `apps/web/tests/e2e/`. Check global page/frame compatibility, two-Repository isolation,
      invalid/high pages, history, categories, failed loads, and supporting-request omission. Record evidence in
      `specs/002-repository-detail-navigation/quickstart.md`.

**Checkpoint**: US1 and US2 now provide the complete section browsing experience. No new backend endpoint, public DTO,
database model, or Provider request type is needed. Contradictory user filters may return no rows but must never broaden
the immutable Repository restriction.

## Phase 5: User Story 3 - Open Existing Details from Table Rows (P1)

**Goal**: Native typed row activation for four resource families, with independent embedded controls and keyboard access.

**Independent Test**: Click ordinary cells and unused row areas in Repository, Issue, Pull Request, and Security Alert
tables; each opens the exact existing internal destination once. Embedded actions produce zero additional navigation.
Rows without internal detail pages receive no new action.

### Tests

- [x] T030 [P] [US3] Add handler tests in `apps/web/app/composables/app/table-row-navigation.spec.ts`.
      Cover typed target resolution, custom interactive-role/contenteditable/explicit opt-out guards, and legitimate
      already-default-prevented Nuxt UI events. Do not add a DOM test dependency; use browser tests for native interaction.
- [x] T031 [P] [US3] Add row journeys in `apps/web/tests/e2e/table-row-navigation.spec.ts`.
      Cover all four families in global/scoped views, ordinary cells, one navigation, retained title links, row Enter/Space,
      repeated keys, headers/placeholders, native/custom controls, disabled/pending action groups, and hover-only tables.

### Implementation

- [x] T032 [US3] Implement the typed helper in `apps/web/app/composables/app/table-row-navigation.ts` after T030-T031.
      Use native `(event, row)` callbacks and existing internal targets. Rely on Nuxt UI's native-control exclusions; add
      custom role/contenteditable and `data-row-navigation-ignore` exclusions. Do not veto legitimate emitted events solely
      because `event.defaultPrevented` is true. Do not add document-level event delegation or change row selection.
- [x] T033 [P] [US3] Bind Repository row navigation in `apps/web/app/pages/repositories/index.vue` after T032.
      Navigate from `row.original.id` to Overview; retain title-link semantics and isolate Provider/settings/toggle controls,
      including disabled/pending action groups. Enable the navigation cursor only on actual navigable data rows.
- [x] T034 [P] [US3] Bind Work Item row navigation in `apps/web/app/components/modules/work-items/table-page.vue` after T032.
      Use the correct existing Issue or Pull Request detail destination in global and scoped mode. Keep title links,
      independently operable actions, native keyboard behavior, and cursor treatment confined to actual data rows.
- [x] T035 [P] [US3] Bind Alert row navigation in `apps/web/app/components/modules/security-alerts/table-page.vue` after T032.
      Navigate to existing `/alerts/:id` details in global/scoped views; preserve Provider links and custom-control isolation.
      Leave Workflow Runs, administration, discovery selection, notification dialogs, and other tables without row actions.
- [x] T036 [US3] Validate US3 using `apps/web/tests/e2e/table-row-navigation.spec.ts` and T030 unit tests.
      Inspect real Nuxt UI focus/Enter/Space behavior and external-link actions; assert no header/empty/placeholder targets,
      double navigation, accidental checkbox selection, or newly opened editing dialogs. Recheck existing quick dialogs and
      record scoped/global results in `specs/002-repository-detail-navigation/quickstart.md`.

**Checkpoint**: Existing internal details are accessible through the whole noninteractive row area. Other tables retain
their explicit controls; US5 supplies universal hover without using fake selection listeners.

## Phase 6: User Story 4 - Preserve Access and Administration (P1)

**Goal**: Verify and complete the permission/action lifecycle of the safely guarded structure introduced in US1.

**Independent Test**: Exercise assigned, unassigned, missing, and denied Repositories as Viewer, Manager, and System
Administrator, including direct restricted URLs. Verify Settings controls, isolated metadata errors, full operation
pending states, stale action responses, and return after local deletion.

### Tests

- [x] T037 [P] [US4] Add access-matrix scenarios in `apps/web/tests/e2e/repository-access.spec.ts`.
      Check four/five/six links, direct Manager/Admin middleware redirects, parent denial before child requests, no restricted
      data disclosure, and missing Repository feedback. Existing API ability checks remain authoritative, not mocked here.
- [x] T038 [P] [US4] Extend administration scenarios in `apps/web/tests/e2e/repository-detail.spec.ts`.
      Move existing form assertions to Settings and cover general/webhook/filter/member/group controls, lazy metadata reads,
      failed supporting requests, complete refresh/sync/save/delete loading, and delayed responses after section/Repo exit.

### Implementation and Hardening

- [x] T039 [US4] Complete action-lifetime safeguards in `apps/web/app/composables/api/repository-detail.ts`.
      After T037-T038, preserve existing behavior while ensuring refresh/sync/update results and finally blocks only affect
      the current lifetime, including A-to-B-to-A and unmount. Keep pending for the entire awaited operation and preserve
      synchronization fields when merging general settings. Extend T004 for any newly exposed action race.
- [x] T040 [US4] Complete Settings lifecycle handling in `apps/web/app/components/modules/repositories/details/settings-page.vue`.
      Invalidate late webhook metadata on unmount/Repository change, retain existing sensitive-value reset behavior, and keep
      optional errors local. Pass typed updates through the parent context. Change existing detail cards only for an actual
      regression required by T038; do not expand Manager privileges, secret visibility, or local API operations.
- [x] T041 [US4] Audit role and child-load gates in `apps/web/app/components/modules/repositories/details/page-shell.vue`.
      Check `apps/web/app/pages/repositories/[id].vue` and its `settings.vue`/`security-alerts.vue` children against T037;
      repair only feature regressions. Keep existing `apps/web/app/middleware/admin.ts` and `manager.ts` semantics and do not
      introduce a replacement authorization model. Retain authorized Settings-anchor and legacy-link behavior.
- [x] T042 [US4] Validate US4 using `apps/web/tests/e2e/repository-access.spec.ts` and administration regressions.
      Run T037-T038, context unit tests, and `apps/web/tests/e2e/repository-deletion.spec.ts` plus relevant destructive-action
      cases. Confirm pending states and no unauthorized supporting requests. Record the distinction between mocked frontend
      checks and unverified real API authorization in `specs/002-repository-detail-navigation/quickstart.md`.

**Checkpoint**: The existing permission matrix and administration behavior remain intact. Security is not deferred until
this checkpoint: baseline restrictions were required from US1, and this phase completes lifecycle and negative coverage.

## Phase 7: User Story 5 - Recognize Hovered Rows across All Tables (P2)

**Goal**: Consistent visual feedback for every data table, independent of whether its rows can navigate.

**Independent Test**: Reach all 16 table components from the research inventory, including Settings and dialogs, and
inspect hovered data rows in both themes. Verify pinned cells, focus/selection/pending feedback, pointer cursor rules,
and zero changes to data, selection, or hover-only row actions.

### Tests

- [x] T043 [US5] Add inventory-driven hover scenarios in `apps/web/tests/e2e/table-hover.spec.ts`.
      Reach the 14 Nuxt UI and two raw HTML tables listed in `specs/002-repository-detail-navigation/research.md`. Assert
      hover entry/exit, pinned-cell backgrounds, retained selected/focus/pending feedback, and no pointer/action on ordinary
      rows without detail destinations. Check headers, empty states, and loading placeholders separately.

### Implementation

- [x] T044 [P] [US5] Extend the Nuxt UI table theme in `apps/web/app/app.config.ts` after T043.
      Target actual body rows bearing `data-selected`, independently of `data-selectable`; match semantic hover backgrounds
      on pinned cells and preserve selection/focus styles. Do not assign navigation cursors or handlers to hover-only tables.
- [x] T045 [P] [US5] Style raw data rows in `apps/web/app/components/modules/dashboard/latest-runs.vue` after T043.
      Match shared semantic hover feedback without adding Workflow Run detail destinations, row selection, or row actions.
      Preserve explicit Provider links, statuses, loading/empty states, and existing dashboard layout.
- [x] T046 [P] [US5] Style raw data rows in `apps/web/app/components/common/dialogs/shortcuts.vue` after T043.
      Match shared hover feedback without making informational rows focusable/selectable or changing dialog controls.
- [x] T047 [US5] Complete visual scenarios in `apps/web/tests/e2e/repository-visual.spec.ts` and locale/layout regressions.
      Extend `apps/web/tests/e2e/localization.spec.ts` as needed for long names, English/German labels, navigation scrolling,
      embedded table controls, keyboard focus, and 375/1440-pixel viewports in both themes. Fix only affected feature layout
      regressions in the existing shell/frame/components; retain all eight locale key sets.
- [x] T048 [US5] Validate US5 using `apps/web/tests/e2e/table-hover.spec.ts` and T047 browser scenarios.
      Visually inspect synthetic screenshots, including hovered pinned columns and both raw tables; verify all 16 inventory
      entries and zero new hover-only actions. Store screenshots only in existing Playwright outputs and record the observed
      acceptance results in `specs/002-repository-detail-navigation/quickstart.md`.

**Checkpoint**: Universal hover is verified independently of row activation, in both themes, without losing focus,
selection, pending feedback, or locale/responsive usability.

## Phase 8: Polish and Cross-Cutting Validation

**Purpose**: Consolidate evidence and check the complete approved feature without extending scope.

- [x] T049 Review changed declarations and Vue layout against `docs/coding-guidelines.md`.
      Run documentation checks and review semantic accuracy, explicit public types, callbacks, block/attribute ordering,
      locale completeness, and preserved comments across changed `apps/web/app/` files. Fix only feature-introduced issues.
- [x] T050 Run affected-project gates from `specs/002-repository-detail-navigation/quickstart.md`.
      Run focused unit/browser suites first, then Web tests/lint/typecheck and canonical format/documentation checks.
      Include relevant existing navigation, deletion, Work Item, security, dashboard, notification, User Group, and layout
      regression suites. Diagnose feature failures without weakening tests or changing toolchain pins; report unrelated gaps.
- [x] T051 Reconcile validation instructions in `specs/002-repository-detail-navigation/quickstart.md`.
      Replace proposed test filenames with actual runnable commands; record checked scenarios and genuine evidence limits.
      Do not claim live Provider, real authorization, Docker, deployment, remote CI, or release verification from UI mocks.
- [x] T052 Refresh the AST graph in `graphify-out/graph.json` after the product source changes.
      Follow the installed Graphify skill and run `graphify update .`; review node/edge summaries and representative queries.
      If changed documents need semantic updates, use the skill's incremental cached procedure, never a full semantic
      rebuild merely because this is a worktree. Keep reports, caches, HTML, runtime metadata, and absolute paths local.
- [x] T053 Audit completion against `specs/002-repository-detail-navigation/spec.md` and this task list.
      Map every FR-001 through FR-019 and SC-001 through SC-008 to actual evidence, rerun canonical formatting after final
      documentation changes, and run `git diff --check`. Inspect source/graph/diff scope, confirm no Provider writes or
      unrequested dependencies/migrations, and leave commits/PR/release actions for explicit instructions. Mark only truly
      completed tasks and report remaining gaps; a generated or green quality checklist is not implementation evidence.

## Dependencies and Execution Order

### Phase and Story Graph

```text
Setup T001-T002
  Foundational T003-T007
    US1 T008-T018: guarded routes, Overview/Settings, real scoped previews
      US2 T019-T029: complete scoped activity tables and Security categories
        US3 T030-T036: integrate row activation into the final table components
      US4 T037-T042: full permission/admin lifecycle acceptance
    US5 T043-T048: universal hover; final acceptance follows US1-US4
      Cross-cutting T049-T053: all stories and evidence complete
```

- IDs describe the default sequential execution order. US2 depends on US1's parent/child structure; US3 integration
  waits for US2 because they edit the same table modules. US4 depends on US1 and its final acceptance also covers US2.
- US5's theme/raw-table edits can be prepared after Foundation, but finish its tests after the routes, rows, and Settings
  fixtures exist. Default to the listed phase order; no parallel agent work is automatically authorized by `[P]`.
- US1's secure navigation/Overview is the suggested MVP. Its activity previews are a working limited increment;
  do not call US2 complete or claim the entire issue delivered until full tables/categories are accepted.
- No story may temporarily expose unrestricted child data. T010-T015 establish baseline restrictions; US4 adds depth
  and negative/lifecycle evidence rather than granting permission to defer access control.
- Shared files are serialized: context T005 then T039; routes T011-T015 then T026-T027/T041; table modules T023-T025
  then T033-T035; locale set T017 then T028; guide evidence T018/T029/T036/T042/T048 then T051/T053.
- Each story's tests are authored before its behavior changes. Its validation task waits for all implementation and
  locale tasks in that phase. Do not run verification concurrently with mutations to the same source or fixture.

### Parallel Execution Examples

These are scheduling examples, not instructions to spawn agents or bypass prerequisite/test gates.

- Foundation: T003 and T004 use separate files. After T005, T006 and T007 can proceed together.
- US1: T008 navigation tests and T009 shell tests can be authored together after Foundation. Complete both before T010.
- US2: T019 and T020 can be authored together. After T022, T023/T024/T025 touch separate table modules. Once those
  complete, T026 and T027 can integrate distinct route files together. T028 locale edits remain serialized.
- US3: T030 and T031 can be authored together. After T032, T033/T034/T035 bind distinct resource tables together.
- US4: T037 access-matrix and T038 administration test authoring can run together after US1. Do not overlap T039-T041
  with unfinished mutations to their context, Settings, shell, or route files.
- US5: After T043, T044 global theme, T045 dashboard rows, and T046 shortcut rows touch separate files. T047/T048 follow
  completed UI changes; do not inspect screenshots while those files are still being changed.

## Requirement and Contract Coverage

- FR-001, FR-002: T008-T011, T015, T017-T018, T026-T027; section routes, roles, addresses, active state, and history.
- FR-003: T012, T014, T018; read-only Overview, synchronization status, and Repository-scoped preview links.
- FR-004: T013, T038-T042; retained Settings controls and existing administration contracts.
- FR-005, FR-006: T019-T025, T027, T029; immutable filtering, pagination, skipped global requests, and omitted metrics.
- FR-007, FR-008: T020, T025-T026, T028-T029; exact category values, normalization, history, and availability states.
- FR-009: T004-T005, T008, T010-T011, T013, T015, T037-T042; parent access and direct role restrictions.
- FR-010, FR-011, FR-012, FR-014: T030-T036, T043-T048; exact destinations, keyboard/control isolation, cursor rules,
  and absence of new actions for remaining tables or placeholders.
- FR-013: T043-T048; the complete 16-table inventory, raw data rows, pinned cells, and preserved state feedback.
- FR-015: T004-T005, T019-T029, T038-T039; generation/lifetime guards, scoped persistence, pagination, and history.
- FR-016: T004-T005, T013, T020, T022-T025, T038-T042; pending, empty, failed/retry, denied, and support-error states.
- FR-017: T009, T017, T028, T043-T048; eight-locale key parity, primary English/German layouts, widths, and themes.
- FR-018, FR-019: T008, T013-T018, T023-T025, T033-T042, T049-T053; compatibility and unchanged read-only boundaries.
- SC-001/SC-002: T018/T042; SC-003/SC-004: T029; SC-005: T036; SC-006: T036/T048; SC-007: T042;
  SC-008: T047-T048. T053 requires actual results, not this mapping alone.
- Detail data/context and state transitions: T003-T005, T010-T013, T019-T029, T039-T040.
- UI addresses/props/read requests: T006, T008-T029. Row and presentation contracts: T030-T048.
- Existing domain entities stay in their current DTOs; no schema/API/migration implementation tasks are needed.

## Implementation Strategy

1. Complete Setup and Foundation, then deliver/test US1 as the secure navigation-first MVP with real previews.
2. Replace preview children with full scoped tables through US2; preserve the already working Overview and Settings.
3. Add US3 row activation, complete US4 access/action lifecycle evidence, then US5 universal hover and visual acceptance.
4. Run cross-cutting validation and review only the feature's source, tests, documentation, and required graph output.

Never commit merely because a task is checked. Follow the supplied explicit-commit rule; if a substantive implementation
commit is later requested, include exactly one focused `repovio` Changeset for that commit and push the reviewed scope
under repository policy. This task-generation output requires no Changeset or commit. Release PR merges remain manual.

## Generation Summary

- 53 tasks: Setup 2, Foundation 5, US1 11, US2 11, US3 7, US4 6, US5 6, Cross-cutting 5.
- Five independently verifiable User Story phases, with explicit integration dependencies and early permission gates.
- Parallel opportunities are restricted to the disjoint-file batches listed above; shared files are serialized.
- Suggested MVP: US1 after Foundation; full issue acceptance requires US1-US5 plus cross-cutting checks.
- Execution evidence and known baseline failures are recorded in [quickstart.md](quickstart.md). Checkbox state reflects
  local completion, not a commit, remote CI pass, release, or deployment.

## Implementation Completion

All 53 tasks were implemented and locally verified. Test organization uses the focused `repository-visual`,
`repository-activity`, and `repository-access` suites instead of expanding the broad page-layout fixture. The existing
navigation suite gained a direct section/history scenario, and existing resource suites gained shared real-row hover
checks. This preserves the planned behavior and boundaries without creating a second table engine or new API.

Validation: 55 Web unit tests; 41 dedicated feature browser scenarios; eight additional long-name visual checks; 45 passing
legacy regressions with four independently reproduced baseline failures; passing lint, typecheck, documentation, and
canonical formatting. See [quickstart.md](quickstart.md) for the failure details, per-requirement evidence, and limits.

The issue remains open for review. Planning artifacts and the completed implementation are published in separate commits
for the requested feature PR. Earlier verification was completed before this delivery step. No merge, release, deployment,
Provider write, migration, or dependency upgrade was performed. The requirements-quality checklist remains unchanged.
