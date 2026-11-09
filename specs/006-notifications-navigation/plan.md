# Implementation Plan: Simplify Notifications Navigation

**Branch**: `codex/notifications-navigation`, based on `origin/main` at `19dada5` | **Date**: 2026-11-09 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/006-notifications-navigation/spec.md`

## Summary

Replace the Notifications navigation group with one localized bell-icon link to `/notifications`. Reuse that destination
in navigation search and the command palette. Remove the administrative Delivery history link from the navbar popover;
keep the existing channel toolbar button as the sole in-app entry point. Preserve history URLs, administrator guards,
personal recent notifications, and channel functionality.

The user approved task generation, then explicitly requested implementation and PR creation. Reuse this existing Codex
worktree. No matching active issue exists; the feature PR tracks this bounded request, with closed issue #65 as context.
Do not create a new issue, merge, deploy, or start unrelated work.

## Technical Context

**Language/Version**: Existing TypeScript and Vue SFCs; Node.js 26.13.0, pnpm 11.28.9.

**Primary Dependencies**: Existing Nuxt 4 SPA, Vue 3, Nuxt UI, vue-i18n, Pinia, and shared navigation composables.

**Storage**: No persisted data or schema changes.

**Testing**: Existing Playwright Chromium navigation/notification suites; focused web checks and visual inspection.

**Target Platform**: Browser SPA, expanded/collapsed desktop sidebar and mobile navigation, English and German.

**Project Type**: Frontend change within the pnpm/Nx monorepo.

**Performance Goals**: One menu selection opens channels; no additional API requests or dependencies.

**Constraints**: Preserve authorization, accessible names, existing routes, loading/error states, and provider read-only
behavior. Keep localized labels and existing translation keys still used by toolbar and breadcrumbs.

**Scale/Scope**: Shared navigation definition, one navbar popover link, focused regression tests and current documentation
if it describes the removed menu structure. No backend, API contract, persistence, toolchain, or delivery changes.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Gate                                    | Before research                          | After design                                                    |
| --------------------------------------- | ---------------------------------------- | --------------------------------------------------------------- |
| Bounded scope and approved architecture | PASS: requested navigation slice only    | PASS: no backend work                                           |
| Read-only providers                     | PASS: no provider calls                  | PASS: no provider changes                                       |
| Authorization and secrets               | PASS: retain existing role gates         | PASS: toolbar and direct history remain admin-only              |
| Durable delivery                        | PASS: no delivery changes                | PASS: no persistence changes                                    |
| Localization and accessibility          | PASS: existing labels and link semantics | PASS: locale, keyboard, mobile checks specified                 |
| Verification                            | PASS: focused browser checks planned     | PASS: quickstart defines evidence; implementation still pending |
| Issue order and approvals               | Direct implementation/PR request         | PR tracks requested scope; no new issue                         |

No constitution exceptions proposed. Existing glossary and coding guidelines disagree on some historical contracts and
TSDoc tag style; this UI plan changes neither those rules nor affected API declarations.

## Project Structure

### Documentation (this feature)

```text
specs/006-notifications-navigation/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── checklists/requirements.md
└── contracts/navigation.md
```

[tasks.md](tasks.md) contains the requested task breakdown and verified completion state.

### Source Code (repository root)

```text
apps/web/app/composables/app/navigation-items.ts
apps/web/app/components/modules/notifications/navbar-popover.vue
apps/web/app/pages/notifications/index.vue
apps/web/app/pages/notifications/history.vue
apps/web/tests/e2e/notifications.spec.ts
apps/web/tests/e2e/page-layout.spec.ts
apps/web/tests/e2e/dashboard.spec.ts
apps/website/content/en/docs/next/navigation.md
apps/website/content/de/docs/next/navigation.md
```

**Structure Decision**: Keep shared route ownership in `useNavigationItems`. Replace the notifications array/group with
one `AppNavigationItem`: localized `layout.notifications`, `i-lucide-bell`, `/notifications`, active for the route and its
nested pages. Feed it through `toMenuItem` and once into `navigationSearchItems`. No shell-specific duplicate links.
Remove only the administrative history `UButton` from the navbar popover. Preserve its personal history/device behavior.
Existing notification pages are validation targets; change them only if a focused regression demonstrates necessity.
Update tests that expect an expanded Notifications region or click the removed child link; use the toolbar instead.
Preserve attached comments and JSDoc when replacing the computed declaration. Update the current English/German
handbook navigation pages that describe the submenu and bell-popover history link; preserve released archives.

## Complexity Tracking

No violations or additional abstractions required.
