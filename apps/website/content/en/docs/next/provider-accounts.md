---
title: 'Provider accounts'
description: 'Connect and administer encrypted, read-only provider credentials.'
---

The PAT/OAuth instructions on this page use per-repository webhooks. GitHub App connections instead use one central
webhook and are configured through the GitHub App dialog.

<a id="access-and-list"></a>

## Access and list

System administrators open **Administration → Provider accounts**. The table shows name, provider type, base URL,
enabled state, and last sync. Filter by type/enabled, sort, change columns, and paginate. Other roles do not administer
provider accounts. Tokens and OAuth secrets are never returned in list data.

<a id="connect-a-provider"></a>

## Connect a provider

Choose **Add provider** and select GitHub, GitLab, Forgejo, or Gitea. Enter a recognizable name and the correct instance
base URL; Gitea requires one. Choose from the authentication methods the API reports as configured. Without a matching
OAuth client, use a personal access token. **Verify and add provider** checks PAT credentials before storing them.
**Connect provider** redirects to provider consent and returns with a success or failure notice.

Use only the read scopes in [Provider OAuth setup](/docs/next/provider-oauth). Provider OAuth connects repository data;
it is separate from [OIDC user sign-in](/docs/next/authentication). Repovio encrypts credentials at rest and never
provides provider resource mutations, even when an upstream token could authorize writes.

<a id="maintain-connections"></a>

## Maintain connections

Enable or disable a row to control participation. Pending row actions block conflicting actions while requests finish.
Disabling retains configuration. Deletion executes immediately; consider dependent tracked data before selecting the
delete action. Create a replacement connection if provider ownership or credentials must change through a flow the
current screen does not expose.

Add repositories separately from [Repositories](/docs/next/repositories); webhook configuration belongs to individual
tracked repositories, not provider accounts. Empty discovery can mean no repositories, an incorrect instance,
insufficient read scopes, or invalid credentials. Distinguish authentication-options loading failures, verification
errors, OAuth callback notices, and API failures; correct the cause before retrying. Inspect jobs for ongoing
synchronization failures.

[GitHub App setup](/docs/next/github-app)

GitLab connections now support in-place OAuth conversion and reauthorization. See
[GitLab connection lifecycle](/docs/next/provider-oauth#gitlab-connection-lifecycle) before replacing an existing
connection; reauthorization preserves its tracked data and enabled state.
