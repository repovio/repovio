# Tasks: Notifications Redesign

**Issue**: [#65](https://github.com/repovio/repovio/issues/65)

**Branch**: `codex/003-notifications-redesign`

**Input**: [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md), [data-model.md](data-model.md),
[contracts](contracts/notifications.md), and [quickstart.md](quickstart.md).

**Tests**: Required by the feature acceptance scenarios and constitution. Add focused regression tests before the
corresponding behavior change, confirm they fail for the intended reason, then make them pass.

**Organization**: Setup, shared contracts, four independently verifiable User Stories, and cross-cutting validation.
All paths are relative to the repository root. New files are named explicitly; reuse existing infrastructure.

## Execution Rules

- Complete only issue #65 and its direct dependencies; no provider writes, toolchain upgrades, inbox, or unread state.
- Before edits/tests, inspect status and relevant diffs. Preserve existing work; use Node.js 26.13.0 and pnpm 11.28.9.
- Follow GLOSSARY.md, docs/coding-guidelines.md, and the constitution. Document new declarations and localize visible text.
- Use the existing writable graph snapshot. Query Graphify before code exploration; refresh it after source changes.
- `[P]` means independent file ownership within the stated ready batch, not permission to ignore prerequisite tasks.
- Keep every task unchecked until implemented and verified. Task generation itself completes none of these tasks.
- Implementation was explicitly approved after generation. The subsequent PR request authorizes delivery commits and push; production migrations, deployment, and release remain outside scope. Completed task checks were established by local verification before PR preparation.

## Phase 1: Setup

**Purpose**: Confirm the existing environment and establish reproducible, sanitized evidence without new infrastructure.

- [x] T001 Verify issue #65 scope against `specs/003-notifications-redesign/spec.md`, `PLAN.md`, `GLOSSARY.md`, and `docs/coding-guidelines.md`; record only material discrepancies in `specs/003-notifications-redesign/research.md`.
- [x] T002 Verify pinned Node/pnpm, install existing locked dependencies if needed, and establish disposable local API/database/web prerequisites from `package.json`, `apps/api/package.json`, and `apps/web/package.json`; record runnable commands in `specs/003-notifications-redesign/quickstart.md` without changing manifests or shared services.
- [x] T003 Capture baseline notification/PWA test results and reproduce the reported push failure with stage-specific, secret-safe evidence from `apps/web/app/composables/app/browser-push.ts`, `apps/web/nuxt.config.ts`, and `apps/api/src/modules/notifications/browser-push.service.ts` in `specs/003-notifications-redesign/research.md`; distinguish source hypotheses from live observations.

**Checkpoint**: Existing test infrastructure and reproduction constraints are understood. Missing live credentials must
be recorded rather than replaced with invented delivery evidence; local implementation work can continue.

## Phase 2: Foundational Shared Contracts

**Purpose**: Both enrollment and personal history need typed, validated boundaries before story integration.

- [x] T004 Add failing lookup/history contract tests in `libs/schemas/src/api-contracts.test.ts`: endpoint input uses existing HTTPS/max-4096 constraints; lookup returns only enrolled boolean; history permits at most five items, existing EVENT/TEST and event enums, nullable event/Repository/URL fields, UUID identity, and only PENDING/DELIVERED/FAILED states; reject extra secret or recipient fields.
- [x] T005 Define/export enrollment lookup and RecentNotification request/response schemas in `libs/schemas/src/api/notifications.ts`, `libs/schemas/src/api-contracts.ts`, and `libs/schemas/src/contracts.ts`, with web exports in `apps/web/app/types/api/resources.ts`; preserve the exact nullability and enums in `specs/003-notifications-redesign/data-model.md` and make T004 pass.
- [x] T006 Add typed methods for `POST /browser-push/subscriptions/status` and `GET /notifications/recent` in `apps/web/app/composables/api/repovio-api.ts`; keep endpoint data out of URL queries and preserve existing authenticated-client behavior.

**Checkpoint**: Shared schema tests pass. Both methods have explicit typed contracts; server implementation follows
in the owning story. Do not relax existing administrative delivery contracts or permissions.

## Phase 3: US1 - Enable Working Browser Push (Priority: P1, MVP)

**Goal**: Correct first-time enrollment, current-account ownership, recovery, and delivery outcomes.

**Independent Test**: In a fresh supported secure-context browser, explicitly enable push, send one controlled test,
observe display/click, reload, disable, and verify no further targeting. Unit tests separately prove failure states.

### Regression Tests

- [x] T007 [P] [US1] Add browser lifecycle regressions in `apps/web/app/composables/app/browser-push.test.ts` for worker-install races, a 15-second activation timeout, no registration/prompt on passive refresh, denied/revoked permission, unavailable/insecure/unsupported contexts, absent server enrollment, failed registration/retry, and mismatched VAPID keys.
- [x] T008 [P] [US1] Extend `apps/api/src/modules/notifications/browser-push.service.spec.ts` and add `apps/api/src/modules/notifications/browser-push.controller.spec.ts` for authenticated ownership lookup, unknown/foreign indistinguishability, ownership-preserving registration, encrypted persistence, and HTTP 404/410 retirement without false success.
- [x] T009 [P] [US1] Extend `apps/api/src/modules/notifications/notification-delivery.service.spec.ts` for all-expired targets, no-device recipients, mixed-user/mixed-device outcomes, successful-device retry exclusion, and bounded backoff; assert no foreign key references a subscription removed before attempt insertion.

### Implementation

- [x] T010 [US1] Implement read-only enrollment lookup in `apps/api/src/modules/notifications/browser-push.service.ts`, `apps/api/src/modules/notifications/browser-push.controller.ts`, and `apps/api/src/modules/notifications/dto/browser-push.dto.ts`; query endpoint hash AND authenticated User ID, return only `{ enrolled: boolean }`, and keep existing ownership guards.
- [x] T011 [US1] Repair readiness/state reconciliation in `apps/web/app/composables/app/browser-push.ts`: distinguish capability/secure context, permission, API availability, worker readiness, local key match, and authenticated enrollment; request permission directly from enable, bound activation to 15 seconds, recover explicitly from missing enrollment/key mismatch, and retain loading through all awaited work.
- [x] T012 [US1] Add sign-out/account-switch regressions in `apps/web/app/store/auth.test.ts`, then implement owned-device cleanup and account-state invalidation in `apps/web/app/store/auth.ts`, `apps/web/app/composables/app/browser-push.ts`, and `apps/web/app/components/layout/user-menu.vue`; cleanup before losing credentials, expose retry/explicit continue on failure, attempt local unsubscribe, and preserve other devices without endpoint reassignment.
- [x] T013 [US1] Correct expired-target results and sanitized attempt recording in `apps/api/src/modules/notifications/browser-push.service.ts` and `apps/api/src/modules/notifications/notification-delivery.service.ts`; 404/410 must not count as acceptance, retired targets must not be retried, and valid failed targets must retain bounded retries and durable logical deduplication.
- [x] T014 [US1] Add localized actionable push-state and cleanup recovery text in `apps/web/i18n/locales/en.json` and `apps/web/i18n/locales/de.json`; wire existing device controls in `apps/web/app/pages/notifications/index.vue` and `apps/web/app/components/layout/user-menu.vue` until US4 relocates them.
- [x] T015 [US1] Extend production-worker display/click coverage in `apps/web/tests/pwa/pwa.spec.ts` and enrollment/recovery scenarios in `apps/web/tests/e2e/notifications.spec.ts`; verify and fix `apps/web/public/notification-sw.js` or `apps/web/nuxt.config.ts` only if evidence identifies a worker defect, preserving existing PWA behavior and safe notification targets.
- [x] T016 [US1] Add the authenticated enrollment lookup example under `apps/api/bruno/browser-push/check subscription status.bru` and its folder metadata if needed; verify OpenAPI generation through `apps/api/src/openapi/document.spec.ts` with secret-safe example values.
- [ ] T017 [US1] Run focused schema/API/lifecycle/auth/browser tests and the controlled production-worker push scenario in `specs/003-notifications-redesign/quickstart.md`; record sanitized evidence and any unavailable live verification there without treating mocks as proof of OS receipt.

**Checkpoint**: US1 can ship as the MVP without the wizard, toolbar redesign, or personal-history endpoint. If actual
push display cannot be verified, retain that limitation explicitly and do not claim complete live acceptance.

## Phase 4: US2 - Navigate Channels and Delivery History (Priority: P2)

**Goal**: One responsive breadcrumb/action toolbar per notification table route.

**Independent Test**: Open both routes at desktop/mobile widths; operate all table controls, navigate history, reload
persisted table settings, and verify non-admin visibility/direct-access denial.

- [x] T018 [US2] Add failing merged-toolbar, navigation, persisted table-state, keyboard, and non-admin denial scenarios in `apps/web/tests/e2e/notifications.spec.ts`; assert exactly one `data-page-toolbar` per route without a second table toolbar.
- [x] T019 [US2] Make `apps/web/app/pages/notifications.vue` a neutral route outlet, move `LayoutPage` ownership/actions to `apps/web/app/pages/notifications/index.vue` and `apps/web/app/pages/notifications/history.vue`, and preserve full-width metadata, table storage keys, complete column metadata, query bindings, pagination, and shortcuts.
- [x] T020 [US2] Add the System Administrator-only delivery-history action and linked history breadcrumbs in `apps/web/app/pages/notifications/index.vue` and `apps/web/app/pages/notifications/history.vue`; preserve history middleware and render controls through the established `LayoutPage` action slot.
- [x] T021 [US2] Add or reuse appropriate toolbar/history action labels in `apps/web/i18n/locales/en.json` and `apps/web/i18n/locales/de.json`; verify responsive wrapping, accessible labels, focus, and table scrolling against `apps/web/app/components/layout/page.vue` without redesigning unrelated pages.
- [x] T022 [US2] Run focused notification Playwright scenarios and desktop/mobile English/German visual checks from `specs/003-notifications-redesign/quickstart.md`; verify all controls and authorized navigation survive the layout change.

**Checkpoint**: US2 works with the existing dialog and device controls; no dependency on US3 or US4.

## Phase 5: US3 - Create a Channel in Four Steps (Priority: P2)

**Goal**: Name/type, destination, events, and preview/review with correct validation and secret preservation.

**Independent Test**: Create each of the six channel types through four steps; test Back/type changes, invalid fields,
masked review, preview failures/staleness, final save, and unchanged/replaced configuration on edit.

- [x] T023 [P] [US3] Add failing state/validation/serialization tests in `apps/web/app/composables/app/notification-channel-draft.test.ts` for identity/destination/events/review transitions, Back retention, type-reset behavior, at least one event, fixed edit type, explicit credential replacement, final full validation, and close/reset secret clearing.
- [x] T024 [P] [US3] Add four-step browser scenarios to `apps/web/tests/e2e/notifications.spec.ts` for all six transports, Enter before review, duplicate clicks, save failure/loading, secret-safe summaries, non-workflow-only/mixed events, preview retry, and obsolete preview responses.
- [x] T025 [US3] Extract the typed in-memory draft and existing transport/request mapping into `apps/web/app/composables/app/notification-channel-draft.ts`; keep `step` values identity/destination/events/review, preserve write-only edit semantics, clear incompatible fields on type changes, and never store draft credentials in persistent state or preview payloads.
- [x] T026 [US3] Implement named identity/destination steps in `apps/web/app/components/modules/notifications/channel/identity-step.vue` and `apps/web/app/components/modules/notifications/channel/destination-step.vue`; preserve EMAIL/GOTIFY/NTFY/DISCORD/CUSTOM_APPRISE/BROWSER_PUSH fields, enabled state, recipient selection, and explicit replacement intent.
- [x] T027 [US3] Implement event selection and review sections in `apps/web/app/components/modules/notifications/channel/events-step.vue` and `apps/web/app/components/modules/notifications/channel/review-step.vue`; preserve Repository/workflow filtering and mask or omit every credential-bearing token/password/URL in review.
- [x] T028 [US3] Refactor `apps/web/app/components/modules/notifications/channel-dialog.vue` to coordinate four steps with step-local validation, Back, final-only Save, complete shared-schema validation, and blocked concurrent submission; keep Save loading through persistence and required parent refresh, using an awaited integration with `apps/web/app/pages/notifications/index.vue` rather than an unawaited saved event.
- [x] T029 [US3] Add input-revision cancellation/guarding and preview lifecycle handling in `apps/web/app/composables/app/notification-channel-draft.ts` and `apps/web/app/components/modules/notifications/channel/review-step.vue`; send only workflow event subscriptions to existing preview, explain unsimulated events, allow valid saves after no-match/preview failure, and keep retry/loading independent of Save.
- [x] T030 [US3] Add complete step, validation, review, preview, navigation, and accessibility labels in `apps/web/i18n/locales/en.json` and `apps/web/i18n/locales/de.json`; wire focus movement/restoration and mobile layout in `apps/web/app/components/modules/notifications/channel-dialog.vue`.
- [x] T031 [US3] Run draft unit tests and channel create/edit/preview browser coverage from `specs/003-notifications-redesign/quickstart.md`; verify real rendered keyboard/mobile English/German flows and that preview sends no message or credential payload.

**Checkpoint**: US3 is independently useful with existing channel APIs and toolbar ownership; it does not require the
personal-history endpoint. Coordinate `index.vue` edits if US2 is being implemented concurrently.

## Phase 6: US4 - Access Personal Notifications from the Navbar (Priority: P2)

**Goal**: Replace the old banner with a global notification popover, current-device controls, and five private entries.

**Independent Test**: Open the popover from multiple routes/accounts. Verify placement, independent device/history
states, stable five-entry grouping, no cross-user/Repository leakage, and retained history after device deletion.

### Regression Tests

- [x] T032 [P] [US4] Add additive migration/legacy-row/relationship tests in `apps/api/src/modules/notifications/notification-recipient-migration.integration.spec.ts` against disposable PostgreSQL: existing rows stay null, new attribution survives subscription deletion, User deletion clears attribution, and existing application writes still work without the new field.
- [x] T033 [P] [US4] Add personal-history service/controller authorization tests in `apps/api/src/modules/notifications/recent-notifications.service.spec.ts` and `apps/api/src/modules/notifications/recent-notifications.controller.spec.ts` for every role, foreign recipients, changed channel recipients, revoked Repository access, tests without a Repository, unauthenticated requests, five-entry limiting after restrictions, stable grouping/order, and safe DTO serialization.
- [x] T034 [P] [US4] Add popover/cache/loading/error/account-change regressions in `apps/web/app/composables/app/recent-notifications.test.ts`; extend `apps/web/tests/e2e/notifications.spec.ts` for global placement, no page banner, unsupported-push history, and forbidden admin-history links after T024's edits are integrated.

### Implementation

- [x] T035 [US4] Add "nullable `recipientUserId` (UUID)" to `apps/api/prisma/notification-delivery-attempt.prisma`, relate it to `apps/api/prisma/user.prisma` with "`onDelete: SetNull`", and add the "index on `(recipientUserId, notificationDeliveryId, createdAt)`" through `apps/api/prisma/migrations/20261109150000_attribute_browser_push_attempt_recipients/migration.sql`; do not backfill historical/non-browser rows, validate the query plan on representative disposable data, and generate Prisma types using existing tooling. Include compatible stable `targetKey` support and corrective legacy-backfill/live-device uniqueness migrations from `specs/003-notifications-redesign/data-model.md`.
- [x] T036 [US4] Persist trusted attempt-time User attribution in `apps/api/src/modules/notifications/notification-delivery.service.ts` for successful/failed/no-device/expired-device browser attempts; retain "null for non-browser attempts, pre-upgrade records, and recipient-less configuration failures", and extend `apps/api/src/modules/notifications/notification-delivery.service.spec.ts` to prove retries preserve logical identity and deleted subscriptions never cause invalid foreign keys.
- [x] T037 [US4] Implement `apps/api/src/modules/notifications/recent-notifications.service.ts` with recipient ownership AND current CASL-aware Repository restrictions in Prisma before deduplication/limit; return "One item per logical delivery" in "`(createdAt DESC, id DESC)`" order, cap at five, exclude unattributed legacy rows, and keep safe attributed test deliveries without Repository scope.
- [x] T038 [US4] Implement a separate safe projection in `apps/api/src/modules/notifications/dto/recent-notification.dto.ts`: preserve nullable event/Repository/URL fields and existing EVENT/TEST kinds; status is only this User's "`PENDING`, `DELIVERED`, `FAILED`", where any accepted personal device means DELIVERED, otherwise scheduled retry means PENDING, otherwise FAILED; never expose another User's outcomes, channel configuration, endpoint hashes, keys, or raw errors.
- [x] T039 [US4] Expose authenticated `GET /notifications/recent` in `apps/api/src/modules/notifications/recent-notifications.controller.ts`, register it in `apps/api/src/modules/notifications/notifications.module.ts`, and make T033 pass without widening administrative NotificationDelivery permissions or accepting a recipient selector.
- [x] T040 [US4] Implement `apps/web/app/composables/app/recent-notifications.ts` using the typed API method: lazy refresh on each popover open, explicit loading/empty/error/retry states, no per-route background fetching, immediate invalidation on account changes, and no stale list retained after an authorization error.
- [x] T041 [US4] Implement `apps/web/app/components/modules/notifications/navbar-popover.vue` with five safe entries, personal status/timestamps, supported/denied/unavailable device controls from US1, independent history/enrollment errors and pending states, safe links, keyboard dismissal, focus restoration, and an admin-only full-history link; no unread/read state.
- [x] T042 [US4] Insert the popover immediately before `LayoutUserMenu` in `apps/web/app/components/layout/navbar-controls.vue`, remove the old browser-notifications banner and duplicate device controls from `apps/web/app/pages/notifications/index.vue`, retain channel-creation availability checks, and add complete English/German text in `apps/web/i18n/locales/en.json` and `apps/web/i18n/locales/de.json`.
- [x] T043 [US4] Add `apps/api/bruno/notifications/get recent notifications.bru` and folder metadata, synchronize generated development OpenAPI through the existing export tooling, and verify the recent-history schema/401 responses in `apps/api/src/openapi/document.spec.ts`; use secret variables and leave released OpenAPI archives untouched.
- [x] T044 [US4] Run migration/API authorization/schema/frontend tests and the personal-history browser matrix in `specs/003-notifications-redesign/quickstart.md`; verify device deletion, recipient changes, retries, account switching, revoked access, all role gates, and desktop/mobile English/German rendering before accepting US4.

**Checkpoint**: US4 consumes US1's repaired device lifecycle and US4's own history endpoint; US3 is not a dependency.
The existing admin history is still separate. Pre-upgrade attempts without reliable attribution stay absent.

## Phase 7: Polish and Cross-Cutting Validation

- [x] T045 Reconcile all issue #65 acceptance criteria against `specs/003-notifications-redesign/spec.md`, `specs/003-notifications-redesign/contracts/notifications.md`, and this `specs/003-notifications-redesign/tasks.md`; resolve implementation discrepancies within scope and document remaining environmental verification limits.
- [x] T046 Run focused tests first, then affected schema/API/web lint, documentation, typecheck, tests, OpenAPI, and production-web/PWA build checks from `specs/003-notifications-redesign/quickstart.md`; fix relevant failures without weakening checks and record actual results there.
- [ ] T047 Complete final English/German keyboard, loading/error, desktop/mobile, recipient-isolation, and controlled real-push checks in `apps/web/tests/e2e/notifications.spec.ts`, `apps/web/tests/pwa/pwa.spec.ts`, and `specs/003-notifications-redesign/quickstart.md`; report unavailable provider/browser/Docker/remote-CI evidence accurately.
- [x] T048 Prepare exactly one focused implementation Changeset for package `repovio` at `.changeset/notification-redesign.md`, run two stable canonical formatting passes on changed files using `scripts/format.mjs`, and check `git diff --check`; do not commit or push without explicit user request.
- [x] T049 Refresh `graphify-out/graph.json` with `graphify update .` for changed source plus incremental cached semantic extraction for changed design documents; inspect node/edge/source summaries and the final in-scope diff, leaving Graphify reports/cache/runtime metadata untracked.

## Dependencies and Execution Order

```text
T001 -> T002 -> T003
T003 -> T004 -> T005 -> T006
T006 -> US1 (T007-T017, MVP)
T006 -> US2 (T018-T022)
T006 -> US3 (T023-T031)
US1  -> US4 (T032-T044)
US1 + US2 + US3 + US4 -> T045-T049
```

- Within each story, write and prove failing regression tests before the related implementation, then validate its
  independently observable increment. Models precede persistence services; services/DTOs precede endpoint integration.
- US1 does not need new recipient attribution. US4 adds attribution after US1's accurate per-device outcomes exist.
- US2 and US3 have no semantic dependency on US1; priority favors finishing the push MVP first. Coordinate their shared
  `index.vue`, locale, and Playwright files rather than marking conflicting edits parallel.
- T007/T008/T009 are independent test-file batches after T006. T023/T024 are independent after T006.
- T032/T033/T034 are independent test batches after US1, provided shared browser-spec work from earlier stories is merged.
- T035 precedes T036; T036 precedes T037/T038; T037/T038 precede T039; T039/T040 precede T041/T042; T044 validates all US4 work.
- T048's Changeset is for the future substantive implementation, not this task-generation-only change. A later explicit
  commit request activates the repository's scoped staging/review and push rules.

## Parallel Execution Examples

### US1

After T006, implement T007 browser lifecycle regressions independently of T008 API lookup/service regressions and
T009 delivery orchestration regressions. Integrate results before production changes in their corresponding files.

### US2

No same-phase parallel edits are marked: route ownership, navigation, locales, and shared browser-spec changes overlap.
US2 can progress independently of US1 backend work after T006, with coordinated shared-file ownership.

### US3

After T006, T023 draft unit regressions and T024 browser regressions can be prepared independently. Once T025 fixes the
draft interface, identity/destination components and event/review components have separate files, but their integration
still follows T028/T029; do not concurrently edit the dialog, locale files, or shared browser test.

### US4

After US1, T032 migration, T033 API authorization, and T034 client-state regressions have separate primary files and can
be prepared concurrently once earlier browser-spec edits are merged. After their prerequisites, backend endpoint work
and T040's mock-backed client composable can progress independently before popover integration.

## Implementation Strategy

1. Complete setup/shared boundaries, then US1 as the MVP. Prove actual enrollment and delivery separately from mocks.
2. Complete US2's consolidated route toolbar and US3's four-step create flow as independently verifiable increments.
3. Complete US4's additive attribution, private API projection, navbar integration, and banner removal.
4. Run cross-cutting acceptance and quality gates; preserve explicit environmental limitations.
5. Stop after verified implementation of issue #65. Commits, production migration, deployment, and release require their
   own authorization; no later issue work is included.

## Traceability and Counts

| Work          | Tasks     | Count | Acceptance focus                              |
| ------------- | --------- | ----- | --------------------------------------------- |
| Setup         | T001-T003 | 3     | Reproducible environment and failure evidence |
| Foundation    | T004-T006 | 3     | Shared contracts and typed API boundaries     |
| US1           | T007-T017 | 11    | FR-007, FR-008, FR-009; SC-003                |
| US2           | T018-T022 | 5     | FR-001, FR-002; SC-001                        |
| US3           | T023-T031 | 9     | FR-003, FR-004, FR-005, FR-006; SC-002        |
| US4           | T032-T044 | 13    | FR-010, FR-011, FR-012; SC-004, SC-005        |
| Cross-cutting | T045-T049 | 5     | FR-013; SC-006 and overall verification       |
| Total         | T001-T049 | 49    | All issue #65 acceptance criteria             |

There are eight explicitly marked parallel test tasks in three ready batches. Shared-file and cross-story parallel
opportunities are described above; no subagent execution is implied by generating these tasks.

## Execution Status (2026-11-09)

**47 of 49 tasks completed locally.** T017 and T047 retain their unchecked markers because controlled real enrollment
failed in Chromium and a physical OS click was unavailable. Their local/mock/production-handler portions were executed;
these results do not establish real network delivery. See [recorded evidence](quickstart.md#recorded-local-results-2026-11-09).

All four stories are implemented; root lint/typecheck/tests, API/web builds, production notification browser tests
(12/12), production PWA tests (3/3), HTTP contracts, real PostgreSQL migrations/access checks, and visual inspection passed.
The remaining gates are external acceptance evidence rather than a waived requirement. The subsequent PR-preparation request authorizes committing and pushing the reviewed work. No deployment occurred.
