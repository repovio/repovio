# Implementation Plan: Notification Setup Follow-up

**Branch**: `codex/90-notification-setup-polish` | **Date**: 2026-11-10
**Issue**: [#90](https://github.com/repovio/repovio/issues/90) | **Base**: `01dd05cd97bb3ddf74bcb479c3504f2ef2274be5`
**Spec**: [spec.md](spec.md)

**Input**: `specs/009-notification-setup-polish/spec.md`

## Summary

Address the four notification browser comments: make Delivery history an accessible icon-only link, expose and recover
server push availability, replace the hand-built progress list with `UStepper`, and move actions into `UModal #footer`.
Reuse the existing channel draft, schema validation, enrollment state, and typed API. Do not bypass missing server setup
or require local device enrollment for global channel configuration.

## Technical Context

**Language/Version**: TypeScript with pinned compiler aliases; Node.js 26.13.0 and pnpm 11.28.9.
**Primary Dependencies**: Nuxt 4.6.x SPA, Vue 3.5.x, Nuxt UI 4.12.x, Zod, existing NestJS Web Push API.
**Storage**: Existing PostgreSQL channel/subscription records; new availability state is transient. No migration.
**Testing**: Existing Vitest lifecycle tests, Playwright notification scenarios, canonical formatter, lint and type checks.
**Target Platform**: HTTPS desktop/mobile web; current browser support remains distinct from server availability.
**Project Type**: Existing pnpm/Nx web/API monorepo.
**Performance Goals**: One availability refresh per dialog open or explicit retry; no new polling or provider calls.
**Constraints**: Preserve server configuration guards, authorization, credentials, validation, full async loading, all channel
transports, and English/German localization. No dependency or toolchain changes.
**Scale/Scope**: One toolbar action, one four-step dialog, its state/composable boundary and focused regression coverage.

## Constitution Check

Pre-research and post-design gate results:

| Principle                       | Result            | Design evidence                                                                |
| ------------------------------- | ----------------- | ------------------------------------------------------------------------------ |
| Bounded approved architecture   | PASS for planning | Only four comments and direct push diagnosis; issue #90                        |
| Read-only providers             | PASS              | No outbound forge mutations or new provider integration                        |
| Authorization/secrets           | PASS              | Existing role/query rules and encrypted records retained; no credential output |
| Durable notifications           | PASS              | Reuse current persistence and delivery; no new retry/delivery design           |
| Verification/localization       | PASS for design   | Focused lifecycle/browser matrix; English and German text                      |
| Existing architecture/toolchain | PASS              | Existing composables, components, API and pinned dependencies                  |
| Delivery permissions            | PASS for planning | Implementation and local acceptance complete; merge/deployment pending         |

Issue #90 records this scope. Current open issue #64 concerns PWA support; do not absorb it or
expand into installation/offline work. PR #68 is merged. No duplicate redesign issue is needed.

The constitution's documentation instructions conflict with current `AGENTS.md` and `docs/coding-guidelines.md` about
inline callbacks and typed JSDoc tags. Apply current explicit repository instructions: document all handwritten
callables and exported declarations; do not repeat TypeScript types in braces. No standards audit or amendment is scoped.

## Project Structure

### Documentation (this feature)

```text
specs/009-notification-setup-polish/
  spec.md
  plan.md
  research.md
  data-model.md
  contracts/ui.md
  quickstart.md
  tasks.md
  checklists/requirements.md
```

Task generation approved on 2026-11-10; see [tasks.md](tasks.md). Issue creation, implementation, and task commits/pushes are approved and completed. Merge remains a separate gate.

### Source Code (repository root)

```text
apps/web/app/pages/notifications/index.vue
apps/web/app/components/modules/notifications/channel-dialog.vue
apps/web/app/components/modules/notifications/channel/identity-step.vue
apps/web/app/composables/app/notification-channel-draft.ts
apps/web/app/composables/app/browser-push-state.ts
apps/web/app/composables/app/browser-push.test.ts
apps/web/tests/e2e/notifications.spec.ts
apps/web/i18n/locales/en.json
apps/web/i18n/locales/de.json
apps/api/src/modules/notifications/browser-push.service.ts  # Existing availability guard, change only with evidence.
```

**Structure Decision**: Keep route orchestration in the page, dialog layout in the feature component, draft transitions
in its existing composable, and server/device state in the existing push state layer. Extend the existing locale files; do not create a new locale
tree.

## Phase 0: Research Outcome

See [research.md](research.md). Server readiness, failed reads, and current-device enrollment are separate concepts.
The screenshot cannot identify production's configuration. Existing Compose environment loading is already present;
there is no evidence for adding speculative environment passthrough or replacing Web Push.

Nuxt UI supplies controlled step values, linear navigation, and modal footer slots. Its linear flag is not business
validation. Keep the draft composable authoritative for transitions and route every forward interaction through validation.

## Phase 1: Design

### Delivery history

Keep `to=/notifications/history` and the administrator guard. Replace visible `label` with localized `aria-label` and
`UTooltip` using the same history text; retain the history icon and current visual variant.

### Push availability and diagnosis

Model `idle`, `loading`, `available`, `server-unconfigured`, and `request-failed` separately. Refresh on dialog open and
explicit retry. Use the existing status response without a new endpoint. A failed device-enrollment inspection must not
turn a successful server readiness read into server-unconfigured. Separate status readiness from subsequent device checks
inside the existing layer rather than adding a parallel API cache.

Expose an adjacent localized explanation and retry control. For server-unconfigured, identify all three required VAPID
settings in operator guidance; do not expose configuration values. If implementation-time non-secret evidence identifies
an actual API or deployment template defect, fix only its responsible existing layer with a regression. Production
configuration changes and restarts remain outside this planning request.

Retain revision/account invalidation, reset readiness on account changes, and prevent stale reads from publishing state.
Existing Browser push drafts keep type and recipients when unavailable; existing server validation remains authoritative.

### Stepper and modal footer

Build four localized `StepperItem` entries with explicit values `0`, `1`, `2`, `3`. Bind the controlled current value to
the existing draft state. A guarded transition handler permits backward moves, validates before forward moves, and never
accepts a direct jump past unvalidated steps. Do not use blind `v-model` updates or raw stepper `next()` to bypass validation.
Block all transition entry points while saving, persisted-refresh recovery, or any conflicting awaited operation.

Move navigation controls into `UModal #footer`. Keep `UForm` in `#body`; external Save calls its documented `submit()`
method so full schema validation and the existing submit handler still run. Back and Next remain button actions.
Preserve pre-review Enter handling and focus movement, disable repeated submissions, and keep Save loading through
`onSaved`. Preserve persisted-write recovery so retry only refreshes the list after a successful write.

Use the modal's existing layout utilities for reachable footer actions and responsive step titles. No new wrapper
framework, secondary wizard store, or custom CSS system is required.

### Validation and delivery boundary

Use the Vue feature acceptance matrix in [quickstart.md](quickstart.md). No API contract change or migration is planned.
If a necessary contract change emerges, reconcile shared schema, DTO/client types, protected endpoint examples, and Bruno
coverage under `api-contract-check` before implementation proceeds with the changed design.

The generated tasks partition coherent changes into independently verified increments, each with tests,
relevant documentation, and exactly one focused `repovio` Changeset per substantive implementation commit. Commit
permission must be explicit and compatible with the repository's commit-only-on-request rule.

## Complexity Tracking

No architectural exceptions or new dependencies. The documented standards discrepancy is resolved by existing instruction
precedence, not a waiver. Required production/browser proof remains an evidence boundary, not a passed check.
