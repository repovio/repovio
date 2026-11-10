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

- T006 committed and pushed as `8910dc8`.

## Final verification (T007, 2026-11-10)

- All seven tasks completed. Changeset-bearing implementation commits: `d0dd89d`, `5cc61f1`, `4febab0`, `8910dc8`.
- Targeted acceptance: 10 passed. Expanded six-suite run excluding those already-tested cases: 39 passed, 2 failed.
  Thus 49 browser cases passed; the two failures below were reproduced on an isolated unchanged base archive.
- Web Vitest: 24 files, 106 tests passed. All shipped locales retain complete keys; moved labels reuse existing keys.
- Full repository lint (including documentation and guideline regressions) passed. Web lint/typecheck passed after
  the final visible-label change. Canonical formatting is stable across two passes; whitespace checks passed.
- Graphify AST update and pre-commit rebuilds passed. Existing optional `tree_sitter_sql` extraction warning remains.
- Testing used isolated Nuxt servers and synthetic API fixtures. It does not verify live provider data, real backend
  authorization/persistence, Docker, or production deployment; none were changed or executed.

### Requirement coverage

| Requirements                   | Evidence                                                                                             |
| ------------------------------ | ---------------------------------------------------------------------------------------------------- |
| FR-001, SC-001                 | Five compact monitoring headers in the six-route screenshot matrix                                   |
| FR-002, SC-003                 | Work-item all-label/date and all three alert-kind path/date request assertions                       |
| FR-003                         | Specialized-only active indication, close/reopen, combined Clear, retained search                    |
| FR-004, SC-002                 | EN/DE group workflows and exactly one header with bound search/sorting/New group                     |
| FR-005                         | Existing group actions, list empty/error/warning states, sorting/options/pagination, delayed refresh |
| FR-006, FR-007, SC-004, SC-005 | Three requested viewports, EN/DE, Light/Dark, Shift+F and Escape/focus assertions                    |
| FR-008                         | Embedded Issue/Pull Request/CODE cases preserve Repository and kind constraints after Clear          |
| FR-009                         | Diff contains frontend, focused tests, planning evidence, Changesets, and generated graph only       |

### Reproduced baseline failures

The unchanged base `5f568b0` was extracted into a temporary independent source tree with its own Nuxt server on
port 3110. Targeted runs reproduced both failures; no unrelated product code or assertions were changed.

1. `repository-navigation.spec.ts`: “viewer browses assigned repositories without administration actions” expects
   the brand link's text to equal `Repovio`; the existing image wordmark gives it empty text. The accessible name remains
   `Repovio`. The warm baseline run reproduced this exact mismatch.
2. `repository-navigation.spec.ts`: “administrator configures a webhook for one repository” expects “Not configured”
   inside the dialog after removing configuration. The unchanged baseline also fails that assertion.

### Reproduction commands

```sh
PLAYWRIGHT_BASE_URL=http://localhost:3109 corepack pnpm --dir apps/web e2e tests/e2e/page-layout.spec.ts tests/e2e/repository-navigation.spec.ts --grep 'six marked|embedded .* filtering|operates wrapped' --workers=2
PLAYWRIGHT_BASE_URL=http://localhost:3109 corepack pnpm --dir apps/web e2e tests/e2e/work-items.spec.ts tests/e2e/security-alerts.spec.ts tests/e2e/user-groups.spec.ts tests/e2e/page-layout.spec.ts tests/e2e/repository-detail.spec.ts tests/e2e/repository-navigation.spec.ts --grep-invert 'six marked|embedded .* filtering|operates wrapped' --workers=2
corepack pnpm --dir apps/web test
corepack pnpm --dir apps/web typecheck
corepack pnpm lint
corepack pnpm format:check
git diff --check
```

A temporary Corepack shim ensured nested package scripts used pnpm 11.28.9; manifests and lockfile were preserved.
Screenshots and local logs are untracked execution artifacts. Remote PR CI is reported separately after PR creation.
