---
title: 'Users'
description: 'Review local and identity-managed users, roles, deletion, and MCP token administration.'
---

> Archived source snapshot. Product labels use Repovio. Use the configuration identifiers and container references from
> this release's tagged deployment files unchanged.

<a id="review-accounts"></a>

## Review accounts

System administrators open **Administration → Users**. The table shows username, avatar/display name, role, local/OIDC
origin, and created/updated timestamps. Filter by role, sort, change columns, or paginate. Repository access for a
Viewer or Manager requires a separate [repository membership](/docs/v1.0/repositories); identity-provider groups do not
create those memberships.

<a id="provisioning-and-deletion"></a>

## Provisioning and deletion

The Users page has no create-user or edit-user form. Additional local users are created through the administrator-only
protected user API using username, password, and role. OIDC users are provisioned through configured identity login. See
[Authentication](/docs/v1.0/authentication) for mapping and account separation. Do not infer a user-edit action from the
presence of an editable profile on your own Settings page.

The delete action is available for other users and executes immediately; review the account before selecting it. You
cannot delete your own account through this API or screen. Deleting a Repovio user removes local access; it does not
delete any provider account at GitHub, GitLab, Forgejo, or Gitea. Review the affected user's access before deleting.

<a id="user-mcp-tokens"></a>

## User MCP tokens

Open a user's MCP-token dialog to list token metadata or revoke a token with confirmation. Administrators cannot
retrieve plaintext token values or create another user's token through this dialog. Users create their own tokens in
[MCP settings](/docs/v1.0/mcp). Empty lists and load errors are distinct; retry after API recovery. Never copy token
values into support reports or screenshots.

<a id="local-user-api"></a>

## Provision a local user through the API

Use an API client over HTTPS to send `POST /api/v1/users` with administrator bearer authentication and
`Content-Type: application/json`. Supply this request body, replacing placeholders in the client's protected inputs:

```json
{
  "username": "new-user",
  "password": "REPLACE_WITH_A_PASSWORD_OF_AT_LEAST_12_CHARACTERS",
  "role": "VIEWER"
}
```

Valid roles are `VIEWER`, `MANAGER`, and `SYSTEM_ADMIN`. Assign only the required role, then grant repository
memberships separately. The response contains safe user metadata, not the password or its hash. A duplicate username or
invalid request must be corrected before retrying. Do not store passwords or bearer tokens in tracked files, shell
history, screenshots, or issue reports.
