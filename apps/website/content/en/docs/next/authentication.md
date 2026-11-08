---
title: 'Authentication'
description: 'Configure local authentication, optional OpenID Connect sign-in, and account recovery.'
---

<a id="first-run-setup"></a>

## First-run setup

After deploying a new installation, open its public URL. Repovio redirects every request to `/auth/setup` until the
first account exists. Enter an optional first and last name, a unique username, and a password with at least 12
characters. The account is created as the system administrator and signed in immediately.

Setup can succeed only once. After the first user exists, `/auth/setup` redirects to `/auth/signin`. Existing
installations keep their current users during upgrades and do not show setup again.

<a id="openid-connect-single-sign-on"></a>

## OpenID Connect single sign-on

Repovio supports one optional OpenID Connect provider in addition to local sign-in. A system administrator configures it
under **Settings → Authentication**. This login is separate from GitHub, GitLab, Forgejo, and Gitea provider OAuth: OIDC
identifies a Repovio user, while provider OAuth only grants read access to provider resources.

Set the exact externally reachable API callback URL before configuring the provider:

```dotenv
PUBLIC_URL=https://repovio.example.com
OIDC_CALLBACK_URL=https://repovio.example.com/api/v1/auth/oidc/callback
```

Register the value of `OIDC_CALLBACK_URL` as an allowed redirect URI at the identity provider. Configure its issuer,
client ID, optional client secret, scopes, and group claim in Repovio. The API accepts the client secret on save but
never returns its value. It is encrypted at rest with `TOKEN_ENCRYPTION_KEY`. Save the configuration before using
**Check connection**; unsaved changes disable that check. Confirm discovery succeeds before relying on OIDC sign-in.

HTTPS is required for the issuer and its endpoints. **Allow HTTP issuer** is only intended for isolated lab networks; it
must never be enabled for an Internet-reachable deployment. Local password sign-in remains available as a recovery path
even when OIDC is enabled.

The form also shows the callback URL for copying, configured/observed groups, and separate controls to replace or clear
the stored client secret. Leaving replacement disabled preserves the saved secret. Loading, saving, and connection-check
failures are reported separately. Fix invalid configuration and save again before retrying the connection check.

<a id="groups-roles-and-identities"></a>

### Groups, roles, and identities

The group claim can be one exact claim name or a dot-separated path such as `realm_access.groups`. Configure exact,
case-sensitive group values for the three Repovio roles. If several groups match, Repovio applies `SYSTEM_ADMIN`, then
`MANAGER`, then `VIEWER`. Missing or unmatched groups are denied unless Allow unmatched users as viewer is explicitly
enabled. Malformed claims and group-overage markers are always denied.

An OIDC account is linked only by the verified issuer and subject pair. Repovio never links an OIDC login to a local
account by email address or username. First and last names are synchronized from verified claims at each successful
login; login name, profile names, and password cannot be changed locally. Repository memberships remain managed in
Repovio and are never derived from identity-provider groups.

Security-relevant configuration or role changes invalidate existing OIDC bearer tokens. Changing only the provider's
display name does not. Disabling or removing an identity-provider group prevents the affected account from obtaining a
new session and invalidates its previous sessions after the next denied login.

<a id="provider-examples"></a>

### Provider examples

Provider guides: [Keycloak](#oidc-keycloak) · [Microsoft Entra ID](#oidc-entra-id) · [Auth0](#oidc-auth0)

For Authentik, create an OAuth2/OpenID Provider with authorization-code flow, the exact callback URL above, and the
`openid`, `profile`, and `email` scopes. Add a scope mapping that returns the chosen group claim as an array of group
names, attach the provider to an application, then copy the application's issuer, client ID, and client secret into
Repovio.

For another standards-compliant provider, enable Authorization Code Flow, require S256 PKCE, register the exact callback
URL, and include a stable `sub` plus the configured group claim in the ID token or UserInfo response. Repovio accepts
only asymmetric ID-token signatures and rejects unsigned and HMAC-signed tokens.

<a id="oidc-keycloak"></a>

#### Keycloak

In the Keycloak admin console, create realm repovio and an OpenID Connect client named repovio. Enable Client
authentication and Standard flow; disable Implicit flow and Direct access grants. Set the exact callback below as Valid
redirect URIs and require S256 under Proof Key for Code Exchange. Keep RS256 signing. Copy the client secret from
Credentials.

Create a Group Membership mapper in the client’s dedicated scope: Token Claim Name groups, Full group path off, Add to
ID token on. Create repovio-admins, repovio-managers and repovio-viewers and assign users. Attach profile and email as
default client scopes. In Repovio, save the values below and map each complete group name to its matching role. Realm
roles are not group memberships.

```text
Issuer: https://auth.example.com/realms/repovio
Discovery: https://auth.example.com/realms/repovio/.well-known/openid-configuration
Redirect URI: https://repovio.example.com/api/v1/auth/oidc/callback
Client ID: repovio
Scopes: openid profile email
Groups claim: groups
SYSTEM_ADMIN: repovio-admins
MANAGER: repovio-managers
VIEWER: repovio-viewers
```

References: [Keycloak](https://www.keycloak.org/docs/latest/server_admin/index.html#_oidc_clients)

<a id="oidc-entra-id"></a>

#### Microsoft Entra ID

Register a single-tenant application in Entra ID → App registrations. Add a Web platform with the exact callback below;
do not enable implicit ID-token issuance. Copy Application (client) ID and Directory (tenant) ID. Create a client secret
and copy its Value, not its secret ID. Use your tenant ID in the v2 issuer; do not use common or organizations.

Under Token configuration, add a groups claim to ID tokens for security groups, using Group ID. Create three security
groups, assign users and map their object IDs to SYSTEM_ADMIN, MANAGER and VIEWER in Repovio. Group display names do not
match GUID claims. Assigned-group filtering may require an appropriate Entra license. Entra supports S256 PKCE and
asymmetrically signed ID tokens. Renew the client secret before expiration.

When Entra omits groups because of token limits, Repovio rejects the overage markers even with unmatched-viewer access
enabled. It never follows external claim sources or queries Microsoft Graph. Reduce the emitted memberships or configure
supported group filtering; do not grant Graph permissions as a workaround.

```text
Issuer: https://login.microsoftonline.com/TENANT_ID/v2.0
Discovery: https://login.microsoftonline.com/TENANT_ID/v2.0/.well-known/openid-configuration
Redirect URI: https://repovio.example.com/api/v1/auth/oidc/callback
Scopes: openid profile email
Groups claim: groups
SYSTEM_ADMIN: ADMIN_GROUP_OBJECT_ID
MANAGER: MANAGER_GROUP_OBJECT_ID
VIEWER: VIEWER_GROUP_OBJECT_ID
```

References:
[Microsoft Entra ID](https://learn.microsoft.com/en-us/security/zero-trust/develop/configure-tokens-group-claims-app-roles)

<a id="oidc-auth0"></a>

#### Auth0

Create a Regular Web Application. Set Allowed Callback URLs to the exact callback below, enable Authorization Code, use
S256 PKCE and choose RS256 for ID-token signing. Set Token Endpoint Authentication Method to Basic. Copy the client ID
and client secret. Read the issuer from discovery for the selected tenant or custom domain, preserving the trailing
slash; do not mix domains.

Add a Login / Post Login Action using the example below. Replace REPLACE_WITH_REPOVIO_CLIENT_ID, deploy the Action and
attach it to the Login flow. Administratively set each user’s app_metadata.repovio_groups to an array containing
repovio-admins, repovio-managers or repovio-viewers. Do not source authorization from user-editable user_metadata. Auth0
does not automatically emit these groups; setting only an access-token claim is insufficient. In Repovio, use the entire
namespaced claim as the exact group-claim name and map the three values to their matching roles.

```text
Issuer: https://YOUR_TENANT.REGION.auth0.com/
Discovery: https://YOUR_TENANT.REGION.auth0.com/.well-known/openid-configuration
Redirect URI: https://repovio.example.com/api/v1/auth/oidc/callback
Scopes: openid profile email
Groups claim: https://repovio.example.com/groups
SYSTEM_ADMIN: repovio-admins
MANAGER: repovio-managers
VIEWER: repovio-viewers
```

```javascript
/** Add administratively managed Repovio groups to this application's ID token. */
exports.onExecutePostLogin = async (event, api) => {
  if (event.client.client_id !== 'REPLACE_WITH_REPOVIO_CLIENT_ID') return;
  const groups = event.user.app_metadata?.repovio_groups;
  api.idToken.setCustomClaim('https://repovio.example.com/groups', Array.isArray(groups) ? groups : []);
};
```

References: [Auth0](https://auth0.com/docs/secure/tokens/json-web-tokens/create-custom-claims)

<a id="verify-oidc-providers"></a>

#### Validation and troubleshooting

For every provider, register OIDC_CALLBACK_URL exactly, request openid profile email, use Authorization Code with S256
PKCE and an asymmetric signing algorithm. Save the issuer, client ID, client secret, scopes and group claim under
Settings → Authentication, then run Check connection. Discovery success does not verify a user’s group claims.

Test separate users for SYSTEM_ADMIN, MANAGER and VIEWER, plus an unassigned user who must be denied with
unmatched-viewer access disabled. Check exact group spelling, Keycloak path settings, Entra object IDs and the Auth0
namespaced ID-token claim if access fails. Keep a local administrator for recovery. OIDC groups grant global roles only;
repository access still needs separate Repovio grants. Configure only one identity provider at a time.

<a id="oidc-api-contract"></a>

### OIDC API contract

| Method       | Path                         | Access               | Purpose                                                                      |
| ------------ | ---------------------------- | -------------------- | ---------------------------------------------------------------------------- |
| `GET`        | `/api/v1/auth/oidc/status`   | Public               | Returns only effective availability and the optional provider name.          |
| `GET`        | `/api/v1/auth/oidc/start`    | Public               | Starts a browser-bound authorization-code and S256 PKCE transaction.         |
| `GET`        | `/api/v1/auth/oidc/callback` | Public               | Validates the provider response and redirects with a one-time fragment code. |
| `POST`       | `/api/v1/auth/oidc/exchange` | Public               | Consumes the fragment code once and returns the normal bearer `AuthResult`.  |
| `GET`, `PUT` | `/api/v1/auth/oidc/config`   | System administrator | Reads or updates secret-safe OIDC settings.                                  |
| `POST`       | `/api/v1/auth/oidc/check`    | System administrator | Checks the saved discovery configuration without changing it.                |

The callback never places a bearer JWT in a URL. Its opaque exchange code expires after 60 seconds and can be used only
once. Provider errors are reduced to stable error codes before they reach the browser or logs.

<a id="change-your-password"></a>

## Change your password

While signed in, open **Settings → General → Change password**. Enter the current password, the new password, and its
confirmation. Repovio keeps the current browser signed in with a replacement access token and invalidates tokens held by
every other signed-in session.

<a id="reset-a-forgotten-password"></a>

## Reset a forgotten password

Repovio deliberately has no email-based password reset. A deployment administrator can reset a local account from the
directory containing `compose.yml`. Read the replacement password without echoing it or storing it in shell history,
then send it to the API container over standard input:

```bash
read -rsp 'New Repovio password: ' REPOVIO_NEW_PASSWORD
printf '\n'
printf '%s\n' "$REPOVIO_NEW_PASSWORD" \
  | docker compose exec -T api node dist/scripts/reset-password.js USERNAME
unset REPOVIO_NEW_PASSWORD
```

Replace `USERNAME` with the exact login username. The command requires a password between 12 and 256 characters, updates
only that local account, and invalidates all of its existing access tokens. Sign in again with the new password
afterward. The command rejects OIDC-managed accounts because they have no local password.

<a id="local-user-and-group-management"></a>

## Local access groups

In a repository’s Group access section, select a group and assign Viewer or Manager; change the role or remove the
assignment there. Direct and group grants combine, with Manager winning over Viewer. Manager capabilities still require
the global Manager role; system administrators retain unrestricted access. Removing a membership or grant takes effect
on the next request, unless another grant preserves access. Groups are local, work with local and OIDC accounts, and are
not synchronized from OIDC claims.

[Local access groups](/docs/next/users#local-access-groups)
