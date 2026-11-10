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
corepack pnpm --dir apps/web e2e tests/e2e/repository-navigation.spec.ts tests/e2e/repository-detail.spec.ts tests/e2e/repository-access.spec.ts tests/e2e/repository-deletion.spec.ts tests/e2e/repository-visual.spec.ts tests/e2e/table-row-navigation.spec.ts tests/e2e/global-search.spec.ts tests/e2e/command-palette.spec.ts tests/e2e/admin-tables.spec.ts tests/e2e/page-layout.spec.ts
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
