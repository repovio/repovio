---
title: 'Repositories'
description: 'Track repositories, inspect activity, and configure local synchronization and access.'
---

<a id="browse-and-open-details"></a>

## Browse and open details

Open a repository name, noninteractive row area, or global-search result to reach Overview. The explicit row action
opens Settings for system administrators and Overview for other authorized users. Repository navigation includes
Overview, Workflow runs, Issues, Pull requests, Alerts, and Settings. Activity pages retain repository scope and offer
filtering, sorting, pagination, and row navigation. Alerts require management permission; Settings is administrator-only.
The provider link opens the external repository. Old `?repository=` links redirect to the full Overview page.

Overview shows general information, retention, last synchronization/data age, interval, current job, and recent activity.
Pending/running jobs show progress; warnings and failures include categorized safe errors.

<a id="add-and-maintain-tracking"></a>

## Add and maintain tracking

Only system administrators add repositories. Select an enabled provider account, wait for discovery, and select one or
more untracked repositories. Already tracked repositories are excluded. If part of a multi-add fails, successful
selections remain added and only failed selections remain for retry. An empty provider list requires connecting an
enabled [provider account](/docs/next/provider-accounts) first.

Administrators can enable/disable tracking, **Refresh provider data**, and queue a read-only synchronization. Repository
identity uses the provider account and stable provider repository ID. Renames/transfers preserve history, filters,
memberships, and channels; metadata refresh rejects a different ID at the old path rather than reassigning it. Disabled
repositories retain stored data but stop participating in synchronization.

<a id="repository-settings-sections"></a>

## Repository Settings sections

Repository Settings has five secondary tabs. Each section uses the available content width; forms stack on narrow
screens. Tab links can be shared and restored with reload or browser Back/Forward. General is the default.

| Section          | Purpose                                 | Address                      |
| ---------------- | --------------------------------------- | ---------------------------- |
| General          | General retention overrides             | `/repositories/:id/settings` |
| Webhook          | Repository webhook configuration        | `?tab=webhook`               |
| Workflow filters | Allow/deny workflow patterns            | `?tab=workflow-filters`      |
| Members          | Direct user access and repository roles | `?tab=members`               |
| Group access     | Additive local group access             | `?tab=groups`                |

Unsubmitted inputs and pending requests remain attached to their section while switching tabs during the same Settings
visit. Leaving Settings or opening another Repository clears those drafts, including generated webhook secrets. Do not
rely on tab switching to save changes; use the section's save or assignment action.

The quick-detail dialog has been removed. Existing full detail pages retain refresh, synchronization, Provider links,
and local deletion controls. Viewers and managers cannot access Settings by changing its URL.

<a id="retention-filters-and-memberships"></a>

## Retention, filters, and memberships

Administrators set separate workflow-run, issue, and pull-request retention overrides, each from 1 to 3650 days. An
empty value restores the corresponding [system default](/docs/next/settings-system). Workflow filters accept **ALLOW**
and **DENY** glob patterns; deny takes precedence. Add nonempty patterns or remove existing ones. Restrictive filters
can explain absent runs.

In memberships, add a non-administrator user as Viewer or Manager, change their repository role, or remove access.
Administrators are excluded from member selection because they already have unrestricted access. A global Manager still
needs Manager membership for repository-management capabilities such as security alerts.

<a id="webhooks-and-failures"></a>

## Webhooks and failures

The repository webhook card shows callback URL, configured state, provider instructions, and last delivery. It can
generate/copy a secret, save configuration, rotate with explicit confirmation, or remove configuration. A missing public
URL must be fixed before provider registration. Secrets are shown only during configuration; keep them in a secret
manager. Follow [Repository webhooks](/docs/next/provider-webhooks) for setup and verification.

Viewers and managers inspect read-only Repository metadata in Overview; Settings remains administrator-only. Retry
load/save errors after recovery and inspect [Jobs](/docs/next/guide-jobs) for synchronization failures.

<a id="local-user-and-group-management"></a>

## Local access groups

In a repository’s Group access section, select a group and assign Viewer or Manager; change the role or remove the
assignment there. Direct and group grants combine, with Manager winning over Viewer. Manager capabilities still require
the global Manager role; system administrators retain unrestricted access. Removing a membership or grant takes effect
on the next request, unless another grant preserves access. Groups are local, work with local and OIDC accounts, and are
not synchronized from OIDC claims.

[Local access groups](/docs/next/users#local-access-groups)

<a id="delete-local-tracking"></a>

## Delete local tracking

System administrators can select **Delete repository** on the detail page. Confirmation names
the repository and explains that deletion permanently removes local workflows, runs, issues, pull requests, security
alerts, configuration, access assignments, webhook history, synchronization state, and associated notification history.
The provider account and repository data at the provider remain unchanged.

Deletion is blocked while synchronization is running; wait for completion and retry. Pending synchronization requests
are removed with the repository. Notification subscriptions lose this repository filter; a subscription restricted only
to the deleted repository is removed rather than becoming global. Shared channels remain available.

After deletion, the repository can be added again through the existing provider selection. Tracking starts fresh, with
no restored local history or configuration.
