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
