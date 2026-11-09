# Data Model: Notifications Redesign

## Existing Domain Entities

Notification Channels remain global and retain all existing transport configuration, event subscriptions, recipients,
and enabled state. Notification Deliveries remain the durable logical unit; retries/devices remain Delivery Attempts.
No new channel type, event type, provider write, inbox, unread count, or read receipt is introduced.

## Delivery Attempt Recipient Attribution

Add nullable `recipientUserId` (UUID) to `NotificationDeliveryAttempt`, related to User with `onDelete: SetNull`.
Add an index on `(recipientUserId, notificationDeliveryId, createdAt)`; confirm query plans against representative
history before finalizing the index. Existing device, channel, and delivery relations retain their behavior.

- Set attribution from trusted server-side recipient iteration, never a request-supplied User ID.
- Set it on successful, failed, no-device, and expired-device browser-push attempts.
- Store null for non-browser attempts, pre-upgrade records, and recipient-less configuration failures.
- On device expiration, store the failed outcome with null device relation after removal; recipient attribution survives.
- Deduplicate personal entries by delivery ID; never copy logical deliveries to represent retries or additional devices.
- Deleting a User clears attribution; deleting a delivery removes its attempts under existing retention behavior.

### Stable Target Identity

Real PostgreSQL verification exposed a direct dependency: the existing partial channel-attempt unique index treats
removed device foreign keys as anonymous attempts. Multiple browser recipients or deleted devices can collide.
Add nullable `targetKey` (maximum 128 characters), populated by trusted code as `device:<subscription UUID>` or
`user:<User UUID>` for no-device failures. This contains no endpoint or encryption key. Preserve it after User/device
deletion. Keep legacy partial uniqueness only for null targetKey and enforce a separate unique key on delivery,
channel, attempt, and nonnull targetKey. A corrective additive migration preserves already-applied migration history.
Existing writers and unattributed legacy attempts remain supported without a historical recipient backfill.
A separate idempotent migration fills stable device target keys only where an existing device UUID is known, so
legacy device deletion cannot collapse attempt identities. The live-device uniqueness index still applies to both
legacy null-target and new stable-target writers; stable keys protect attempts after the device foreign key is cleared.

### Migration and Compatibility

Use an additive nullable column/relation/index migration; no speculative historical backfill. Old application instances
can continue writing null. Such attempts are absent from personal history. Apply migrations before starting the new API,
regenerate Prisma, and test with a disposable database containing pre-upgrade notification history.
Rolling back application code can leave the additive field in place. Do not drop attribution while new code uses it;
any later destructive rollback requires a separate reviewed migration. No production migration is part of planning.

## Personal History Projection

One item per logical delivery with at least one attempt attributed to the current User. Require current Repository
read access for repository-bound events before applying the five-entry limit. No admin bypass for recipient ownership.
Test deliveries without a Repository require personal attribution. Newly added channel recipients cannot see old attempts.

Fields: `id`, `createdAt`, `kind`, nullable `eventType`, nullable Repository display identity, `subjectTitle`, nullable safe
`subjectUrl`, and `status` (`PENDING`, `DELIVERED`, `FAILED`). Do not return channel configuration, other recipients,
endpoint hashes, push keys, raw errors, or other users' attempts. Subject content is permission-filtered before projection.

`DELIVERED` means at least one of this User's device attempts was accepted; otherwise a scheduled retry means `PENDING`,
otherwise `FAILED`. Do not use another recipient's success to derive this User's state. Return newest logical deliveries
by `(createdAt DESC, id DESC)`; later retries do not reorder them.

## Client-Only Channel Draft

`step`: identity, destination, events, review. `name`, `type`, `enabled`, existing per-type destination fields,
`browserRecipientUserIds`, event states, `replaceConfiguration`, validation errors, preview revision/result/loading/error.
Draft secrets stay in memory; clear them on final close/reset. Do not persist them in storage or preview requests.

Transitions: identity validates name/type; destination validates type-specific fields or preserved configuration;
events validates at least one subscription and filters; review validates the complete shared request before one save.
Back retains valid values. Type changes reset incompatible destination values and preview. Editing cannot change type.
Closing/reopening resets step, errors, pending preview identity, and replacement intent.

## Browser Enrollment State

Model support/secure context, permission, API availability/public key, worker readiness, local subscription/key match,
authenticated server enrollment, and pending/error stage independently. “Enabled” requires permission granted, matching
local subscription, and current-user server enrollment; a subscription count alone never establishes device ownership.

Transitions: inspect without prompting; explicit enable requests permission and waits for active worker; register only
when ready; mark enabled only after server confirmation. Registration failures remain recoverable. Disable removes
owned enrollment then unsubscribes; partial failure remains visible. Account changes clear client state and history;
no endpoint reassignment. Normal sign-out attempts cleanup before losing credentials.
