---
title: 'GitHub App setup'
description: 'Register and connect a deployment-owned GitHub App with encrypted credentials and read-only installation access.'
---

<a id="register-app"></a>

## Register the App

Use one GitHub.com App per Repovio deployment. PAT and OAuth connections remain available. As an account or organization
owner, open GitHub Settings, Developer settings, GitHub Apps, then New GitHub App. Choose a unique name and your Repovio
homepage. For installations across multiple accounts, select Any account. A private App can only be installed on its
owning account. No OAuth client secret, callback URL or setup URL is required for this integration.

<a id="permissions-and-events"></a>

## Configure permissions and events

Set the core repository permissions below to Read-only; Metadata read access is automatic. Add the optional security
permissions only when those features are needed and available. Subscribe to the listed events. GitHub sends App
installation lifecycle events automatically. Repovio restricts generated installation tokens to read permissions even if
the App registration grants more.

```text
Required repository permissions (Read-only):
Actions (actions)
Issues (issues)
Pull requests (pull_requests)
Metadata (metadata, automatic)

Optional repository permissions (Read-only):
Dependabot alerts (dependabot_alerts)
Code scanning alerts (security_events)
Secret scanning alerts (secret_scanning_alerts)

Webhook events:
workflow_run
issues
pull_request
dependabot_alert
code_scanning_alert
secret_scanning_alert
```

<a id="configure-repovio"></a>

## Configure Repovio

Enable webhooks in the GitHub App settings. Use the public HTTPS endpoint below; PUBLIC_URL must identify your
externally reachable Repovio installation. Choose a random webhook secret of at least 16 characters and enter the same
value on GitHub and in Repovio. Generate an RSA private key on GitHub and download its PEM file. In Repovio, open
Administration, Provider accounts, GitHub App. Enter App ID, App slug, the entire private key and webhook secret, then
choose Verify and save. The API validates the App identity and encrypts both secrets in PostgreSQL. Keep the deployment
encryption key secure; secrets are never returned to the browser.

```text
https://repovio.example.com/api/v1/webhooks/github-app
```

<a id="install-and-connect"></a>

## Install and connect

Choose Install on GitHub, select an account or organization and grant access only to the repositories you need. Return
to Repovio and choose Refresh installations, then Connect for the desired account. Suspended or already connected
installations cannot be connected again. This list comes from the configured App; no installation ID from a browser
callback is trusted. Add repositories separately through the repository screen. Repovio renews short-lived installation
tokens automatically; initial import and periodic polling complement webhook-triggered synchronization.

Change the local account name before connecting if it would duplicate an existing PAT or OAuth account name.

<a id="rotate-and-disconnect"></a>

## Rotate and disconnect

For private-key rotation, generate a replacement key on GitHub, save it in Repovio and verify synchronization before
deleting the old key on GitHub. For webhook-secret rotation, update GitHub and Repovio together; deliveries signed with
the old secret stop validating immediately. Empty secret fields preserve stored values. Delete connected provider
accounts before replacing the App identity or deleting App configuration. Account deletion also deletes dependent
tracked data; export anything you need first. Removing local configuration does not uninstall the App on GitHub.

<a id="troubleshooting"></a>

## Troubleshoot

If setup fails, check App ID, slug and PEM format. For signature failures, check the shared secret, HTTPS reachability
and reverse-proxy preservation of the raw request body. For empty discovery, check installation repository selection and
read permissions, then refresh installations. Removed or suspended installations show an unavailable state while
retaining existing data; restore access on GitHub and refresh. Missing optional security permissions do not prevent
other synchronization domains. Check Jobs for detailed sync status. Polling remains available if webhook deliveries
fail. Live provider behavior needs a real test App; mocked tests do not verify an installation on GitHub.

## See also

- [Provider accounts](/docs/next/provider-accounts)
- [Provider OAuth setup](/docs/next/provider-oauth)
- [Provider webhooks](/docs/next/provider-webhooks)
