# Layout decisions

- `LayoutPage` currently renders actions beside the breadcrumb; `CommonTablePageFrame` provides a separate toolbar only
  when embedded. Extend those boundaries rather than duplicating breakpoint logic across routes.
- Work items currently render the active preset and summary after the actions slot. Collapse only the summary; an
  active preset must remain clearable. Treat remaining visible content as a barrier to merging.
- The implemented `006-unify-table-toolbars` assumed a shared header on monitoring pages. The new rule supersedes
  its placement assertions while retaining specialized filters, translated labels, and embedded scope.
