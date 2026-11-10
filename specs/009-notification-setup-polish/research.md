# Research: Notification Setup Follow-up

**Date**: 2026-11-10

## 1. Existing feature and scope

- **Decision**: Create a bounded follow-up specification in the selected Codex worktree, detached at planning start.
- **Rationale**: PR [#68](https://github.com/repovio/repovio/pull/68) merged on November 9. Current open issues contain
  PWA audit #64 but no matching notification setup follow-up at planning start. Issue #90 now records this scope;
  do not rewrite completed redesign artifacts.
- **Alternatives considered**: Reopen all redesign work or combine with PWA installation; both exceed the four comments.

## 2. Disabled Browser push

- **Decision**: Distinguish server readiness from read lifecycle and device enrollment; retain server safeguards.
- **Rationale**: `notification-channel-draft.ts:230-238` disables the option only through `browserPushAvailable`.
  `pages/notifications/index.vue:155-159` passes `push.available`, refreshed on mount at `:336-348`.
  `browser-push-state.ts:37-83` initializes availability false and reports status failures separately, but the wizard
  receives only the boolean. Its passive refresh does not set loading for this read.
  `BrowserPushService.available` requires public/private VAPID keys and subject (`browser-push.service.ts:24-26`).
  Current-device support and permission are distinct (`composables/app/browser-push.ts:7-25`).
- **Alternatives considered**: Always enable the option, require this browser to enroll first, or infer missing server
  keys from the screenshot. All misrepresent readiness or block valid recipient setup.
- **Evidence limit**: No production status response or configuration inspected. `.env.example` leaves VAPID blank,
  and `compose.yml` already loads `.env`; missing production configuration is plausible, not established.

## 3. Stepper navigation

- **Decision**: Use Nuxt UI `UStepper` with explicit values and controlled, validated transitions.
- **Rationale**: The existing dialog uses a wrapping ordered list. `nextStep()` in
  `notification-channel-draft.ts:482-508` validates visible fields. This remains the source of business validation.
  Official [Stepper documentation](https://ui.nuxt.com/docs/components/stepper), retrieved through Context7, documents
  `items`, `modelValue`, `linear`, `disabled`, and exposed navigation. Linear navigation does not replace schema checks.
- **Alternatives considered**: Uncontrolled `v-model` or raw `next()`; these introduce paths around existing validation.

## 4. Footer submission

- **Decision**: Put Back, Next, and Save in `UModal #footer`; submit through the existing form instance.
- **Rationale**: Official [Modal documentation](https://ui.nuxt.com/docs/components/modal) defines the footer slot.
  Official [Form documentation](https://ui.nuxt.com/docs/components/form) explicitly supports external controls calling
  `form.submit()` while retaining validation. Existing save awaits persistence plus refresh and records `persisted` to
  avoid duplicate writes after refresh failure.
- **Alternatives considered**: Calling the persistence handler directly or nesting another form; both complicate validation
  and keyboard behavior unnecessarily.

## 5. Verification and standards

- **Decision**: Extend existing push lifecycle and notification browser tests; keep real delivery evidence separate.
- **Rationale**: `browser-push.test.ts` already exercises lifecycle boundaries; `tests/e2e/notifications.spec.ts` covers
  six transport wizards and history authorization. Existing Browser push happy path mocks `available:true`, so it cannot
  establish production readiness or OS notification display.
- **Alternatives considered**: Static markup checks only, introducing a new browser framework, or claiming mocked delivery
  proves live push. None supplies appropriate evidence.

All design choices resolved. Production cause remains an implementation-time diagnostic observation, not an unresolved
product requirement. No extension hook file exists; before/after specification and plan hooks are inapplicable.
