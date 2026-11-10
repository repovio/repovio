# Research: Provider Account Actions and Webhook Setup

## Existing behavior and evidence

- `apps/web/app/components/modules/providers/account-actions.vue` renders webhook, conditional GitLab OAuth,
  enable/disable, and delete icon buttons. Existing events and pending props support replacing presentation locally.
- `apps/web/app/components/modules/providers/organization-webhooks-dialog.vue` resolves callback only from the selected
  saved configuration; creation therefore shows an empty field and after-save help. It already supports manual setup,
  secret generation/reveal/copy, rotation confirmation, removal, and receipt metadata.
- `apps/web/app/composables/api/organization-webhooks.ts` owns list/save/remove state but no draft initialization.
- `apps/api/src/modules/organization-webhooks/organization-webhooks.service.ts` constructs saved callbacks with
  `new URL('/api/webhooks/organization/' + hook.id, ENV.PUBLIC_URL)` and creates server-assigned UUID records. Its existing
  unique-constraint catch currently describes every collision as a duplicate namespace.
- `apps/api/src/modules/webhooks/webhook.controller.ts` accepts organization deliveries by UUID, both version-neutral
  and versioned; saved callback uses the version-neutral route. Keep that route unchanged.
- Existing shared create schema is strict and permits only scope and secret. Scope is trimmed, 1–255 characters,
  namespace validated and normalized lowercase. Secret is trimmed, 16–1024 characters. Nested namespaces are GitLab-only.
- `apps/web/tests/e2e/organization-webhooks.spec.ts` currently asserts the old empty-before-save behavior and exact create
  keys. Update those fixtures deliberately; passing unchanged tests would not prove the new behavior.
- Historical `specs/004-organization-webhook-callback/spec.md` explicitly excluded preallocation. This new request
  supersedes that UX assumption; preserve the historical artifact.

## Decision: One local action dropdown per account

**Rationale**: Existing feature component already owns conditions, labels, busy state, and emitted events. Nuxt UI
provides the established dropdown control. Retaining event contracts minimizes handler changes.

**Alternatives considered**: Page-wide action menu loses row context; custom popover adds avoidable keyboard/focus work.

## Decision: Server-generated stateless draft metadata

**Rationale**: Draft GET returns a UUID and canonical callback after admin/account authorization. Optional create ID
preserves the displayed URL on insert, requires no new table, and leaves old clients unchanged. Shared URL generation
prevents differences between preview and persistence. Draft initialization does not create abandoned records.

**Alternatives considered**:

- Browser UUID plus browser-origin URL: wrong when PUBLIC_URL differs from browser origin.
- Browser UUID plus newly exposed server base: viable, but separates URL ownership and still adds a server contract.
- Persist an incomplete hook on dialog open: abandoned database entries and secret-less configuration need cleanup.
- Change callback routing to namespace/account: changes URL semantics and existing delivery paths unnecessarily.
- Show URL only after saving: does not meet this request.

## Decision: Optional UUID is identity, not authorization

**Rationale**: Server validates UUID, authorizes selected account, and inserts only. A caller-supplied UUID must never
select an update/upsert path. Existing primary-key uniqueness rejects collision across accounts; sanitized conflict
feedback discloses no owner. Preview neither reserves the ID nor enables deliveries.

**Alternatives considered**: Signed draft token or persistent reservation adds lifecycle/storage without additional value
for an administrator-only local-create operation. Reconsider only if future non-admin draft creation changes the threat
boundary; outside this scope.

## Decision: Setup first, management separate

**Rationale**: Callback must be discoverable before save; show it before namespace/secret and keep saved configurations
below a distinct heading. Bounded scrolling and compact instructions preserve usable layouts for many hooks and mobile.

**Alternatives considered**: Wider modal alone preserves the confusing hierarchy; full new page broadens navigation scope.

## Validation and limits

Use existing pinned dependencies and repository fixtures as implementation authority; no external API change or new
library is proposed. Browser screenshots supplied by the user establish desired scope, not current local implementation
proof. Local tests and planned screenshots cannot establish real provider registration or deployed behavior.

No unresolved design decisions. Issue creation and product implementation remain separately gated.
