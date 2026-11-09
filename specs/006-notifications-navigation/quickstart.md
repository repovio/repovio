# Validation Guide: Simplify Notifications Navigation

## Prerequisites

- Implement the separately approved feature tasks first. This planning change does not alter product behavior.
- Use Node.js 26.13.0 and Corepack pnpm 11.28.9 from the repository root.
- Install dependencies with `corepack pnpm install --frozen-lockfile` if absent.
- Install Chromium with `corepack pnpm --dir apps/web exec playwright install chromium` if absent.
- Start the web app in a separate terminal with `corepack pnpm --dir apps/web dev --host ::1`.
  The existing Playwright fixtures mock application data; production access is unnecessary.

## Focused browser checks

```sh
corepack pnpm --dir apps/web e2e tests/e2e/notifications.spec.ts tests/e2e/page-layout.spec.ts tests/e2e/dashboard.spec.ts
```

If using another local server, set `PLAYWRIGHT_BASE_URL` to its origin for the same command.

1. In English and German, navigate from another page using Notifications. Expect channels after one selection.
2. Inspect expanded desktop, collapsed desktop, and mobile navigation. Expect one link, no expansion control or children,
   a localized accessible name, and no administrative history destination.
3. Inspect global search and command palette. Expect one Notifications destination; no Channels/history shortcuts.
4. As System Administrator, follow the channel toolbar Delivery history link. Verify table/details, active Notifications,
   refresh, breadcrumb return, and browser back/forward. Repeat with empty/failed channel data.
5. Open the navbar bell. Expect personal recent notifications/device controls, with no administrative history shortcut.
6. As Viewer and Manager, confirm channel visibility stays unchanged, history toolbar is absent, and direct history access
   remains denied. Repeat the administrator scenario using a direct history bookmark.
7. Capture or inspect browser rendering for both locales at desktop and mobile widths, including the collapsed sidebar;
   verify no clipping, redundant submenu gutter, or unexpected expansion affordance.

See [the UI contract](contracts/navigation.md) for exact semantics and [data-model.md](data-model.md) for route transitions.

## Affected checks after implementation

```sh
corepack pnpm format:check
corepack pnpm documentation:check
corepack pnpm --dir apps/web lint
corepack pnpm --dir apps/web typecheck
corepack pnpm --dir apps/web test
```

Add a focused patch Changeset for `repovio` with the eventual substantive implementation commit. Run `graphify update .`
after code changes. Run `git diff --check` and inspect scoped diffs. Follow repository formatting stability requirements;
do not claim browser, provider, Docker, or remote CI behavior without running the corresponding checks.

For this planning-only change, validate Markdown formatting, internal references, specification completeness, and diffs;
application tests and browser acceptance are not evidence of an unimplemented feature.

## Execution Record: 2026-11-09

- Environment: existing Codex task worktree; Node.js 26.13.0 and Corepack pnpm 11.28.9; frozen installation unchanged.
  A temporary Corepack shim directory supplied pinned pnpm to nested package scripts because the host's bare pnpm is
  10.33.0. No tracked toolchain configuration changed.
- Browser: local Nuxt server at `http://[::1]:3064`, Chromium, synthetic users, Playwright API-route fixtures. No production
  session or provider data was used.
- Before implementation, the direct Notifications link assertion failed with zero matching links. Before removing the
  bell shortcut, both locale tests found one administrative history link where zero were required.
- Browser checks passed across focused runs covering all 37 current scenarios in the three scoped suites: 18 existing
  dashboard/page-layout cases, two new EN/DE navigation-surface cases, and all 17 final notification cases. The broader
  baseline run passed 30 cases; navigation-surface checks passed 2/2 and the final notification suite passed 17/17.
- Navigation screenshots inspected for English/German expanded desktop, collapsed desktop, and mobile presentation;
  personal-popover screenshots confirm the removed administrative shortcut. Generated filenames include
  `notifications-expanded-en.png`, `notifications-collapsed-de.png`, `notifications-mobile-menu-de.png`,
  `notifications-mobile-en.png`, and `notifications-personal-popover-de.png`; screenshots remain local test artifacts.
- Browser coverage includes keyboard activation, palette navigation/search, mobile drawer dismissal, active history state,
  direct bookmarks/reload, breadcrumbs, browser back/forward, channel empty/error states, administrator visibility, and
  Viewer/Manager denial without a history query. Existing channel-creation, delivery-detail, and personal-history retry
  scenarios remain passing.
- Web unit tests: 23 files, 97 tests passed. Web typecheck, web lint, scoped browser-test ESLint, documentation coverage,
  canonical formatting, and 21 guideline regression tests passed. Changed-file formatting converged across two passes.
- `git diff --check` passed. Graphify AST refresh and pre-commit isolation hook passed; graph contains 13,691 nodes after
  source changes. Existing missing SQL-parser warnings concern unchanged SQL files; this UI change needs no SQL graph
  extraction. Graph runtime metadata and reports remain ignored.
- Limits: mocked browser checks verify frontend route guards, not backend authorization or live notification delivery.
  Real provider calls, Docker images, deployment, and remote GitHub Actions were not validated by these local runs.
  Nuxt emitted its existing package-module warnings while checks still exited successfully.

## Main Integration: 2026-11-10

PR #77 was green but conflicted with the merged User name presentation changes. Merged `origin/main` at `a3128bb`
without discarding either feature: `mockShell` retains Manager coverage and the new catch-all API fixture isolation;
name-first recipient fixtures, assertions, and pagination regressions remain intact.

Verification after resolution: 22 notification/User-identity Chromium scenarios and two EN/DE navigation-surface
scenarios passed; all 106 web unit tests passed. Web typecheck, canonical formatting with stable scoped output,
browser-test ESLint, documentation coverage, and whitespace checks passed. Graphify union merge validated and its AST
refresh succeeded. This integration introduces no new product behavior and needs no additional release entry.
Remote checks must pass on the new head before the user-authorized merge.
