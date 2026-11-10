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
