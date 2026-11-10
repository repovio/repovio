# Validation Guide: Repository Settings Navigation and Dialog Removal

## Prerequisites

Use Node.js 26.13.0 and Corepack pnpm 11.28.9. Install workspace dependencies with the pinned toolchain if missing.
Planning-only changes require document checks; run the application checks below after approved implementation.
No production Provider credentials are needed: browser suites use synthetic API fixtures.

See [contracts/ui.md](contracts/ui.md) for destinations and [data-model.md](data-model.md) for visit-state lifetime.

## Planning artifact validation

- Confirm specification requirements map to plan behavior and contract scenarios, with no unresolved placeholders.
- Check feature links, Markdown formatting, and `git diff --check`.
- Confirm `tasks.md` follows the accepted design and no application sources changed during planning/task generation.

## Planning evidence (2026-11-10)

- Eight Markdown artifacts: structure, checklist format/IDs, requirement coverage, local links, and whitespace passed.
- Scoped canonical formatting and a second stable pass passed using the identical formatter/configuration from the
  dependency-installed main checkout. No application dependency or tracked configuration changes were needed.
- No application tests, live Provider behavior, Docker, or remote CI were verified during planning.

## Application checks after implementation

From the repository root:

```sh
corepack pnpm --dir apps/web dev
```

With the web app running, in another terminal:

```sh
corepack pnpm --dir apps/web e2e tests/e2e/repository-settings.spec.ts tests/e2e/repository-filter-layout.spec.ts tests/e2e/repository-member-layout.spec.ts tests/e2e/repository-group-layout.spec.ts tests/e2e/user-groups.spec.ts tests/e2e/repository-navigation.spec.ts tests/e2e/repository-detail.spec.ts tests/e2e/repository-access.spec.ts tests/e2e/repository-deletion.spec.ts tests/e2e/repository-visual.spec.ts tests/e2e/table-row-navigation.spec.ts tests/e2e/global-search.spec.ts tests/e2e/command-palette.spec.ts tests/e2e/admin-tables.spec.ts tests/e2e/page-layout.spec.ts
corepack pnpm --dir apps/web test
corepack pnpm --dir apps/web lint
corepack pnpm --dir apps/web typecheck
corepack pnpm --dir apps/web build
corepack pnpm format:check
corepack pnpm documentation:check
corepack pnpm test:guidelines
git diff --check
```

Start with focused test-name filters for each changed behavior, then run the listed affected suites. If implementation
adds a new focused test file, include it in this command before marking acceptance complete.

## Browser acceptance scenarios

1. As Viewer, Manager, and System Administrator, activate Repository names, rows, explicit actions, and search results.
   Expect contract destinations and zero Repository details dialogs; embedded controls activate once.
2. Open a legacy scalar query URL; expect replace navigation and preserved unrelated query/fragment state. Test empty,
   repeated, inaccessible, and missing IDs plus legacy administrator paths and existing Settings anchors.
3. As administrator, open all five Settings tabs. Reload and use Back/Forward. Test missing, explicit General, unknown,
   empty, and repeated `tab` values. Exactly one tab/panel remains active.
4. Enter unsaved filter/member/group form values and a synthetic webhook secret. Switch tabs and return; expect retained
   input. Hold a mutation response across a switch; expect no duplicate request and pending/result state on return.
   Leave Settings or change Repository; expect no stale values or cross-Repository response display.
5. Exercise retention, webhook save/rotation/removal, filter add/remove, membership and group grants, metadata refresh,
   sync queuing, and local deletion. Preserve validation, cancellation, errors, retry behavior, and complete loading state.
6. Return to the list after configuration changes; expect current metadata and webhook badges. Verify deletion returns to
   a valid list without a second successful deletion. Migrate obsolete modal-only callback tests to shared-action tests
   where needed rather than adding list-refresh responsibilities to detail-page deletion.
7. As Viewer/Manager, directly visit each Settings query. Expect the existing guard and no administration-data leakage.
8. Capture English/German, light/dark evidence at 390, 1102, and 1440 pixels. Verify Alerts/Warnungen, all five secondary
   tabs, visible field labels, unclipped primary actions, long names/patterns, empty/populated/error states, and keyboard
   focus. Tables/navigation may scroll inside their containers; document-level horizontal overflow is a failure.

## Evidence and limits

Record executed checks and screenshot locations. Mocked browser tests do not establish live Provider behavior or remote
CI status. Production deployment and Provider writes are outside this feature.

## Implementation evidence

- T001: frozen offline dependency install passed on Node.js 26.13.0 / pnpm 11.28.9 without manifest or lockfile changes.
  A temporary PATH shim keeps nested package scripts on the pinned Corepack pnpm; no repository toolchain edits.
- T002: parent child keys preserve ordinary query changes; administrator guard and list-state initialization confirmed.
  Baseline: 129 web unit tests passed; initial browser cold-start failures passed unchanged on immediate focused rerun.
- T003: canonical/legacy entry tests passed for all three roles; search and command-palette navigation passed;
  migrated retention/filter/membership, webhook rotation/removal, refresh, sync, and deletion tests passed.
  Existing multi-repository-add selection failure is outside the removed details dialog; investigate against base.

- T004: eight Settings browser scenarios passed, covering five tabs, URL normalization/history, lazy requests, role
  guards, drafts/pending requests, and memory-only synthetic webhook draft disposal. Existing administration, webhook,
  and user-discovery regressions passed after selecting the proper section. Web lint/typecheck and 129 unit tests passed.
  Existing app locale parity requires new labels in all 17 supported catalogs; this preserves rather than expands locales.

- T005: 12 language/theme/viewport browser scenarios passed (390/1102/1440 px), visiting all five Settings sections via
  keyboard and capturing their layouts. Screenshot review confirms full-width retention inputs and no duplicate Settings
  identity; Overview retains its existing card header. Four Repository detail/retention/access scenarios passed.
  Existing translated Alerts labels and action/field keys are reused; no new label keys are needed for T006-T008.

- T006: 12 populated long-pattern layout cases passed in both locales/themes and all three widths. Focused regression
  verifies empty-pattern validation, failed create, full-lifetime pending state, successful create, cancellation, and
  confirmed removal. Invalid-field recovery waits for real validation completion. Web lint/typecheck passed.

- T007: 13 focused member cases passed: 12 locale/theme/width layouts with long identities, plus actual remote search,
  pagination, failed assignment, held successful assignment/role change, cancellation, and confirmed removal. Invisible
  native select bridge inputs are excluded from visible-control geometry checks. Screenshot reviewed at 1102 px.
  Existing seven role/access/lazy-metadata/user-discovery scenarios passed; web typecheck passed.

- T008: 13 group-access cases passed: 12 long-name viewport/locale/theme layouts, plus search/pagination, assignment
  failure, loading through dependent refresh, role updates, cancellation, and confirmed grant removal. Visible picker
  labels are opt-in; existing consumers retain their previous presentation. Web lint/typecheck and documentation passed.

- Baseline isolation: the unchanged multi-repository-add test also fails with the pre-feature Repository list and
  details dialog temporarily restored from planning commit `5adb18d`. Current implementation files were restored
  exactly afterward. Failure: `Selected: 2` never appears after selecting two discovered repositories. Evidence:
  `/tmp/repovio88-baseline-add/`. This pre-existing add-wizard failure is outside #88's detail/Settings scope.
- T008 existing group-administration regression: both English and German complete workflows passed after migrating
  their direct Settings address to `?tab=groups`; opt-in picker labels did not change other picker consumers.

- T009: current Repositories/Settings handbook pages reconciled in all 13 documentation locales, with en-US canonical
  guidance and preserved localized references/technical identifiers. Published archives were not changed. Handbook
  validation and 11 documentation tests passed; final website build passed. Root canonical formatting, declaration
  documentation, and 21 guideline regression tests passed. Web production build also passed.

- T010 follow-up: migrated the remaining embedded-action keyboard test from modal dismissal to Settings link/history
  semantics. Search acceptance now supplies complete Repository detail fixtures and checks the visible Synchronization
  card; all three focused follow-up scenarios passed against the production build. Retention label rows receive a shared
  minimum height on the three-column desktop layout so wrapped labels keep inputs aligned.

## Final acceptance (2026-11-10)

Validated runtime revision: `2768178f8d734ebad2b459b173771a27d30544ff`, including current main
`c666f9a9f5ae0665a47019af312987bb301949ec` through a non-rewriting merge. Later evidence-only changes do not modify runtime
code. Task implementation commits: T003 `9c39b11`, T004 `44960bf`, T005 `fd5e5a6`, T006 `4843982`, T007 `92a2070`,
T008 `132353a`, T009 `3e82441`; T010 scoped validation fixes `d9f2e16`; T011 breadcrumb correction `2768178`.

- Production-build Chromium run: 158 passed, 1 failed, 0 skipped, 0 flaky across 159 affected scenarios. The only failure
  is the unchanged multi-repository enrollment scenario described above and reproduced with pre-feature list/dialog
  sources. All #88 feature scenarios pass. No tests were disabled or assertions relaxed to hide that baseline failure.
- All 12 viewport/locale/theme combinations passed for full Settings navigation, long Workflow Filter patterns, long
  member identities, and long group names. Keyboard actions, direct links/history, role guards, draft lifetime, pending
  mutations, and cancellation/retry paths passed. Synthetic screenshots were inspected.
- Merged-base web unit tests: 26 files / 141 tests passed. Web lint/typecheck and merged production build passed.
- Root lint (five Nx targets), canonical formatting, declaration documentation, and 21 guideline regressions passed.
  Current handbook validation, 11 handbook tests, and website production build passed. Published archives are unchanged.
- The final graph has no nodes sourced from the removed dialog, and no current-worktree absolute paths. All 17 merged
  application locale catalogs parse and retain the new labels. The feature diff contains no API, schema, dependency,
  lockfile, workflow, or production configuration changes.
- Local reports: `/tmp/repovio88-accepted-e2e.json`, `/tmp/repovio88-accepted-e2e.log`, and
  `/tmp/repovio88-accepted-e2e/`. The run used the built SPA at `http://127.0.0.1:3102` with synthetic API fixtures.
- API persistence/live Provider behavior, Docker deployment, and remote Actions are not established by mocked browser
  checks. No deployment occurred. Remote CI status must be checked for the final PR head; merge still needs approval.

The independently reproduced pre-existing add-wizard failure remains an explicit broader-suite limitation rather than
a passing full suite. T011 corrected the long-breadcrumb/action overlap found at 1102 px during screenshot review;
the final production run includes its geometry assertions and completes T010 acceptance for the approved feature scope.

- T011: geometry regression reproduced long-breadcrumb/action overlap at 1102 px before the fix. Bounding only the
  Repository breadcrumb label through the existing item class contract resolved it; all 12 viewport/locale/theme cases
  pass with exactly one active primary section and nonoverlapping action bounds. Full accessible identity is retained.
  Web lint/typecheck, declaration documentation, stable formatting, and screenshot review passed.
