# Research: Notifications Redesign

## Existing Architecture and Authority

- Decision: Bind implementation tasks to [issue #65](https://github.com/repovio/repovio/issues/65), created on 2026-11-09 at the user's
  explicit request after Phase 1 planning. Do not repurpose issue #62.
- Evidence: At the original planning check, no matching open notification issue existed. Issue #65 now records the full
  redesign scope and acceptance criteria; the user explicitly requested issue creation and subsequent task generation.
- Rationale: Keep the implementation order traceable to its own issue without expanding unrelated repository work.
- Alternatives considered: Expanding #62 would conflate repository navigation with notification redesign.
- Baseline drift: `PLAN.md` Notifications and constitution IV describe older repository-scoped channels/rules;
  `GLOSSARY.md`, `NotificationChannel`, and current code describe global channels and event subscriptions. Preserve the
  current domain model; this plan is not an architecture-document rewrite.

## Consolidated Toolbar Ownership

- Decision: Make `pages/notifications.vue` a neutral route outlet; each child owns one `LayoutPage` and its actions.
- Evidence: The parent currently supplies the breadcrumb toolbar while children supply separate table toolbars.
  `components/modules/workflow-runs/table-page.vue` already combines Querry Kit controls in `LayoutPage`'s action slot.
- Rationale: Reuses a proven layout and avoids route-to-parent callback registries or duplicate table state.
- Alternatives considered: Parent-injected controls would couple table implementation to routing unnecessarily.
- Preserve: Table storage names, query contracts, full column metadata, shortcuts, pagination, and the history admin gate.

## Push Failure Hypotheses and Diagnosis

- Decision: Reproduce first, then repair the lifecycle with explicit capability/permission/enrollment states.
- Evidence: `composables/app/browser-push.ts:20-23` returns a registration before waiting for activation;
  `enable()` immediately subscribes. This is a source-level first-enrollment race hypothesis, not a live diagnosis.
- Primary reference: [ServiceWorkerContainer.ready](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/ready)
  resolves after an active worker exists; it may wait indefinitely. Use an explicit bounded wait and actionable error.
  [Push API](https://www.w3.org/TR/push-api/) defines subscription and delivery behavior.
- Evidence: `refresh()` considers a local subscription sufficient; it does not check current-user server enrollment.
  Existing enrollment failures, database removal, or account switches can therefore display false enabled state.
- Evidence: `browser-push.service.ts` rejects reassignment of an endpoint owned by another user. Keep this protection.
  `store/auth.ts` currently clears local authentication without removing that device's enrollment.
- Decision: Passive refresh only inspects existing registration; enabling waits for active worker, requests permission
  directly from the user action, verifies the VAPID key, subscribes, persists registration, and reconciles state.
- Decision: Expose a bounded, authenticated ownership lookup; never reveal another user's identity. On explicit recovery,
  retire an unusable local subscription and obtain a fresh one rather than transferring an existing endpoint.
- Decision: Before normal sign-out, remove owned server enrollment and unsubscribe this device while credentials exist.
  If cleanup fails, expose retry; explicit continue-sign-out must still clear local account state and attempt local
  unsubscription. Account changes invalidate cached push/history state; other devices remain enrolled.
- Alternatives considered: Trusting `subscriptionCount` cannot identify the current device; silently overwriting endpoint
  ownership could deliver the previous account's notifications to the next account.
- Evidence: Existing subscriptions are reused without comparing the current VAPID public key. Plan controlled
  resubscription for mismatched keys, with clear recovery on failure.
- Evidence: Production `nuxt.config.ts` integrates `notification-sw.js` into generated `/sw.js`; development PWA workers
  are disabled by default. Inspect built assets and secure-context availability before claiming a missing handler.

## Delivery Outcome Accuracy

- Decision: Record a sanitized failed attempt for HTTP 404/410, retire the expired target, and never count expiration
  as successful push-service acceptance. Keep retrying valid failed targets with bounded existing backoff.
- Evidence: `browser-push.service.ts:167-169` currently returns `delivered: true, recordAttempt: false` after deletion.
- Rationale: Current behavior can mark all-expired deliveries successful without any device acceptance.
- Alternatives considered: Treating expiration as success hides failures; retrying an expired endpoint wastes attempts.
- Implementation detail to validate: Record recipient attribution even when a subscription is removed before the attempt
  is written; use a null device foreign key for retired subscriptions rather than referencing a deleted row.

## Four-Step Dialog and Preview

- Decision: Reuse existing shared channel schemas and transport field mappings in a four-step create workflow.
- Evidence: `components/modules/notifications/channel-dialog.vue` already handles all six transports, per-type fields,
  event selection, credential replacement, and workflow-match preview in one long form.
- Decision: Validate only the current step when advancing, then the full payload on save. Type changes reset incompatible
  destination values. Back navigation preserves valid input. Save exists only on the final step.
- Decision: Review always shows a secret-safe summary; preview only sends event subscriptions, never destination secrets.
  Workflow preview errors are retryable but not a new save prerequisite; valid non-workflow subscriptions can be saved.
- Evidence: `NotificationsService.previewRules()` requires at least one workflow event. The preview is historical rule
  matching, not notification rendering and not proof of destination connectivity.
- Decision: Preserve edit type immutability and write-only configuration unless explicitly replaced. Scope changes to
  event rules invalidate old preview results; stale asynchronous responses cannot overwrite current preview state.
- Alternatives considered: A new send-preview endpoint adds side effects; exposing stored credentials breaks the model.

## Navbar History and Persistence

- Decision: Show five personal browser-push logical deliveries, not the admin-wide delivery list. Load on popover open.
- Evidence: `pages/notifications/history.vue` uses admin middleware; `NotificationDeliveriesQueryService` and the
  existing list method intentionally protect system-wide history. Reusing that DTO for all users would widen access.
- Decision: Add nullable `recipientUserId` to Delivery Attempts. Persist it for every per-user browser attempt, including
  no-device and expired-device failures; existing non-browser and historical attempts remain null.
- Rationale: `browserPushSubscriptionId` uses `onDelete: SetNull`; channel recipients can change. Neither current channel
  membership nor surviving subscription links provide reliable historical recipient attribution.
- Decision: Group attempts by delivery, require `recipientUserId = authenticated user`, apply current Repository access
  in the database before limiting, order by delivery creation time/id descending, and project only personal safe fields.
- Decision: A user's send state is derived only from that user's attempts: any accepted device means DELIVERED;
  otherwise retry scheduled means PENDING, otherwise FAILED. This means acceptance by at least one push service,
  not OS display or a read receipt. Administrative aggregate status stays unchanged.
- Decision: Include attributed test attempts without Repository scope; exclude unattributed legacy attempts and do not
  infer or backfill ownership. Subscription deletion preserves recipient attribution until delivery retention removes it.
- Alternatives considered: A general inbox/read-state table is outside scope; filtering current channel recipients leaks
  historical events to newly added recipients; an admin endpoint shortcut exposes unrelated channels and recipients.

## Validation Limits

Existing notification browser tests mock push as unavailable; PWA coverage does not prove actual push receipt.
Source research and primary documentation support the design, but production VAPID configuration, OS permission,
network delivery, notification display, and click behavior remain to be verified during implementation.

## Implementation Findings and Verification (2026-11-09)

- The original source-level first-install race was covered by a failing regression and repaired with bounded active
  worker readiness. Passive refresh now verifies current-user enrollment without registering a worker or prompting.
- Additional reproduced races were repaired: an old account's pending enable could unsubscribe a newer account's
  subscription, and an older passive status response could overwrite successful enrollment. Account and read revisions
  now protect those asynchronous boundaries independently.
- Durable recipient attribution exposed a real PostgreSQL partial-index conflict when device foreign keys become null.
  Stable target keys preserve device/User attempt identity, including expired devices and recipient deletion. Legacy
  device target backfill uses only existing device UUIDs; it never infers historical recipients. Live-device uniqueness
  also covers mixed legacy/new writers. Applied migration files were preserved; corrections are separate migrations.
- A successful recipient whose device is removed no longer becomes failed while another recipient retries. Only that
  recipient's own recorded acceptance can satisfy an empty-device retry.
- The wizard preserves a successful mutation if dependent table refresh fails, so Retry refreshes without another
  create. Hidden numeric/enum destination values reset on type changes; obsolete previews clear their pending state.
- Production worker tests exposed unsafe notification destinations and malformed JSON handling; HTTP(S)-only,
  credential-free destination resolution and a generic malformed-payload notification now cover those cases.
- Headless-shell reports inconsistent notification permission in this environment. The focused production-handler test
  uses full Chromium and verifies actual `showNotification`/`getNotifications` with a synthetic worker push event.
- A separate controlled full-Chromium enrollment attempt reached an active production worker with permission `granted`
  but actual `pushManager.subscribe()` rejected with `AbortError: Registration failed - permission denied`.
  No real push subscription or network send was obtained. The cause is not established; live network delivery remains
  unverified. Synthetic clicks prove notification closure and safe target handling, not a trusted physical OS click.
