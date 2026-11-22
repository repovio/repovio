# Tasks: Responsive Table Toolbars

## Setup and foundation

- [x] T001 Inventory routes, nested tables, KPI regions, search support, and existing placement assertions in
      `specs/014-adapt-table-toolbars/contracts/layout.md`. Identify which action owner each route should use.

## US1: Controls adjacent to results

- [x] T002 [US1] Extend `apps/web/app/components/common/table-page-frame.vue` and
      `apps/web/app/components/layout/page.vue` with distinct summary and table control regions. Migrate the table
      routes from T001. Verify expanded Issues and embedded list ordering in `apps/web/tests/e2e/page-layout.spec.ts`.

## US2: Animated KPI disclosure

- [ ] T003 [US2] Add the rightmost accessible chevron and reduced-motion-aware disclosure to
      `apps/web/app/components/layout/page.vue`. Wire all identified KPI regions, including `apps/web/app/pages/index.vue`.
      Verify localized labels, focus, expanded state, and unchanged filters in `apps/web/tests/e2e/dashboard.spec.ts`
      and the affected monitoring tests.

## US3: Search every active table

- [ ] T004 [US3] Bind one labeled search per toolbar to the resource query under `apps/web/app/composables/api`.
      Route Ctrl+F to that visible input through a shared shortcut owner under `apps/web/app/composables/app`.
      Verify results across pagination, embedded scopes, tab changes, dialog focus, and native fallback in
      `apps/web/tests/e2e/page-layout.spec.ts`.

## US4: Adaptive shared row

- [ ] T005 [US4] Implement fit-based merging in `apps/web/app/components/layout/page.vue` and its table frame.
      Verify separate rows at narrow widths, a single row where possible, and correct layout after collapse, resize,
      and navigation. Assert no duplicated inputs or hidden actions in `apps/web/tests/e2e/page-layout.spec.ts`.

## Feature verification

- [ ] T006 Run the focused browser matrix in `specs/014-adapt-table-toolbars/quickstart.md`, inspect rendered pages,
      and record actual outcomes. Run affected web checks and address any scoped regressions.

## Dependencies and implementation strategy

T001 precedes T002. T002 establishes the placement contract for T003 and T004. T005 uses T003's visibility state;
T006 requires all four stories. Use Issues as the first complete layout fixture. Verify unrelated route families
independently once the shared implementation is stable.
