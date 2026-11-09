# API Contracts: Organization Webhooks

Canonical contracts live in `libs/schemas/src/api/organization-webhooks.ts` and the existing repository metadata schema.

| Method | Route                                                            | Input                                     | Success                       |
| ------ | ---------------------------------------------------------------- | ----------------------------------------- | ----------------------------- |
| GET    | `/api/v1/provider-accounts/:id/organization-webhooks`            | None                                      | 200, safe configuration array |
| POST   | `/api/v1/provider-accounts/:id/organization-webhooks`            | `scope`, `webhookSecret`                  | 201, safe configuration       |
| PATCH  | `/api/v1/provider-accounts/:id/organization-webhooks/:webhookId` | Only `webhookSecret`                      | 200, safe configuration       |
| DELETE | `/api/v1/provider-accounts/:id/organization-webhooks/:webhookId` | None                                      | 204                           |
| POST   | `/api/webhooks/organization/:webhookId`                          | Original signed JSON and provider headers | 202, `accepted`, `duplicate`  |

The public callback also has the `/api/v1/webhooks/organization/:webhookId` alias. Configuration operations require System
Administrator authorization; connection and webhook path parameters are UUIDs. Inputs reject unknown properties. Scope is
trimmed, bounded to 255 characters and composed of namespace segments; nested scopes are accepted only for GitLab. Secrets
are trimmed and bounded to 16–1024 characters. Namespaces cannot be changed through PATCH.

Safe metadata contains `id`, `providerAccountId`, `providerType`, normalized `scope`, `callbackUrl`, and nullable ISO
`lastDeliveryAt`. No plaintext or encrypted secret is returned. Invalid input returns 400; unauthenticated/unauthorized
callers receive 401/403; missing or cross-account resources receive 404; duplicate scope returns 409.

Webhook provider identity is selected from stored configuration, never supplied by the caller. Invalid signatures/disabled
connections receive 401; authenticated malformed JSON receives 400. Verified unknown/ping events receive 202 without imports.

T3 adds repository webhook metadata `source` (`ORGANIZATION`, `REPOSITORY`, `NONE`) and nullable `organizationWebhook`
(`id`, `providerAccountId`, `scope`). `configured` and `callbackUrl` describe the effective displayed source; strict consumers
must accept the additional fields. Existing repository mutation and GitHub App contracts remain intact.
