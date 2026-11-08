---
title: 'Needs attention'
description: 'Investigate workflow contexts whose newest completed run failed.'
---

> Archived source snapshot. Product labels use Repovio. Use the configuration identifiers and container references from
> this release's tagged deployment files unchanged.

<a id="current-failures"></a>

## Current failures

Open **Workflow runs → Needs attention**. Unlike historical failed runs, this queue keeps actionable workflow contexts
whose newest completed run failed. A newer successful run, a closed related change, or a merged change removes the
context after synchronization. Older branch-scoped runs can be associated with the pull/merge request active when they
started. The sidebar badge uses the same permission-scoped queue.

Search and use the available table controls to narrow the workflow/repository context. Open its external run link for
logs and remediation. Open the related change when present. Repovio never reruns, cancels, edits, or dispatches
workflows.

<a id="diagnose-missing-or-stale-entries"></a>

## Diagnose missing or stale entries

An empty result can be correct after a successful replacement run. For older failures use
[All runs](/docs/v1.0/workflow-runs). Clear filters and check repository memberships before treating an absent context
as missing data. Provider actions are observed asynchronously; inspect [Jobs](/docs/v1.0/guide-jobs) if state stays
stale. Loading and request errors are separate from an empty queue; retry after API recovery.
