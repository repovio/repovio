---
title: 'Repovio user guide'
description: 'Start using Repovio to view repositories, workflow status, and required approval actions.'
---

> Archived source snapshot. Product labels use Repovio. Use the configuration identifiers and container references from
> this release's tagged deployment files unchanged.

Repovio is a read-only workflow status dashboard. It lets authorized users inspect repository activity without creating,
rerunning, approving, or deleting anything at GitHub, GitLab, Forgejo, or Gitea.

<a id="before-you-begin"></a>

## Before you begin

You need the URL of a Repovio installation and a local or configured OIDC account. The first administrator completes
one-time setup; additional local users are provisioned through the protected API, or users sign in through configured
OIDC. Access to provider data depends on your role and repository memberships; signing in does not automatically expose
every configured repository.

Repovio uses three application roles:

- **Viewer** can inspect explicitly assigned repositories, workflows, issues, and pull requests.
- **Manager** has read access and can inspect security alerts for repositories where the membership is also **Manager**.
  Notification channels, subscriptions, tests, and history are administered globally by system administrators.
- **System Administrator** can access every repository and manage provider accounts, repositories, memberships, users,
  MCP tokens, and application defaults.

Application roles never grant write access at GitHub, GitLab, Forgejo, or Gitea. If an action changes provider state,
Repovio opens the provider interface instead of performing the action.

<a id="recommended-first-session"></a>

## Recommended first session

1. [Sign in](/docs/v1.0/sign-in), learn [navigation](/docs/v1.0/navigation), and try [search](/docs/v1.0/search).
2. Review the [Dashboard](/docs/v1.0/guide-dashboard), [All runs](/docs/v1.0/workflow-runs),
   [Needs attention](/docs/v1.0/needs-attention), and [Awaiting approval](/docs/v1.0/awaiting-approval).
3. Inspect [Issues](/docs/v1.0/guide-issues) and [Pull requests](/docs/v1.0/guide-pull-requests).
4. Open [Repositories](/docs/v1.0/repositories) to understand the data you can see.
5. Administrators configure [notification channels](/docs/v1.0/notifications) and
   [event subscriptions](/docs/v1.0/notification-rules).

System administrators should then continue with [Administration and settings](/docs/v1.0/provider-accounts). Deployment,
provider registration, webhook setup, backup, and recovery are linked from the corresponding handbook pages.

<a id="when-a-page-is-empty-or-unavailable"></a>

## When a page is empty or unavailable

An empty page can mean that no matching provider data has been synchronized, that filters exclude all results, or that
your account has no membership for the repository. Clear active filters and check the repository selection first. A
load-error message means the requested data could not be retrieved; retry the page action and ask the installation
administrator to inspect the API and synchronization jobs if the error persists.
