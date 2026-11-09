# Organization webhook configuration API

System Administrators can prepare one local configuration per organization/group and Provider Account.
Configuration is encrypted locally and never registers or modifies a provider webhook. Namespaces are immutable;
secrets can be rotated. Complete delivery and browser management are tracked by issue #58.

| Method | Route                                                            | Purpose                                 |
| ------ | ---------------------------------------------------------------- | --------------------------------------- |
| GET    | `/api/v1/provider-accounts/:id/organization-webhooks`            | List safe metadata                      |
| POST   | `/api/v1/provider-accounts/:id/organization-webhooks`            | Create with `scope` and `webhookSecret` |
| PATCH  | `/api/v1/provider-accounts/:id/organization-webhooks/:webhookId` | Rotate using only `webhookSecret`       |
| DELETE | `/api/v1/provider-accounts/:id/organization-webhooks/:webhookId` | Remove local configuration              |

Creation returns HTTP 201, listing/rotation HTTP 200, and removal HTTP 204. Unknown/cross-account identifiers return 404;
duplicate normalized scopes return 409. Authentication and System Administrator authorization are required.

Use an organization login for GitHub, Forgejo, or Gitea; use the full group path for GitLab. Namespaces normalize to lowercase.
Secrets contain 16–1024 characters and are write-only. Safe metadata includes configuration and account IDs, provider type,
normalized scope, callback URL and last accepted delivery time, never signing secrets or encrypted credential envelopes.

Apply the additive database migration before the new API starts. It preserves existing repositories and their signing secrets.
Rollback to the prior application can retain the added tables; do not drop configuration/receipt history during rollback.
