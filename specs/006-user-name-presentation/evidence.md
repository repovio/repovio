# Implementation Evidence: User Name Presentation (#76)

## Baseline and Environment

- Implementation, per-task commits, and pushes explicitly approved; merge remains separate.
- Worktree `/mnt/projects/.codex-worktrees/6120/repovio`, branch `codex/76-user-name-presentation`, baseline `fa90261`.
- Node.js 26.13.0, pnpm 11.28.9; frozen offline installation completed without manifest/lockfile changes.
- Spec quality checklist: 16/16 checked. Feature context and 12 ordered tasks resolved; no extension hooks configured.
- Existing ignore rules cover dependencies, generated Prisma/Nuxt output, environment files, reports, and build artifacts.
- Baseline identity/channel-draft Vitest: 2 files, 9 tests passed. Existing schema build and Nuxt prepare passed.
- Initial Prisma generation required explicit synthetic DATABASE_URL/SHADOW_DATABASE_URL; generation then passed.
- Isolated task-owned PostgreSQL 18 container `repovio76-postgres`, local port 32771, disposable `repovio_test` database.
- Browser scenarios mock provider/API resources with synthetic local/OIDC identities; no provider requests required.
- Fixture matrix: full/partial/null/blank/padded/Unicode/duplicate/long names, older responses, later pages, denied Users.

## Task Commits and Validation

- T001: `3d48a22` — record user identity validation baseline; focused verification passed before commit.

- T002: `f125c13` — normalize user identity names; focused verification passed before commit.

- T003: `8ecbdfb` — expose safe notification recipient names; focused verification passed before commit.

- T004: `1f2dfe1` — search users by personal names; focused verification passed before commit.

- T005: `c07c7c6` — show names in user selectors; focused verification passed before commit.

- T006: `035103d` — paginate named browser notification recipients; focused verification passed before commit.

- T007: `3dbae00` — show safe delivery requester identities; focused verification passed before commit.

- T008: `97562a1` — use names in membership identities; focused verification passed before commit.

- T009: `b2995a8` — identify account actions by personal names; focused verification passed before commit.

## Surface Inventory Review

- Shared display/selection labels normalize complete, partial, absent, padded, and Unicode name parts.
- Group picker, repository access picker, browser recipients: named choices and stable IDs; repository/browser discovery
  is paginated rather than capped at 100. Group search retains stale-response and page-reset behavior.
- Group and repository member rows/removal targets, account rows/reset/delete targets, MCP owner descriptions,
  notification summaries and delivery requester details all use shared names or parenthesized secondary usernames.
- Existing account navigation, User avatar accessible labels, and repository member avatar tooltips already use the
  shared helpers and remain covered by the helper change and browser matrix.
- Scoped source audit found remaining username references only in identity transport, credential editing,
  destination-service configuration, Provider Actors, or parenthesized secondary labels.
- Current frontend Axios consumers retain additional response fields; new schemas explicitly allow older responses with
  absent names/requester. This is not a claim that arbitrary external strict historical consumers accept new fields.
- Notifications: safe explicit recipient/requester projections; credential exclusion and older-response parsing tested.
