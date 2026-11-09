# Data Model: Organization Webhooks

## OrganizationWebhook

- UUID `id`; creation/update timestamps.
- `providerAccountId` foreign key with cascading deletion.
- Immutable normalized lowercase `scope` (organization login or full GitLab group path), bounded to 255 characters.
- Encrypted `encryptedWebhookSecret`; plaintext is accepted only on creation/rotation and never serialized.
- Unique `(providerAccountId, scope)` prevents duplicate configuration on one connection.

## OrganizationWebhookDelivery

- UUID `id`, receipt timestamp, provider `deliveryId` bounded to 255 characters, owning `organizationWebhookId`.
- Cascading ownership and unique `(organizationWebhookId, deliveryId)` provide durable receipt deduplication.
- Index `(organizationWebhookId, createdAt)` supports latest accepted delivery metadata.

## Existing records

Repository secrets, IDs, memberships, existing webhook deliveries, GitHub App configuration, and queue records retain their
existing models. A verified tracked event also inserts the existing repository delivery identity before scheduling work,
preventing duplicate work for matching repository/delivery IDs across ingress paths.

No backfill or destructive alteration is required. An application rollback retains the additive tables; dropping them would
intentionally discard organization configuration and receipts and is outside this task.
