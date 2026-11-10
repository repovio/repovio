# UI and API Contracts

## Provider Account row

One ellipsis trigger with an accessible account-specific name. Menu entries: Organization Webhooks; GitLab Connect or
Reauthorize when applicable, retaining unavailable explanation; Enable or Disable; destructive Delete in its own group.
Keep existing component events `organizationWebhooks`, `oauth`, `toggle`, and `delete`. Trigger is loading/disabled across
the complete awaited row operation; labels and conditions match existing semantics. Keyboard opening, item navigation,
Escape dismissal, and focus restoration follow the established Nuxt UI menu behavior.

## Webhook dialog

Setup starts with canonical callback and copy control, then namespace and signing secret. Show loading/retry feedback
until metadata is available; never reconstruct from browser origin. Explain that unsaved callbacks require local save
before deliveries can be accepted and that Provider registration remains manual. Separate existing-configuration list
with receipt status and selection controls. Preserve rotation/removal confirmation and secure secret lifecycle.

Use bounded vertical scrolling, no horizontal modal overflow at 390 and 1102 pixels, keyboard-reachable controls, proper
labels, EN/DE localization, clipboard-denial feedback, and complete pending indicators. A failed list load must not erase a
ready draft; failed draft load must not block managing already loaded saved hooks.

## GET /api/v1/provider-accounts/:id/organization-webhooks/draft

New authenticated administrator-only endpoint. Validate account ID, authorize before reading account metadata, return
404 for an absent account to an authorized administrator. Generate UUID without storage or provider requests.

Response: HTTP 200, the existing unwrapped API JSON resource (Axios exposes it as response.data):

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "callbackUrl": "https://repovio.example/api/webhooks/organization/550e8400-e29b-41d4-a716-446655440000"
}
```

Set `Cache-Control: no-store`; client does not persist or cache draft metadata across dialog sessions. Response URL uses
the same server-owned helper and PUBLIC_URL as saved hooks. No signing secret, credentials, or existing-hook metadata.
Errors follow existing envelope: 401 unauthenticated, 403 non-administrator, 400 malformed account ID, 404 missing account.

## POST /api/v1/provider-accounts/:id/organization-webhooks

Backward-compatible input extension:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "scope": "repovio",
  "webhookSecret": "example-only-minimum-16-characters"
}
```

`id` is optional and must be a valid UUID when provided. Keep schema strict and existing scope/secret validation. Treat
secret example as documentation data only; never reuse it in configuration. Require SYSTEM_ADMIN and existing account.
Insert only, returning existing safe HTTP 201 DTO. Supplied ID and callback must equal draft metadata; omitted ID retains
server generation. Never trust a client URL field. Return sanitized 409 for ID or namespace conflict; no colliding-hook
metadata or mutation. Invalid input returns 400; preserve existing auth/not-found behavior.

A lost successful response can be recovered through the existing account-scoped list, matching the exact draft ID;
POST remains insert-only, with no new idempotent upsert contract.

## Unchanged endpoints and compatibility

Existing list, rotate, delete, and `/api/webhooks/organization/:webhookId` receiver remain compatible. Unknown unsaved IDs
remain rejected by existing receiver verification, never accepted merely because preview issued the UUID. Existing
saved callbacks and legacy POST clients remain valid. No provider calls or database migration.

## Contract synchronization

Update shared Zod request/draft-response schemas, Nest DTOs/Swagger, server response mapping, typed web resources/client,
Bruno examples, and current webhook setup docs together. Test validation and transport envelopes end-to-end. Preserve
published versioned snapshots. Check administrator/account isolation in addition to field filtering.
