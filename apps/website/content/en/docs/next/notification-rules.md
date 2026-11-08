---
title: 'Event subscriptions'
description: 'Choose events, repository filters, and workflow patterns inside a channel.'
---

<a id="configure-subscriptions"></a>

## Configure subscriptions

System administrators open a [channel](/docs/next/notifications) and configure event subscriptions in its create/edit
dialog. The legacy `/notifications/rules` route redirects to Channels; there is no separate rules-management screen.
This page documents that channel-dialog workflow.

Choose workflow success, failure, or recovery; pull-request opened, closed, reopened, or merged; issue opened, closed,
or reopened; and supported dependency, code, or secret-alert opened/resolved events. Select repository restrictions for
each event. An empty repository selection means all applicable repositories, not none. Workflow-name patterns apply only
to workflow events. Save the channel to persist its subscriptions.

<a id="preview-matches"></a>

## Preview matches

Preview is available only when at least one workflow event is selected; non-workflow-only subscriptions disable it. Use
preview to inspect up to 20 recent matching workflow records before saving. A match confirms the current filter
conditions against retained data; it does not enqueue a delivery. Distinguish no matches from never-synchronized,
synchronization-failed, or partial-data notices. Broaden the repository/pattern selection or inspect
[Jobs](/docs/next/guide-jobs) when source data is unavailable.

Initial synchronization establishes a silent baseline for lifecycle events and does not flood channels with old
open/closed transitions. Later observed transitions can produce deliveries. Provider availability and read permissions
limit which security events can be observed. Repovio never changes provider resources to make a rule match.

If preview or save fails, retain the form values, check API status, and retry. An empty preview alone does not prove
that no future event will match or that every selected repository has synchronized successfully.
