# Implementation Plan: Repository Detail Navigation and Table Interactions

**Branch**: `codex/62-repository-detail-navigation` | **Date**: 2026-11-09 | **Spec**: [spec.md](spec.md)

**Issue**: [#62](https://github.com/repovio/repovio/issues/62)

**Input**: Feature specification in `specs/002-repository-detail-navigation/spec.md`.

## Summary

Extend the existing Repository detail page into a shared parent with six addressable child sections. Reuse the current
activity tables through a small layout frame that supports standalone and embedded rendering. Scope their existing read
queries and state to the selected Repository; omit global metrics. Add native table-row navigation for existing record
detail destinations and consistent hover feedback across the complete table inventory.

This command delivers Phase 0 research and Phase 1 design artifacts only. The later instruction invoking `speckit-plan`
authorizes this design phase beyond the earlier specification-only delivery boundary. It does not authorize task
generation, product changes, commits, a PR, or deployment. The specification and its reviewed checklist remain unchanged.

## Technical Context

**Language/Version**: TypeScript through the existing compiler aliases; Vue SFCs; Node.js 26.13.0; pnpm 11.28.9.

**Primary Dependencies**: Existing Nuxt 4.6.x, Vue 3.5.x, Nuxt UI 4.12.x, Pinia, Vue I18n, Axios, and Query Kit packages.
Preserve the manifest ranges, compiler aliases, and lockfile. Installed Nuxt UI 4.12.0 row behavior was inspected.

**Storage**: Existing Query Kit browser persistence and route pagination. Existing PostgreSQL data is read through the
API; no Prisma models, migrations, retention changes, or new persistent entities.

**Testing**: Existing Vitest unit/composable tests and Playwright Chromium scenarios with mocked API responses. Existing
formatting, documentation, ESLint, locale parity, Nuxt typecheck, and affected Web targets remain required.

**Target Platform**: Existing Nuxt SPA, modern desktop/mobile browsers, 375-pixel and 1440-pixel acceptance widths,
light/dark themes. English/German visual acceptance; preserve all eight shipped locales.

**Project Type**: Frontend feature within the existing pnpm/Nx Nest API and Nuxt Web monorepo.

**Performance Goals**: One section activation from any Repository section; one detail navigation per row activation.
Do not prefetch inactive section tables or fetch global summaries for scoped views. Retain server pagination and existing
search debounce; no new performance service-level objective is introduced.

**Constraints**: Existing Repository authorization, role guards, read-only Provider access, pending/error behavior,
quick-detail addresses, and global table behavior. No public API or dependency changes.

**Scale/Scope**: Six Repository sections, three security categories, four navigable resource families, 16 existing table
components, eight locales. Only issue #62 and its direct frontend dependencies are covered.

## Constitution Check

Both the pre-research and post-design reviews pass. No constitutional exception is required.

| Gate                                      | Pre-research | Post-design evidence                                                                        |
| ----------------------------------------- | ------------ | ------------------------------------------------------------------------------------------- |
| Approved architecture and bounded scope   | Pass         | Reuse existing modules; only issue #62; no product execution in this command                |
| Read-only Provider integrations           | Pass         | No new Provider calls; existing local configuration and sync behavior retained              |
| Authorization and secret protection       | Pass         | Parent Repository access load, existing role middleware, unchanged ability-aware API reads  |
| Durable synchronization and notifications | Pass         | No new jobs, retry semantics, notification behavior, or Provider-side mutations             |
| Typed and localized interfaces            | Pass         | Typed context/props; existing DTOs; preserve locale parity and English/German acceptance    |
| Verified and documented delivery          | Pass         | Focused unit/browser plan, declaration documentation, canonical formatting and scope checks |
| Toolchain and repository lifecycle        | Pass         | Preserve pinned tools, selected worktree, explicit commit policy, and release PR boundaries |

The supplied `AGENTS.md` instructions and canonical coding guidelines govern implementation documentation and
verification. No changes to the constitution, coding standards, or glossary are necessary for this feature.

## Project Structure

### Documentation for This Feature

```text
specs/002-repository-detail-navigation/
├── spec.md
├── checklists/requirements.md
├── plan.md
├── research.md
├── data-model.md
├── contracts/ui.md
└── quickstart.md
```

`tasks.md` belongs to a later `speckit-tasks` invocation and is intentionally absent. The ignored local feature selector
continues to point to this directory. The setup helper reports the feature slug as `BRANCH`; the actual Git branch is
`codex/62-repository-detail-navigation` and must not be renamed to the feature slug.

### Application Layout for Later Implementation

```text
apps/web/app/
├── pages/repositories/[id].vue
├── pages/repositories/[id]/{index,workflow-runs,issues,pull-requests,security-alerts,settings}.vue
├── components/common/table-page-frame.vue
├── components/modules/repositories/details/
├── components/modules/{workflow-runs,work-items,security-alerts}/table-page.vue
├── composables/api/repository-detail.ts
├── composables/app/table-row-navigation.ts
├── types/repository-detail.ts
└── app.config.ts
```

The existing layout shell, API adapter, guards, raw-table components, locale files, and tests are reused. This tree names
ownership boundaries rather than requiring new copies of existing cards. Keep route files thin and feature sections in
named module components. A shared row guard may live beside the presentation composable; no generic table engine is added.

## Design

### Repository Parent and Sections

- Keep `[id].vue` as the route coordinator. A feature detail shell renders the existing `LayoutPage`, action toolbar,
  navigation toolbar, and nested child slot. Keep one page shell and one primary heading per screen.
- Provide a typed, route-local Repository context from `composables/api/repository-detail.ts`. It owns Repository detail,
  authorization/load state, and existing update/refresh/sync behavior. Children consume readonly state and typed update
  operations. Do not add a global selected-Repository store.
- Key the parent lifecycle by Repository ID. Clear previous data and invalidate request generations before loading a new
  identity; gate child mounting on a successful Repository detail read. Guard each late response and unmount.
- Use six child routes defined in [the UI contract](contracts/ui.md). Overview retains metadata, synchronization status,
  and permitted previews; its general card is read-only. Settings owns the editable general card and existing webhook,
  Workflow Filter, membership, and group-grant cards. Optional webhook loading/error state belongs to Settings.
- Use existing `admin` middleware for Settings and `manager` middleware for Security Alerts. Keep role-filtered section
  links and existing API authorization. Existing middleware redirects unauthorized roles to `/`; preserve that behavior.
- Make navigation a single horizontal, scrollable row with exact Overview matching, active-link semantics, and visible
  keyboard focus. Keep long names and German labels within available width. Update preview section links to child routes;
  retain record links, quick dialogs, legacy redirects, and existing local deletion behavior.

### Activity Tables and Query Lifetimes

- Add `CommonTablePageFrame` with optional `embedded` mode and existing title/breadcrumb/actions/default slots. In
  standalone mode, forward the existing actions into `LayoutPage`; in embedded mode, show a local `data-table-toolbar`
  and shell-free content area. It does not own API state or intercept table events.
- Keep the existing three table modules and their typed columns, filters, sorting, pagination, summaries, and errors.
  Add optional `repositoryId` and `embedded` props. Scoped child routes supply both; existing global callers keep defaults.
- AND immutable Repository scope with existing static search constraints. Security adds immutable kind. Query Kit then
  ANDs the static filter with user filtering. Hide Repository/Provider selectors in scoped mode; contradictory stored
  filters may yield no results but can never remove scope. Ignore global dashboard presets in scoped mode.
- Preserve global persistence names. Scoped names are `repository:<id>:workflow-runs`, `repository:<id>:issues`,
  `repository:<id>:pull-requests`, and `repository:<id>:security-alerts:<kind>`.
- Key child table instances by this scope tuple, excluding `page` and ordinary filters. Section links use only their own
  path; category links carry only normalized kind. Direct addresses retain an explicit valid page. Reset category
  navigation to page 1, normalize invalid pages, and clamp out-of-range successful responses before presenting an empty
  result caused solely by stale pagination. Preserve history restoration within the same context.
- Reuse Query Kit's request versioning. Clear or hide retained rows after scoped load errors. Feature-owned supporting
  data requests use generation/unmount guards, including A-to-B-to-A transitions. Do not modify the Query Kit package.
- Scoped mode skips summary cards, summary requests, and all-Repository choice loading. Existing permission-filtered
  author/label/milestone and security suggestions remain usable without being presented as Repository metrics.

### Security Category and Availability

- Use `kind=DEPENDENCY|CODE|SECRET` on the security section address. Normalize absent/invalid input to `DEPENDENCY` using
  replacement; user category selection pushes history. A kind change remounts the scoped table and discards inherited page.
- Filter existing availability metadata by both Repository ID and kind. Show known unavailability with a safe reason;
  show an unknown/not-yet-synchronized indication when metadata is absent. A failed metadata request is an error,
  not evidence of no findings. A successful available list with zero records is the ordinary empty state.
- Keep the existing globally permission-filtered supporting endpoint and all backend DTOs unchanged.

### Table Activation and Presentation

- Use `UTable @select` only at the Repository, Work Item, and Security Alert table locations. Resolve destinations from
  `row.original.id` and the existing resource family. Reuse native row focus and Enter/Space behavior; preserve title
  links and their native open-in-new-tab semantics.
- Share a typed row-navigation composable for destination callbacks and custom interactive exclusions. Native Nuxt UI
  already ignores links, buttons, inputs, labels, selects, and textareas. Also exclude contenteditable controls, custom
  interactive roles, and explicit `data-row-navigation-ignore` controls/action groups. Do not check `defaultPrevented`
  as a blanket veto after Nuxt UI emits: it is already true for legitimate row activations.
- Prevent disabled/pending action-group clicks from falling through to navigation. Do not toggle TanStack row selection,
  synthesize Provider destinations, or introduce row actions in the hover-only inventory.
- Extend global table theme slots for actual body data rows identified by `data-selected`. Use the same semantic hover
  color on rows and pinned cells. Preserve existing selected/pending/focus feedback. Add a pointer cursor only for actual
  data rows with detail destinations, not headers or placeholder rows.
- Apply equivalent utility styles to raw data rows in Dashboard latest runs and the shortcut dialog. The full 16-component
  inventory and current destinations are recorded in [research.md](research.md).

### Interfaces and Compatibility

[contracts/ui.md](contracts/ui.md) defines addresses, query normalization, roles, table props, detail context, events,
existing read requests, and state behavior. [data-model.md](data-model.md) separates unchanged domain data from transient
presentation state. No API schema, Prisma model, Provider integration, or dependency changes are planned.

Reuse existing translated labels where possible. New messages must preserve key parity across en, de, es, fr, it, nl,
pl, and pt; primary visual scenarios use English and German. Existing global list layout and quick-detail behavior remain.

## Validation and Later Implementation Sequence

1. Introduce route-local detail context, shared shell, six routes, Overview/Settings separation, guards, and preview
   destinations. Validate direct links, six/five/four visible sections, retained administration, stale detail responses,
   and existing quick-detail/deletion scenarios before proceeding.
2. Add the table frame and scope props, fixed filters, persistence/lifecycle isolation, security categories and availability,
   and conditional supporting requests. Verify request constraints and page/history behavior using two Repositories,
   including conflicting stored filters, late responses, failed loads, unavailable metadata, and category switches.
3. Add native row activation, shared custom-control guards, and all-table hover. Verify one navigation, control isolation,
   keyboard focus/activation, no new actions in other tables, pinned cells, locales, responsive layouts, and both themes.

These are design increments for later task generation, not an executed task list or permission to commit. Future product
changes require focused tests and exactly one focused `repovio` Changeset per substantive implementation commit when
committing is explicitly requested. No Changeset is needed for the current planning-only output.

Run the focused and affected-project checks documented in [quickstart.md](quickstart.md). Use existing tests for baseline
compatibility, add behavior-focused unit and browser coverage for changed boundaries, and inspect synthetic screenshots.
Mocked browser checks verify frontend behavior, not backend authorization or live Providers. No Provider, Docker, release,
or deployment behavior is claimed by this plan. Rollout is a normal reviewed Web change with no data migration; reverting
it restores the previous frontend without requiring database rollback.

## Complexity Tracking

No constitutional violations or complexity exceptions. The only shared additions are a small layout frame, route-local
detail context, and typed presentation navigation helper. The existing API, Query Kit engine, state store, and permission
model remain the owners of their current responsibilities.
