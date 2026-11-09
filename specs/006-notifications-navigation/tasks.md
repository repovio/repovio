# Tasks: Simplify Notifications Navigation

**Input**: Design documents from `/specs/006-notifications-navigation/`.

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md),
[UI contract](contracts/navigation.md), and [quickstart.md](quickstart.md).

**Tests**: Browser regression coverage is explicitly required by the specification, plan, and constitution. Extend the
existing suites; do not add backend scaffolding or a new test framework.

**Organization**: Two user stories, ordered by priority. Every task includes its acceptance evidence and exact file paths.
Implementation and PR creation explicitly requested on 2026-11-09. No matching active issue exists; the PR tracks this
bounded request, with closed issue #65 as context. No new issue, merge, or deployment is authorized.

## Format: `[ID] [P?] [Story] Description`

- `[P]` identifies work on separate files that may proceed together after shared prerequisites.
- `[US1]` and `[US2]` map to the stories in `spec.md`.
- Paths are relative to the repository root.
- Before each edit or check, inspect `git status` and the relevant diff; preserve unrelated work.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Reuse the existing task worktree and pinned toolchain; no project initialization is needed.

- [ ] T001 Verify the selected worktree, Node.js 26.13.0, pnpm 11.28.9, dependency availability, and local Chromium/server prerequisites using `package.json`, `apps/web/package.json`, `apps/web/playwright.config.ts`, and `specs/006-notifications-navigation/quickstart.md`; install pinned dependencies/browser only if missing and record baseline check failures without changing toolchain versions.

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Confirm scope and authorization before product edits; no new database or API foundation is required.

- [ ] T002 Record the user's explicit implementation and PR request in `specs/006-notifications-navigation/plan.md`, reuse branch `codex/notifications-navigation`, and verify the existing channel toolbar role gate in `apps/web/app/pages/notifications/index.vue` and history guard in `apps/web/app/pages/notifications/history.vue`; track this bounded request in the PR because no matching active issue exists. Do not create a new issue or merge/deploy.

**Checkpoint**: The user explicitly authorized implementation and PR creation; no new issue is required for this request.

## Phase 3: User Story 1 - Open Notification Channels Directly (Priority: P1, MVP)

**Goal**: One localized Notifications link opens channels across navigation surfaces, with no notification submenu.

**Independent Test**: From another page, select Notifications once to reach `/notifications`; verify one destination in
expanded, collapsed, mobile, search, and command-palette presentations in English and German.

- [ ] T003 [US1] Extend `apps/web/tests/e2e/notifications.spec.ts`, `apps/web/tests/e2e/page-layout.spec.ts`, and `apps/web/tests/e2e/dashboard.spec.ts` to expect one keyboard-operable Notifications link rather than the expanded group/Channels child; cover English/German accessible labels, expanded/collapsed/mobile navigation, mobile dismissal, global search/command palette without Channels or history destinations, and active state on channels and history. Confirm the new assertions fail against the old navigation, then replace the notifications array/group with one `AppNavigationItem` in `apps/web/app/composables/app/navigation-items.ts`: `layout.notifications`, `i-lucide-bell`, `/notifications`, and prefix-aware active matching. Reuse it once in `navigationItems` through `toMenuItem` and once in `navigationSearchItems`; `children`, `type: trigger`, and `defaultOpen` must be absent. Preserve attached comments and unrelated destinations; change existing sidebar history clicks to the toolbar so the suite remains runnable. Run the focused suites and include exactly one `repovio` patch Changeset in `.changeset/notifications-navigation-link.md` for this substantive increment if later committed.
- [ ] T004 [P] [US1] Update the Notifications menu description in `apps/website/content/en/docs/next/navigation.md` and `apps/website/content/de/docs/next/navigation.md` to describe the single link opening channels; remove Channels/history submenu instructions, retain both language versions, check cross-references, and leave released handbook archives unchanged.

**Checkpoint**: US1 can be demonstrated and tested independently. The separate bell-popover history shortcut is removed
by US2; delivering only US1 does not satisfy the full toolbar-only request.

## Phase 4: User Story 2 - Open Administrative Delivery History from the Toolbar (Priority: P2)

**Goal**: Preserve administrative history through the channel toolbar and existing direct URLs; remove its bell shortcut.

**Independent Test**: As System Administrator, follow the toolbar history link, inspect delivery details, and return through
the Notifications breadcrumb. Verify Viewer and Manager denial and the absence of the bell history shortcut.

- [ ] T005 [US2] Extend `apps/web/tests/e2e/notifications.spec.ts` with failing assertions for no administrative history link in the navbar bell popover and retained personal recent notifications, error/retry/empty states, and browser-push controls; remove only the administrative Delivery history `UButton` from `apps/web/app/components/modules/notifications/navbar-popover.vue`, removing imports/store bindings only if now unused. Keep the existing toolbar button in `apps/web/app/pages/notifications/index.vue` and admin middleware in `apps/web/app/pages/notifications/history.vue`. Cover administrator toolbar navigation, delivery details, breadcrumb return, direct bookmark/refresh, browser back/forward, active Notifications styling, channel empty/error states, and Viewer/Manager toolbar absence plus direct-route denial in both locales. Run the focused notification suite; include exactly one `repovio` patch Changeset in `.changeset/notifications-toolbar-history.md` for this substantive increment if later committed.
- [ ] T006 [P] [US2] Update `apps/website/content/en/docs/next/navigation.md` and `apps/website/content/de/docs/next/navigation.md` to describe administrative Delivery history access solely through the channel toolbar, remove the bell-popover history-link instructions, and retain the distinction between personal recent notifications and administrative history; verify links and preserve released archives.

**Checkpoint**: Both stories meet the UI contract. History URLs and existing authorization remain intact; no provider,
backend, persistence, or notification delivery changes are needed.

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Verify the complete feature and record actual evidence without expanding scope.

- [ ] T007 Run canonical formatting twice to prove byte stability for changed files, then `corepack pnpm format:check`, `corepack pnpm documentation:check`, and `corepack pnpm --dir apps/web lint` using the commands in `docs/coding-guidelines.md`; inspect changes in `apps/web/app/composables/app/navigation-items.ts` and `apps/web/app/components/modules/notifications/navbar-popover.vue`, fix introduced failures, and record preexisting failures separately in `specs/006-notifications-navigation/quickstart.md`.
- [ ] T008 [P] Run `corepack pnpm --dir apps/web typecheck` and `corepack pnpm --dir apps/web test` from the repository root against `apps/web/package.json`; fix feature regressions without relaxing rules and record command results and limitations in `specs/006-notifications-navigation/quickstart.md` after concurrent checks finish.
- [ ] T009 Run `graphify update .` after source edits; inspect node/edge summaries and a Notifications navigation query for `graphify-out/graph.json`, keep the graph with its source changes in any later authorized commit, and leave Graphify runtime metadata/reports untracked.
- [ ] T010 Execute the full matrix in `specs/006-notifications-navigation/quickstart.md`, including `apps/web/tests/e2e/notifications.spec.ts`, `apps/web/tests/e2e/page-layout.spec.ts`, and `apps/web/tests/e2e/dashboard.spec.ts`; visually inspect or capture both locales at expanded/collapsed desktop and mobile sizes, check keyboard activation, clipping, missing expansion affordances, toolbar-only discovery, and all role gates. Record browser evidence and check outcomes in the quickstart, run `git diff --check`, review all scoped diffs and Changesets, and mark only verified tasks complete in `specs/006-notifications-navigation/tasks.md`. Report unverified remote CI/provider/Docker behavior honestly; do not commit, push, deploy, or merge without the applicable authorization.

## Dependencies & Execution Order

```text
T001
  T002
    US1: T003 + T004
      US2: T005 + T006
        T007 + T008
          T009
            T010
```

- T001 precedes T002; T002 blocks every product edit.
- US1 has no implementation dependency on US2 and is the suggested MVP.
- US2 is independently testable as a toolbar/popover change, but follows US1 for delivery because both stories edit
  `notifications.spec.ts`, both documentation tasks edit the same handbook files, and active-link assertions need US1.
- T003 and T004 may run together after T002. T005 and T006 may run together after US1.
- T007 and T008 may run checks concurrently against a stable source snapshot; serialize fixes and evidence-file writes.
- T009 follows all source fixes. If T010 discovers a source regression, repeat affected checks and refresh the graph.
- No task is complete merely because files exist; its stated behavior and validation must pass.

## Parallel Example: User Story 1

```text
T003: Shared navigation and browser regression files.
T004: English/German handbook navigation descriptions.
```

These file sets are disjoint. Both wait for setup, issue association, and implementation approval.

## Parallel Example: User Story 2

```text
T005: Navbar popover and notification browser regressions.
T006: English/German handbook history-access descriptions.
```

These file sets are disjoint. Do not overlap T006 with T004 or T005 with T003.

## Implementation Strategy

### MVP First

Complete setup and the authorization prerequisite, then US1 with its tests and current documentation. Validate the single
Notifications destination independently. US1 is an intermediate increment, not completion of the entire user request.

### Incremental Delivery

Complete US2 next, then cross-cutting checks and browser acceptance. Reuse existing routes, labels, role guards, and tests;
no new entities, endpoints, dependencies, or generic navigation abstractions are needed. Keep channel operations and
personal recent notifications working throughout.

### Commit Boundaries

The user has now requested implementation and PR creation, including the commits and pushes necessary for that PR.
keep each completed implementation task independently reviewable with its tests, related documentation, and validation;
include exactly one focused `repovio` Changeset per substantive implementation commit. Do not fabricate release metadata
for setup or validation-only tasks. Refresh the graph after source edits and follow repository staging/push rules only
when a commit is explicitly requested. Preserve user-controlled release PRs.

## Requirement Coverage

| Requirement                                          | Tasks                        |
| ---------------------------------------------------- | ---------------------------- |
| FR-001, FR-002: one direct link, no submenu          | T003, T004, T010             |
| FR-003: one navigation-search destination            | T003, T010                   |
| FR-004: toolbar-only administrative history          | T003, T005, T006, T010       |
| FR-005: bookmarks and administrator guards           | T002, T005, T010             |
| FR-006: active Notifications across routes           | T003, T005, T010             |
| FR-007: localized accessible navigation surfaces     | T003, T004, T005, T006, T010 |
| FR-008: unchanged channel/delivery/personal behavior | T003, T005, T008, T010       |

## Completion Summary

10 tasks total: 2 shared prerequisites, 2 US1 tasks, 2 US2 tasks, and 4 cross-cutting tasks. Parallel opportunities:
T003/T004, T005/T006, and read-only checks T007/T008. Suggested MVP: US1 after prerequisites. Implementation and PR creation are now authorized; no new issue, merge, or deployment is authorized.
