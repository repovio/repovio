---
title: 'Profile'
description: 'Change local account names and username with current-password verification.'
---

<a id="edit-a-local-profile"></a>

## Edit a local profile

Open **Settings → General**. Local users can update optional first/last names and their login username. Personal names
are used as the preferred display identity; the username remains available for unambiguous identification. Fields have a
maximum length of 255 characters and username cannot be empty.

Changing the username requires the current password. Enter it in the profile form and select save. Names alone do not
require a username change. Wait for the request; successful save updates the current account. A duplicate username and
an incorrect current password produce different validation errors. Correct the affected field and retry.

<a id="identity-managed-accounts"></a>

## Identity-managed accounts

OIDC users cannot change their username or profile names locally. Repovio synchronizes names from verified identity
claims at successful login. Change them at the identity provider and sign in again. Avatar remains separately editable
in [Avatar settings](/docs/v2.0/avatar). If the profile request fails, retry after API recovery; do not submit passwords
through support channels.
