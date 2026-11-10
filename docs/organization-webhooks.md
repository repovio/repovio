# Organization webhooks

Organization webhooks let one manually registered provider hook cover every tracked repository in an organization.
GitLab group webhooks also cover projects in descendant groups. Repovio never registers or changes hooks at the provider.

## Setup

1. Sign in as a System Administrator and open **Provider accounts**.
2. Open the connection’s three-dot action menu and select **Organization webhooks**. The same menu contains
   Enable/Disable, Delete, and applicable GitLab OAuth actions.
3. Enter the organization login, or the full GitLab group path such as `acme/platform`. Generate a signing secret.
4. Save the configuration. Copy its callback URL and signing secret into the provider's organization/group webhook settings.
5. Select the repository events you want to monitor. Send a provider test delivery and check **Last accepted delivery**.

The public callback must be reachable from the provider. Configure Repovio's `PUBLIC_URL` with its public HTTPS origin;
the callback is `/api/webhooks/organization/<configuration-id>`. JSON payloads and the same secret on both sides are required.
Secrets are encrypted at rest and never returned by the API. The dialog retains freshly entered secrets only until it closes.

- GitHub: organization **Settings > Webhooks**. Organization owner access is required. Subscribe to the available workflow,
  issue, pull request, and security events relevant to your installation.
- Forgejo/Gitea: organization **Settings > Webhooks**. Choose the native provider format and relevant repository events.
- GitLab: group **Settings > Webhooks**. Group webhooks require Premium or Ultimate. Subscribe to pipeline, job, issue,
  and merge request events as needed. Use the signing secret or legacy secret token supported by your GitLab version.

Provider references: [GitHub webhook types](https://docs.github.com/en/webhooks/types-of-webhooks),
[Forgejo webhooks](https://forgejo.org/docs/latest/user/repository/webhooks/), and
[GitLab group webhooks](https://docs.gitlab.com/api/group_webhooks/).

## Repository behavior

The configuration applies automatically to matching repositories under the same Provider Account. Organization names
and group paths are normalized to lowercase. GitLab matches exact groups and slash-delimited descendants: `acme/team`
matches `acme`, while `acme-other` does not. If groups overlap, the deepest configured group controls the displayed URL.
The blue **Organization** badge (German: **Organisation**) indicates local configuration, not verified provider registration.

Existing repository webhook URLs and secrets remain valid. Organization configuration takes display priority; removing it
restores the repository-specific configuration in the UI. GitHub App delivery remains independent and unchanged.
Hooks synchronize only already tracked, enabled repositories on enabled connections. Unknown repositories and events
without repository context are acknowledged without importing repositories. Polling remains available for reconciliation.

Provider delivery IDs are deduplicated durably. Deliveries with the same repository and delivery ID cannot queue duplicate
work even when received through both organization and repository endpoints. Separate provider IDs can still represent the
same underlying event; the synchronization queue coalesces those requests.

## Rotation and removal

Select **Manage webhook**, enter or generate a new secret, confirm the provider update, and select **Rotate secret**.
Update the provider immediately: the previous secret stops validating organization deliveries after rotation.
Removing a local configuration does not remove the provider hook. Remove that registration manually to stop failed deliveries.

## API

System Administrator authorization is required for these local configuration endpoints:

| Method | Path                                                             | Purpose                                 |
| ------ | ---------------------------------------------------------------- | --------------------------------------- |
| GET    | `/api/v1/provider-accounts/:id/organization-webhooks`            | List safe metadata                      |
| POST   | `/api/v1/provider-accounts/:id/organization-webhooks`            | Create with `scope` and `webhookSecret` |
| PATCH  | `/api/v1/provider-accounts/:id/organization-webhooks/:webhookId` | Rotate using only `webhookSecret`       |
| DELETE | `/api/v1/provider-accounts/:id/organization-webhooks/:webhookId` | Remove local configuration              |

Creation returns HTTP 201, rotation/listing HTTP 200, removal HTTP 204, duplicate scopes HTTP 409, invalid input HTTP 400,
unauthenticated access HTTP 401, unauthorized roles HTTP 403, and unknown/scoped-out configurations HTTP 404.
Namespace changes require removing and recreating the configuration. Safe metadata contains identifiers, provider type,
normalized scope, callback URL, and last accepted delivery time, never signing secrets.

The public callback accepts signed POST requests without a Repovio login and returns HTTP 202 after durable acceptance.
Invalid signatures or disabled connections return HTTP 401. Authenticated malformed payloads return HTTP 400.
The stable callback and `/api/v1/webhooks/organization/:webhookId` both work.

Repository webhook metadata adds `source` (`ORGANIZATION`, `REPOSITORY`, or `NONE`) and nullable
`organizationWebhook` (`id`, `providerAccountId`, `scope`). Existing `configured`, `callbackUrl`, and delivery-time fields
describe the effective displayed configuration. Strict API consumers must allow the added fields before upgrading.

## Migration and rollback

Deploy the additive migration before starting the new application. It creates organization configuration and receipt tables
and adds no transformations to existing rows. No provider-side migration or repository-secret replacement is required.
An application rollback can retain these tables; older versions continue using repository webhooks and polling. Do not
drop the new tables unless organization configuration and receipt history are intentionally being discarded.
