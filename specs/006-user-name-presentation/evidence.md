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

- T010: `c6a96c2` — show names in notification summaries; focused verification passed before commit.

- T011: `edf0428` — verify user name fallback workflows; focused verification passed before commit.

## Feature-Wide Validation

- API Jest: 111 suites, 796 tests passed against the isolated PostgreSQL database (46 existing migrations applied).
- Nx `web,schemas` lint/typecheck/test targets: all seven targets succeeded without cache hits.
- API typecheck and API lint passed; API TSDoc checked 775 declarations in 182 source files.
- Shared schema tests: 19 passed, including additive recipient/requester names, absent older fields, and private-field rejection.
- Documentation check passed for 685 handwritten files; guideline regression suite: 21 tests passed.
- Canonical repository formatting passed; scoped write/check pipelines were stable on the second pass.
- API and web production builds passed. Changesets status reports one `repovio` patch release from ten focused entries.
- Focused browser checks passed for memberships, accounts, MCP targets, recipient summaries, requester details, and fallback
  cases. Desktop and 390-pixel EN/DE screenshots were inspected with synthetic data; no clipping outside controls or
  invalid fixture errors remain. Full labels remain accessible when long selected text is truncated.
- The initial combined development-server browser run had 31 passes and one Gotify dropdown timeout while a Nuxt
  production build ran against the same worktree. No product fix was inferred from that environmental interruption;
  the complete affected browser matrix is rerun against the built server without HMR.
- Provider integrations, Docker application images, deployment, and external strict historical clients are not validated
  by mocked browser fixtures or these local checks. No provider operations or production changes were performed.

- Final browser matrix against the built production server: all 32 Chromium scenarios passed in 22.4 seconds, including
  the Gotify scenario. API responses are mocked for browser tests; PostgreSQL-backed API tests ran separately.
- No implementation extension hooks are configured. All ten implementation increments have one focused patch Changeset;
  setup and verification documentation have no fabricated release entries. Merge remains unapproved.

- T012: `59bf762` — record user identity acceptance evidence; focused verification passed before commit.

- Cleanup: stopped the two task-owned web servers and removed the isolated PostgreSQL container and its anonymous volume.
- Final delivery: all twelve tasks completed; PR creation follows. Remote CI and merge remain separate from local proof.
