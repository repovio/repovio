---
title: 'All runs'
description: 'Search, filter, and inspect retained workflow history without changing provider resources.'
---

<a id="browse-retained-runs"></a>

## Browse retained runs

Open **Overview → Workflow runs → All runs**. Results are scoped to accessible repositories and retained history. Use
repository, provider, status, and duration filters (duration is entered in seconds). All runs has no text-search box;
Needs attention adds search and detailed created/started columns. Sort columns, change visible columns, and paginate the
results. Clear filters if an expected run is missing.

Rows identify the workflow and repository, provider, normalized status, provider timestamps, and duration when supplied.
Queued or unfinished runs can lack completion time or final duration. Normalized states are `queued`, `running`,
`success`, `failed`, `cancelled`, `skipped`, and `unknown`. An unknown state must be checked at the provider.

<a id="open-a-run"></a>

## Open a run

Use the external row action to open the provider run and its logs. Repovio does not provide a separate editable run
screen, download provider artifacts, or synchronize full logs. Approve, rerun, cancel, or dispatch only at the provider
with your provider account. For current failures use [Needs attention](/docs/v2.0/needs-attention); for gates use
[Awaiting approval](/docs/v2.0/awaiting-approval).

<a id="missing-or-stale-history"></a>

## Missing or stale history

An empty table means no retained record matches the filters and your permissions. Retention can remove older runs. Check
repository enablement, memberships, workflow allow/deny patterns, and [Jobs](/docs/v2.0/guide-jobs). A page refresh
reloads stored data; it does not bypass the durable synchronization queue. Retry load errors after API recovery.
