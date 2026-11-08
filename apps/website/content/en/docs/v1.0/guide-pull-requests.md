---
title: 'Pull requests'
description: 'Browse synchronized pull requests, filters, and read-only details.'
---

> Archived source snapshot. Product labels use Repovio. Use the configuration identifiers and container references from
> this release's tagged deployment files unchanged.

<a id="browse-and-filter"></a>

## Browse and filter

Open **Overview → Pull requests**. Lists, summaries, filter choices, and details use repository memberships. Search by
title or number; filter by provider, repository, lifecycle, author, assignee, draft state, workflow status, approval
requirement, labels, and updated time. Updated date boundaries are inclusive UTC. Multiple selected labels must all
match. Change sorting, visible columns, and pagination with the table controls. Summary cards count open changes,
drafts, failed workflows, and workflow approvals. GitLab uses the term merge request. Details show source/target
branches, draft state, lifecycle, and aggregate workflow status. The aggregate uses the newest run for each linked
workflow; failed results take precedence over running, pending, cancelled, successful, and unknown results. A workflow
approval requirement is not code-review approval, merge approval, or a merge-conflict indicator.

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
