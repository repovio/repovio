---
title: 'Users'
description: 'Review local and identity-managed users, roles, deletion, and MCP token administration.'
---

<a id="review-accounts"></a>

## Review accounts

System administrators open **Administration → Users**. The table shows username, avatar/display name, role, local/OIDC
origin, and created/updated timestamps. Filter by role, sort, change columns, or paginate. Repository access for a
Viewer or Manager requires a separate [repository membership](/docs/v2.0/repositories); identity-provider groups do not
create those memberships.

<a id="provisioning-and-deletion"></a>

## Provisioning and deletion

In Administration → Users, select New user in the toolbar. Enter a unique username, optional first and last name, a
password of 12–256 characters and its confirmation, and a role; Viewer is the default. Creation remains available with
OIDC enabled. OIDC identities are provisioned through their identity provider and are never linked by matching a local
username.

The delete action is available for other users and executes immediately; review the account before selecting it. You
cannot delete your own account through this API or screen. Deleting a Repovio user removes local access; it does not
delete any provider account at GitHub, GitLab, Forgejo, or Gitea. Review the affected user's access before deleting.

<a id="user-mcp-tokens"></a>

## User MCP tokens

Open a user's MCP-token dialog to list token metadata or revoke a token with confirmation. Administrators cannot
retrieve plaintext token values or create another user's token through this dialog. Users create their own tokens in
[MCP settings](/docs/v2.0/mcp). Empty lists and load errors are distinct; retry after API recovery. Never copy token
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

<a id="create-and-reset-local-accounts"></a>

## Create and reset local accounts

For a local account, the row action Reset password lets a system administrator set a replacement without the old
password. Enter the new password and confirmation. Existing JWT sessions become invalid; resetting your own account
signs you out. OIDC accounts have no reset action. MCP tokens are not revoked by this operation.

<a id="local-access-groups"></a>

## Local access groups

Open Administration → User groups to create, rename or delete a group and add or remove members. Names must be unique
and nonempty. Membership selection supports searching and pagination; users may belong to multiple groups. Nested groups
are not supported. Deleting a group requires confirmation and removes its memberships and repository grants, preserving
direct assignments.

In a repository’s Group access section, select a group and assign Viewer or Manager; change the role or remove the
assignment there. Direct and group grants combine, with Manager winning over Viewer. Manager capabilities still require
the global Manager role; system administrators retain unrestricted access. Removing a membership or grant takes effect
on the next request, unless another grant preserves access. Groups are local, work with local and OIDC accounts, and are
not synchronized from OIDC claims.

```text
POST   /api/v1/users                              { username, password, role, firstName?, lastName? }
PUT    /api/v1/users/:id/password                 { newPassword }
GET    /api/v1/user-groups                       ?page=1&perPage=10
POST   /api/v1/user-groups                       { name }
PUT    /api/v1/user-groups/:id                    { name }
DELETE /api/v1/user-groups/:id
GET    /api/v1/user-groups/:id/members            ?page=1&perPage=10
PUT    /api/v1/user-groups/:id/members/:userId
DELETE /api/v1/user-groups/:id/members/:userId
GET    /api/v1/repositories/:id/group-memberships
PUT    /api/v1/repositories/:id/group-memberships/:groupId  { role }
DELETE /api/v1/repositories/:id/group-memberships/:groupId
```
