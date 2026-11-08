---
title: 'Sign in'
description: 'Use local credentials or OpenID Connect and safely end a session.'
---

<a id="local-sign-in"></a>

## Local sign-in

Open `/auth/signin`, enter the local username and password, and select **Sign in**. Wait until authentication finishes.
Rejected credentials leave you on the form; verify the username and ask the deployment operator about
[password recovery](/docs/next/authentication#reset-a-forgotten-password). Repovio has no email password-reset flow.

A new installation opens [First-run setup](/docs/next/setup) instead. Once authenticated, navigation and results depend
on your role and repository memberships. An empty dashboard does not mean sign-in failed.

<a id="openid-connect"></a>

## OpenID Connect

When an administrator enables OIDC, use the additional provider sign-in button. Complete authentication on the identity
provider's own page and let the callback finish. A denied group mapping, expired transaction, or provider failure
returns an error; start a new sign-in attempt. OIDC never links an existing local account by matching its email.

OIDC login is separate from provider OAuth connections. It authenticates a Repovio user; it does not connect GitHub,
GitLab, Forgejo, or Gitea repositories. Identity-managed names and passwords must be changed at the identity provider.

<a id="sign-out"></a>

## Sign out

Choose sign out from the user menu. Signing out removes the browser session without deleting repositories, changing
provider credentials, or modifying provider resources. On a shared device, sign out when finished. If an API session
expires, sign in again before retrying the failed action. Local password sign-in remains available when OIDC is enabled.
