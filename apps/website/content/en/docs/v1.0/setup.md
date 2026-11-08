---
title: 'First-run setup'
description: 'Create the first local administrator and understand one-time setup.'
---

> Archived source snapshot. Product labels use Repovio. Use the configuration identifiers and container references from
> this release's tagged deployment files unchanged.

<a id="before-setup"></a>

## Before setup

Deploy the API, web application, and PostgreSQL using [Deployment](/docs/v1.0/deployment). Open the installation URL.
When no user exists, Repovio directs the browser to `/auth/setup`. Existing installations retain their accounts and
instead open sign-in. Setup creates a local Repovio account, not a provider account.

<a id="create-the-administrator"></a>

## Create the administrator

Enter an optional first and last name, a unique username, a password, and password confirmation. Passwords require at
least 12 characters. Submit the setup form once and wait for the request; successful setup signs in the first system
administrator. Validation errors leave the form available for correction. If another operator completed setup first,
continue to [Sign in](/docs/v1.0/sign-in) with an existing account.

<a id="continue-configuration"></a>

## Continue configuration

Connect a [provider account](/docs/v1.0/provider-accounts), select [repositories](/docs/v1.0/repositories), and inspect
[synchronization jobs](/docs/v1.0/guide-jobs). Local users can be created through the protected API; the Users page
lists accounts and manages deletion and MCP access. Alternatively configure [OIDC](/docs/v1.0/authentication) for
identity-provider-managed accounts. New non-administrators need explicit repository memberships.

If setup fails, check API/database availability and the deployment logs without publishing credentials. Do not reset the
database to repeat setup. See [Password recovery](/docs/v1.0/authentication#reset-a-forgotten-password) for an existing
local administrator.
