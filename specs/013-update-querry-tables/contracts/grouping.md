# Grouping contract

Allow only status for Workflow Runs, state for Issues and Pull Requests, and severity for Security Alerts.
The flat-list response remains backward compatible. Return group keys and counts separately from leaf DTOs.
Reject unsupported fields at the API boundary. Opening a group applies the same filter context plus the typed group
value. Counts and leaves use the same authorization predicate; Security Alerts retain their manager restriction.
