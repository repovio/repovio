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
