---
title: 'First-run setup'
description: 'Create the first local administrator and understand one-time setup.'
---

<a id="before-setup"></a>

## Before setup

Deploy the API, web application, and PostgreSQL using [Deployment](/docs/next/deployment). Open the installation URL.
When no user exists, Repovio directs the browser to `/auth/setup`. Existing installations retain their accounts and
instead open sign-in. Setup creates a local Repovio account, not a provider account.

<a id="create-the-administrator"></a>

## Create the administrator

Enter an optional first and last name, a unique username, a password, and password confirmation. Passwords require at
least 12 characters. Submit the setup form once and wait for the request; successful setup signs in the first system
administrator. Validation errors leave the form available for correction. If another operator completed setup first,
continue to [Sign in](/docs/next/sign-in) with an existing account.

<a id="continue-configuration"></a>

## Continue configuration

Connect a [provider account](/docs/next/provider-accounts), select [repositories](/docs/next/repositories), and inspect
[synchronization jobs](/docs/next/guide-jobs). Local users can be created through the protected API; the Users page
lists accounts and manages deletion and MCP access. Alternatively configure [OIDC](/docs/next/authentication) for
identity-provider-managed accounts. New non-administrators need explicit repository memberships.

If setup fails, check API/database availability and the deployment logs without publishing credentials. Do not reset the
database to repeat setup. See [Password recovery](/docs/next/authentication#reset-a-forgotten-password) for an existing
local administrator.

<a id="local-user-and-group-management"></a>

## Create and reset local accounts

In Administration → Users, select New user in the toolbar. Enter a unique username, optional first and last name, a
password of 12–256 characters and its confirmation, and a role; Viewer is the default. Creation remains available with
OIDC enabled. OIDC identities are provisioned through their identity provider and are never linked by matching a local
username.

[Local access groups](/docs/next/users#local-access-groups)
