# Tasks: Global Auto Refresh

**Input**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md),
[contracts/ui.md](contracts/ui.md), and [quickstart.md](quickstart.md).

**Authorization**: Planning, task generation, issue creation, branch creation, and planning-only commit/push approved
on 2026-11-10. Implementation is not yet approved. Issue: [#91](https://github.com/repovio/repovio/issues/91).
Current checkout: existing Codex worktree `/mnt/projects/.codex-worktrees/c996/repovio`, branch
`codex/91-global-auto-refresh`.

**Organization**: Eight coherent tasks, grouped by story. Each implementation task includes its focused tests, declaration
comments, feature documentation, and exactly one focused `repovio` Changeset in its own commit after implementation and
commit authority is obtained. Pure setup/verification tasks require no empty commit or invented package bump.

## Format and Path Conventions

`- [ ] Tnnn [P?] [USn?] Description with exact paths`. Paths below are repository-relative. Story labels map to spec.md.
No task is marked parallel because the integrations share request ownership, browser fixtures, or dependent feature state.
Checks within a completed increment may run independently when they do not share mutable resources.

## Phase 1: Setup

**Purpose**: Resolve issue/branch authority and verify the existing toolchain before product changes.

- [ ] T001 Verify the associated issue and approved implementation scope against `specs/009-global-auto-refresh/spec.md`
      and `specs/009-global-auto-refresh/tasks.md`; inspect current instructions, status/diffs, remote base, and task worktree;
      install existing dependencies from `pnpm-lock.yaml` using Node.js 26.13.0/pnpm 11.28.9 if missing; inspect installed
      Query Kit refresh/query completion and active repository-tab lifecycle; record actual baseline checks, precise request
      dispatch/activation integration points, and issue/branch context in `specs/009-global-auto-refresh/evidence.md`.

**Acceptance**: No provider/server/toolchain changes. Issue and planning commit exist before implementation approval is
requested; T001 execution requires that subsequent approval. Run Graphify before new source exploration and inspect the
actual installed contracts rather than assuming that a refresh call returns an awaitable promise. If the no-overlap
requirement requires a material dependency change, stop for a scoped design revision; do not silently relax it.

## Phase 2: Foundational Scheduling and Preference

**Purpose**: Provide one tested scheduling/registration foundation for all stories.

- [ ] T002 Implement `apps/web/app/store/auto-refresh.ts`,
      `apps/web/app/composables/app/auto-refresh-state.ts`, and `apps/web/app/composables/app/auto-refresh.ts` with focused
      tests in `apps/web/app/store/auto-refresh.test.ts` and
      `apps/web/app/composables/app/auto-refresh-state.test.ts`; use storage key `repovio:auto-refresh:interval-ms`,
      numeric union `0 | 15000 | 30000 | 60000 | 300000`, default `15000`, and zero meaning
      “Disable interval refresh; preserve manual and existing sync-completion refresh”; validate with the exact rule
      “Reject strings, objects, non-finite numbers, negatives, and unlisted values after JSON decoding” and fallback
      “Missing/invalid/inaccessible storage uses an in-memory 15000 default; writes are best effort”; implement unique
      target tokens, reactive busy state, completion-driven deadlines, joined in-flight promises, activation/disposal
      generations, hidden/offline suspension, and one catch-up; document the contract in
      `specs/009-global-auto-refresh/data-model.md` and include `.changeset/global-auto-refresh-foundation.md`.

**Tests first within this increment**: Fake-clock/deferred-promise cases must fail before implementing the corresponding
behavior, then pass before commit. Cover all interval values, changes while waiting/running, invalid and blocked storage,
failed reads/writes, rejected refresh, simultaneous triggers, stale disposer, sign-out/unmount/deactivation, hidden/offline
combinations, and no catch-up burst. Off must also suppress resume-driven automatic catch-up. A catch-up attempted during
busy work joins or skips it and resumes the normal schedule, without starting a second operation.

**Acceptance/checks**: One pending refresh per target, no scheduled requests while busy/ineligible/Off, no orphan timers or
listeners, no unhandled rejection, no automatic initial duplicate load. Focused tests, web lint/typecheck, documentation,
canonical formatting, and diff checks pass. This task exposes no unconditional global table polling.

## Phase 3: User Story 1 - Keep the Active Monitoring View Current (P1, MVP)

**Goal**: All nine views and active embedded monitoring tables update at the default interval with preserved state.

**Independent test**: With cleared refresh preference, change synthetic responses and advance the browser clock by 15 s
on each supported view. Verify new table/widget/summary data, unchanged applicable query choices, and no sync POST.

- [ ] T003 [US1] Integrate the registered refresh target into `apps/web/app/pages/index.vue` and
      `apps/web/app/pages/workflows/awaiting-approval.vue`; use the same guarded operation for existing initial/manual
      loading and scheduled refresh, preserve dashboard period and approval search, await all grouped reads even after a
      sibling fails, and protect current/historical/approval writes from obsolete generations; add focused deferred-loader
      integration tests in `apps/web/app/composables/app/auto-refresh-pages.spec.ts` and browser scenarios in
      `apps/web/tests/e2e/auto-refresh-pages.spec.ts`; record coverage in
      `specs/009-global-auto-refresh/evidence.md` and include `.changeset/global-auto-refresh-pages.md`.

**T003 acceptance**: Dashboard and approval updates work independently of the future navbar UI. A delayed widget keeps the
manual control busy until every related read settles; existing error/retry feedback survives partial failures. Period
changes during refresh do not apply an obsolete result. No requests continue to schedule after navigation/sign-out.

- [ ] T004 [US1] Integrate `apps/web/app/components/modules/workflow-runs/table-page.vue` for All runs, Needs attention,
      and active embedded repository workflow tabs; preserve the 500 ms sync-completion debounce and route its final call,
      manual refresh, and scheduled refresh through the same completion gate; if T001 proves necessary, add a narrow
      opt-in dispatch/completion seam in `apps/web/app/composables/api/table.ts` with regression coverage in
      `apps/web/app/composables/api/table.spec.ts`, preserving existing behavior for nonparticipants; add deferred query/sync
      adapter tests in `apps/web/app/composables/app/auto-refresh-workflow-runs.spec.ts` and fixture browser cases in
      `apps/web/tests/e2e/auto-refresh-workflow-runs.spec.ts`; record evidence and include
      `.changeset/global-auto-refresh-workflow-runs.md`.

**T004 acceptance**: Initial/filter/page requests cannot overlap automatic work for the same source. Simultaneous
sync/manual/timer triggers produce one operation; Off preserves sync-driven refresh. Existing search, presets, sort,
columns, route pagination, repository restrictions, and invalid-page recovery remain unchanged. Inactive repository tabs
never register active work; route/resource changes cannot apply old scoped data.

- [ ] T005 [US1] Integrate `apps/web/app/components/modules/work-items/table-page.vue` and
      `apps/web/app/components/modules/security-alerts/table-page.vue` with the registered completion gate and T004's
      opt-in query seam if required; refresh tables plus current summary/supporting reads to completion, preserve errors,
      fixed repository/category scope, and active embedded-tab lifecycle; add deferred summary/query tests in
      `apps/web/app/composables/app/auto-refresh-monitoring-tables.spec.ts` and fixture coverage for Issues, Pull requests, and all
      three alert categories in `apps/web/tests/e2e/auto-refresh-monitoring-tables.spec.ts`; record evidence and include
      `.changeset/global-auto-refresh-monitoring-tables.md`.

**T005 acceptance**: All five routes refresh complete visible content at the default interval. Filters, multi-label AND
matching, date constraints, presets, sort, pagination, columns, and category/repository scope survive refresh. Rejected table
or summary reads do not clear pending while sibling reads still run, expose unauthorized retained data, or prevent retry.
Background/inactive instances issue no scheduled reads. Relevant existing table/query/browser regressions pass.

**Checkpoint**: US1 is independently complete after T003–T005, with default cadence and existing manual buttons. This is the
MVP; navbar configuration and uniform manual styling follow without changing the refresh semantics.

## Phase 4: User Story 2 - Choose One Refresh Interval (P1)

**Goal**: Configure the shared browser preference once from the authenticated navbar.

**Independent test**: Set 30 s, navigate/reload, verify selected state and cadence; select Off and advance five simulated
minutes, with no interval requests and manual/sync refresh still operational.

- [ ] T006 [US2] Add `apps/web/app/components/layout/auto-refresh-control.vue` and compose it before notifications in
      `apps/web/app/components/layout/navbar-controls.vue`; bind Off/15 seconds/30 seconds/1 minute/5 minutes to the T002
      store, provide translated selected-state tooltip/accessible name/help, labeled single-choice popover, keyboard
      selection, Escape/focus return, and non-color selection indication; add matching strings in every existing
      `apps/web/i18n/locales/*.json` locale, extend `apps/web/app/composables/app/locales.spec.ts` for key parity as needed,
      and add `apps/web/tests/e2e/auto-refresh-preferences.spec.ts`; document usage in `apps/web/README.md`, record browser
      evidence, and include `.changeset/global-auto-refresh-preferences.md`.

**Acceptance/checks**: Every choice takes effect without reload and persists across navigation/reload; storage failures do
not block the control. Unsupported authenticated routes show the preference but create no target. Changes while running
cannot duplicate work. Verify EN/DE at 390/1440 px with keyboard, light/dark themes, selected-state naming, and no new navbar
overflow; inspect screenshots. Run preference/store tests, locale parity, affected web checks, formatting/docs/diff checks.

## Phase 5: User Story 3 - Consistent Manual Refresh Buttons (P2)

**Goal**: All nine monitoring views expose the same accessible icon-only refresh design and complete pending state.

**Independent test**: Compare the nine toolbars and activate their controls with delayed fixture requests; verify matching
presentation, tooltip/name, keyboard focus, duplicate prevention, and full loading lifetime even when auto-refresh is Off.

- [ ] T007 [US3] Create `apps/web/app/components/common/refresh-button.vue` with `i-lucide-refresh-cw`, neutral/ghost/medium,
      square icon-only presentation, translated Refresh name/tooltip, parent-owned busy state, and activation event;
      replace manual refresh buttons in `apps/web/app/pages/index.vue`,
      `apps/web/app/pages/workflows/awaiting-approval.vue`,
      `apps/web/app/components/modules/workflow-runs/table-page.vue`,
      `apps/web/app/components/modules/work-items/table-page.vue`, and
      `apps/web/app/components/modules/security-alerts/table-page.vue`; add component coverage in
      `apps/web/app/components/common/refresh-button.spec.ts` and nine-route pending/style/accessibility browser checks in
      `apps/web/tests/e2e/auto-refresh-controls.spec.ts`; record inspected screenshots, update `apps/web/README.md`, and
      include `.changeset/global-auto-refresh-controls.md`.

**Acceptance/checks**: No visible Refresh text label; same icon/variant/size/focus behavior on all nine routes. Loading and
disabled state cover every related read through rejection, with successful manual retry afterward. Existing toolbar search,
filtering, sorting, columns, and navigation retain their positions/semantics. Provider synchronization and PWA update
controls remain separate. Run focused component/browser checks and affected web lint/typecheck/tests/build.

## Phase 6: Cross-Cutting Verification

**Purpose**: Prove the integrated feature and preserve unrelated behaviors.

- [ ] T008 Execute `specs/009-global-auto-refresh/quickstart.md`, compose shared fixture helpers and cross-route acceptance
      in `apps/web/tests/e2e/auto-refresh.spec.ts` as needed, and record commands/results, screenshots, requirement coverage,
      issue/commit references, and limitations in `specs/009-global-auto-refresh/evidence.md`; run all new focused suites,
      affected existing toolbar/dashboard/query/repository-tab/localization regressions, web test/lint/typecheck/build,
      root documentation/guideline/format checks, and `git diff --check`; reconcile every FR/SC against evidence.

**Acceptance**: Prove all nine views, active embedded tabs, hidden/offline pause, one catch-up, failure recovery, exact
preference behavior, unchanged permissions/query state, zero sync/provider writes, and EN/DE responsive accessibility.
Inspect screenshots rather than inferring visual success from type checks. Run `graphify update .` after source changes,
inspect graph summaries, and include the graph with its source commits. Formatting must be byte-stable on a second complete
pass. Report mocked/local evidence separately from live provider/deployment/remote CI behavior. If this task needs fixes,
commit each scoped verified follow-up with its own single focused Changeset; otherwise no empty commit is needed.

## Requirements Coverage

| Requirement                                     | Tasks                        |
| ----------------------------------------------- | ---------------------------- |
| FR-001 nine views and active embedded targets   | T003, T004, T005, T008       |
| FR-002 global interval choices/default          | T002, T006                   |
| FR-003 persistence/validation/fallback          | T002, T006                   |
| FR-004 target lifecycle/sign-out                | T002, T003, T004, T005       |
| FR-005 complete content/state preservation      | T003, T004, T005             |
| FR-006 no overlapping triggers/queries          | T002, T003, T004, T005       |
| FR-007 hidden/offline/resume                    | T002, T008                   |
| FR-008 uniform accessible manual controls       | T007                         |
| FR-009 permission-scoped reads/no provider sync | T001, T003, T004, T005, T008 |
| FR-010 locale completeness                      | T006, T007, T008             |
| FR-011 sync refresh survives Off                | T004, T008                   |
| SC-001 default cadence across all views         | T003, T004, T005, T008       |
| SC-002 interval choices/persistence/Off         | T002, T006, T008             |
| SC-003 single flight/ineligible/no backlog      | T002, T003, T004, T005, T008 |
| SC-004 preserved choices/uniform controls       | T003, T004, T005, T007, T008 |
| SC-005 EN/DE responsive keyboard/visual proof   | T006, T007, T008             |

## Dependencies and Execution Order

```text
T001: setup and concrete request ownership
  T002: preference and scheduler foundation
    T003: Dashboard and Awaiting approval
      T004: workflow runs and optional opt-in query seam
        T005: work items and alert categories (US1 MVP complete)
          T006: navbar preference (US2 complete)
            T007: uniform manual controls (US3 complete)
              T008: full acceptance evidence
```

All story work depends on T002. US1 integrations are executed sequentially to preserve query ownership and a coherent
MVP. US2 can be tested independently of refreshed view content through its selected preference, persistence, and unsupported
route behavior; cadence acceptance uses US1's actual targets. US3 is independently testable on the completed target adapters
with Off. Do not treat shared scheduler availability as proof that an unintegrated route refreshes.

## Parallel Execution Examples

- **US1**: After each integration is built, its isolated unit checks and static checks may run concurrently. Serialize
  browser builds, shared fixture edits, source writes, Graphify updates, and commits.
- **US2**: After navbar implementation, storage unit checks and locale-key checks may run independently. Browser tests
  wait for the working app and serialized fixture server.
- **US3**: After control migration, presentation checks and unit tests may run independently; shared nine-route browser
  checks use one configured test run. No file-disjoint implementation task is marked `[P]`.

These examples describe scheduling possibilities; they do not authorize additional agents or combined task commits.

## Implementation Strategy

1. Issue/planning-commit approval received; issue #91 and its branch are established in the existing worktree.
   Commit/push the reviewed planning artifacts, then obtain separate implementation approval.
2. Complete T001–T005 for the independently verified US1 MVP. This checkpoint does not end the approved full scope.
3. Complete T006 and T007 for global configuration and consistent compact manual controls.
4. Complete T008, repair scoped failures, and record actual evidence before preparing the feature PR.
5. During authorized implementation, each substantive task gets exactly one focused `repovio` Changeset, its own reviewed
   commit, and push under repository policy. Do not mark an implementation task complete before its checks and commit pass.
6. PR merge, release, deployment, and production synchronization are outside task-generation authority and retain their
   separate applicable approvals.

## Notes

- Do not add a new API, database migration, dependency, settings permission, socket protocol, or server polling setting.
- Do not refresh hidden cached tabs, unsupported administration tables, Jobs, notification popovers, or provider sync actions.
- Add concise purpose/contract documentation to handwritten declarations under `docs/coding-guidelines.md`; preserve
  Vue block/attribute ordering and all existing comments.
- `.specify/extensions.yml` is absent: no before/after-task hooks require dispatch.
- Task generation itself performs no product implementation, issue creation, branch creation, commit, push, or deployment.
