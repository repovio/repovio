# Data Model: Notification Setup Follow-up

## Existing persisted entities

Notification Channels, Event Subscriptions, Recipients, Browser Push Subscriptions, Notification Deliveries, and Delivery
Attempts retain existing fields and relationships. No migration, backfill, credential changes, or new storage is needed.
Browser push channel recipients remain Users; subscriptions remain scoped to each authenticated User.

## Transient server availability

| State               | Meaning                                   | New Browser push selection | Visible action              |
| ------------------- | ----------------------------------------- | -------------------------- | --------------------------- |
| idle                | Not checked for current account/dialog    | Disabled until checked     | Begin read on open          |
| loading             | Status request pending                    | Disabled until result      | Checking indicator          |
| available           | Successful status read, server configured | Enabled                    | No server warning           |
| server-unconfigured | Successful read, `available=false`        | Disabled                   | Setup guidance and recheck  |
| request-failed      | Status read failed                        | Disabled until confirmed   | Error explanation and retry |

Server response remains `{ available, publicKey, subscriptionCount }`. Only the public key is client-visible.
Do not infer a missing setting's identity from this boolean response. Operator setup guidance names all required settings.

Transitions: open/retry starts loading; a successful response determines available or server-unconfigured; failed status
read produces request-failed. A revision token prevents stale completion after close, a newer read, or an account change.
Account change resets all account-owned state. Device inspection errors remain device errors after server readiness succeeds.

## Device state

Retain supported, permission, currentDeviceEnabled, subscriptionCount, and existing worker/enrollment error semantics.
These describe this device and authenticated User. They must not gate configuring another User's Browser push channel.
No passive status read creates a worker, subscription, or permission prompt.

## Channel draft and navigation

Retain identity, destination configuration, recipients, event selection, preview, and existing schemas. Current step has
four explicit numeric values: identity 0, destination 1, events 2, review 3.

- Forward navigation validates the current step. Direct future-step jumps cannot skip unvalidated steps.
- Backward navigation preserves values. Closing and transport changes retain existing secret-clearing behavior.
- Saving blocks navigation and dismissal; full-form validation precedes persistence.
- Successful persistence followed by failed refresh enters existing persisted recovery. Retry refreshes without writing again.
- Preview results remain invalidated after relevant draft edits; stale results cannot overwrite newer state.

Read lifecycle is exposed as `availability` and `refreshing`; `cancelRefresh()` invalidates dialog-owned reads without
changing subscriptions. Existing `loading` remains the explicit enrollment mutation state. Device inspection errors
retain confirmed server availability.
