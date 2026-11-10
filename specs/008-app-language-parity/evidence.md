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

## T006: Preferences, full loading lifetime, failure recovery, and formatting

- T005 committed/pushed as `e6b1c1e` before this task. All 17 catalogs now contain 1,030 messages, including localized
  language-change failure feedback.
- Shared busy state gates both public and signed-in initiators and blocks overlapping changes until completion.
- Nuxt i18n catches asset errors internally. An empty target catalog is detected after its setter, then the public setter
  restores the previous language/cookie. Rejected setters also release loading and provide accessible feedback.
- Failed public selection closes its overlay; signed-in errors close the user menu. The error toast renders an explicit
  visible alert because the pinned Reka implementation marks its transient announcement node aria-hidden.
- Escape during a pending signed-in change defers focus until the trigger is enabled. An explicit focus change to another
  control is respected. Public selectors likewise avoid moving focus away from another active control.
- Real locale assets are intercepted by message content rather than development-only filenames. Public German/Brazilian
  Portuguese and signed-in download holds prove full-duration loading; real failed imports verify rollback, live error
  feedback, retained cookies, and successful reload/retry. The old dev-only test limitation is resolved.
- Every public/signed-in language selection survives navigation/reload and preserves query parameters. Browser detection
  passes zh-CN, pt-BR, pt-PT, ar-SA, ur-PK; unsupported sv-SE falls back to English. Existing unsupported-cookie coverage passes.
- Added twelve fixed-UTC date/time regressions for Chinese, Brazilian Portuguese, Arabic, and Urdu, including midnight,
  24-hour output, and invariant ISO Latin digits/order. Formatter implementation remains unchanged.
- Final checks: 25 unit files / 129 tests, all 70 production-browser cases, web lint/typecheck/build, focused test lint,
  repository documentation, stable formatting, and whitespace checks passed. API responses are fixtures.

## T007: Current handbook maintenance

- T006 committed/pushed as `7290b51`. Parallel handbook drafts were reconciled against its verified final behavior.
- All 13 current handbook translations now describe the 17 app languages, separate pt/pt-BR options, exact local flag
  mappings, RTL and technical data, preference/fallback behavior, loading, error/reload retry, and maintenance commands.
- Guidance points to the shared app registry and explicit Nuxt UI mapping, complete current catalogs, validation gates,
  licensed assets, supported script/theme/width checks, and pinned toolchain.
- Website documentation check passed. All localized frontmatter and stable anchors were preserved; the complete flag
  mapping, identifiers, commands, and pins were checked. Canonical formatting is stable. Published archives are unchanged.
- No website runtime/routing/publishing or dependency change. This source update does not claim deployment or native-speaker
  certification; agent translations and source consistency checks were used.

## T008: Final acceptance

- All eight tasks verified. Final application suite: 25 files / 129 passing unit tests; web lint, typecheck, production
  build, focused browser-test lint, and documentation coverage passed on the final application code.
- Final production-browser reruns: 70 auth/localization cases and 26 RTL/visual cases passed (96 total). The latter
  includes Arabic/Urdu isolation and 24 combinations of six languages, two themes, and 390px/1440px viewports.
- Canonical repository formatting, 21 guideline tests, website documentation validation, 11 handbook tests, and whitespace checks passed.
  Source formatting was stable over two passes. Screenshot inspection and translation review limitations are recorded above.
- Integrated current main (`ce1ff86`, unrelated website Release Notes PR #85) with merge commit `c7c80a8`, preserving
  task commits. No app sources changed during integration. Graph union merge validated; AST graph updated afterward.
- Final scope against current main: app localization/presentation/tests, 13 current localization handbooks, planning
  evidence, six focused Changesets, and the graph. No API, database, provider adapter, authorization, dependency manifest,
  lockfile, toolchain, website runtime, or published documentation archive changes belong to this feature.
- Final catalogs contain 1,030 messages per language, including the T006 locale-load error. The earlier T003 count of
  1,029 describes that task's checkpoint. All 17 catalogs compile and render with matching parameters and linked targets.
- Live-provider behavior, Docker images, remote CI, and native-speaker certification are not established by these local
  checks. No merge, release, publishing, or deployment performed. PR review and separate merge approval remain.

### Requirement acceptance

| Requirements           | Final evidence                                                                                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-001, FR-002, SC-001 | Registry subset/uniqueness checks and all 17 public/signed-in browser selections; legacy options preserved.                                       |
| FR-003, FR-007, SC-002 | Exact catalog coverage, actual message compilation/rendering, parameters/plurals/links, 15 date-format tests, translated Nuxt UI controls.        |
| FR-004, FR-006, SC-003 | Native names/local flags, keyboard/focus, role-shaped screen fixtures, persistence/detection/query checks, real delayed/failed imports and retry. |
| FR-005, SC-004         | Arabic/Urdu direction, technical-data isolation, logical alignment, overlay/focus checks and inspected script/theme/viewport matrix.              |
| FR-008, SC-006         | Negative fixtures reject missing website language, missing/empty key, parameter, compiler/link, metadata and flag defects.                        |
| FR-009                 | All 13 current handbook translations validated; localized frontmatter/anchors retained; published archives unchanged.                             |
| FR-010, SC-005         | Scope diff excludes API/provider/permission changes; local assets/catalogs only; browser fixtures retain source provider values.                  |

### Task commits and Changesets

| Task | Pushed commit              | Focused Changeset                                      |
| ---- | -------------------------- | ------------------------------------------------------ |
| T001 | Evidence included in T002  | Verification only                                      |
| T002 | `a0b3eee`                  | `chubby-ends-leave.md`                                 |
| T003 | `54fc799`                  | `odd-heads-relax.md`                                   |
| T004 | `667eae8`                  | `plenty-peaches-try.md`                                |
| T005 | `e6b1c1e`                  | `better-goats-wash.md`                                 |
| T006 | `7290b51`                  | `old-kings-watch.md`                                   |
| T007 | `e6d357b`                  | `smart-tires-judge.md` (repovio and website)           |
| T008 | Acceptance evidence commit | Verification only; no fabricated package release entry |
