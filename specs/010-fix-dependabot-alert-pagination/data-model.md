# Data Model: GitHub Dependabot Alert Pagination

The existing Repository Sync Request, Dependency Alert, and Security Alert Sync State keep their current schemas.

| Transient value               | Purpose                                                             |
| ----------------------------- | ------------------------------------------------------------------- |
| Configured API origin         | Trust boundary for authenticated continuation requests              |
| Current request URL           | Base for resolving a relative next link                             |
| Visited request URLs          | Detect pagination cycles within a single read                       |
| Accumulated Dependabot alerts | Complete provider collection passed to existing alert normalization |

The adapter returns a complete Dependabot collection to the synchronization service. Cursors exist only for the
duration of one read. A failed read uses the existing job handling, and a retry begins with the initial request.
