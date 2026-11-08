---
title: 'Code scanning alerts'
description: 'Review code scanning alerts with repository-scoped management access.'
---

<a id="access-and-provider-support"></a>

## Access and provider support

Open **Overview → Security alerts → Code scanning alerts**. Managers need management access to the repository; system
administrators can inspect all repositories. Viewers cannot access alert data. Lists, filter options, counters, details,
repository activity, and dashboard metrics apply the same access restrictions.

GitHub supports this alert type through its security APIs. GitLab maps Dependency Scanning, SAST, and Secret Detection
vulnerabilities to the corresponding alert views, subject to instance/license and token permissions. Forgejo and Gitea
currently report these types as unsupported. A warning for an unavailable type does not fail other synchronization
scopes.

<a id="review-findings"></a>

## Review findings

Use search and available repository, provider, severity, and state filters, sorting, visible columns, and pagination.
States include `OPEN`, `RESOLVED`, and `DISMISSED`; severity includes critical, high, medium, low, informational, and
unknown. Code filters additionally include scanner, rule, and a dedicated file-path selector. Updated-date bounds and
kind-specific text search help narrow large lists. Select a finding to inspect scanner, rule, severity, safe file
location, and finding state. Repovio stores allowlisted metadata only; raw provider payloads, credentials, token
fragments, and secret values are never retained. Missing fields can reflect provider capabilities rather than a
processing error.

Use **Open in provider** to investigate and remediate. Repovio does not dismiss, resolve, reopen, or edit alerts. The
first successful read per repository and alert kind establishes a silent baseline. Later opened, resolved, dismissed, or
reopened transitions can trigger subscribed [notification channels](/docs/next/notifications).

<a id="empty-unavailable-and-stale-data"></a>

## Empty, unavailable, and stale data

Clear filters and verify management membership if no findings appear. Inspect [Jobs](/docs/next/guide-jobs) for
unsupported kinds or permission warnings. Existing GitHub OAuth accounts may need reauthorization with
`security_events`; see [Provider OAuth](/docs/next/provider-oauth). Retry failed loads after recovery; absence of
visible findings is not proof that the provider has scanned the repository or that every alert type is supported.
