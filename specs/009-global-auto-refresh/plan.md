# Implementation Plan: Global Auto Refresh

**Branch**: `codex/91-global-auto-refresh`, based on verified `origin/main` at
`01dd05cd97bb3ddf74bcb479c3504f2ef2274be5`.

**Issue**: [#91](https://github.com/repovio/repovio/issues/91)

**Date**: 2026-11-10 | **Spec**: [spec.md](spec.md) | **Feature context**: `009-global-auto-refresh`

**Input**: Feature specification from `specs/009-global-auto-refresh/spec.md`.

## Summary

Add one authenticated-navbar refresh preference, defaulting to 15 seconds, with Off/15 s/30 s/1 min/5 min choices.
Refresh only active supported monitoring views and their summaries through existing permission-scoped Repovio reads.
Standardize the nine annotated views' manual controls as accessible icon-only buttons. Keep provider synchronization,
server Polling, Jobs, forms, and notification refresh behavior outside scope.

Use a browser-local Pinia preference store, shared scheduling/registration composable, small navbar component, and reusable
manual button. Route timer/manual/workflow-sync triggers through one completion-aware gate per target. Preserve queries,
pause hidden/offline work, clean up on disposal, and protect against obsolete results.

## Technical Context

**Language/Version**: Existing TypeScript compiler aliases; Node.js 26.13.0, pnpm 11.28.9.

**Primary Dependencies**: Existing Nuxt 4 SPA, Vue 3, Pinia, Nuxt UI, VueUse, Query Kit; no dependency changes.

**Storage**: One validated browser-local numeric interval preference; memory fallback if storage is blocked.

**Testing**: Vitest fake timers/deferred requests, fixture-based Playwright browser tests, existing locale/query regressions.

**Target Platform**: Supported desktop/mobile browsers; authenticated Nuxt application, responsive navbar.

**Project Type**: Frontend feature in existing pnpm/Nx monorepo.

**Performance Goals**: One interval schedule per active target; at most one in-flight refresh per target; zero scheduled
requests while hidden/offline, on unsupported routes, or when Off; no catch-up bursts.

**Constraints**: Provider read-only; no sync POSTs, schema/API/toolchain changes, cross-device settings, or hidden-tab polling.
Full pending lifetimes and preserved authorization/query behavior are mandatory. All application locales receive new text.

**Scale/Scope**: Nine annotated routes, implemented through Dashboard, Awaiting approval, and three shared table features.
Actively embedded repository tabs inherit their shared feature behavior; unrelated views do not.

## Constitution Check

_GATE: Reviewed before research and re-evaluated after design._

| Gate                                    | Before research                         | After design                                                     |
| --------------------------------------- | --------------------------------------- | ---------------------------------------------------------------- |
| Approved architecture and bounded scope | PASS: user-requested planning only      | PASS: nine routes and direct shared dependencies                 |
| Active issue/order                      | Planning authorized; issue #91 recorded | Issue/order recorded; implementation approval pending            |
| Provider read-only                      | PASS                                    | PASS: existing Repovio reads only, no synchronization actions    |
| Authorization and secrets               | PASS                                    | PASS: existing query-scoped clients; no credentials persisted    |
| Durable synchronization/notifications   | Unchanged                               | Unchanged: no new backend operations                             |
| Typed ownership and existing patterns   | PASS                                    | PASS: narrow store/app composable/layout/common components       |
| Localization/accessibility/loading      | Required                                | Explicit acceptance and browser matrix in quickstart             |
| Verification and documentation          | Required                                | Fake-clock, adapter, browser, locale, type/lint checks specified |
| Workflow authority                      | Planning only                           | Tasks/issue/planning commit approved; implementation pending     |

The constitution and coding-guidelines document contain different documentation-tag wording. Explicit current AGENTS.md
requires following `docs/coding-guidelines.md`; apply its TypeScript documentation policy during implementation, without
rewriting the constitution or weakening checkers. No design exception is required.

## Project Structure

### Documentation (this feature)

```text
specs/009-global-auto-refresh/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/ui.md
├── checklists/requirements.md
└── tasks.md
```

Task generation and implementation were approved on 2026-11-10; [tasks.md](tasks.md) records the ordered implementation work.
`.specify/feature.json` selects this feature locally.
The issue branch is established in the existing worktree. Setup's `BRANCH` output identifies the feature context.

### Source Code (repository root)

```text
apps/web/
├── app/store/auto-refresh.ts                              # proposed preference store
├── app/composables/app/auto-refresh.ts                    # proposed Vue integration
├── app/composables/app/auto-refresh-state.ts              # proposed testable scheduler
├── app/components/layout/auto-refresh-control.vue         # proposed navbar settings
├── app/components/layout/navbar-controls.vue             # existing navbar composition
├── app/components/common/refresh-button.vue               # proposed shared manual button
├── app/pages/index.vue                                   # dashboard target
├── app/pages/workflows/awaiting-approval.vue               # approval target
├── app/components/modules/workflow-runs/table-page.vue     # runs/needs-attention target
├── app/components/modules/work-items/table-page.vue        # issues/PR target
├── app/components/modules/security-alerts/table-page.vue   # category target
├── app/composables/api/table.ts                           # optional narrow opt-in dispatch seam, if required
├── i18n/locales/                                          # existing application locales
└── tests/e2e/auto-refresh.spec.ts                          # proposed synthetic browser acceptance
```

**Structure Decision**: Keep scheduling in app composables and durable browser preferences in a narrow store; UI components
render controls only. Existing pages/features own refresh callbacks, data, errors, query state, and permission scope.
Do not add polling to every generic table or centralize all API fetching into the navbar.

## Design and Delivery Boundaries

1. Establish typed validated preference and testable completion-driven scheduler; prove time/lifecycle/single-flight rules.
2. Compose navbar selection and common manual button with all-locale text and accessibility states.
3. Integrate the Dashboard, Awaiting approval, and shared table refresh targets, including complete grouped-read lifetime,
   query/initial busy gates, workflow sync debounce, active embedded tabs, and obsolete-result guards.
4. Execute the acceptance matrix and affected regressions; record actual evidence and limitations before PR review.

These are design boundaries, not generated implementation tasks or permission to implement. The subsequent task procedure
must produce coherent increments with tests/docs and exactly one focused `repovio` Changeset per substantive commit.

## Validation Strategy

Use fake timers and deferred reads to verify intervals, persistence failure, Off, no overlap, resume/disposal, and rejection
recovery. Use synthetic browser request counting to prove coverage on all nine views, active repository tabs, preserved
filters and periods, no sync/provider writes, and full pending lifetime. Inspect EN/DE screenshots at 390/1440 px and
light/dark themes; test keyboard, accessible names, tooltip/focus return, and navbar overflow. Check all locale keys.

Follow [quickstart.md](quickstart.md) for exact affected package/root checks. Planning-only validation checks prose,
formatting stability, links, artifact completeness, and whitespace; application tests do not validate a design document.

## Complexity Tracking

No justified architectural violations. Existing server settings, API, schemas, migrations, socket protocol, toolchain,
provider integrations, Jobs timer, and release configuration remain outside this design.
