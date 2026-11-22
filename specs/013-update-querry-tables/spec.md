# Update Querry-Kit tables

## User scenarios and requirements

- P1: A maintainer can install the workspace without the high-severity Effect advisory and identify outstanding direct
  package updates. Preserve the pinned runtime, package manager, and compiler aliases.
- P2: A user can group Workflow Runs by status, Issues and Pull Requests by state, and Security Alerts by severity.
  A group count covers every matching authorized record, including records beyond the first page.
- P2: On each of those tables, pagination remains the initial mode. A user can switch to infinite scrolling and back.
  Preserve current filters, sorting, search, row links, and repository restrictions in both modes.

## Success criteria

An isolated frozen install passes dependency checks and audit. No hidden repository contributes group keys or counts.
Repeated loading does not duplicate rows. Changing a filter while loading cannot append stale results. English and
German controls remain operable by keyboard on desktop and narrow screens. An empty result and a failed append leave
navigation usable.
