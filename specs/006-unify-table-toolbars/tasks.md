# Tasks: Consistent Table Toolbars

**Input**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md),
[UI contract](contracts/ui.md), and [quickstart.md](quickstart.md).
**Feature**: `006-unify-table-toolbars`
**Status**: Task generation and issue/planning-commit creation approved on 2026-11-09; implementation and feature verification completed on 2026-11-10; merge approval pending.
**Issue**: [#79](https://github.com/repovio/repovio/issues/79)
**Branch**: `79-unify-monitoring-list-toolbars-and-merge-user-groups-header-controls`
**Organization**: Seven executable tasks grouped by user story. Tests are included as required by the feature spec
and constitution. Each implementation task includes its own code, focused tests, documentation, and Changeset.

## Delivery Boundaries

- Reuse the existing Codex worktree and `79-unify-monitoring-list-toolbars-and-merge-user-groups-header-controls` branch for issue #79.
  Issue creation and committing/pushing the planning artifacts are approved.
- Implementation approved on 2026-11-10 after planning PR #80 merged. PR merge still requires separate approval.
- Once implementation is authorized, complete, verify, commit, and push each substantive task separately before
  dependent work. Include exactly one focused `repovio` patch Changeset per implementation commit.
- Read-only setup/verification tasks do not require empty commits or artificial Changesets. Metadata-only evidence
  updates follow repository policy. Mark implementation tasks complete only after their checks and commit succeed.
- Inspect status and relevant diffs before every edit, test, and commit. Preserve unrelated work and release PRs.
- No provider mutations, schema changes, dependencies, toolchain changes, deployment, or release work.

## Phase 1: Setup

**Goal**: Verify the approved feature context and prepare the existing toolchain without changing project configuration.

- [x] T001 Verify `specs/006-unify-table-toolbars/{spec,plan,tasks}.md` and `.specify/feature.json` resolve to this feature; confirm issue/branch/implementation approvals before product work, check Node.js 26.13.0 and Corepack pnpm 11.28.9 against `package.json`, and install the unchanged `pnpm-lock.yaml` dependencies and Chromium if missing. Record prerequisites and any preexisting failures in `specs/006-unify-table-toolbars/evidence.md`.

**Acceptance**: This worktree can run the existing web checks and mocked browser suites with pinned dependencies.
Do not copy writable Graphify caches or change shared Git hooks as setup work.

## Phase 2: Foundational

**Goal**: Establish the behavioral baseline and supported public filtering interface before moving controls.

- [x] T002 Inspect the installed `@querry-kit/nuxt-ui` public header/trigger slots against `pnpm-lock.yaml` and `specs/006-unify-table-toolbars/research.md`; run baseline `apps/web/tests/e2e/{work-items,security-alerts,user-groups,page-layout}.spec.ts`, capture existing label/path/date request predicates and toolbar screenshots, and record results in `specs/006-unify-table-toolbars/evidence.md`. Confirm no native Date field is required and identify existing locale keys in `apps/web/i18n/locales/{en,de}.json` for the wrapper header, mode, and Clear controls.

**Acceptance**: Baseline results and public-slot compatibility are recorded. Existing failures are classified before edits.
No product-code changes belong in this task. This phase blocks all implementation tasks.

## Phase 3: User Story 1 - Consistent monitoring controls (P1, MVP)

**Goal**: Issues, Pull requests, and the three alert lists match Workflow runs without losing filtering behavior.

**Independent test**: Each marked list shows search and refresh/sort/filter/options in its breadcrumb header;
specialized criteria work inside filtering, preserving the equivalent request constraints and visible active state.

- [x] T003 [US1] Add focused failing coverage in `apps/web/tests/e2e/work-items.spec.ts`, then implement `apps/web/app/components/common/table-filtering.vue` using only public `QTableFiltering` header/trigger slots and integrate it in `apps/web/app/components/modules/work-items/table-page.vue`. Move labels and updated-date inputs into its specialized slot, preserve existing refs/static predicates and field metadata, forward models/shortcuts, combine generic/specialized active state, and make Clear reset both groups without clearing search. Reuse or add localized accessible header/mode/Clear text in `apps/web/i18n/locales/{en,de}.json`. Prove “Every selected label contributes an AND constraint,” “Inclusive UTC day bounds; blank values add no constraint,” unchanged generic OR/AND behavior, popover close/reopen preservation, dashboard-preset release, search debounce, pagination, scoped Repository restrictions, delayed refresh loading, and no fetch merely from opening filtering. Run focused browser and affected web checks, update `specs/006-unify-table-toolbars/evidence.md`, refresh `graphify-out/graph.json`, and include `.changeset/unify-work-item-toolbars.md` in this task's commit.

- [x] T004 [US1] After T003, add focused failing coverage in `apps/web/tests/e2e/security-alerts.spec.ts`, then reuse `apps/web/app/components/common/table-filtering.vue` in `apps/web/app/components/modules/security-alerts/table-page.vue` to move CODE path and all alert updated-date inputs into filtering. Preserve “CODE only; preserve existing location predicate,” inclusive UTC bounds, fixed alert kind, generic criteria, combined active/Clear behavior, and refresh loading through supporting requests. Cover all three alert routes, empty/error/unavailable states, option-loading/empty options, and embedded Repository scope in `apps/web/tests/e2e/repository-detail.spec.ts`. Run focused browser and affected web checks, update `specs/006-unify-table-toolbars/evidence.md`, refresh `graphify-out/graph.json`, and include `.changeset/unify-alert-toolbars.md` in this task's commit.

**Checkpoint**: US1 is complete only after T003 and T004 pass independently and their commits exist.
Workflow runs itself retains its current behavior. Existing column options, sorting, summaries, warnings, and
pagination remain functional. No filter criteria are persisted under new keys.

## Phase 4: User Story 2 - Manage groups from one header (P1)

**Goal**: User groups exposes breadcrumbs, search, sorting, and New group in one page toolbar.

**Independent test**: Existing group-management flows pass with no second controls row or duplicate query state.

- [x] T005 [P] [US2] Add focused failing coverage in `apps/web/tests/e2e/user-groups.spec.ts`, then move page-frame ownership into `apps/web/app/components/modules/user-groups/table.vue` and make `apps/web/app/pages/admin/user-groups.vue` compose it while retaining admin middleware, full-width metadata, and page title. Render existing search, sorting, and New group bindings through frame actions, remove the content-level `QTableToolbar`, and preserve “Exactly one owner after moving frame ownership.” Verify search/sorting requests, pagination, create/rename/member/delete dialogs, confirmation, pending/loading, errors, and administrator access; do not add Teleport or duplicate state. Run focused browser and affected web checks, update `specs/006-unify-table-toolbars/evidence.md`, refresh `graphify-out/graph.json`, and include `.changeset/merge-user-group-toolbar.md` in this task's commit.

**Checkpoint**: Exactly one `data-page-toolbar` contains breadcrumbs and the three group control types.
T005 does not depend on T003 or T004 and must not modify their files or locale keys.

## Phase 5: User Story 3 - Sizes, languages, and keyboard access (P2)

**Goal**: All six marked routes remain usable at the specified sizes and in both supported languages.

**Independent test**: Bounds, control reachability, active states, and keyboard behavior pass for the six-route matrix.

- [x] T006 [US3] After T003–T005, extend `apps/web/tests/e2e/page-layout.spec.ts` with all six routes at 390 × 844, 1065 × 1134, and 1440 × 900 in English/German; capture deterministic light/dark screenshots and assert one global header, no duplicate group controls, no page-level horizontal overflow, and reachable toolbar/popover controls. Exercise Shift+F, tab order, visible focus, Escape dismissal/focus return, specialized-only active state, Clear, and close/reopen preservation; retain embedded `data-table-toolbar` coverage in `apps/web/tests/e2e/repository-navigation.spec.ts`. Fix only demonstrated feature regressions in `apps/web/app/components/common/table-filtering.vue`, affected feature tables, or `apps/web/i18n/locales/{en,de}.json`; avoid a global shell redesign. Update `specs/006-unify-table-toolbars/evidence.md`, run focused and affected web checks, refresh `graphify-out/graph.json` for code changes, and include `.changeset/verify-toolbar-accessibility.md` in this test/behavior task's commit.

**Checkpoint**: Responsive wrapping is allowed; clipping and page-level overflow are not. Table-local horizontal
scrolling remains allowed. Capture all six supplied desktop cases; do not claim screenshots prove network semantics.

## Phase 6: Polish and Cross-Cutting Verification

**Goal**: Prove feature-wide acceptance without expanding scope.

- [x] T007 Run `specs/006-unify-table-toolbars/quickstart.md` against the completed implementation, including the focused browser matrix, `apps/web/tests/e2e/repository-detail.spec.ts`, `apps/web/tests/e2e/repository-navigation.spec.ts`, affected web lint/typecheck/unit tests, canonical formatting stability across two passes, documentation/guideline checks, and `git diff --check`. Review `specs/006-unify-table-toolbars/{spec,plan,tasks}.md` and `contracts/ui.md` for full requirement coverage; record commands, screenshots, commits, current CI status when available, and explicit verification gaps in `specs/006-unify-table-toolbars/evidence.md`. Correct only scoped regressions with focused tests and the required separate Changeset-bearing follow-up commit; a clean read-only verification run needs no empty commit.

**Checkpoint**: All FR-001–FR-009 and SC-001–SC-005 have evidence. Browser evidence uses deterministic local fixtures;
provider behavior, Docker, production deployment, and remote CI are not inferred from local passes.

## Dependencies and Execution Order

```text
T001 then T002
T002 enables T003 and T005 independently
T003 enables T004
T004 and T005 enable T006
T006 enables T007
```

| Story    | Tasks      | Dependencies                       | Acceptance                                               |
| -------- | ---------- | ---------------------------------- | -------------------------------------------------------- |
| US1 (P1) | T003, T004 | T002; T004 also needs T003 wrapper | Five compact monitoring headers and preserved predicates |
| US2 (P1) | T005       | T002                               | One group header; existing administration flows          |
| US3 (P2) | T006       | US1 and US2                        | Six routes, three sizes, EN/DE, keyboard and screenshots |

## Parallel Opportunities

- **US1**: T003 and T004 are sequential because the alert task consumes the wrapper. After each task's integration,
  its independent browser cases can run concurrently if isolated browser contexts and resources are available.
- **US2**: T005 is marked `[P]` because its product and test files are disjoint from T003/T004. Example: implement
  `modules/user-groups/table.vue` while US1 works on `modules/work-items/table-page.vue`. Evidence updates, Graphify
  refreshes, staging, and commits remain serialized to avoid shared-file/index conflicts.
- **US3**: Run independent route/locale/viewport browser cases concurrently after T006 coverage is written; do not
  edit `page-layout.spec.ts` concurrently. Example: Issues at 1065 pixels and User groups at 390 pixels.
- Parallel opportunities describe scheduling only; no additional agent work is authorized by this artifact.

## Implementation Strategy

1. Complete setup and the behavioral baseline without changing the pinned toolchain.
2. Deliver US1 as the MVP: T003 provides a working Issues/Pull requests increment; T004 completes monitoring parity.
3. Deliver US2 as an independently verified group-header increment.
4. Complete US3's cross-route browser proof and any narrowly scoped corrections.
5. Finish T007 before reporting implementation complete or creating the feature PR under the delivery workflow.

Each task has stable IDs for the future issue checklist. Do not stop at the MVP when implementation is approved for
the complete feature. Do not merge a PR without separate approval.

## Approved Tracking Scope

**Issue title**: Unify monitoring list toolbars and merge User groups header controls.
**Scope**: The five marked monitoring routes, User groups, directly reused filtering/frame code, EN/DE labels,
focused regression coverage, and visual acceptance evidence. No provider/API/database work.

Issue #79 carries the complete plan, ordered task checklist, dependencies, acceptance criteria, validation strategy,
and material risks. Implementation and verification records are in [evidence.md](evidence.md); merge approval is pending.
