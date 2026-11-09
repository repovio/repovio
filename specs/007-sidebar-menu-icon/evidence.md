# Implementation Evidence: Sidebar Menu Icon

**Date**: 2026-11-10
**Checkout**: Existing Codex task worktree `a990/repovio`; branch `codex/sidebar-menu-icon` based on `779265e`.
**Authorization**: Local implementation and verification were explicitly requested, followed by commit, push, and PR
creation. Issue creation, merge, provider resource changes, and deployment remain outside scope.

## Change

- Changed only `ui.icons.menu` from `i-tabler-menu` to `i-tabler-menu-2` in `apps/web/app/app.config.ts`.
- Preserved close, panel-open, panel-close, sidebar state, and framework button behavior.
- Added four parameterized browser cases in `apps/web/tests/e2e/page-layout.spec.ts` and one focused `repovio` patch
  Changeset in `.changeset/sidebar-menu-icon.md`.
- Updated the AST graph locally; semantic document extraction was not rerun.

## Environment

- Node.js 26.13.0; Corepack pnpm 11.28.9; `corepack pnpm install --frozen-lockfile` passed without lockfile changes.
- Schema build passed. Nuxt dev server started from this worktree at `http://127.0.0.1:3107`.
- Existing port 3000 server was not used or modified.
- A fresh server start rescanned the literal menu icon into the client bundle; no Nuxt icon configuration change needed.

## Regression and Focused Verification

- Before implementation, the new English/light test failed because `i-tabler:menu-2` was absent from the open button.
- After changing the mapping through HMR, the computed SVG assertion exposed an empty icon mask. A server restart
  regenerated the bundle; the same assertions then passed without enabling an external icon provider.
- Focused browser run: **4 passed** in 22.6 seconds.
- Each locale/theme case covers 982 × 1134 and 390 × 844, icon visibility and actual bundled SVG data, pointer opening,
  Escape dismissal, restored focus, Enter opening, unchanged route, and blocked external icon services with zero requests.
- Each case also covers 1440 × 900 desktop collapse/expand and persistence across reload.

## Static Checks

- Web lint passed; explicit ESLint check for the changed Playwright file passed.
- Web typecheck passed via `corepack pnpm --filter @repovio/schemas build` followed by
  `corepack pnpm --dir apps/web exec nuxt typecheck`.
- The web `typecheck` script initially failed because its nested bare `pnpm` resolved to global 10.33.0. Explicit
  Corepack commands above execute the same underlying checks with pinned pnpm 11.28.9, without changing tooling.
- Documentation check passed for 685 handwritten source files.
- Canonical repository formatting and two-pass scoped formatting passed; feature Markdown links are valid.
- AST graph update passed: 13,731 to 13,795 nodes, 18,898 to 19,776 edges. No absolute worktree paths were introduced.
  Graphify reported unavailable SQL extraction support for 47 unrelated SQL files; no SQL changes were made.

## Final Acceptance

- Full page-layout browser suite: **19 passed** in 2.7 minutes using the worktree server on port 3107.
- Visually inspected all eight locale/theme/viewport header screenshots: exactly three horizontal strokes, visible in
  both themes with unchanged header spacing. Also inspected the complete English/light screenshots at both sizes.
- Screenshots are under ignored `apps/web/test-results/page-layout-sidebar-menu-*/sidebar-{390,982}.png`; the locale
  and theme appear in each test directory name. These paths are local test artifacts, not committed assets.
- Mocked dashboard resources may display existing unavailable-data notices; verification concerns the real sidebar
  control and its bundled icon. No live provider or real API acceptance is claimed.
- Final `git diff --check` passed. Changes are limited to the menu mapping, focused browser tests, one patch Changeset,
  feature documentation, and the generated graph. Remote CI remains separate from the recorded local checks.
- All T001-T004 tasks are complete. The user subsequently requested commit, push, and PR creation.
- The task-owned server on port 3107 was stopped after validation; the original port 3000 server remains untouched.
