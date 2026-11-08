---
title: 'Repovio overview'
description: 'Read-only workflow runs, repository work and security alerts across your providers.'
---

> Archived source snapshot. Product labels use Repovio. Use the configuration identifiers and container references from
> this release's tagged deployment files unchanged.

Repovio is a self-hosted dashboard for GitHub Actions, GitLab pipelines, Forgejo Actions and Gitea Actions. Track
selected workflow runs, issues and pull requests, identify current failures and send notifications without modifying
provider resources.

<a id="one-permission-scoped-overview"></a>

## One permission-scoped overview

- Inspect workflow health, latest runs, trends, approval queues and work that needs attention.
- Read issues and pull or merge requests alongside their related workflow activity.
- Review supported security-alert metadata without storing secret values.
- Manage repository memberships, encrypted notification destinations and read-only provider connections.
- Use local accounts, optional OpenID Connect and personal read-only MCP access tokens.

Provider changes, approvals, reviews and workflow reruns remain external actions. Repovio's own administration controls
configure its local tracking and notifications; they do not grant provider write access.

Start with [installation](/docs/v1.0/installation), then follow [sign-in and navigation](/docs/v1.0/sign-in). For
production operations, see [deployment and backups](/docs/v1.0/deployment).
