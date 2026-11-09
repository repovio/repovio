# Data Model: Consistent Table Toolbars

No persistent entities, schema migrations, API resources, or DTO changes.

## Existing presentation state

| State                     | Owner                      | Invariant                                                |
| ------------------------- | -------------------------- | -------------------------------------------------------- |
| Search                    | Existing feature table     | Preserve debounce, trim, and query mapping               |
| Selected labels           | Work items table           | Every selected label contributes an AND constraint       |
| Selected path             | Security alerts table      | CODE only; preserve existing location predicate          |
| Updated from/to           | Existing feature table     | Inclusive UTC day bounds; blank values add no constraint |
| Generic filtering         | Existing `useTable`        | Preserve typed criteria and table preferences            |
| Sort and column state     | Existing `useTable`        | No reset caused by moving UI                             |
| Group search/sort/dialogs | Existing groups table      | Exactly one owner after moving frame ownership           |
| Filter surface open       | Local filtering component  | Closing/dismissal changes visibility only                |
| Effective active filter   | Derived presentation state | Generic OR labels/path/date criteria active              |

## Relationships and transitions

- Specialized criteria remain combined with generic filtering through the existing table query mechanism.
- Repository-scoped views retain mandatory Repository constraints independently of user-editable criteria.
- Opening or closing filtering neither mutates criteria nor triggers a new options fetch.
- Changing criteria retains existing pagination reset and dashboard-preset release behavior.
- A group dialog action keeps its existing pending, success-refresh, and error transitions.
- No new persistence keys or provider operations are introduced.
