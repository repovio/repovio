---
title: 'Dashboard'
description: 'Read current workflow health, work summaries, and historical charts.'
---

<a id="scope-and-date-range"></a>

## Scope and date range

Every card and chart uses only repositories the signed-in user may read. Select **Last 7 days**, **Last 30 days**, or
**Last 90 days** for historical statistics. The time range changes completed-run totals, success/error trends, duration,
and status distribution. Current queue and work-item counts remain current-state summaries. Select **Refresh** to reload
the dashboard; the control remains busy until its requests settle.

<a id="summary-and-navigation"></a>

## Summary and navigation

The workflow summary contains success rate/completed count, active queued/running count, median completed duration,
current failures, awaiting-approval count, and runtime totals. Follow current failures to
[Needs attention](/docs/next/needs-attention), or pending approvals to
[Awaiting approval](/docs/next/awaiting-approval). Issue and pull-request summaries link to their own filtered lists.
Managers and administrators also see security-alert summaries for repositories they manage.

The active-runs card opens a removable `preset=active` filter; current work-item cards also open removable presets.
Manual filter changes release the preset.

The trend chart compares successful and failed completed runs over time. Status distribution groups normalized states.
**Latest runs** shows recent workflow activity with links to the provider. It is not an embedded provider log viewer.
Repovio cannot approve or rerun workflows from any dashboard widget.

<a id="empty-and-partial-results"></a>

## Empty and partial results

No completed runs in the selected period produces empty charts. Zero current failures is different from a missing
provider connection. If a request fails, an error banner identifies the partial load while available sections remain
visible. Refresh after recovery, or inspect [Jobs](/docs/next/guide-jobs) and the repository's last synchronization.
