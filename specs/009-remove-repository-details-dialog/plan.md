# Implementation Plan: Repository Settings Navigation and Dialog Removal

**Branch**: `codex/88-repository-settings-navigation` | **Date**: 2026-11-10 | **Spec**: [spec.md](spec.md)

**Issue**: [#88](https://github.com/repovio/repovio/issues/88).

**Input**: Feature specification from `specs/009-remove-repository-details-dialog/spec.md`.

## Summary

Consolidate Repository details into existing pages, retain compatible legacy links, shorten the Repository navigation
entry to Alerts, and replace the Settings card stack/grid with five URL-addressable full-width secondary tabs.
Reuse current feature cards and request contracts; improve their responsive form presentation without backend changes.

## Technical Context

**Language/Version**: TypeScript, Node.js 26.13.0; pnpm 11.28.9.

**Primary Dependencies**: Existing Nuxt 4 SPA, Vue 3, Nuxt UI 4, Vue Router, Pinia, and query-kit dependencies; no upgrades.

**Storage**: Existing API/PostgreSQL resources unchanged; tab and draft state is client-only for a Settings visit.

**Testing**: Playwright Chromium E2E, existing Vitest suites, canonical formatting/documentation checks, lint/typecheck.

**Target Platform**: Existing web SPA, desktop and mobile, English/German, light/dark.

**Project Type**: pnpm/Nx web application monorepo.

**Performance Goals**: No new polling or backend requests for navigation; load each Settings section only on first visit.

**Constraints**: Preserve administrator guards, read-only Provider access, typed clients, existing field validation,
pending/error states, and unrelated work. No toolchain, schema, DTO, or authorization changes.

**Scale/Scope**: One Repository detail workflow, list/search entry points, five Settings sections, affected regressions.

## Constitution Check

Pre-research and post-design: PASS for the bounded user-requested planning scope.

- Architecture: existing Repository feature components, typed API composables, and route middleware reused.
- Providers/security: no outbound Provider writes, new endpoints, authorization changes, or secret persistence.
- State: existing resource contracts retained; inactive mounted sections retain drafts only within a Settings visit.
- Verification/localization: focused behavior tests and browser evidence required; English/German UI strings.
- Delivery: task generation and issue/planning-commit creation were separately approved on 2026-11-10. Issue #88 owns
  this scope; product implementation was separately approved on 2026-11-10. Merge, release, and deployment remain gated.
- Documentation: follow the explicit session/project instructions and `docs/coding-guidelines.md` for changed
  declarations. Explicit user instructions govern any conflicting inherited documentation conventions.

## Project Structure

### Documentation (this feature)

```text
specs/009-remove-repository-details-dialog/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── contracts/ui.md
├── quickstart.md
├── checklists/requirements.md
└── tasks.md
```

`tasks.md` was generated after separate user approval on 2026-11-10; implementation remains gated.

### Source Code (repository root)

- `apps/web/app/pages/repositories`: retain existing detail routes and administrator Settings guard.
- `apps/web/app/components/modules/repositories`: remove the obsolete dialog, retain detail shell/cards, and add focused
  Settings navigation/composition as needed without growing route files.
- Existing layout command palette, Repository route middleware, locale files, and affected web tests complete scope.

**Structure Decision**: Keep routing in existing pages/middleware, Settings UI in Repository feature components, typed
navigation state in a small feature helper/composable only if needed. No shared design-system extraction.

## Implementation Design

### Canonical entry points and compatibility

- Delete `details-dialog.vue`; remove list modal bindings, selected Repository state, close/history bookkeeping, and
  modal-only update/delete handlers. Keep list webhook metadata requests and badges, add dialog, and enable/disable.
- Use a real link for the explicit row action: administrator Settings, other roles Overview. Preserve localized labels
  and row-navigation exclusion. Names, row clicks, and command-palette results open Overview directly.
- Extend existing Repository middleware to redirect `/repositories?repository=<scalar>` with replace navigation, using
  an encoded ID and removing only `repository`. Preserve unrelated query/hash state and existing Settings-anchor rules.
  Empty or repeated values leave the list visible. Preserve legacy `/admin/repositories` redirects.

### Settings tabs and lifecycle

- Keep `/repositories/:id/settings`; select a section with optional `tab` query values `general`, `webhook`,
  `workflow-filters`, `members`, or `groups`. Bare Settings selects General. Unknown, empty, or repeated values are
  replaced by the same route without `tab`; retain unrelated query parameters and fragments.
- Render a secondary `UNavigationMenu` immediately under the primary Repository navigation, matching the Alerts
  category-navigation treatment. Use explicit active links, localized accessible navigation naming, horizontal overflow
  confined to the navigation strip, and the existing administrator route guard.
- Labels/order: General, Webhook, Workflow filters, Members, Group access. German: Allgemein, Webhook, Workflow-Filter,
  Mitglieder, Gruppenzugriff. Use feature-local locale keys; reuse existing labels where meanings match exactly.
- General links use the bare Settings address; other tabs push history with their `tab` value. Tab changes must not
  remount the Settings page. Keep existing parent Repository context alive across sections.
- Lazy-mount each selected section on first visit; retain mounted sections hidden during this Settings visit to preserve
  drafts, feedback, and awaited requests. Hidden panels must be absent from keyboard focus and the accessibility tree.
  Do not store drafts or generated secrets in browser storage. Dispose all sections on leaving Settings or changing ID.
- Load safe webhook metadata when Webhook first mounts, not for every tab. Existing scope-disposal checks remain;
  no completion for an old Repository may update a new visit. Shared Repository updates continue through detail context.

### Full-width presentation

- Render one card/section per selected tab with `min-w-0` and full available width; remove the two-column Settings grid.
  Keep one concise Settings heading and section descriptions; avoid duplicated Repository identity/description within
  editable General by adding a presentation option to the shared card, preserving Overview defaults.
- Workflow Filter and membership forms use visible labels and a consistent field/action row on wide screens, stacking
  below the existing medium breakpoint. Flexible fields use `min-w-0`; selects fill their allocated width; primary add
  actions show localized text beside icons. Group assignment/search/pagination follow the same spacing and action style.
- Keep tables in their own overflow containers, preserve pinned action columns, and make empty/error/pending states
  legible. Retain all existing validation and destructive confirmation behavior. Avoid application-wide card restyling.
- Change only the primary Repository navigation label to the existing Alerts/Warnungen translation where available,
  otherwise add a dedicated localized key. Keep `/security-alerts`, alert categories, domain naming, and role gates.

### Documentation and release metadata

- Update current handbook descriptions of entry points and Settings sections, preserving published archives and
  unrelated specifications. Remove locale keys only after proving no remaining consumers.
- Implementation must refresh Graphify AST and include one focused `repovio` patch Changeset per substantive task
  commit. This prose-only planning delivery needs no package Changeset or semantic graph rebuild; the repository
  pre-commit AST graph refresh still applies.

## Validation Strategy

Use [quickstart.md](quickstart.md). Migrate existing dialog regressions to page workflows rather than discarding their
behavior coverage. Add focused tab normalization/state-history tests, role checks, request-lifetime cases, and browser
screenshots for the reported 1102-pixel viewport plus mobile/desktop. No production Provider calls are required.

## Complexity Tracking

No new framework, persistent model, public API, or design-system abstraction. The query-selected tab contract avoids
introducing five additional route pages while preserving shareable destinations and the existing Settings guard.
