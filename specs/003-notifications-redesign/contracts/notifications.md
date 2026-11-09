# Contracts: Notifications Redesign

All API paths are relative to `/api/v1`; existing JWT authentication and shared Zod request/response validation apply.
These interfaces are implemented and covered by runtime HTTP, schema, and access-boundary checks.

## Unchanged Administrative Interfaces

Keep channel create/update/delete/test, workflow-rule preview, and `notification-deliveries/query` semantics.
Administrative delivery history and channel management remain System Administrator-only. Preview is read-only against
local synchronized records and accepts event subscriptions only; it neither sends a message nor validates connectivity.
The wizard maps to existing create/update schemas and preserves write-only secrets on unchanged edits.

## Current-Device Enrollment Lookup

Add `POST /browser-push/subscriptions/status` as a read-only authenticated lookup with body `{ endpoint: string }`,
validated using the existing endpoint constraints and bounded request limits. Keeping the endpoint out of URL query
parameters reduces accidental URL logging. Exclude request bodies from sensitive logging.

Response: `{ enrolled: boolean }`. Resolve by server-computed endpoint hash AND authenticated User ID.
Unknown and foreign-owned endpoints both return `{ enrolled: false }`; no owner identity, subscription IDs, or keys.
Malformed body returns 400; missing/invalid session returns 401. Lookup never transfers or creates enrollment.

Existing `GET /browser-push`, registration POST, and subscription DELETE retain their contracts. Registration rejects
foreign ownership; the client can explicitly renew its local subscription instead of bypassing that restriction.
Use shared schemas, explicit DTOs/return types, typed client methods, OpenAPI, and Bruno examples for the new lookup.

## Personal Recent History

Add `GET /notifications/recent` for every authenticated role. No user selector, arbitrary query, or client-controlled
recipient filter. Return `{ items: RecentNotification[] }`, capped server-side at five distinct logical deliveries.

| Field          | Shape                                                              |
| -------------- | ------------------------------------------------------------------ |
| `id`           | Delivery UUID                                                      |
| `createdAt`    | Existing API timestamp convention                                  |
| `kind`         | EVENT or TEST                                                      |
| `eventType`    | Existing NotificationEventType or null for TEST                    |
| `repository`   | `{ id, owner, name }` or null for TEST                             |
| `subjectTitle` | Safe display string                                                |
| `subjectUrl`   | Validated HTTP(S) destination or null                              |
| `status`       | Personal PENDING, DELIVERED, or FAILED as defined in data-model.md |

Server query combines immutable attempt recipient attribution with current CASL-aware Repository access in Prisma,
then deduplicates and limits in stable `(createdAt DESC, id DESC)` order. Use a dedicated explicit safe projection;
never grant general NotificationDelivery read abilities just to make this endpoint work. Project only the caller's
attempt outcomes and permitted subject metadata. All roles, including administrators, receive only their own entries.

Responses: 200 with an empty list when no eligible entries exist; 401 for unauthenticated callers; sanitized 5xx for
failure. Entries without reliable legacy attribution are excluded. Subscription deletion does not erase attribution.
Revoked Repository access removes the entry on the next request. Clear cached entries immediately on account change;
refresh on each popover open and never retain a previous successful list after an authorization error.

No subscription endpoints, credentials, channel secrets, recipient lists, per-device detail, or raw error strings appear
in this contract. A DELIVERED entry proves push-service acceptance on at least one personal device, not human receipt.

## Toolbar UI

- `/notifications`: one `LayoutPage` toolbar; breadcrumb left, Querry Kit controls and authorized actions right.
- System Administrators see channel creation and a delivery-history link to `/notifications/history`.
- `/notifications/history`: one toolbar with a linked Notifications breadcrumb, Delivery history leaf, and its controls.
- Parent route provides no second toolbar. Preserve both tables' storage keys and query bindings.
- Controls wrap at narrow widths; shortcuts, labels, column metadata, table scrolling, and pagination remain functional.

## Wizard UI

1. Name/type and enabled state.
2. Type-specific destination parameters; browser push uses recipients instead of URL/token fields.
3. Event subscriptions, Repository scope, and workflow patterns.
4. Masked configuration review plus applicable historical workflow-match preview.

Next validates its step; Back retains values; Enter cannot save before review. Final Save validates the entire payload,
blocks concurrent submission, and remains loading through awaited persistence and required refresh. Preserve edit type
immutability and explicit replacement behavior. Preview errors have retry controls; no-match/unsupported-event preview
states do not prohibit valid saves. Only workflow event rules are previewed when mixed events are selected.

Preview requests use an input revision guard or cancellation so obsolete responses cannot replace current results.
Draft URLs containing credentials, SMTP passwords, tokens, Discord webhook secrets, and Apprise credentials must be
masked or omitted in summaries and screenshots. Stored credentials are never fetched back for review.

## Navbar UI

Render `ModulesNotificationsNavbarPopover` immediately before `LayoutUserMenu` inside `navbar-controls.vue`.
Expose localized label, enrollment state, explicit enable/disable or recovery controls, and five recent personal entries.
History loading/error/retry is independent of enrollment loading/error; unsupported push does not hide personal history.
Only administrators see a link to full administrative delivery history. No unread badge or read-state behavior.

Use keyboard activation, Escape dismissal, focus restoration, accessible pending/error messages, safe link targets,
and English/German labels. Remove the old channels-page browser notifications banner; surface actionable device errors
inside the popover. Do not request notification permission on mount or popover open.
