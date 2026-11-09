# Research: Organization Webhooks

## Decisions and evidence

1. **Reuse provider verification and synchronization**. Existing `provider-adapter.ts`, provider adapters, `WebhookService`,
   and `ProviderSyncQueueService` already support signatures, delivery headers, sync scopes, and durable queue writes.
   Reuse those implementations; do not introduce provider registration or another queue.
2. **Separate connection-owned configuration from repository secrets**. Existing repository hooks bind a secret and URL to
   one local repository. A dedicated configuration allows multiple organizations per account without rewriting those secrets.
3. **Use normalized scope matching**. Repository `owner` is an organization login for GitHub/Forgejo/Gitea and GitLab's
   `namespace.full_path`. Match GitLab descendants with a slash boundary and prefer the deepest configuration for display.
4. **Use transactional conflict-safe inserts**. PostgreSQL uniqueness supports receipts per organization hook and deliveries
   per repository. Insert with conflict handling inside the same transaction as queue work; failed processing stays retryable.
5. **Keep configuration honest**. A local secret does not prove provider registration. The badge describes the selected
   source; receipt time records successful verification. GitHub App hooks remain independent.
6. **Respect provider prerequisites**. GitHub requires appropriate organization-owner privileges; GitLab group webhooks
   require Premium/Ultimate and cover subgroup projects. Provider instructions remain manual.

## Primary references

- [GitHub webhook types](https://docs.github.com/en/webhooks/types-of-webhooks)
- [GitLab group webhooks](https://docs.gitlab.com/api/group_webhooks/)
- [Forgejo webhooks](https://forgejo.org/docs/latest/user/repository/webhooks/)

No unresolved design decisions or external dependency upgrades remain.
