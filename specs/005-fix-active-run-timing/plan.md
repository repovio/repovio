# Implementation Plan: Correct Active Workflow Run Timing

**Branch**: `codex/74-fix-active-run-timing`, based on verified `origin/main` at `1466da6`.

**Feature context**: `005-fix-active-run-timing` | **Date**: 2026-11-09 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/005-fix-active-run-timing/spec.md`.

## Summary

Prevent active Workflow Runs from exposing final timing, normalize bogus Forgejo timestamps before persistence,
and defend run-row rendering against previously persisted bad values. Reuse existing nullable timing fields and
localized unavailable labels. Preserve valid terminal timing, including zero duration. No live elapsed counter.

Planning, task generation, [Issue #74](https://github.com/repovio/repovio/issues/74), and the planning-only commit/push
and product implementation are approved. All implementation tasks are complete; deployment and merging remain separately gated.

## Technical Context

**Language/Version**: TypeScript, Node.js 26.13.0, pnpm 11.28.9; preserve manifest aliases and ranges.

**Primary Dependencies**: Existing NestJS/Fastify, Prisma, shared Zod schemas, Nuxt 4/Vue, Nuxt UI and query-kit stack.
No dependency changes.

**Storage**: Existing PostgreSQL Workflow Run records; nullable DateTime completion and millisecond duration.
No schema migration or production data rewrite planned.

**Testing**: Jest provider/sync tests; Vitest timing-presentation tests; Playwright browser fixtures.

**Target Platform**: Existing API service and browser SPA.

**Project Type**: pnpm/Nx web monorepo.

**Performance Goals**: Constant-time per-run validation; no additional provider calls, polling, or per-row timers.

**Constraints**: Read-only providers; existing CASL restrictions; nullable transport contract; English/German UI;
focused regression coverage and browser evidence required during implementation.

**Scale/Scope**: Forgejo normalization, shared active-run persistence invariant, API read projections where needed
for existing rows, dashboard/table rendering, and focused tests. Other provider adapters receive parity regression
coverage; change their timing mapping only if the same invariant fails. No unrelated provider refactor.

## Constitution Check

Pre-research and post-design gates:

- PASS: Bounded user-reported bug, aligned with `PLAN.md`; no later issue work. Issue #74 supplies the
  authorized tracking association; implementation approval was granted before source changes.
- PASS: Provider operations remain read-only; no permission, credential, or notification changes.
- PASS: Existing synchronization identity/upserts remain idempotent. Active timing is replaced, never merged back
  from stale terminal fields.
- PASS: Existing DTO keys, nullability, repository restrictions, and schema remain compatible.
- PASS: Design requires focused provider/sync/read-projection and presentation tests plus browser checks in both locales.
- PASS: No vocabulary change, toolchain migration, schema migration, or new infrastructure.
- PASS: Planning and implementation approvals were obtained separately; substantive task commits each contain one Changeset.

No constitution exceptions. Documentation coverage follows explicit project instructions if implementation begins.

## Project Structure

### Documentation (this feature)

```text
specs/005-fix-active-run-timing/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/ui-api.md
└── checklists/requirements.md
```

### Source Code (repository root)

```text
apps/api/src/modules/providers/
  forgejo/forgejo-actions.adapter.ts
  forgejo/forgejo-actions.adapter.spec.ts
  sync.service.ts
  sync.service.spec.ts
apps/api/src/modules/workflow-runs/
apps/api/src/modules/dashboard/
apps/web/app/components/modules/
  workflow-runs/table-page.vue
  dashboard/latest-runs.vue
apps/web/app/utils/
apps/web/tests/e2e/
```

**Structure Decision**: Keep provider-specific input handling inside the adapter. Normalize final active timing at
existing persistence/read boundaries; use one small workflow-run timing presentation helper for both row surfaces.
Do not change the generic date formatter's treatment of unrelated domain dates.

## Design and Validation

1. Normalize status before timing in Forgejo. For QUEUED/RUNNING, set `completedAt` and `durationMs` to null.
   Reject malformed and epoch-sentinel timing and reversed intervals. Preserve valid terminal provider duration
   fallback in nanoseconds converted to milliseconds; never clamp invalid durations into a fabricated zero.
2. Enforce the active final-timing invariant before persistence across provider entry points. Verify polling,
   detail reconciliation, and webhook-triggered synchronization use it. Keep null assignments in upserts.
3. Protect existing active rows in Workflow Runs and dashboard read projections, including repository-scoped queries.
   Preserve ability filtering and selection semantics. No SQL repair or migration is needed for immediate display;
   subsequent normal synchronization fixes stored active timing.
4. Share run-aware display validation across dashboard and Workflow Runs rows, protecting against stale API/cache
   payloads. Use existing localized unavailable labels. Keep each surface's current valid duration formatting.
5. Add regression fixtures for bad timing, terminal transitions, zero duration, and existing persisted active rows.
   Replace the Forgejo approval fixture's positive final-duration expectation intentionally: queued means unavailable.
6. Validate focused tests, affected targets, canonical formatting, documentation and browser screenshots in both locales.
   Include exactly one `repovio` patch Changeset per substantive implementation commit under repository policy.

## Phase Results

Phase 0 decisions: [research.md](research.md). Phase 1 model: [data-model.md](data-model.md).
Contract: [contracts/ui-api.md](contracts/ui-api.md). Validation guide: [quickstart.md](quickstart.md).
All design unknowns resolved; live-provider reproduction remains unverified evidence, not a design prerequisite.

## Complexity Tracking

No new architecture or justified violations. Feature context uses the existing Codex worktree and issue branch. Implementation and local verification are complete in [tasks.md](tasks.md); see [evidence.md](evidence.md).
