# Implementation Plan: Consistent Table Toolbars

**Branch**: `79-unify-monitoring-list-toolbars-and-merge-user-groups-header-controls`
**Base**: `origin/main` at `5f568b0a4dd92aa3dd4f5b17c9098e1289dc6f76`.
**Feature Identifier**: `006-unify-table-toolbars` | **Date**: 2026-11-09 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/006-unify-table-toolbars/spec.md`.
**Workspace**: Existing Codex worktree `/mnt/projects/.codex-worktrees/51ac/repovio`; initially clean.
**Tracking**: [GitHub issue #79](https://github.com/repovio/repovio/issues/79). Issue creation and the planning
commit/push and implementation are approved. PR merge requires separate approval.

## Summary

Match the five marked monitoring toolbars to Workflow runs: breadcrumbs plus search and refresh/sort/filter/options.
Move specialized labels, Code scanning path, and updated-date inputs into the existing filtering surface while preserving
query semantics. Merge User groups search, sorting, and New group into its breadcrumb toolbar, keeping table state and
dialogs under one owner. Reuse existing page frames and local table controls; preserve repository-scoped embedding.

## Technical Context

**Language/Version**: TypeScript, Vue SFCs; Node.js 26.13.0 and Corepack pnpm 11.28.9.
**Primary Dependencies**: Existing Nuxt 4 SPA, Nuxt UI, `@querry-kit/nuxt`, local `QTable*` controls.
**Storage**: Existing table preferences only; no Prisma schema, API DTO, or database changes.
**Testing**: Existing Playwright E2E suites, web Vitest checks, canonical formatting, documentation, lint, and typecheck.
**Target Platform**: Existing supported desktop/mobile browsers; Chromium regression runner.
**Project Type**: Web application within the existing pnpm/Nx monorepo.
**Performance Goals**: No additional fetch triggered merely by opening filtering; retain existing search debounce.
**Constraints**: Provider read-only behavior, EN/DE labels, keyboard focus, pending/error states, unchanged query predicates.
**Scale/Scope**: Six marked routes, two shared monitoring table pages, User groups page/table, minimal filtering UI extension.

## Constitution Check

| Gate                                    | Before research                     | After design                                     |
| --------------------------------------- | ----------------------------------- | ------------------------------------------------ |
| Bounded scope and approved architecture | Pass: six comments only             | Pass: existing frontend structures               |
| Issue implementation order              | Issue #79; planning approved        | Implementation requires associated issue         |
| Read-only providers and authorization   | Pass: no integration changes        | Pass: preserve scoped constraints and admin gate |
| Secrets and durable operations          | Pass: no credential/storage changes | Pass: existing group operations unchanged        |
| Localization, accessibility, loading    | Required acceptance criteria        | Included in UI contract and browser matrix       |
| Focused tests and visual proof          | Required for implementation         | Existing suites plus targeted browser checks     |
| Toolchain and coding conventions        | Preserve existing pins              | No dependency or configuration changes           |
| Delivery boundaries                     | Planning authorized                 | Implementation approved; merge approval pending  |

No architecture exceptions. Recheck these gates during implementation; planning checks do not prove runtime behavior.

## Project Structure

### Documentation (this feature)

```text
specs/006-unify-table-toolbars/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── tasks.md
├── checklists/requirements.md
└── contracts/ui.md
```

Task generation is approved and recorded in [tasks.md](tasks.md).

### Source Code (repository root)

```text
apps/web/app/components/
├── layout/page.vue
├── common/table-page-frame.vue
├── common/table-filtering.vue                # Proposed public-slot wrapper
├── modules/workflow-runs/table-page.vue       # Reference; preserve behavior
├── modules/work-items/table-page.vue
├── modules/security-alerts/table-page.vue
└── modules/user-groups/table.vue
apps/web/app/pages/admin/user-groups.vue
apps/web/i18n/locales/
apps/web/tests/e2e/
```

**Structure Decision**: Keep feature query state in existing table modules. Use frame actions for merged headers.
Prefer composing the existing specialized inputs into the local filtering control over translating nested predicates
into generic fields. Extend only the local filtering surface required by these consumers; avoid a new toolbar framework.

## Phase 0: Research

See [research.md](research.md) for source findings, ownership decisions, predicate invariants, and alternatives.
The installed filtering control exposes public header/trigger slots; the local wrapper design preserves its editor.

## Phase 1: Design

### Monitoring lists

1. Retain search and the existing grouped refresh/sort/filter/options buttons in `#actions`.
2. Add a small common wrapper using public `QTableFiltering` header/trigger slots; put labels/path/date controls inside.
3. Preserve existing refs, static-filter construction, search debounce, table preferences, and dashboard-preset reset logic.
4. Combine generic/specialized active state; Clear resets both groups, leaving search unchanged. Closing preserves criteria.
5. Keep supporting-data loading and refresh lifetimes unchanged. Opening filtering uses already-loaded option lists.
6. Preserve `embedded` framing and hidden Repository/Provider filters in repository detail lists.

### User groups

Move frame ownership into the existing group table component, using `CommonTablePageFrame` or `LayoutPage` consistently.
Let `admin/user-groups.vue` compose that component and retain metadata/admin middleware. Render search, sorting,
and New group through frame `#actions`; retain the existing query state, dialogs, destructive confirmation, and pagination.
Remove the separate content-level `QTableToolbar` row. Do not use Teleport or duplicate query/dialog state in the route.

### Verification and delivery

Extend existing list/group/layout E2E suites; assert request predicates, active-filter state, keyboard behavior,
header ownership, responsive bounds, and embedded scope. Capture screenshots for all six routes at 1065 pixels,
plus mobile/desktop and EN/DE coverage. Run focused browser checks, then affected web lint/type/test targets and
required canonical repository checks. Include exactly one focused `repovio` patch Changeset per substantive
implementation commit when that later phase is authorized. Refresh Graphify after code changes.

## Complexity Tracking

No constitution violations requiring a complexity exception. No backend, schema, dependency, or release changes planned.
