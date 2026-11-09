# UI Contract: Consistent Table Toolbars

## Routes

| Route                  | Visible header controls                | Specialized filtering       |
| ---------------------- | -------------------------------------- | --------------------------- |
| `/issues`              | Search, refresh, sort, filter, columns | Labels, updated from/to     |
| `/pull-requests`       | Search, refresh, sort, filter, columns | Labels, updated from/to     |
| `/alerts/dependencies` | Search, refresh, sort, filter, columns | Updated from/to             |
| `/alerts/code`         | Search, refresh, sort, filter, columns | Path, updated from/to       |
| `/alerts/secrets`      | Search, refresh, sort, filter, columns | Updated from/to             |
| `/admin/user-groups`   | Search, sort, New group                | No added monitoring filters |

Breadcrumbs share the same page header as the visible controls. At narrower widths controls may wrap without clipping.
Global lists retain one `data-page-toolbar`; embedded lists retain their local `data-table-toolbar`.
The groups page has no second content-level toolbar.

## Filtering surface

- Existing generic fields and specialized controls appear through the same filtering trigger.
- Preserve generic criteria, all-selected-labels matching, current path matching, and inclusive UTC date boundaries.
- Reuse existing localized accessible names; add EN/DE strings only when new grouping text is needed.
- Active indication includes specialized criteria when generic filtering is empty.
- Closing, reopening, or dismissing the surface must not lose criteria.
- Clear resets generic and specialized criteria together; search remains unchanged. Generic OR/AND mode applies
  only to its existing structured group; specialized constraints remain AND-combined.
- Preserve the existing Shift+F shortcut and avoid duplicate filtering surfaces.
- Preserve keyboard opening, Escape dismissal, focus return, and control tab order.
- Repository-scoped surfaces cannot switch Repository or Provider and keep alert kind fixed.

## Group administration

The table component owns the page frame, query state, and dialogs. The route retains admin middleware and page metadata.
Search and sorting retain their bindings and shortcuts. New group opens the existing dialog. Member management,
rename, deletion confirmation, errors, pagination, and pending states keep their existing behavior.

## Network compatibility

No endpoint, request schema, permission, or provider-call changes. Request assertions must demonstrate the same
constraints for equivalent inputs before and after the layout change. Refresh awaits all existing supporting requests.
