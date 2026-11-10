# Tasks: Notification Setup Follow-up

**Input**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md),
[UI contract](contracts/ui.md), and [quickstart.md](quickstart.md).

**Authorization**: Task generation, issue creation, branch setup, and planning commit/push approved on 2026-11-10.
**Issue**: [#90](https://github.com/repovio/repovio/issues/90). **Branch**: `codex/90-notification-setup-polish`.
The existing selected Codex worktree is reused. Implementation and per-task commit/push approved on 2026-11-10. Merge and deployment remain unapproved.

**Tests**: Required by the specification and repository rules. Each behavior increment includes focused regression tests,
relevant documentation, and its own verification. Write the focused regression first and establish failure before fixing.

**Format**: `- [ ] TNNN [P?] [US?] Description with file paths`. No task is marked complete by this generation step.

## Phase 1: Setup

**Purpose**: Establish reviewable baseline and preserve the approved scope before product changes.

- [x] T001 Record baseline and non-secret push diagnosis in `specs/009-notification-setup-polish/evidence.md`: after issue/implementation approval, confirm task association, current branch/base, clean or explicitly preserved changes, pinned Node.js/pnpm, and existing test configuration; run current push and draft unit tests plus notification browser scenarios when the existing test server is available. Distinguish preexisting failures from introduced failures. Inspect `apps/api/src/modules/notifications/browser-push.service.ts`, `.env.example`, and `compose.yml` only as needed to trace readiness; never print secrets or infer production configuration from the screenshot. Record production diagnosis as unverified unless an authorized status read supplies evidence. No production mutations, dependency upgrades, or new infrastructure.

**Acceptance**: Baseline identifies actual check results and evidence gaps without claiming live push success. Any confirmed
source defect is bounded to its existing owning layer; a materially different solution returns to plan review.

## Phase 2: Foundational Preconditions

Existing authenticated status API, channel persistence, browser transport, schemas, localization, and test runners are
already present. No database, endpoint, framework, or installation task is required. T001 is the sole shared prerequisite.
Before implementation, an approved issue and reviewed planning commit must exist under the delivery workflow.

## Phase 3: User Story 1 - Understand and Use Browser Push (P1, MVP)

**Goal**: Distinguish server setup from read failures and device capabilities, then recover selection through refresh.

**Independent test**: Pending, available, server-unconfigured, failed-read/retry, unsupported/denied device, and existing
channel edit all produce the behavior specified in FR-002 through FR-005 and FR-009.

- [x] T002 [US1] Implement explicit transient server readiness in `apps/web/app/composables/app/browser-push-state.ts` with regression coverage in `apps/web/app/composables/app/browser-push.test.ts`. Preserve the exact states `idle`, `loading`, `available`, `server-unconfigured`, and `request-failed`; keep the response `{ available, publicKey, subscriptionCount }` unchanged. Separate successful server status from later device-inspection failure; passive reads never register a worker, prompt, or enroll. Preserve existing enrollment error semantics and revision/account isolation. Test delayed reads, all response outcomes, retry, overlapping requests, close/session invalidation as applicable, and successful status followed by device lookup failure. Document the boundary in `specs/009-notification-setup-polish/data-model.md` and results in `specs/009-notification-setup-polish/evidence.md`; include exactly one focused `repovio` Changeset at `.changeset/notification-push-readiness.md`. Depends on T001.

- [x] T003 [US1] Wire readiness and retry through `apps/web/app/pages/notifications/index.vue`, `apps/web/app/components/modules/notifications/channel-dialog.vue`, `apps/web/app/components/modules/notifications/channel/identity-step.vue`, and `apps/web/app/composables/app/notification-channel-draft.ts`. Refresh once per open or explicit retry, expose adjacent checking/unconfigured/error guidance, and keep retry loading for its full awaited request. Only confirmed server availability permits new Browser push selection; device support, permission, and enrollment never gate global configuration. Preserve existing channel type, recipients, rules, credentials, server validation, and role guards. Add English/German text in `apps/web/i18n/locales/en.json` and `apps/web/i18n/locales/de.json`; name required VAPID settings without revealing values. Extend `apps/web/app/composables/app/notification-channel-draft.test.ts` and `apps/web/tests/e2e/notifications.spec.ts` for pending/failure/retry/unconfigured/available, device independence, and existing-channel edits. Update `specs/009-notification-setup-polish/quickstart.md` and evidence; include exactly one focused `repovio` Changeset at `.changeset/notification-push-availability.md`. Depends on T002.

**Checkpoint**: Configured push is selectable; unconfigured push remains safely blocked with actionable guidance; read errors
recover without a page reload. No unsupported assertion about production readiness or actual delivery is made.

## Phase 4: User Story 2 - Navigate Channel Setup Consistently (P2)

**Goal**: Use `UStepper` and the modal footer without weakening validation, keyboard behavior, or save recovery.

**Independent test**: All four steps and six channel types support valid progression; invalid inputs and pending operations
block every forward pathway; footer Save retains full form validation and single-write semantics.

- [ ] T004 [US2] Replace the ordered progress list in `apps/web/app/components/modules/notifications/channel-dialog.vue` with controlled Nuxt UI `UStepper` items and centralize guarded navigation in `apps/web/app/composables/app/notification-channel-draft.ts`. Preserve the exact mapping `identity 0, destination 1, events 2, review 3`. Reject jumps beyond the next step; validate next-step clicks and keyboard requests through the same visible-step validation as Next. Backward movement preserves values; save, persisted-refresh recovery, and conflicting awaited work block transitions. Preserve focus movement, preview invalidation, and secret clearing. First extend `apps/web/app/composables/app/notification-channel-draft.test.ts` and `apps/web/tests/e2e/notifications.spec.ts` for invalid fields, direct jumps, backward navigation, keyboard activation, and pending-state guards. Reuse or update English/German step labels in `apps/web/i18n/locales/en.json` and `apps/web/i18n/locales/de.json`. Update `specs/009-notification-setup-polish/contracts/ui.md` and evidence; include exactly one focused `repovio` Changeset at `.changeset/notification-channel-stepper.md`. Depends on T001; default delivery order follows T003 because dialog, draft, locale, and browser-test files overlap.

- [ ] T005 [US2] Move Back, Next, Save, and persisted-refresh retry to `UModal #footer` in `apps/web/app/components/modules/notifications/channel-dialog.vue`; retain the single `UForm` in `#body` and invoke its validated `submit()` method from external Save. Preserve pre-review Enter behavior, full-schema validation, loading through persistence and awaited list refresh, blocked dismissal/navigation while saving, and refresh-only retry after a successful write. Update `apps/web/app/composables/app/notification-channel-draft.ts` only where needed to preserve these guards. Extend `apps/web/app/composables/app/notification-channel-draft.test.ts` and `apps/web/tests/e2e/notifications.spec.ts` with deferred persistence/refresh, both failure cases, repeated activation, invalid Save, and all six transport journeys. Inspect English/German layouts at 390x844 and 1102x1134 with long body content and keyboard focus; capture synthetic screenshots in test output. Update `specs/009-notification-setup-polish/contracts/ui.md` and evidence; include exactly one focused `repovio` Changeset at `.changeset/notification-channel-footer.md`. Depends on T004.

**Checkpoint**: Both requested component changes are visible and independently verified; a successful write followed by failed
refresh cannot become a second channel write.

## Phase 5: User Story 3 - Open Delivery History Compactly (P3)

**Goal**: Keep the existing history route and permissions while removing the visible toolbar label.

**Independent test**: Administrator keyboard/pointer activation opens the same route with localized tooltip and accessible
name; Manager/Viewer access remains restricted, including direct navigation.

- [ ] T006 [US3] Make Delivery history icon-only in `apps/web/app/pages/notifications/index.vue`, retaining `i-lucide-history`, `/notifications/history`, existing neutral styling, and the System Administrator guard. Replace the visible label with localized `aria-label` and `UTooltip` using existing history translations in `apps/web/i18n/locales/en.json` and `apps/web/i18n/locales/de.json`. Extend the existing history cases in `apps/web/tests/e2e/notifications.spec.ts` to assert no visible label, tooltip/name, keyboard access, route behavior, empty/error toolbar availability, and Manager/Viewer restrictions in both locales. Inspect the compact toolbar at both target widths. Update `specs/009-notification-setup-polish/contracts/ui.md` and evidence; include exactly one focused `repovio` Changeset at `.changeset/notification-history-icon.md`. Depends on T001; default delivery order follows T005 to avoid concurrent page and browser-test edits.

**Checkpoint**: History remains discoverable and accessible with reduced toolbar width.

## Phase 6: Polish and Cross-Cutting Verification

- [ ] T007 Run the acceptance matrix and commands in `specs/009-notification-setup-polish/quickstart.md`; record exact outcomes, mocked boundaries, screenshot locations, and remaining live-browser/device gaps in `specs/009-notification-setup-polish/evidence.md`. Run focused push/draft tests, affected web lint/typecheck/test targets, canonical formatting/documentation/guideline checks, `git diff --check`, and the English/German notification browser suite; inspect screenshots at 390x844 and 1102x1134. Verify read-only provider behavior, permissions, absence of secret output, and no migrations/toolchain drift. Run `graphify update .` after source changes and review graph summaries. If a defect requires code edits, apply focused regression proof and its own substantive task Changeset/commit rather than claiming completion; do not create empty commits. Real enrollment, service acceptance, OS display, and click behavior require separate actual evidence or an explicit unverified record. Depends on T003, T005, and T006.

**Acceptance**: All deterministic acceptance checks pass. Missing physical-device or production evidence is named explicitly;
CI, deployment, and service acceptance are never conflated with local test success.

## Dependencies and Execution Order

```text
T001
  T002 -> T003 (US1, MVP)
  T004 -> T005 (US2)
  T006         (US3)
T003 + T005 + T006 -> T007
```

Default execution order is T001 through T007. US2 and US3 have no product dependency on US1; they are independently
verifiable after T001. Their shared file ownership makes sequential implementation the safest default.

## Parallel Opportunities and Examples

No whole task has `[P]`: substantive increments share `notifications.spec.ts`, locale files, and evidence, and several
share the dialog/page/draft. Do not schedule concurrent writes to those files. No agent delegation is authorized here.

- **US1**: Within T002, inspect server readiness configuration read-only while preparing push-state test cases; after edits,
  independent Vitest and status/documentation checks may run together. T003 waits for T002.
- **US2**: Within T004, prepare keyboard/stepper scenarios while checking existing form validation; within T005, separate
  viewport browser contexts may run concurrently after edits if the existing runner supports them. Never run competing
  browser-suite mutations or commits concurrently.
- **US3**: After T006 edits, English/German or role-specific browser cases may use the runner's existing parallelization.
  Keep page edits, locale edits, and the task commit serial.

## Implementation Strategy

1. Obtain issue/planning-commit approval, associate the issue and branch in the selected worktree, and commit the reviewed
   planning artifacts. Obtain implementation approval separately before starting T001.
2. Establish T001 baseline. Complete T002 and T003 for the smallest viable delivery: usable and explained push readiness.
3. Complete T004 and T005, preserving existing form behavior while adopting the requested Nuxt UI controls.
4. Complete T006, then T007 across all stories. Do not stop at the MVP when the full implementation is approved.
5. Each implementation task includes its behavior, tests, documentation, and exactly one focused `repovio` Changeset.
   Once explicitly authorized, commit each completed substantive task separately, inspect staged scope, and push after
   every commit. Evidence-only tasks do not need fabricated package Changesets or empty commits.
6. Keep stable IDs and synchronize task status/evidence with the approved issue. Product implementation and merge need
   their own approvals; no release, deployment, production configuration, or provider-write action is included.

## Requirement Coverage

| Requirement                        | Tasks                        |
| ---------------------------------- | ---------------------------- |
| FR-001 history icon                | T006, T007                   |
| FR-002 distinct availability       | T002, T003, T007             |
| FR-003 open refresh and retry      | T002, T003, T007             |
| FR-004 device independence         | T002, T003, T007             |
| FR-005 unconfigured/edit behavior  | T001, T003, T007             |
| FR-006 validated stepper           | T004, T007                   |
| FR-007 modal footer and submission | T005, T007                   |
| FR-008 locales/responsiveness      | T003, T004, T005, T006, T007 |
| FR-009 preserved invariants        | T001 through T007            |

## Tracking Scope

Issue [#90](https://github.com/repovio/repovio/issues/90): **Fix notification setup controls and Browser push availability**.

Scope: these seven tasks and the four browser comments only. Do not reopen merged redesign PR #68 or include PWA audit
#64. Issue creation approval covers one separate planning-only commit and push from the selected worktree; implementation
permission remains a later decision.
