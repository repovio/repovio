# Data Model: Provider Account Actions and Webhook Setup

## Existing persisted Organization Webhook

Fields remain `id`, `providerAccountId`, normalized immutable `scope`, encrypted signing secret, and existing receipt
relationships/metadata. Existing UUID primary key permits explicit assignment. Keep all current uniqueness constraints,
account-scoped rotation/removal queries, encryption, and delivery lookup. No migration or backfill.

Public metadata remains `id`, `providerAccountId`, `providerType`, `scope`, `callbackUrl`, and `lastDeliveryAt`; never include
plaintext or encrypted secrets. Existing URL is immutable through rotation and unaffected by this feature.

## Transient draft resource

| Field         | Contract                                                                                           |
| ------------- | -------------------------------------------------------------------------------------------------- |
| `id`          | Server-generated UUID; optional create input; never an authorization token or database reservation |
| `callbackUrl` | Absolute canonical server URL for that UUID; read-only and copyable after metadata load            |

A draft belongs to the account/dialog session requesting it. It is not stored server-side. Abandoning it requires no
cleanup. Before save its URL does not resolve to a valid configuration and cannot accept authenticated delivery.

## Create input extension

Add optional UUID `id` to the existing strict `{ scope, webhookSecret }` create schema. Preserve current validation and
normalization. Omitted ID invokes existing database generation; supplied ID is passed only to insert. Duplicate ID or
account/scope produces sanitized conflict, never update, rotation, or disclosure of the colliding record.

## Client presentation state

- Account/dialog generation tracks ownership and rejects stale asynchronous responses.
- Separate list and draft load status/errors; save/remove retain complete awaited pending state.
- Mode: new draft or selected saved configuration. Store current draft ID, canonical URL, namespace, transient secret,
  reveal flag, rotation acknowledgement, and active operation only in component/composable memory.
- New draft: initializing, ready, saving, saved, or retryable failure. Validation/save failure preserves ID and inputs.
- Existing selection: use saved callback and immutable scope; rotate changes secret only; removal resets to fresh setup.
- Unknown save outcome: reload only authorized account metadata; an exact saved draft ID permits recovery. A conflict
  alone never establishes success. Reconcile response metadata without exposing stored secrets or silently changing URL.
- Add another, close/reopen, and account switch invalidate previous session selections; close clears plaintext immediately.

## Action menu state

Existing account identity, enabled status, provider type, OAuth status and availability determine entries. Existing
pending operation controls trigger loading and item disabled state. No persisted action/menu state or new authorization.
