---
title: 'Needs attention'
description: 'Investigate workflow contexts whose newest completed run failed.'
---

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
[All runs](/docs/next/workflow-runs). Clear filters and check repository memberships before treating an absent context
as missing data. Provider actions are observed asynchronously; inspect [Jobs](/docs/next/guide-jobs) if state stays
stale. Loading and request errors are separate from an empty queue; retry after API recovery.

## Removed and disabled workflows

After synchronization confirms a workflow is removed or disabled, its runs leave Needs attention, Awaiting approval,
and current active-run counters. All runs retains their actual outcomes and displays a lifecycle badge with the latest
confirmed check time. Historical metrics and configured retention remain unchanged. Reactivation restores current views.

GitHub and supported Gitea versions expose individual workflow lifecycle metadata. Forgejo Actions and GitLab CI/CD
repository-level disabling is supported; disappearance of an individual Forgejo definition or GitLab pipeline name is
inconclusive. Unknown states, missing runs, and inaccessible APIs never prove removal. A failed check preserves the last
confirmed state; inspect Jobs for synchronization failures.

The additive database migration must run before the updated application. Existing workflows start as Unknown and are
classified by the next workflow synchronization. Application rollback may leave the additional columns in place.
