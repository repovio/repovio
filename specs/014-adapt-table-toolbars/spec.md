# Feature Specification: Responsive Table Toolbars

**Created**: 2026-11-22. **Status**: Proposed.

## User Scenarios & Testing

1. **Find controls (P1).** On Issues, the user sees breadcrumbs, summary metrics, table controls, then rows.
   Search, refresh, filtering, sorting, grouping, and column controls belong to the table they affect.
2. **Make room for rows (P1).** The rightmost breadcrumb button is a chevron without visible text. Activating it by
   mouse or keyboard smoothly hides the metrics. Activating it again restores them without resetting table state.
3. **Search from the keyboard (P1).** Ctrl+F focuses the visible table search. Typing narrows results; clearing the
   field restores them. A page without a table leaves the browser shortcut available.
4. **Use available space (P1).** With no visible intervening content, wide layouts share one row. Narrow layouts
   place the table controls on a separate row directly above the table.

### Edge Cases

- A hidden summary takes up no space; errors, presets, navigation, and unrelated actions remain reachable.
- An embedded table retains its repository scope and has no duplicate breadcrumb.
- Reduced-motion users can toggle immediately. Changing layout does not duplicate focus targets or search requests.

## Requirements

- Apply the same placement rule to all application pages with Querry-Kit table controls, including embedded views.
- All summary metric sections below a breadcrumb can collapse, including those on pages without a table.
- Label the toggle and search accessibly in the active language. Expose the current expanded state.
- Every table toolbar includes a working search across the table's dataset, including paginated results.
- Only merge adjacent toolbars where their actual content fits without clipping.

## Success Criteria

- At the annotated 1118 px viewport, expanded Issues metrics never separate the search field from the table.
- On desktop, collapsing the last intervening section permits a single row; at 390 px, all actions remain reachable.
- A keyboard user can focus search in one shortcut and toggle metrics in both directions without losing the query.

## Assumptions

Metrics start expanded. A collapsed section counts as absent for merging. Static report tables without a query
toolbar do not acquire query controls. Existing filters, permissions, and pagination continue to apply.
