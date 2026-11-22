# Implementation Plan: Responsive Table Toolbars

## Summary

Separate page actions, collapsible summaries, and table controls in the shared page layout. Classify routes by actual
content rather than route name. Preserve controls and query state across responsive changes.

## Technical Context

- Nuxt/Vue, Nuxt UI and the installed Querry-Kit packages; reuse query owners and existing locale catalogs.
- Inventory `UTable`, query toolbars, embedded lists, and KPI sections. Include the dashboard, work items, security
  alerts, workflow views, repositories, jobs, notification lists, providers, users, and user groups where applicable.
- Trace each search to its data source. For a paginated resource without search, use the supported query
  fields or add a scoped, tested read filter; filtering only the current page is insufficient.

## Constitution Check

Reuse the page shell and table frame. Preserve permissions and repository constraints. No provider writes, dependency
upgrade, or database migration is proposed. Implementation requires an active issue per repository policy.

## Project Structure

- `apps/web/app/components/layout/page.vue`: breadcrumb actions, rightmost accessible toggle, optional animated region.
- `apps/web/app/components/common/table-page-frame.vue`: separate table controls near the table; merge only across
  empty space when the available width accommodates both groups. Keep one live instance of each control.
- `apps/web/app/pages` and `apps/web/app/components/modules`: wire actual summaries, navigation, and query actions;
  keep errors and active filter removal outside hidden metrics.
- `apps/web/app/composables`: resolve Ctrl+F to the active search, with cleanup on navigation and native fallback.
- `apps/web/tests/e2e`: update superseded placement assertions and verify the new layout, search, and toggle.

See [layout contract](contracts/layout.md), [research](research.md), [state](data-model.md), and
[browser acceptance](quickstart.md).
