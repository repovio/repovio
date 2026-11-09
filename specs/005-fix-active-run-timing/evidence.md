# Active Run Timing Evidence

## Setup and Baseline (T001, T002)

- Issue: #74; branch: `codex/74-fix-active-run-timing`; planning commit: `7db5269`.
- Requirements checklist: 16 checked, 0 unchecked. No extension hooks registered.
- Node.js 26.13.0, Corepack pnpm 11.28.9; frozen-lockfile dependency installation succeeded.
- A temporary Corepack shim directory is used for nested pnpm scripts because the host default pnpm is 10.33.0.
- Prisma Client generated with synthetic local database URLs; generation performs no database operations.
- Existing ignore files cover dependencies, generated Prisma/Nuxt output, build output, environment files, and browser reports.
- Baseline API: four suites, 50 tests passed (Forgejo, sync, resource DTOs, dashboard run DTO).
- Workflow Run resource DTO mapping is shared by global and repository-scoped reads; dashboard uses its own DTO.
- Provider list and explicit active-run detail refresh both reach `persistRunAndEvaluateEvents`; webhook-driven
  repository synchronization uses that same persistence path.
- Existing Forgejo approval fixture expects 3,000 ms for QUEUED; T003 intentionally changes that assertion.
- No product changes or database writes occurred during setup/baseline.

- Baseline web date-time suite: 3 tests passed.
- T003 regression reproduced: three active-state cases failed before the fix.

## T003: Forgejo Normalization

- Regression failed with epoch completion and -1,785,578,400,000 ms for three active states before the fix.
- After the fix: Forgejo suite 27/27 passed; focused ESLint and API typecheck passed.
- QUEUED/RUNNING final timing is null; malformed/nonpositive start/stop sentinels are unavailable.
- Existing approval metadata and valid terminal controls remain unchanged.

- T003 commit: `97eb300`, pushed.

## T004: Run-Aware Presentation

- Focused Vitest: 3 passed; web typecheck and changed-file ESLint passed.
- Playwright: 4 passed, covering dashboard/history in English/German with stale active payloads.
- Screenshots inspected at desktop/mobile widths. Dashboard shows Unknown/Unbekannt and an em dash; history shows
  two em dashes. Existing mobile table horizontally scrolls; no layout change was introduced.
- Initial cold dev-server request exceeded the default 5-second row assertion; explicit row availability wait allows
  15 seconds for initial compilation. Warm and updated fixture runs passed without retries.
- Screenshot artifacts: `apps/web/test-results/workflow-run-timing-*/active-timing-*.png` (local, untracked).

- T004 commit: `90cbc62`, pushed.

## T005: Persistence Invariant

- Three regression cases failed before the fix because stored active timing retained epoch/negative values.
- Expanded coverage: QUEUED and RUNNING through provider listing, explicit detail reconciliation, and the
  repository queue entry point used by webhook-driven synchronization. Six cases verify repeated stable-identity upserts.
- Sync suite: 25 tests passed; API typecheck and focused ESLint passed.

- T005 commit: `a02a499`, pushed.

## T006: Existing Row Read Projections

- Five new DTO/controller regression cases failed before the fix, exposing stale completion or final duration.
- Resource and dashboard DTOs now mask active final timing before wire serialization and field projection.
- Focused DTO/controller suites: 14 tests passed; actual PostgreSQL authorization suite: 30 tests passed.
- Database cases cover direct/group grants, repository-scoped reads, inaccessible repositories, and requested timing
  fields without status. Status remains internal and is not exposed by restricted field selection.
- API typecheck and changed-file ESLint passed. Existing nullable schemas/OpenAPI keys and client DTO types unchanged.
- Integration database is task-owned `repovio74-postgres` on loopback port 55474, initialized from the existing 46
  migrations. Only synthetic test data is truncated by the repository's guarded test cleanup.

- T006 commit: `327310e`, pushed.

## T007: Terminal Timing and Provider Parity

- Provider parity regression exposed four failing Gitea/GitLab active-state cases; GitHub already passed and its
  implementation remains unchanged. Gitea/GitLab now use the shared timing validator.
- Shared validation is also used by persistence and both API DTOs. It preserves independently valid terminal timing,
  including zero; rejects malformed/epoch/pre-start completion and negative/nonfinite duration; retains BigInt values.
- Added wire-schema tests for malformed stored terminal timing, Forgejo fallback/zero/sentinel cases, and same-row
  active-to-terminal-to-active transitions. Fractional provider milliseconds round only before BigInt storage.
- Provider/sync/DTO suites: 154 tests passed before the additional terminal matrix; terminal/helper/sync suites:
  80 tests passed. Full affected suite and integration results are recorded under final verification.
- API typecheck and changed-file ESLint passed.

- Final T007 affected run: 9 suites, 212 tests passed, including real PostgreSQL authorization.

- T007 commit: `19ecc91`, pushed.

## T008: Terminal Browser Acceptance

- Timing utility: 19 tests passed; changed-file ESLint and web typecheck passed.
- Playwright: 10/10 passed across dashboard, global history, and repository history, in English/German.
- Refresh changes the existing active-row identity to terminal; zero duration remains visible; invalid completion,
  epoch, reversed timing, negative duration, missing timing, and UNKNOWN preserve independent valid fields.
- Desktop terminal screenshots visually inspected in English history and German dashboard; existing active screenshots
  include desktop/mobile widths. No missing translation keys or changed date/rounding conventions observed.
- Local screenshots: `apps/web/test-results/workflow-run-timing-terminal-timing-survives-refresh-de--chromium/terminal-timing-de.png`
  and `apps/web/test-results/workflow-run-timing-termin-011ea-es-refresh-en-workflow-runs-chromium/terminal-timing-en.png`.
- Browser endpoints use synthetic intercepted responses; live-provider browser behavior is not claimed.

- T008 commit: `14fd919`, pushed.

## T009 Review Correction: Derived Intervals

- Full baseline verification after T008: API 110 suites/788 tests, web 23 suites/97 tests, root lint/documentation,
  root typecheck, root canonical formatting, and Changesets patch validation passed.
- Review found that timestamp-derived duration must use validated endpoints; a sentinel start could otherwise
  produce a large positive duration. Four regression assertions failed across GitHub/Gitea/GitLab before correction.
- These adapters now validate endpoints before deriving duration. Independently supplied GitLab duration remains
  available when valid. GitHub mapping changed only after this additional parity failure was reproduced.
- Updated adapter suites: 97 tests passed; API typecheck passed. Final validation follows below.

- T009 correction commit: `3d2fafb`, pushed.

## Final Verification (T009)

| Check                                      | Result                                                                               |
| ------------------------------------------ | ------------------------------------------------------------------------------------ |
| Full API suite on task-owned PostgreSQL 18 | 110 suites, 794 tests passed                                                         |
| Full web unit suite                        | 23 files, 97 tests passed                                                            |
| Timing browser acceptance                  | 10 scenarios passed, English/German, dashboard/global/repository history             |
| Root lint and guideline regressions        | Passed, including documentation coverage for 680 handwritten files                   |
| Root typecheck                             | All 5 Nx targets passed                                                              |
| Canonical formatting                       | Root check passed; changed-file formatting stable across two passes                  |
| Whitespace, artifact links, task IDs       | Passed                                                                               |
| Changesets                                 | Seven focused patch entries for `repovio`; one per substantive implementation commit |
| Graphify pre-commit                        | Passed; generated graph contains no absolute worktree/interpreter paths              |

Final source revision tested: `3d2fafb`. Subsequent completion commit changes documentation only. `origin/main`
remained at `1466da6` during final verification. Provider integrations retain their existing read-only requests.

## Acceptance Traceability

- FR-001/SC-001: Forgejo/provider parity, sync, DTO/controller, and stale active browser fixtures.
- FR-002/SC-002: Sentinel, malformed, reversed, negative/nonfinite, and derived-endpoint regression matrices.
- FR-003/SC-003: Valid terminal values, independent fallback, and zero-duration unit/browser assertions.
- FR-004: Real persisted active rows normalize before synchronization; stale browser payloads are guarded independently.
- FR-005: Same provider run identity survives repeated sync and active/terminal transitions; null overwrites are explicit.
- FR-006/SC-004: English/German browser assertions and visually inspected desktop/mobile screenshots.
- FR-007: Real PostgreSQL direct/group grant and field-selection assertions; approval metadata controls remain intact.

## Limits

Live provider payloads and production deployment were not exercised. Browser evidence uses synthetic intercepted
API responses; PostgreSQL integration evidence uses a dedicated disposable container. No schema migration or bulk
production data repair was added. Historical retained aggregates are not rewritten. Graphify's SQL parser dependency
is unavailable; AST hook reports the existing SQL extraction limitation without failing.
