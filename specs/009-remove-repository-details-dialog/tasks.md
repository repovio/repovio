# Tasks: Repository Settings Navigation and Dialog Removal

**Input**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md),
[UI contract](contracts/ui.md), and [quickstart.md](quickstart.md).

**Authorization**: Task generation and issue/planning-commit creation approved on 2026-11-10. Scope belongs to
[#88](https://github.com/repovio/repovio/issues/88), branch `codex/88-repository-settings-navigation`. Product implementation
was separately approved on 2026-11-10; merge remains gated.

**Tests**: Required by the specification and constitution. Each behavior task includes its focused tests and evidence;
write/update the relevant regressions before its implementation, then make the complete increment green before commit.
Never commit intentionally failing test-only increments.

## Format and delivery rules

- Task paths are repository-relative. `[P]` means disjoint files and no dependency on an unfinished sibling task.
- Every substantive implementation task forms its own verified commit with exactly one focused `repovio` patch Changeset
  in `.changeset/` and its refreshed `graphify-out/graph.json`. Push each authorized commit; do not combine tasks.
- T001, T002, and T010 are verification-focused tasks and do not require empty commits or fabricated Changesets.
  Evidence/status-only updates follow planning-metadata policy; source fixes require their own substantive commits.
- Inspect status and scoped diffs before every edit, test, and commit. Preserve unrelated work. Use Node.js 26.13.0 and
  Corepack pnpm 11.28.9. Preserve pinned dependencies, compiler aliases, typed API contracts, and Provider read-only access.
- Follow project documentation, Vue block/attribute order, and localization rules. Use relevant `vue-feature-check`
  acceptance evidence for UI work. Add no database/API/provider/toolchain changes.
- Commit/staging remains sequential even when independent implementation work can be prepared in parallel. Graphify
  outputs must never be edited concurrently; update and review them during each task's serial verification/commit step.

## Phase 1: Setup

**Purpose**: Confirm the already-selected checkout and toolchain before approved implementation.

- [x] T001 Verify the existing issue worktree/branch, active feature selection in `.specify/feature.json`, issue/branch and
      approvals, clean scope, Node.js 26.13.0, and pnpm 11.28.9 against `package.json`; install frozen workspace dependencies
      if missing after implementation approval, without changing `pnpm-lock.yaml`. Record baseline availability and existing
      failures in `specs/009-remove-repository-details-dialog/quickstart.md` when evidence is collected.

## Phase 2: Foundational prerequisites

**Purpose**: Validate integration assumptions; no new framework, schema, fixture platform, or API is needed.

- [x] T002 Confirm the existing Repository parent key, administrator guard, route middleware, and reusable fixture in
      `apps/web/app/pages/repositories/[id].vue`, `apps/web/app/pages/repositories/[id]/settings.vue`,
      `apps/web/app/middleware/repository-paths.global.ts`, and `apps/web/tests/e2e/fixtures/repository-detail.ts` support the
      contract in `specs/009-remove-repository-details-dialog/contracts/ui.md`; record focused baseline test results before
      edits. Validate that tab-only query changes will not remount Settings and preserve current list-state ownership.

**Checkpoint**: T001 and T002 pass; implementation may begin only with separate implementation approval.

## Phase 3: User Story 1 - Open canonical Repository pages (P1, MVP)

**Goal**: All Repository entry points reach full pages; existing administration remains reachable.

**Independent test**: Viewer/Manager/administrator list and search journeys, legacy URLs, reload and browser history;
zero Repository details modals, unchanged embedded actions and access restrictions.

- [x] T003 [US1] Remove `apps/web/app/components/modules/repositories/details-dialog.vue` and modal-only state/handlers
      from `apps/web/app/pages/repositories/index.vue`; retain add dialog, list webhook badges and refresh initialization,
      enable/disable, and explicit role-aware real links. Point Repository search results in
      `apps/web/app/components/layout/command-palette.vue` directly to Overview. Extend
      `apps/web/app/middleware/repository-paths.global.ts` for replace redirects of nonempty scalar `repository` values,
      encoded IDs, removal of only that parameter, preserved unrelated query/hash state, and no redirect for empty/repeated
      values. Preserve legacy administrator routes and Settings anchors. Update existing tests in
      `apps/web/tests/e2e/repository-navigation.spec.ts`, `global-search.spec.ts`, `command-palette.spec.ts`,
      `repository-deletion.spec.ts`, `admin-tables.spec.ts`, and `page-layout.spec.ts` to canonical page workflows. Retain all
      existing configuration/refresh/sync/deletion assertions; relocate modal-only callback-retry coverage to focused shared
      action coverage rather than changing page deletion behavior. Verify Back/Forward, missing/denied IDs, keyboard links,
      no extra row navigation, metadata/badge refresh on list return, and no duplicate successful deletion. Run the affected
      suites and web lint/typecheck before this task's commit and Changeset.

**Checkpoint**: US1 works without the dialog while Settings retains its existing pre-tab composition.

## Phase 4: User Story 2 - Navigate focused Settings sections (P1)

**Goal**: Five shareable full-width Settings sections with retained current-visit drafts and request state.

**Independent test**: Visit each tab, reload and traverse history; switch with unsaved input/pending requests; leave
Settings/change Repository; directly visit tabs as Viewer/Manager.

- [x] T004 [US2] Add secondary navigation and lazy retained panels in
      `apps/web/app/components/modules/repositories/details/settings-page.vue`; extract Webhook loading into a focused
      `apps/web/app/components/modules/repositories/details/settings-webhook-panel.vue` so it runs only on first Webhook
      visit. Keep the existing Settings route/administrator guard. Implement section values
      `general | webhook | workflow-filters | members | groups`; missing selects General; unknown, empty, or repeated values
      replace the same route without `tab`, preserving unrelated query/hash state. General links omit `tab`; other links
      push history. Lazy-mount each visited panel once, hide inactive panels from focus and assistive technology, retain
      drafts/errors/pending requests, and dispose all visit state including generated secrets on exit/Repository change.
      Keep secrets memory-only, never in URLs/storage/logs/snapshots, and suppress stale completions. Remove the two-column
      grid; show only one full-width panel. Add tab/navigation labels in `apps/web/i18n/locales/en.json` and `de.json`.
      Add `apps/web/tests/e2e/repository-settings.spec.ts` using the existing fixture; cover normalization, history/reload,
      active links, hidden-panel accessibility, first-visit-only requests, drafts, pending mutation completion without
      resubmission, cross-Repository disposal, and denied roles without administration-data requests. Adjust existing
      `apps/web/tests/e2e/admin-tables.spec.ts`, `repository-navigation.spec.ts`, and `repository-detail.spec.ts` section
      selectors to the new tabs. Verify all five configuration operations remain reachable before committing this task.

**Checkpoint**: US1 and US2 pass; full-width section layout is available for form presentation work.

## Phase 5: User Story 3 - Use readable configuration controls (P1)

**Goal**: Short Alerts label, consistent Settings presentation, unclipped full-width configuration forms.

**Independent test**: English/German, light/dark, 390/1102/1440 px; keyboard focus, long input/labels, empty/populated
and error/pending states. Navigation/tables may scroll within their containers; document-level overflow fails.

- [x] T005 [US3] Shorten only the Repository navigation label to Alerts/Warnungen in
      `apps/web/app/components/modules/repositories/details/page-shell.vue`, preserving `/security-alerts`, category labels,
      domain terms, and Manager/administrator restrictions. Add an explicit header-presentation option in
      `apps/web/app/components/modules/repositories/details/general-card.vue` and apply it in `settings-page.vue` to avoid
      duplicate Repository identity/descriptions while preserving Overview defaults. Prepare all localized visible form
      labels and text-plus-icon action labels needed by T006-T008 in `apps/web/i18n/locales/en.json` and `de.json` before
      those tasks start, reusing current keys when meanings match. Update
      `apps/web/tests/e2e/repository-visual.spec.ts` and `repository-settings.spec.ts` for primary/secondary navigation,
      General presentation, retention behavior, focus, and existing permissions. Verify desktop/mobile theme/locale evidence.
- [x] T006 [P] [US3] Improve `apps/web/app/components/modules/repositories/details/workflow-filters-card.vue`: visible
      labels, flexible `min-w-0` pattern field, full-width controls, aligned text-plus-icon add action on wide screens,
      stacked fields/actions below the existing medium breakpoint, consistent spacing, and contained table overflow with
      pinned actions. Retain validation, allow/deny semantics, loading/errors, and confirmations. Add focused
      `apps/web/tests/e2e/repository-filter-layout.spec.ts` using the unchanged shared fixture to verify add/remove,
      validation, pending/error states, long patterns, empty/populated rows, and unclipped controls at all target sizes.
- [x] T007 [P] [US3] Improve `apps/web/app/components/modules/repositories/details/members-card.vue`: visible labels,
      flexible user selection, full-width role control, stacked narrow layout and aligned wide layout, labeled primary add
      action, and contained table overflow with pinned actions. Preserve user search/pagination, avatars, role validation,
      pending role/remove controls, and confirmation behavior. Add focused
      `apps/web/tests/e2e/repository-member-layout.spec.ts` using the unchanged fixture for long user names, add/update/remove,
      search/pagination, errors/pending states, empty/populated rows, keyboard operation, and target viewport coverage.
- [x] T008 [P] [US3] Improve `apps/web/app/components/modules/repositories/details/groups-card.vue`: consistent visible
      search/group/role labels, search and pagination spacing, flexible full-width fields, stacked narrow layout and aligned
      wide assignment actions. Preserve additive grants, role restrictions, request states, and confirmations. Add focused
      `apps/web/tests/e2e/repository-group-layout.spec.ts` using the unchanged fixture for long group names, search/pagination,
      assignment/role/removal, errors/pending states, empty/populated data, keyboard access, and target viewport coverage.

**Checkpoint**: All UI changes preserve existing operations, clear controls, and role restrictions; no document overflow.

## Phase 6: Polish and cross-cutting verification

- [ ] T009 Update current documentation in `apps/website/content/en/docs/next/repositories.md` and
      `apps/website/content/en/docs/next/settings.md` for canonical entry points, legacy links, five Settings tabs, short Alerts
      navigation, and current-visit draft lifetime; reconcile corresponding existing `docs/next/repositories.md` and
      `docs/next/settings.md` pages in the other supported handbook locale directories and
      `apps/website/content/COVERAGE.md` without changing published archives. Use en-US for authored guides under this
      session's writing preference; preserve existing translated content outside the changed sections. Update
      `specs/009-remove-repository-details-dialog/quickstart.md` with exact new focused test commands. Validate references,
      handbook structure/build, and formatting. Include this substantive task's focused Changeset and graph policy checks.
- [ ] T010 Execute the complete acceptance guide in `specs/009-remove-repository-details-dialog/quickstart.md`, including
      the new `repository-settings.spec.ts`, `repository-filter-layout.spec.ts`, `repository-member-layout.spec.ts`, and
      `repository-group-layout.spec.ts` under `apps/web/tests/e2e/`; affected web tests/lint/typecheck/build, canonical
      formatting/documentation/guideline checks, and `git diff --check`. Check format stability across two complete passes.
      Review residual dialog consumers, locales, Settings request isolation, current metadata on list return, and shared
      delete confirmation. Record results and browser evidence for the 12 viewport/locale/theme combinations plus operation
      states in `specs/009-remove-repository-details-dialog/quickstart.md`. Disclose unverified live Provider/Docker/remote CI
      behavior; no deployment or merge is authorized by this task. Any required fixes are scoped follow-up implementation
      commits with their own Changeset, followed by affected rechecks; do not mark this gate complete until evidence passes.

## Dependencies and execution order

```text
T001 then T002 then T003 (US1/MVP) then T004 (US2) then T005 (US3 shared labels/presentation)
T006, T007, T008 after T005; independent source/test files
T009 after T003-T008; T010 after T009
```

All three stories are P1; execute in the order above. US1 delivers a working independently testable MVP. US2 depends on
US1's canonical entry points; US3 uses US2's full-width panels. No later feature or unrelated cleanup may be added.

## Parallel execution examples

- **US1**: Read-only review of list/legacy navigation and search/delete acceptance can run independently; T003 source
  mutation and its integrated test updates remain one serial verified task because removing the modal affects them all.
- **US2**: Review tab/history cases and draft/pending cases independently against `contracts/ui.md`; implement T004 as
  one coherent increment since both depend on the same Settings state and locale files.
- **US3**: After T005, T006/T007/T008 may prepare disjoint card and focused test changes in parallel. They must not edit
  shared fixtures, locales, graph output, or shared suites concurrently; T005 already supplies their labels. If shared
  file changes become necessary, serialize that work. Verification/staging/commits/graph refresh remain serial.

Parallel opportunities are optional; no additional agent execution is authorized by this task-generation document.

## Implementation strategy

1. Issue/planning-commit approval is recorded for #88; verify the pushed planning commit before implementation approval.
2. Obtain explicit implementation approval. Complete T001-T003 for canonical Repository navigation; verify MVP.
3. Complete T004 for URL-addressable Settings with preserved visit state; verify the five-section contract.
4. Complete T005-T008, preserving one substantive task per verified commit and one focused Changeset per commit.
5. Complete documentation and final evidence through T009-T010. Repair scoped failures rather than relaxing checks.
6. Open the normal feature PR after approved implementation and validation; ask separately about merge after current CI.

## Requirement coverage

| Requirements           | Tasks                                    |
| ---------------------- | ---------------------------------------- |
| FR-001, FR-002, FR-003 | T003, T010                               |
| FR-004, FR-005, FR-008 | T004, T010                               |
| FR-006                 | T005, T006, T007, T008, T010             |
| FR-007                 | T003, T004, T005, T006, T007, T008, T010 |
| FR-009                 | T005, T010                               |
| FR-010                 | T004, T005, T006, T007, T008, T010       |
| FR-011                 | T001, T002, T003, T004, T010             |

T009 documents all three stories. Every behavior task includes focused regression checks; T010 is the feature-wide
acceptance gate, not a substitute for earlier verification.
