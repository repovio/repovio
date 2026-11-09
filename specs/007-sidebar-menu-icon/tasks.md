# Tasks: Sidebar Menu Icon

**Input**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md),
[contracts/ui.md](contracts/ui.md), and [quickstart.md](quickstart.md).
**Scope**: One P1 user story: replace the responsive sidebar menu symbol with Tabler menu-2.
**Status**: Local implementation and verification explicitly authorized with `$speckit-implement` on 2026-11-10.
All four local tasks are complete. Commit, push, and PR creation were subsequently requested; issue creation and merge
remain outside scope.
**Issue**: None assigned. The user requested implementation and PR delivery without creating an issue.

## Format and Paths

Tasks use `- [ ] TNNN [P?] [US1?] Description with exact file paths`. Paths are repository-relative.
`[P]` denotes independent tasks in different files. This small change has no useful independent task-level parallelism.

## Phase 1: Setup

**Purpose**: Prepare the existing task worktree without changing dependencies or tooling.

- [x] T001 Verify the selected worktree and clean/in-scope diff, confirm Node.js 26.13.0 and pnpm 11.28.9 against `package.json`, prepare existing locked dependencies with Corepack if absent, and ensure the dev server used by `apps/web/playwright.config.ts` serves this checkout on an available port; record the actual URL and prerequisites in `specs/007-sidebar-menu-icon/quickstart.md`.

## Phase 2: Foundational

**Purpose**: Confirm the existing UI seam and fixtures; no new infrastructure is needed.

- [x] T002 Confirm installed Nuxt UI still consumes `ui.icons.menu` for the responsive toggle used by `apps/web/app/components/layout/navbar.vue`, confirm local Tabler menu-2 has three lines and `apps/web/nuxt.config.ts` scans the literal mapping, and identify the mocked shell and rendered bundled-icon assertion in `apps/web/tests/e2e/page-layout.spec.ts` and `apps/web/tests/e2e/admin-tables.spec.ts`; update `specs/007-sidebar-menu-icon/research.md` only if installed evidence changes the design.

**Checkpoint**: Existing component ownership and local test environment confirmed. Do not replace the toggle or introduce
API, persistence, provider, dependency, or toolchain changes.

## Phase 3: User Story 1 - Recognize and Open Navigation (Priority: P1, MVP)

**Goal**: The selected “Open sidebar” control displays three horizontal lines and preserves navigation behavior.

**Independent Test**: At 982 × 1134 and 390 × 844, inspect the actual rendered icon and open/dismiss navigation using
pointer and keyboard. Verify both English/German and light/dark themes. At 1440 × 900, desktop collapse/expand and its
preference behavior remain functional. No external icon request is needed; the route remains unchanged.

### Tests and Implementation

The specification explicitly requires these acceptance checks. Keep the regression test, mapping, and release note in
one coherent implementation increment rather than committing a failing test separately.

- [x] T003 [US1] Extend `apps/web/tests/e2e/page-layout.spec.ts` using existing mocked shell fixtures to assert the responsive open control contains rendered `i-tabler:menu-2` with a nonempty computed mask/background, block and assert no requests to external icon services, and cover the independent test matrix including pointer/keyboard opening, dismissal, accessible labels, unchanged route, and desktop controls/preferences; first confirm the new icon assertion fails against the two-line mapping, then change only `ui.icons.menu` from `i-tabler-menu` to `i-tabler-menu-2` in `apps/web/app/app.config.ts`, preserving close/panel icons and button behavior; add exactly one focused `repovio` patch Changeset at `.changeset/sidebar-menu-icon.md`, run the focused browser regression and affected web checks from `specs/007-sidebar-menu-icon/quickstart.md`, and include source, tests, Changeset, and the AST-only `graphify-out/graph.json` update in the same reviewed implementation commit when authorized.

**Checkpoint**: FR-001 through FR-005 and SC-001 through SC-004 are covered by the focused browser regression. A class
match alone is insufficient: inspect rendered asset styling and screenshots. Add an explicit icon bundle entry in
`apps/web/nuxt.config.ts` only if a reproduced bundling failure demonstrates it is necessary.

## Phase 4: Polish and Cross-Cutting Verification

**Purpose**: Complete acceptance evidence without expanding this icon correction.

- [x] T004 Execute `specs/007-sidebar-menu-icon/quickstart.md` against this checkout, visually inspect screenshots saved under `apps/web/test-results/` for exactly three lines at both responsive sizes, run the full affected page-layout suite, web lint/typecheck, canonical formatting, documentation checks, and `git diff --check`, and record commands, locale/theme/viewport results, screenshot locations, server provenance, and any unresolved limitations in `specs/007-sidebar-menu-icon/evidence.md`; review the complete scoped diff and verify only the intended menu mapping, focused tests, one Changeset, feature evidence, and graph changes are included.

## Dependencies and Execution Order

```text
T001 (existing environment)
  T002 (installed component and fixture confirmation)
    T003 (US1: regression, icon correction, Changeset, scoped checks)
      T004 (visual review and final acceptance evidence)
```

- Phase 1 precedes Phase 2; both precede US1. Final acceptance follows US1.
- US1 has no other story dependency. No model constraints or migrations exist in [data-model.md](data-model.md).
- Before every edit, test, or commit, inspect `git status` and the relevant diff; preserve unrelated work.
- The subsequent direct `$speckit-implement` request authorizes local implementation and verification. Issue creation
  remained outside that request. The later commit/push/PR instruction authorizes delivery of this reviewed scope.
- T001/T002 are preparation and read-only verification apart from necessary evidence corrections; no empty commits.
- T003 is the single substantive implementation task and requires one focused Changeset in its own authorized commit.
  Complete required checks and AST graph update before committing; push an authorized commit per repository policy.
- T004 records verification evidence; no fabricated package bump or empty implementation commit is required.

## Parallel Example: User Story 1

No implementation tasks are marked `[P]`: there is one small, coherent product increment. After T003 edits are ready,
its independent read-only web lint and typecheck commands may run together. Run browser checks after confirming the
server uses those edits; visually inspect their screenshots before completing T004. This is an execution option, not
an instruction to spawn agents or authorize implementation.

## Implementation Strategy

1. Complete setup and installed-source confirmation using existing repository patterns.
2. Deliver US1 as one focused increment: demonstrate the regression, correct the shared icon mapping, add its patch
   Changeset, and validate the affected checks. Preserve accessible labels and existing sidebar state ownership.
3. Review screenshots and final evidence. US1 is the entire MVP and requested scope; no later stories are proposed.
4. Complete the requested commit, push, and PR delivery after verification. Do not create issues, deploy, merge, alter
   provider resources, or start unrelated work without authorization.
