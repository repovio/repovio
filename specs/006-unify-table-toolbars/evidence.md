# Toolbar Implementation Evidence

## Setup (T001)

- Existing Codex worktree reused; clean at entry.
- Planning PR #80 merged. Implementation branch follows the requested GitHub issue naming convention.
- Node.js 26.13.0, Corepack pnpm 11.28.9; frozen installation completed without manifest or lockfile changes.
- Chromium available; isolated Nuxt dev server uses port 3109 and deterministic E2E API fixtures.
- All 16 specification-quality checklist items passed; no extension hooks configured.

## Baseline (T002)

- Public `QTableFiltering` header/trigger slots verified in the installed dependency; default items/add stay intact.
- Reuse existing `querrykit.table.filtering` keys for title, mode, and Clear; no translation keys required.
- Existing label AND, path equality, and inclusive UTC date predicate construction will remain unchanged.

- Baseline suites ran against unchanged product code; layout and list fixtures cover existing query behavior.
- Initial web unit suite: 24 files, 106 tests passed. Typecheck, documentation, and guideline regressions passed.
- T003 red proof: the new assertion expected zero Labels buttons in the header; baseline rendered one.

- Full baseline: 27/30 passed. Two initial cold-start cases did not render within 5 seconds; the German 320px
  matrix hit a transient detached control. These occurred before product edits and will be rechecked on the warm server.

## Work items (T003)

- All four work-item browser scenarios passed, including new moved-control, multi-label/date, active-state,
  Clear, close/reopen, and keyboard focus assertions.
- Existing request predicate construction and debounce are unchanged; the wrapper reuses existing translated keys.

- T003 web lint/typecheck and documentation passed. Wrapped-filter refresh-loading test and both shortcut/focus
  regressions passed. Escape is exercised from a popover button after native date input interaction settles.

- T003 committed and pushed as `d0dd89d`.

## Security alerts (T004)

- Red proof: CODE path control was absent from the filtering dialog before integration.
- Security alerts and Repository detail browser suites: 10 passed, including all three alert kinds and exact
  UTC/path predicates, retained search after Clear, active state, and close/reopen focus.
- Mandatory kind and Repository constraints and supporting-request refresh ownership remain unchanged.

- T004 web lint/typecheck and documentation passed; committed and pushed as `5cc61f1`.

## User groups (T005)

- Red proof: New group was absent from the breadcrumb header before moving frame ownership.
- Route retains its admin middleware, full-width metadata, and localized title. The table owns one frame,
  its existing state, and its existing dialogs; no Teleport or duplicate state.
- Web lint and typecheck passed. EN/DE workflows now also assert merged-header search/sort request serialization.

- T005 EN/DE browser workflows passed (2/2); committed and pushed as `4febab0`.

## Responsive and keyboard acceptance (T006)

- Targeted matrix: 10/10 browser cases passed (six locale/viewport matrix cases, three embedded scope cases,
  one combined-filter Clear/refresh-loading case).
- All six marked routes exercised at 390 × 844, 1065 × 1134, and 1440 × 900, in English/German and Light/Dark.
  Screenshots are generated under `apps/web/test-results/page-layout-matches-the-six-marked-toolbars-*`.
- Inspected mobile Issues/filtering and desktop Issues, CODE filtering, and User groups, including German groups.
  No clipped controls or page-level overflow. Added existing localized visible date-boundary labels after visual review.
- Verified Shift+F, Escape/focus return, both generic and specialized Clear, and retained search. Embedded Issue,
  Pull Request, and CODE filters cannot select Repository/Provider and preserve mandatory constraints after Clear.
- Web lint/typecheck and documentation passed after the label change. No new translation keys or dependencies.
