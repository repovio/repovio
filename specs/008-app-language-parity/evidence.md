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
