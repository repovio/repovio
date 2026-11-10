# Implementation Evidence: Website Release Notes (#83)

## Authorization and context

- Implementation approved on 2026-11-10; branch `codex/83-website-release-notes`, planning commit `84a31c6`.
- Existing Codex worktree reused. Feature context resolves to `specs/007-website-release-notes`.
- Requirements checklist: 16 checked, zero unchecked; no configured extension hooks.
- Explicit current project documentation rules govern source documentation; preserve existing comments and standards.
- Ignore files already exclude dependencies, generated Nuxt output, browser artifacts, secrets, and container build noise.

## T001 baseline

- Node.js 26.13.0 and Corepack pnpm 11.28.9; frozen installation succeeded without manifest/lockfile changes.
- Website unit tests: 8 files, 48 tests passed.
- Website `docs:check`: passed.
- Docker daemon available (29.9.3). Browser, full build, and container acceptance follow the owning tasks.

## T002 source and build validation

- Red check: focused suite failed before the source module existed; nine tests pass after implementation.
- Canonical source is included through an explicit root-relative Nuxt Content collection; source bytes are not rewritten.
- Valid-empty, missing/directory input, invalid headings, duplicate versions, and numeric semantic order covered in isolated inputs.
- Website lint, typecheck, production build, and repository documentation check passed (687 source files).
- Production build completed in 38.7 seconds. Docker image `repovio-website:83` built successfully; existing unprivileged/read-only runtime checks passed.

## T003 fourth tab and public page

- Commit for T002: `057d980` (pushed); T001/T002 synchronized in task checklist and issue.
- Four production browser tests passed: current and archived EN/DE navigation, active tab, direct reload, retained
  handbook selectors, complete migration paragraph, no duplicate source H1, and zero external release-service requests.
- Sixteen focused unit checks passed, including real interface keys for all 13 supported locales.
- Website lint/typecheck, repository declaration coverage, and production build passed.
- Rebuilt Docker image and enhanced read-only/unprivileged runtime checks passed for EN/DE release-history routes.
- Interactive browser and screenshot inspection confirmed active fourth tab and readable complete Markdown in dark mode.
- Deliberate empty-source presentation will also be exercised with an isolated fixture during final acceptance.

## T004 release navigation

- Commit for T003: `e5619f5` (pushed).
- Red browser check failed on absent TOC before implementation. Six production browser scenarios now pass.
- Desktop/mobile release navigation uses the real renderer IDs (`_230`, `_220`, etc.); fragment reloads work in EN/DE.
- Ten focused unit tests pass; heading adaptation preserves original objects, metadata, IDs, and source order.
- Complete multiline upgrade guidance and first/last canonical releases remain visible; no duplicate heading IDs.
- Website lint/typecheck, production build, documentation coverage, and stable canonical formatting passed.

## T005 responsive and accessibility acceptance

- Commit for T004: `f439bec` (pushed).
- Red checks exposed six mobile targets below 44 px; desktop baseline remained green.
- Twelve production cases now pass: EN/DE/Arabic, 375/1440 px, light/dark.
- Keyboard disclosure/Tab navigation, visible focus outlines, 44 px mobile links, language/direction markup, zero page
  overflow, and original handbook toolbar overflow checks passed. No captured page errors.
- All 12 screenshots visually inspected in a contact sheet; localized chrome and isolated left-to-right English prose
  remain readable. Review screenshots are local artifacts outside Git; test paths use `test-results/release-notes-*.png`.
- Website lint/typecheck/build, declaration coverage, and canonical formatting stability passed.

## T006 localized discovery

- Commit for T005: `9f73330` (pushed).
- Three production SEO scenarios pass, including all 13 SSR locale routes, localized titles/descriptions, canonical and
  alternate-language metadata, exactly one history sitemap URL per locale, and real EN/DE language-switch fragments.
- The existing LanguageSwitch already preserves the route and hash; no switch modification was necessary.
- Website lint/typecheck/build, declaration coverage, and stable canonical formatting passed.
- Inspection identified a direct FR-008 dependency: Nx cache inputs and CI path selection must include root CHANGELOG.md.
  A bounded T008 follow-up will fix this before T007 acceptance; no release automation or deployment coupling is added.

## T008 canonical source dependency correction

- Commit for T006: `851d35d` (pushed).
- Red CI-area regression failed before the fix; all nine CI-area tests now pass.
- Eleven release-source unit checks pass, including every source-consuming Nx target retaining normal inputs plus root history.
- Effective `nx show project website --json` confirms root CHANGELOG.md in build, container, test, and typecheck inputs.
- Website ESLint, focused root-script ESLint, declaration coverage, and stable canonical formatting passed.
- No deployment or release trigger changed; only validation selection and cache inputs changed.

## T009 API-reference fixture compatibility

- Existing API-reference acceptance reproduced `ENOENT /CHANGELOG.md` before the fixture layout fix.
- Fixture now preserves `apps/website` and root changelog relationship; no production source override added.
- Real isolated API-reference build and browser acceptance passed: 54 tests, one optional real-schema case skipped.
- Existing schema, archive, browser, and cleanup assertions were preserved. Website ESLint, declaration coverage, and
  stable canonical formatting passed after the fixture change.

## T010 current base release integration

- Commit for T009: `94e617b` (pushed).
- Current main `aa0fa7e` integrated through merge commit `0cabe3f`; existing task commits preserved.
- Main's already-published app version is 2.3.1 and website version is 0.2.2. No release or version command executed here.
- Browser assertions now compare every rendered release heading against the current validated canonical source.
- After base integration: production build, 60 unit tests, 11 documentation tests, docs verification, website
  lint/typecheck, 11 CI-helper tests, declaration coverage (694 sources), and full production browser acceptance passed.
- Full browser result: 146 passed, 54 dedicated API-reference cases skipped; those cases passed in their isolated command
  (54 passed, one optional externally supplied real-schema scenario skipped).
- Current-source Docker image rebuilt; read-only/unprivileged EN/DE documentation and release-history checks passed.
- Twelve current-source screenshots were refreshed, preserving local review artifacts outside Git.

## T007 final acceptance

- All ten task IDs completed, including the three bounded dependency/regression follow-ups.
- Current-source Docker image and EN/DE release routes passed unprivileged/read-only runtime checks.
- Isolated actual Nuxt builds/browser checks: valid-empty history passed twice (EN/DE); rich Markdown history passed
  twice (EN/DE), including nested lists, links, code, multiline migration prose, ordered versions, and fragment targets.
- Isolated direct `nuxt build` with missing canonical source failed specifically with CHANGELOG.md ENOENT.
- Current-source website unit tests: 60 passed. Documentation source tests: 11 passed. CI helper tests: 11 passed.
- Guideline regression tests: 21 passed. Website lint/typecheck, docs verification, declaration coverage, canonical
  formatting stability, Changesets status, and diff whitespace checks passed.
- Full production browser suite on integrated main: 146 passed; 54 API-reference-only cases skipped in that command.
  Dedicated isolated API-reference command: 54 passed, one optional externally supplied real-schema test skipped.
- Twelve EN/DE/Arabic mobile/desktop light/dark screenshots captured; current-source captures refreshed and inspected.
- Immutable content archives, lockfile, compiler aliases, toolchain ranges, and provider integration source are unchanged
  relative to integrated main. All source reads remain local; no release-service credentials required.
- No configured Spec Kit implementation hooks. No release, publish, merge, or deployment performed.
- Remote GitHub Actions results will be reported from the feature PR; local checks are not remote-CI proof.

### Requirement evidence

| Requirements                   | Evidence                                                                                               | Result |
| ------------------------------ | ------------------------------------------------------------------------------------------------------ | ------ |
| FR-001, FR-002, FR-007, SC-001 | EN/DE current/archive toolbar, active state, reload and version-selector browser cases                 | Pass   |
| FR-003, FR-008, SC-002         | Full renderer version list versus canonical source; multiline/rich fixtures; Nx/CI input tests         | Pass   |
| FR-004                         | Desktop/mobile TOC, real generated IDs, fragment reloads in EN/DE                                      | Pass   |
| FR-005, FR-006, SC-004         | 12 layout cases, keyboard focus, 44 px targets, RTL language isolation, locale-key coverage            | Pass   |
| FR-009                         | Valid-empty real builds and UI, missing-source build failure, invalid/duplicate/order fixtures         | Pass   |
| FR-010, SC-003                 | All 13 SSR routes and metadata, unique sitemap entries, live EN/DE language-switch hashes              | Pass   |
| SC-005                         | Browser request assertions and local-only content design; no credentials or application API dependency | Pass   |
