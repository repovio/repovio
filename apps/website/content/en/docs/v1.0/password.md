---
title: 'Password'
description: 'Change a local password and understand session invalidation and recovery.'
---

> Archived source snapshot. Product labels use Repovio. Use the configuration identifiers and container references from
> this release's tagged deployment files unchanged.

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
[local recovery command](/docs/v1.0/authentication#reset-a-forgotten-password); it rejects OIDC accounts and invalidates
existing sessions. Never put a replacement password in shell history or an issue report.
