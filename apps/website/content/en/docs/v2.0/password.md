---
title: 'Password'
description: 'Change a local password and understand session invalidation and recovery.'
---

<a id="change-a-password"></a>

## Change a password

For a local account open **Settings → General → Change password**. Enter the current password, a new password of 12 to
256 characters, and matching confirmation. Submit once and wait for completion. An invalid current password, short
password, or mismatched confirmation must be corrected before retrying.

A successful change returns a replacement token for the current browser and invalidates the account's other existing
sessions. Other devices must sign in again with the new password. This changes only the Repovio account, not provider
PATs, OAuth credentials, notification credentials, or MCP-token configuration.

<a id="oidc-and-forgotten-passwords"></a>

## OIDC and forgotten passwords

OIDC-managed accounts do not have a local password form. Change the identity-provider password at that provider. Repovio
deliberately has no email-based reset flow. A deployment operator can use the documented
[local recovery command](/docs/v2.0/authentication#reset-a-forgotten-password); it rejects OIDC accounts and invalidates
existing sessions. Never put a replacement password in shell history or an issue report.

<a id="local-user-and-group-management"></a>

## Create and reset local accounts

For a local account, the row action Reset password lets a system administrator set a replacement without the old
password. Enter the new password and confirmation. Existing JWT sessions become invalid; resetting your own account
signs you out. OIDC accounts have no reset action. MCP tokens are not revoked by this operation.

[Local access groups](/docs/v2.0/users#local-access-groups)
