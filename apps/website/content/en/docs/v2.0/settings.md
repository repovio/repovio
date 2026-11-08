---
title: 'Settings'
description: 'Find personal settings and administrator-only authentication and system controls.'
---

<a id="settings-tabs"></a>

## Settings tabs

Open **Settings** from the user menu. Every authenticated user can access **General** and **MCP**. System administrators
also see **Authentication** and **System**. The sidebar's administrator grouping does not prevent other signed-in users
from opening their personal settings through the user menu.

General contains [Profile](/docs/v2.0/profile), [Avatar](/docs/v2.0/avatar), and, for local accounts,
[Password](/docs/v2.0/password). OIDC-managed users see an identity-management notice instead of local profile/password
forms, but can still edit their avatar. [MCP](/docs/v2.0/mcp) manages personal read-only access tokens.

<a id="related-preferences"></a>

## Related preferences

[Language](/docs/v2.0/language) and [Appearance](/docs/v2.0/appearance) are selected from the app/user controls.
Administrators configure [OIDC authentication](/docs/v2.0/authentication) and
[System defaults](/docs/v2.0/settings-system) in their respective tabs. A missing tab can be correct for your role;
changing a URL does not grant authorization. Retry failed settings requests only after checking API connectivity.
