---
title: 'Settings'
description: 'Find personal settings and administrator-only authentication and system controls.'
---

<a id="settings-tabs"></a>

## Settings tabs

Open **Settings** from the user menu. Every authenticated user can access **General** and **MCP**. System administrators
also see **Authentication** and **System**. The sidebar's administrator grouping does not prevent other signed-in users
from opening their personal settings through the user menu.

General contains [Profile](/docs/next/profile), [Avatar](/docs/next/avatar), and, for local accounts,
[Password](/docs/next/password). OIDC-managed users see an identity-management notice instead of local profile/password
forms, but can still edit their avatar. [MCP](/docs/next/mcp) manages personal read-only access tokens.

<a id="related-preferences"></a>

## Related preferences

[Language](/docs/next/language) and [Appearance](/docs/next/appearance) are selected from the app/user controls.
Administrators configure [OIDC authentication](/docs/next/authentication) and
[System defaults](/docs/next/settings-system) in their respective tabs. A missing tab can be correct for your role;
changing a URL does not grant authorization. Retry failed settings requests only after checking API connectivity.

<a id="repository-settings"></a>

## Repository Settings

Repository configuration is separate from personal Settings. System administrators open a Repository's Settings to
switch between General, Webhook, Workflow filters, Members, and Group access. See
[Repository Settings sections](/docs/next/repositories#repository-settings-sections) for direct addresses and draft lifetime.
