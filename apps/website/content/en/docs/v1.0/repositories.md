---
title: 'Repositories'
description: 'Track repositories, inspect activity, and configure local synchronization and access.'
---

> Archived source snapshot. Product labels use Repovio. Use the configuration identifiers and container references from
> this release's tagged deployment files unchanged.

<a id="browse-and-open-details"></a>

## Browse and open details

All signed-in users can list repositories they may read. The table shows owner/name, enabled state, members, retained
run count, retention, and last synchronization. Use enabled filtering, sorting, column controls, and pagination. Open
the provider link for the external repository, the detail page for synchronized activity, or the settings dialog for
configuration. A missing membership or removed repository can produce an inaccessible detail state.

The detail page combines general information, retention, last sync/data age, configured interval, current job, and
recent workflows, issues, and pull requests. Managers with repository management access and administrators also see
security-alert activity. Pending/running jobs show progress; warnings and failures include categorized safe errors.

<a id="add-and-maintain-tracking"></a>

## Add and maintain tracking

Only system administrators add repositories. Select an enabled provider account, wait for discovery, and select one or
more untracked repositories. Already tracked repositories are excluded. If part of a multi-add fails, successful
selections remain added and only failed selections remain for retry. An empty provider list requires connecting an
enabled [provider account](/docs/v1.0/provider-accounts) first.

Administrators can enable/disable tracking, **Refresh provider data**, and queue a read-only synchronization. Repository
identity uses the provider account and stable provider repository ID. Renames/transfers preserve history, filters,
memberships, and channels; metadata refresh rejects a different ID at the old path rather than reassigning it. Disabled
repositories retain stored data but stop participating in synchronization.

<a id="retention-filters-and-memberships"></a>

## Retention, filters, and memberships

Administrators set separate workflow-run, issue, and pull-request retention overrides, each from 1 to 3650 days. An
empty value restores the corresponding [system default](/docs/v1.0/settings-system). Workflow filters accept **ALLOW**
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
manager. Follow [Repository webhooks](/docs/v1.0/provider-webhooks) for setup and verification.

Viewers and managers receive a read-only repository settings summary. Retry load/save errors after recovery; inspect
[Jobs](/docs/v1.0/guide-jobs) for provider access, rate-limit, or synchronization failures.
