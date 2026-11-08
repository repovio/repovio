---
title: 'Issues'
description: 'Browse synchronized issues, filters, and read-only details.'
---

> Archived source snapshot. Product labels use Repovio. Use the configuration identifiers and container references from
> this release's tagged deployment files unchanged.

<a id="browse-and-filter"></a>

## Browse and filter

Open **Overview → Issues**. Lists, summaries, filter choices, and details use repository memberships. Search by title or
number; filter by provider, repository, lifecycle, author, assignee, milestone, labels, and updated time where
available. Updated date boundaries are inclusive UTC. Multiple selected labels must all match. Change sorting, visible
columns, and pagination with the table controls. Summary cards count open, recently updated, assigned, and stale issues.
Initial synchronization reads every open issue and closed issues updated in the preceding 90 days. Staleness helps find
unattended open work; it does not change provider state.

<a id="inspect-details"></a>

## Inspect details

Select a row to open its Repovio detail page. Review identity, repository, author, assignees, labels, milestone,
provider state, timestamps, and sanitized Markdown description. Linked workflow context is shown when available.
Embedded HTML and unsafe markup are removed. Comments, reactions, attachments, and code diffs are not synchronized. Use
the provider link to comment, assign, label, close, review, approve, or merge. Repovio performs none of those writes.

<a id="synchronization-and-failures"></a>

## Synchronization and failures

Signed webhooks enqueue repository-specific reads after a 15-second coalescing window; 30-minute reconciliation covers
missed events. A browser refresh reloads stored data. If a record is absent, clear filters, check repository enablement
and membership, and inspect [Jobs](/docs/v1.0/guide-jobs). Retention can remove old closed records. An inaccessible
detail page can indicate revoked access or a removed record; return to the list. Retry request failures after API
recovery.
