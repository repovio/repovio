# Organization webhook callback drafts

Administrators can request `GET /api/v1/provider-accounts/:id/organization-webhooks/draft` before creating configuration.
The HTTP 200 JSON resource contains `id` (UUID) and `callbackUrl` (absolute URL), without an additional response envelope.
The response uses `Cache-Control: no-store` and the configured server `PUBLIC_URL`, even if the browser uses another origin.
Preview creates no database record, reserves no identifier, and performs no provider request. Its URL remains inactive
until local configuration is saved; provider registration is manual.

Pass the optional draft `id` with the usual `scope` and write-only `webhookSecret` to the existing POST endpoint.
HTTP 201 returns safe metadata with the same ID and URL. Existing clients omitting `id` keep server-assigned identities.
The server ignores no validation: malformed UUID or unknown fields return 400; missing authentication returns 401;
non-administrators receive 403 and absent accounts return 404. Identifier or namespace conflicts return sanitized 409
without updating any existing hook. A draft ID is never an authorization token. Rotation and removal remain account-scoped.

Keep the draft identity stable across input validation or retry. If a successful save response is lost, list only the
selected account and reconcile its exact draft ID before retrying. A conflict alone does not establish creation success.
Do not persist signing secrets or log request bodies. Dismissing setup requires no server cleanup.
