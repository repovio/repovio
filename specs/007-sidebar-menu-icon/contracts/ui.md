# UI Contract: Sidebar Menu Icon

- Surface: the dashboard navbar's responsive “Open sidebar” button, including the reported 982 × 1134 viewport.
- Closed-state symbol: `i-tabler-menu-2`, rendering three horizontal lines from the local Tabler collection.
- Preserve existing accessible labels, button semantics, focus behavior, toggle handlers, and dismissal behavior.
- Preserve existing desktop collapse/expand symbols through `ui.icons.panelClose` and `ui.icons.panelOpen`.
- Preserve current route, layout spacing, sidebar preferences, and English/German behavior.
- No new API endpoint, provider operation, data contract, or network dependency.
