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
