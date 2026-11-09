# Tasks: App-Wide User Name Presentation

**Input**: [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md), [data-model.md](data-model.md),
[UI/API contract](contracts/user-identity.md), and [validation guide](quickstart.md).

**Status**: Implementation and per-task commit/push approved for issue
[#76](https://github.com/repovio/repovio/issues/76). All twelve tasks completed, verified, and pushed.
Merge remains a separate approval.

**Branch**: `codex/76-user-name-presentation`.

**Tests**: Required by the specification's measurable outcomes and constitution. Every behavior task includes its own
focused regression tests and verification; write the relevant failing assertion before changing behavior within that
same task. Do not create separate incomplete test-only commits.

## Format and Execution Rules

- Each checkbox is one task. `[US1]`, `[US2]`, and `[US3]` map to specification stories; `[P]` marks disjoint work.
- Paths are repository-relative. Proposed new tests/examples/Changesets are explicitly named and created only if needed.
- Reuse the selected Codex worktree. Inspect status and relevant diffs before every edit, check, and commit.
- After implementation approval, complete each substantive task with its code, tests, relevant docs, one focused patch
  Changeset for `repovio`, and its own commit before dependent work. Proposed Changeset paths below may be replaced by
  CLI-generated filenames. Do not commit without the workflow's explicit commit authorization.
- Run focused tests first, then affected lint/typecheck/test targets and documentation checks. Update Graphify AST after
  code changes, include `graphify-out/graph.json` with source, and serialize graph updates/staging/commits.
- Mark tasks complete only after required checks and the authorized commit succeed. Setup/verification-only tasks need
  no fabricated release entry or empty implementation commit. Record actual evidence and remaining blockers.
- No provider writes, dependency changes, schema migrations, forced name completion, or unrelated release work.

## Phase 1: Setup

**Purpose**: Verify implementation prerequisites without creating new infrastructure.

- [x] T001 Recheck the approved issue/commit/implementation permissions and selected worktree; verify Node.js 26.13.0,
      pnpm 11.28.9, existing local test/database setup, and baseline affected checks; record baseline and synthetic fixture
      strategy in `specs/006-user-name-presentation/evidence.md`, using `quickstart.md` for the required commands.

**Acceptance**: Intended feature context resolves correctly; no unrelated dirty files are touched; implementation has an
approved issue and planning commit before product changes. Environment gaps are concrete, not silently waived.

## Phase 2: Foundational Identity Formatting

**Purpose**: Establish the shared presentation seam used by every story.

- [x] T002 Normalize retained name parts in `apps/web/app/utils/user-identity.ts` and expand
      `apps/web/app/utils/user-identity.spec.ts`; enforce “Trim surrounding whitespace; display first” for `firstName`,
      “Trim surrounding whitespace; display second” for `lastName`, and “Parenthesized after personal name; standalone
      fallback” for `username`; join retained parts with one space, preserve internal spelling/case/Unicode, suppress redundant
      suffixes, and keep avatar behavior stable; include `.changeset/user-identity-format.md`.

**Acceptance**: Truth-table tests cover complete, partial, null, blank, whitespace-padded, Unicode, duplicate, and
username-equals-name identities. Existing callers remain compatible; no labels are persisted.

## Phase 3: User Story 1 - Choose Users by Personal Name (Priority: P1, MVP)

**Goal**: Every User selector displays personal names and supports authorized name-based discovery.

**Independent Test**: Select named Users in repository access, group membership, and browser recipients; verify option,
selected value/chip, duplicate-name disambiguation, later-page search, and unchanged saved User IDs.

- [x] T003 [US1] Extend safe channel recipient projections in
      `apps/api/src/modules/notifications/notifications.controller.ts`,
      `apps/api/src/modules/notifications/notifications.service.ts`,
      `apps/api/src/modules/notifications/notification-delivery.service.ts`, and
      `apps/api/src/modules/notifications/dto/notification-channel.dto.ts`; update
      `libs/schemas/src/api/notifications.ts`, derived consumers in `libs/schemas/src/contracts.ts`,
      `libs/schemas/src/api-contracts.test.ts`, and
      `apps/api/src/modules/notifications/notifications.service.spec.ts`; enforce “retain `id`/`username`; add nullable
      `firstName`/`lastName`” and “New name properties may be absent in older responses; current API explicitly emits
      string/null values.” Add safe-response/authorization regression coverage, relevant examples in proposed
      `apps/api/bruno/notifications/get channel.bru`, and `.changeset/notification-recipient-names.md`.
- [x] T004 [US1] Extend User search in `apps/web/app/composables/api/repovio-api.ts` with focused transport assertions in
      proposed `apps/web/app/composables/api/user-search.spec.ts`; use whole-query username matching OR all name tokens
      across firstName/lastName case-insensitively, omit empty predicates, preserve username/ID ordering and pagination;
      verify server permission composition in `apps/api/src/modules/user-groups/user-groups.integration.spec.ts` and browser
      name search in `apps/web/tests/e2e/user-groups.spec.ts`; include `.changeset/user-name-search.md`.
- [x] T005 [P] [US1] Apply `getUserIdentityLabel` to User options in
      `apps/web/app/components/modules/user-groups/resource-picker.vue` while preserving the group-name branch, page reset,
      stale-response rejection, and disabled/loading/error states; verify open/selected labels and duplicate IDs in
      `apps/web/tests/e2e/user-groups.spec.ts`, and existing repository selection in
      `apps/web/tests/e2e/repository-access.spec.ts`; include `.changeset/group-user-selection-names.md`.
- [x] T006 [P] [US1] Preserve safe name-bearing recipient types and use shared labels in
      `apps/web/app/composables/app/notification-channel-draft.ts`,
      `apps/web/app/components/modules/notifications/channel-dialog.vue`,
      `apps/web/app/components/modules/notifications/channel/destination-step.vue`, and
      `apps/web/app/pages/notifications/index.vue`; replace fixed 100-User choice loading with existing paginated authorized
      search, preserve configured/selected labels across pages, and avoid unbounded or per-option fetches; extend
      `apps/web/app/composables/app/notification-channel-draft.test.ts` and
      `apps/web/tests/e2e/notifications.spec.ts` for named choices, later-page/beyond-100 Users, stale results, and stable
      recipient writes; include `.changeset/browser-recipient-selection-names.md`.

**Checkpoint**: All selectors show `Vera Viewer (@viewer)` with correct selected IDs. US1 is the suggested MVP,
but the approved app-wide feature still requires US2, US3, and final verification.

## Phase 4: User Story 2 - Recognize Users Throughout the Application (Priority: P1)

**Goal**: All remaining Repovio User references use the same name-first convention.

**Independent Test**: Compare the same User across navigation, administration, memberships, recipient summaries,
requester history, dialogs, confirmations, and accessible descriptions, then refresh after a name change.

- [x] T007 [US2] Add the safe requester projection to
      `apps/api/src/modules/notifications/notification-deliveries.controller.ts`,
      `apps/api/src/modules/notifications/notifications.service.ts`, and
      `apps/api/src/modules/notifications/dto/notification-delivery.dto.ts`; align
      `libs/schemas/src/api/notifications.ts`, `libs/schemas/src/contracts.ts`, and client resource types as needed;
      enforce “additive optional nullable `{ id, username, firstName, lastName }`; deleted relation is null” and
      “retained unchanged for compatibility and older-response fallback” for `requestedByUsername`; use shared formatting in
      `apps/web/app/components/modules/notifications/delivery-details-dialog.vue`; add contract/API coverage in
      `libs/schemas/src/api-contracts.test.ts` and proposed
      `apps/api/src/modules/notifications/dto/notification-delivery.dto.spec.ts`, browser coverage in
      `apps/web/tests/e2e/notifications.spec.ts`, proposed safe example
      `apps/api/bruno/notifications/get delivery.bru`, and `.changeset/delivery-requester-names.md`.
- [x] T008 [P] [US2] Align membership rows, parenthesized secondary usernames, localized removal confirmations, and
      accessible identity labels in `apps/web/app/components/modules/user-groups/members-dialog.vue` and
      `apps/web/app/components/modules/repositories/details/members-card.vue`; test stable assignments and actual target
      identity in `apps/web/tests/e2e/user-groups.spec.ts` and `apps/web/tests/e2e/repository-access.spec.ts`; update
      `apps/web/i18n/locales/en.json` and `apps/web/i18n/locales/de.json` only if copy changes; include
      `.changeset/membership-identity-names.md`.
- [x] T009 [P] [US2] Align administration secondary usernames and deletion targets in
      `apps/web/app/pages/admin/users.vue`, reset target text in
      `apps/web/app/components/modules/users/account-dialog.vue`, and MCP target descriptions in
      `apps/web/app/components/modules/mcp/user-token-dialog.vue`; retain/verify personal-name-first navigation in
      `apps/web/app/components/layout/user-menu.vue`; test dialogs, accessible text, and refreshed profile identity in
      `apps/web/tests/e2e/user-management.spec.ts` and `apps/web/tests/e2e/mcp-access.spec.ts`; retain credential input
      semantics and use existing locale interpolation where possible; include `.changeset/account-identity-names.md`.
- [x] T010 [US2] Format notification recipient summaries in `apps/web/app/pages/notifications/index.vue` using the same
      safe identity fields and shared helper; prove named/older-response summaries and post-edit refresh in
      `apps/web/tests/e2e/notifications.spec.ts`; audit all person-reference surfaces against
      `specs/006-user-name-presentation/research.md` and record the inventory in
      `specs/006-user-name-presentation/evidence.md`; include `.changeset/notification-summary-names.md`.

**Checkpoint**: Every inventoried named Repovio User display is name-first; any username suffix is parenthesized.
Provider Actors, destination credentials, and username edit/sign-in fields retain their established behavior.

## Phase 5: User Story 3 - Identify Accounts with Incomplete Names (Priority: P2)

**Goal**: Verify compatibility for existing local and OIDC accounts through real workflows.

**Independent Test**: Open/reopen every selector with partial, null, blank, and padded-name fixtures; verify labels remain
identifiable without empty parentheses, fabricated names, or changed selected IDs.

- [x] T011 [US3] Extend existing fixtures/assertions in `apps/web/app/utils/user-identity.spec.ts`,
      `apps/web/tests/e2e/user-management.spec.ts`, `apps/web/tests/e2e/user-groups.spec.ts`,
      `apps/web/tests/e2e/repository-access.spec.ts`, and `apps/web/tests/e2e/notifications.spec.ts` for complete/partial/null/
      whitespace-only/padded/Unicode/duplicate names, older username-only responses, and missing requester behavior;
      exercise local/OIDC accounts, English/German, keyboard labels, and 390-pixel viewport layout; fix only demonstrated
      in-scope fallback regressions in the responsible identity/projection/component files and include
      `.changeset/user-name-fallback-coverage.md` for this substantive regression-protection increment.

**Checkpoint**: Data-model truth table and selector fallback behavior agree throughout the application.

## Phase 6: Cross-Cutting Verification

- [x] T012 Run all affected checks and browser scenarios from `specs/006-user-name-presentation/quickstart.md`, verify
      contract consistency and unchanged permissions/credential exclusion, inspect desktop/narrow EN/DE screenshots, and
      record actual commands/results, task commit SHAs, per-surface evidence, and any explicit blockers in
      `specs/006-user-name-presentation/evidence.md`; validate canonical formatting stability, required documentation,
      `git diff --check`, and source/`graphify-out/graph.json` consistency; synchronize the approved issue checklist after
      verified commits. This is a verification/documentation task, not permission to release or deploy.

## Dependencies and Execution Order

| Task       | Prerequisites                                  | Deliverable                                        |
| ---------- | ---------------------------------------------- | -------------------------------------------------- |
| T001       | Approved implementation workflow prerequisites | Baseline and fixture strategy                      |
| T002       | T001                                           | Shared identity formatting and tests               |
| T003       | T002                                           | Safe name-bearing recipient transport              |
| T004       | T003                                           | Name-aware authorized search                       |
| T005, T006 | T004                                           | Group/repository and recipient selection workflows |
| T007       | T005, T006                                     | Delivery requester projection and presentation     |
| T008, T009 | T005, T006                                     | Membership and account identity displays           |
| T010       | T007, T006                                     | Notification summaries and final surface audit     |
| T011       | T007, T008, T009, T010                         | Cross-workflow fallback compatibility              |
| T012       | T011 and all prior tasks                       | Feature-wide acceptance evidence                   |

Story completion order is US1, then US2, then US3. Foundational fallback semantics in T002 let US1/US2 remain usable
before US3's exhaustive cross-workflow verification. US2 is independently testable after shared prerequisites and US1;
US3 validates compatibility without introducing a new persistence or authentication feature.

## Parallel Opportunities

- **US1**: After T004, T005's group/repository component and browser files are disjoint from T006's notification files.
- **US2**: T008's membership files and T009's account/MCP files are disjoint; keep locale changes owned by T008 and reuse
  existing interpolation in T009. T007 and T010 share notification/API/test files and must run sequentially.
- **US3**: Fixture/assertion design for different browser suites can be reviewed concurrently; execute T011 as one coherent
  task because shared formatter changes and the regression matrix must converge before its commit.
- Parallel opportunities describe safe file work, not authorization to spawn agents. Serialize shared Graphify updates,
  staging, commits, and issue-status writes. If a new shared-file dependency appears, remove that parallel opportunity.

## Implementation Strategy and Commit Boundaries

Complete setup and shared formatter first. Deliver US1 as the smallest demonstrable slice, then all US2 identity
surfaces, then US3 compatibility and cross-cutting acceptance. Do not stop at MVP for an approved full implementation.

T002 through T011 each form a tested, documented implementation commit with exactly one focused `repovio` patch Changeset.
Tests are part of their owning task; do not postpone all regression proof to T012. Update graph data with code and stage
only task-owned files. Push authorized commits according to repository policy. T001 and T012 record verification without
requiring empty commits or fabricated Changesets. Repair introduced failures before dependent work; material scope
changes return to the affected approval gate. No PR merge, release, or deployment is authorized by these tasks.

## Requirement Traceability

| Requirement                              | Tasks                              |
| ---------------------------------------- | ---------------------------------- |
| FR-001 selector labels                   | T002, T005, T006                   |
| FR-002 app-wide identity                 | T007, T008, T009, T010             |
| FR-003 incomplete names                  | T002, T011                         |
| FR-004 name/username discovery           | T004, T005, T006                   |
| FR-005 duplicate-name identity           | T002, T005, T006, T011             |
| FR-006 stable IDs and interaction states | T003, T004, T005, T006, T008, T011 |
| FR-007 local/OIDC, EN/DE, accessibility  | T008, T009, T011, T012             |
| FR-008 authorization and safe fields     | T003, T004, T007, T012             |

SC-001 is proved by T005/T006, SC-002 by T007–T010, SC-003 by T004–T006, SC-004 by T002/T011, and SC-005 by
T003–T008. T012 records the consolidated result without claiming unrun checks.
