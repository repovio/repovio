# Implementation Evidence: App Language Parity

## Authority and scope

Issue #84; branch `codex/84-app-language-parity`; existing worktree reused. Planning commit `7910243` is pushed.
Implementation and separate per-task commits/pushes approved on 2026-11-10. No merge, release, or deployment approval.

## T001: Baseline

- Feature context and all eight issue task IDs agree; requirements checklist 16/16 checked.
- Node.js 26.13.0, Corepack pnpm 11.28.9. Frozen-lockfile offline dependency installation succeeded without manifest changes.
- Locale/date-time baseline: two files, four tests passed before product edits.
- Existing global pnpm is 10.33.0; nested scripts need a temporary external `/tmp/repovio-84-bin/pnpm` Corepack shim.
  Repository versions and configuration remain unchanged.
- Existing git/Docker/formatter/linter ignores cover dependency, generated, environment, and browser output; no edits needed.

## T002: Locale metadata and UI foundation

- Failing-first locale regression demonstrated missing registry; final locale tests pass (three tests).
- Retained eight codes, native labels, GB/PT flags, cookie, route strategy, and English fallback.
- Added typed app metadata, explicit Nuxt UI mapping, and reactive document language/direction.
- Web unit suite: 24 files, 108 tests passed. Web lint, typecheck, production build, and repository documentation check passed.
- Production browser: six localization/auth cases passed across 390px/1440px and light/dark, with API fixtures.
- Existing delayed-load test timed out against production because it intercepts development-only `/de.json`; the same
  scenario passed on an isolated dev server. This test portability limitation will be addressed with T004/T006 coverage.
- German narrow auth screenshot inspected: labels, theme/language controls, local flag, and spacing readable without overflow.
- Canonical changed-file formatting stable over two passes. Fixture browser behavior does not establish live providers.

## Known environment diagnostics

- Nuxt emits its existing MODULE_TYPELESS_PACKAGE_JSON warning. No toolchain changes made for it.
- Graphify SQL parser is unavailable; SQL extraction remains incomplete and SQL sources are unchanged.

## T003: Complete website-language coverage

- Added nine complete catalogs: zh-CN, hi, ar, bn, pt-BR, id, ur, ru, ja. All 17 catalogs contain 1,029 messages each.
- Retained existing eight identifiers/names/flags and distinct pt/pt-BR options; added nine licensed local SVG flags.
- Corrected previously English prose in existing Spanish, French, Italian, Dutch, Polish, and Portuguese catalogs.
- Actual message compiler rendered every message, with exact key/parameter checks and English-fallback masking guards.
  Negative fixtures reject omitted website codes/catalog keys, empty leaves, wrong parameters, syntax, linked targets,
  direction/UI metadata, and flag assets. Valid linked/plural messages and technical literals remain accepted.
- Scoped translation workers and independent checks preserved structure/parameters. Portuguese dialect review found and
  corrected mechanical word corruption and regional vocabulary; existing non-English European Portuguese values retained.
- Representative auth, parameterized counts, manual-provider-setup prose, and recovery event labels reviewed for every
  added language. This is agent linguistic review, not a claim of native-speaker certification.
- Narrow Arabic/Hindi/Chinese auth renders inspected in browser; selected document language/direction correct.
- Web suite: 24 files, 114 tests passed. Web lint/typecheck/build and repository documentation checks passed.
- Source formatting stable over two passes; no dependency/schema/provider changes. Full browser/RTL matrix follows in
  T004/T005; preference/failure regression coverage follows in T006.

## T004: Every-language browser integration

- T003 committed/pushed as `54fc799`; all translation and metadata sources verified before continuing.
- Browser tests derive native labels/flags from the registry and scroll options into view instead of requiring all 17
  options visible simultaneously. Existing theme, keyboard, persistence, and flag assertions remain intact.
- 34 public cases cover sign-in and first-admin setup in every language; 17 authenticated cases cover role-scoped
  repository tables, parameterized status labels, document metadata, and translated Nuxt UI modal close buttons.
- Distributed navigation also covers dashboard, workflow runs, issues, pull requests, dependency alerts, notifications,
  settings, jobs, and permitted provider administration. System Administrator/Manager/Viewer fixtures preserve navigation.
- Six original desktop/mobile/light/dark cases remain green. Total T004 acceptance: 57 passing cases across focused runs.
- Initial new assertions were corrected to actual accessible names (shortcut key suffix), rendered headings rather than
  intentionally hidden descriptions, and JavaScript hexadecimal escapes in installed Nuxt UI locale literals.
- The existing development-only delayed-load scenario remains explicitly assigned to T006; it was not counted as passed
  against production. T002 already established it on dev. No live-provider/server authorization claim follows from fixtures.
- Focused test ESLint, repository documentation coverage, canonical stable formatting, and whitespace checks passed.

## T005: RTL layout, technical data, and visual acceptance

- T004 committed/pushed as `667eae8` before this task.
- Failing-first Arabic/Urdu browser tests demonstrated missing technical identifier isolation.
- Workflow titles/names now use native auto-direction isolation; composite owner/name identifiers remain isolated LTR.
  Source provider values are unchanged. Logical search alignment, status-bar spacing, and table leading gutters replace
  the corresponding physical properties, preserving LTR behavior and table-owned horizontal scrolling.
- Both RTL technical/alignment regressions pass. Twenty-four visual cases cover English, Arabic, Urdu, Simplified Chinese,
  Hindi, and Bengali at 390px/1440px in light/dark. Actual UI locale switching back to English restores LTR without reload;
  menus use directional keyboard interaction, and dialog dismissal restores focus.
- All 26 browser cases passed. The 24 visual cases were recaptured with animations disabled to avoid transition frames.
  Seventy-two auth/menu, workflow-table, and dialog captures were retained outside Git; six matrix sheets inspected for
  script glyphs, logical layout, contrast, clipping, and control reachability. No page horizontal overflow or new font
  dependency was needed. Long tables retain their own accessible horizontal scroll container.
- Responsive menu accessible names correctly account for the hidden mobile shortcut hint.
- Web lint/build, focused test lint, repository documentation, canonical formatting, and whitespace checks passed.
