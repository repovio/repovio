---
title: 'Awaiting approval'
description: 'Find provider approval gates and open their external approval screens.'
---

<a id="identify-approval-gates"></a>

## Identify approval gates

Open **Workflow runs → Awaiting approval** to view synchronized workflows paused for a human decision. Search by
workflow or repository and inspect repository, provider, and related pull/merge request context. The sidebar badge
reflects visible matching runs; membership restrictions apply to both the badge and table.

Use **Open pull request** for context, or **Approve in provider** to open the provider-owned workflow page. GitLab may
call the related change a merge request. Workflow approval is different from code-review or merge approval.

<a id="complete-the-provider-action"></a>

## Complete the provider action

Authenticate at the provider and use its approval controls if your provider account is authorized. Repovio never sends
an approval request. A webhook or reconciliation read must observe the updated provider state before the row disappears.
Refresh the stored queue afterward; an unchanged row immediately after approval may reflect synchronization delay.

An empty queue means no visible synchronized run currently needs approval, not that every repository is connected or
that your provider account has approval rights. On load failure, retry and inspect [Jobs](/docs/next/guide-jobs).
