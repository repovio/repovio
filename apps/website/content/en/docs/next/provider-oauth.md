---
title: 'Provider OAuth setup'
description: 'Register OAuth applications and configure read-only provider authentication for Repovio.'
---

The PAT/OAuth instructions on this page use per-repository webhooks. GitHub App connections instead use one central
webhook and are configured through the GitHub App dialog.

Repovio connects provider accounts through OAuth or a personal access token (PAT). OAuth is available when at least one
provider OAuth client is configured. Without any configured OAuth clients, the provider-account screen offers only PAT
authentication. Repovio uses either resulting credential only for its read-only provider APIs and encrypts it before
writing it to PostgreSQL.

<a id="register-oauth-applications"></a>

## Register OAuth applications

Register one OAuth application for every provider instance that Repovio should connect. Set the exact callback URL from
`OAUTH_CALLBACK_URL` in each application registration. For a local installation the default is
`http://localhost:3001/api/v1/provider-accounts/oauth/callback`.

Configure the client ID and client secret in the API environment, never in the web application or Git:

```dotenv
OAUTH_CALLBACK_URL=https://repovio.example.com/api/v1/provider-accounts/oauth/callback
GITHUB_OAUTH_CLIENT_ID=...
GITHUB_OAUTH_CLIENT_SECRET=...
GITLAB_OAUTH_BASE_URL=https://gitlab.example.com
GITLAB_OAUTH_CLIENT_ID=...
GITLAB_OAUTH_CLIENT_SECRET=...
FORGEJO_OAUTH_BASE_URL=https://forgejo.example.com
FORGEJO_OAUTH_CLIENT_ID=...
FORGEJO_OAUTH_CLIENT_SECRET=...
```

Configure only the providers that this installation needs. Client IDs and secrets must always be configured as pairs.
`GITLAB_OAUTH_BASE_URL` identifies the single GitLab instance for the installed OAuth application. Forgejo needs an
explicit base URL when its OAuth client is configured.

<a id="read-scopes"></a>

## Read scopes

Use these scopes when registering the application:

- GitHub: `repo security_events`. Existing OAuth accounts must be reauthorized before Repovio can read security alerts.
- GitLab: `read_api read_user`.

Fine-grained GitHub personal access tokens need read access to Dependabot alerts, code scanning alerts, and secret
scanning alerts. GitLab security alert access additionally depends on the instance license and the token owner's project
role; unavailable alert types are shown without failing other repository synchronization scopes.

- Forgejo: `read:repository`.
- Gitea: configure a personal access token with read access in the Gitea provider-account form, including the instance
  base URL. Repovio does not currently offer a shared Gitea OAuth client because every self-hosted instance needs its
  own application registration.

Repovio's adapters expose only validation, discovery, workflow synchronization, and webhook verification. They do not
create, update, dispatch, rerun, cancel, or delete provider resources. OAuth client secrets stay in the API environment,
and provider tokens are never returned by the Repovio API.

[GitHub App setup](/docs/next/github-app)

<a id="gitlab-connection-lifecycle"></a>

## GitLab connection lifecycle

Register a confidential GitLab OAuth application with the exact callback URL and read scopes listed above. Keep the
client secret in the API environment. Only the configured GitLab instance can use this application; a different instance
requires its own matching deployment configuration.

For a new Provider Account, choose **Add provider**, select GitLab and OAuth, and complete consent. For an existing
GitLab connection, choose **Connect with GitLab OAuth** to convert it in place. Managed OAuth connections offer
**Reauthorize**. Conversion binds the numeric GitLab user ID; later authorizations must use the same GitLab user, even
if its username changes. The Provider Account ID, current name and enabled state, tracked Repositories, memberships,
configuration, and history remain intact. Cancellation or failed consent leaves the existing connection unchanged.

Existing connections without saved refresh metadata require one new authorization. Repovio cannot distinguish these
older OAuth tokens from PATs, so upgrading does not automatically relabel or convert them.

<a id="gitlab-token-recovery"></a>

## Token rotation and recovery

Repovio encrypts access and refresh tokens together and automatically renews access tokens when 60 seconds or less
remain. Each successful rotation replaces the previous pair. A rejected refresh with `invalid_grant` marks the
connection as requiring reauthorization and suppresses further automatic refresh attempts until authorization succeeds.
Use **Reauthorize**; deleting and recreating the connection is unnecessary.

Network errors, timeouts, rate limits, and server failures use existing retry/backoff behavior. Missing client
configuration must be restored; changed client identity requires reauthorization, and an instance mismatch is rejected.
Credentials and raw provider errors are never shown. If GitLab rotates tokens but its response is lost or the database
commit fails, the old tokens may already be invalid. Reauthorize to recover; PostgreSQL and GitLab cannot commit this
operation atomically.

<a id="gitlab-oauth-rollout"></a>

## Rollout and rollback

Apply the additive database migration first, then deploy matching API and web versions. Retain the added columns during
an application rollback. Older application versions do not automatically refresh GitLab OAuth tokens, and rolling back
cannot restore tokens already invalidated by GitLab.
