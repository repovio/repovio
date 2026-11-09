# Research: Consistent Table Toolbars

## Evidence and scope

- Browser comments 1–5 mark inline controls on Issues, Pull requests, and all three alert lists; each requests
  the Workflow runs pattern. Comment 6 marks the separate User groups controls row and requests merging upward.
- `apps/web/app/components/modules/workflow-runs/table-page.vue` renders search plus grouped refresh, sorting,
  filtering, and column options in frame actions. It does not use a separate filter row.
- `apps/web/app/components/common/table-page-frame.vue` forwards actions to `LayoutPage` for global views and renders
  a local `data-table-toolbar` for embedded views.
- `apps/web/app/components/layout/page.vue` owns the breadcrumb `UDashboardToolbar` and responsive actions area.
- Work items and security alerts add labels/path/date inputs directly to that actions area.
- `admin/user-groups.vue` owns the page shell, while `modules/user-groups/table.vue` owns a second `QTableToolbar`.
- GitHub read-only inspection on 2026-11-09 found no matching open toolbar issue; no issue was created.
- Spec Kit templates and scripts are available; `.specify/extensions.yml` is absent, so before/after hooks do not run.

## Decision: Keep the reference toolbar arrangement

**Rationale**: The user marked control placement, not table content or summary cards. Retaining search and common
buttons while moving detailed criteria into filtering matches the actual Workflow runs source.

**Alternatives considered**: Widening controls or adding a permanent second row would retain the mismatch and crowding.
Changing the shared page shell globally would affect unrelated routes.

## Decision: Compose specialized inputs through public filtering slots

Installed `@querry-kit/nuxt-ui` 3.3.10 source was inspected in the base checkout's installed dependencies because this
worktree has no `node_modules`. Its `dist/module.mjs` maps `QTableFiltering` to
`runtime/components/table/filtering/index.vue`. Public slots include:

- `trigger`: `open`, `toggle`, `active`.
- `header`: `filtering`, `clear`, `toggleMode`.
- `items`, `item`, and `add`: existing structured-filter editing surfaces.

**Decision**: Add a small local common wrapper that composes `QTableFiltering` through its public `header` and
`trigger` slots. Render localized header/mode/clear controls plus a feature-supplied specialized-input slot in the header.
Leave default structured-filter items and add behavior intact. Forward the existing models, field metadata, and
shortcuts. Preserve trigger slot behavior while adding a specialized-active flag and a clear-specialized event.

**Rationale**: Existing refs and static predicates can remain unchanged. Date has no native field type in this installed
version; supported generic field types are Boolean, Number, Enum, and Select. Converting dates or nested labels into
generic fields would introduce unnecessary serialization and query changes. The public header slot provides a supported
composition surface without package-internal imports, dependency patches, or a second filtering button.

**Alternatives considered**: Replacing generic filtering would duplicate its editor. Importing internal components
would couple the feature to package structure. Moving only some inputs would leave inconsistent headers.

## Decision: Preserve query semantics and expose combined active/clear state

**Rationale**: Work items builds label constraints as AND, combines search with number/title predicates, and applies
`providerUpdatedAt` bounds at UTC `00:00:00.000Z` and `23:59:59.999Z`. Security alerts retains its existing location path
predicate and alert-kind scope. These predicates remain outside the generic filter group's OR/AND mode, as today.
Combined trigger state is generic active OR any specialized criterion. Clear resets generic and specialized criteria,
leaving search unchanged. Closing filtering changes visibility only. Preserve existing dashboard-preset watcher/reset
behavior and table preference ownership; do not introduce new persistence keys.

**Alternatives considered**: A single unified generic expression risks changing all-label matching and UTC boundaries.
Ignoring specialized active state would hide effective restrictions from the User.

## Decision: Move group frame ownership to the state owner

**Rationale**: The group table already owns search, sort, dialogs, pending actions, and refresh. Giving that component
the page frame allows its controls to fill actions directly. Keep route middleware and metadata in the route.

**Alternatives considered**: Teleport depends on rendered DOM targets. Duplicated parent state or imperative component
refs would add unnecessary cross-component coordination.

## Decision: Verify layout and predicates together

**Rationale**: Existing `page-layout`, `work-items`, `security-alerts`, and `user-groups` Playwright suites supply
mocked flows. Extend them for popover placement, active state, clear behavior, Shift+F, focus return, and exact request
constraints. Include repository detail suites for embedded scope and screenshots at the supplied viewport width.

**Alternatives considered**: Typechecking alone cannot detect wrapping, clipping, inaccessible controls, or misplaced rows.

## Remaining uncertainty

No unresolved design decisions. Installed dependency behavior must be rechecked after installing the pinned lockfile in
this worktree during implementation. No current runtime, browser, provider, Docker, or remote CI acceptance is claimed.
