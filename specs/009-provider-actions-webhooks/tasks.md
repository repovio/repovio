# Tasks: Provider Account Actions and Webhook Setup

**Input**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md),
[contracts/ui-and-api.md](contracts/ui-and-api.md), and [quickstart.md](quickstart.md).

**Approval**: Task generation and issue/planning-commit publication approved on 2026-11-10.
**Issue**: [#89](https://github.com/repovio/repovio/issues/89). **Branch**: `codex/89-provider-actions-webhooks`.
Reuse `/mnt/projects/.codex-worktrees/17ad/repovio`; do not create another worktree. Implementation and merge require
separate decisions.

**Tests**: Focused tests are required by the specification, plan, and constitution. Each behavior task includes code,
regression tests, relevant documentation/localization, and its own validation before committing. Do not create a separate
failing-test-only commit. Test-first ordering below occurs inside the corresponding coherent implementation task.

**Format**: `- [ ] Tnnn [P?] [USn?] Description with paths`. `[P]` means independently implementable in different files once
prerequisites pass; it does not authorize subagents or concurrent Git/index/graph operations.

## Phase 1: Setup

**Purpose**: Confirm scope and establish a reproducible local baseline without changing tooling.

- [x] T001 Verify approved issue association, task-generation/implementation authorization, current worktree suitability,
      Node.js 26.13.0, pnpm 11.28.9, existing dependencies and test fixtures against `AGENTS.md`, `docs/coding-guidelines.md`,
      `package.json`, `.specify/feature.json`, and `specs/009-provider-actions-webhooks/quickstart.md`; record baseline commands,
      failures, and actual feature resolution in `specs/009-provider-actions-webhooks/verification.md` before product edits.

**Acceptance**: Feature context resolves to this directory; implementation cannot start without the separately approved
issue and planning commit. Preserve unrelated changes; no installation migration, provider mutation, or deployment.

## Phase 2: Foundational Checks

**Purpose**: Verify shared safety and testing assumptions; no new infrastructure is required.

- [x] T002 Inspect existing authorization, callback URL generation, response envelopes, menu conventions, pending state,
      and schema exports in `apps/api/src/modules/organization-webhooks/organization-webhooks.service.ts`,
      `apps/api/src/modules/organization-webhooks/organization-webhooks.controller.ts`,
      `libs/schemas/src/api/organization-webhooks.ts`, `apps/web/app/components/modules/providers/account-actions.vue`, and
      `apps/web/app/composables/api/organization-webhooks.ts`; confirm integration/browser fixture commands from
      `specs/009-provider-actions-webhooks/quickstart.md` and record reusable seams in
      `specs/009-provider-actions-webhooks/verification.md` without broad refactoring.

**Acceptance**: PUBLIC_URL remains server-owned; existing UUID primary key supports explicit insertion; administrator
and account boundaries are known; callback preview needs no database migration. Run Graphify query before any new
codebase exploration. Block product work only for concrete contradictions with the approved design.

## Phase 3: User Story 1 - One Account Action Menu (Priority: P1; MVP)

**Goal**: Every row offers one accessible menu while preserving all existing actions.

**Independent Test**: Exercise all provider types in `apps/web/tests/e2e/providers.spec.ts`; verify one trigger per row,
applicable labeled entries, keyboard focus, row targeting, confirmation, and busy state after menu dismissal.

- [x] T003 [P] [US1] Add focused failing menu regressions in `apps/web/tests/e2e/providers.spec.ts`, then replace the icon
      cluster in `apps/web/app/components/modules/providers/account-actions.vue` with a Nuxt UI ellipsis dropdown retaining
      existing emitted events; preserve conditional GitLab Connect/Reauthorize and unavailable explanation, Enable/Disable,
      destructive Delete grouping and confirmation, and full-request loading/duplicate blocking on the trigger; add an
      account-specific accessible label in `apps/web/i18n/locales/en.json` and `apps/web/i18n/locales/de.json`, adapt existing
      action selectors in `apps/web/tests/e2e/organization-webhooks.spec.ts`, and update current action guidance in
      `docs/organization-webhooks.md`; verify focused browser checks and one menu screenshot before adding exactly one
      patch Changeset at `.changeset/provider-account-action-menu.md` for `repovio` and committing this task separately.

**Acceptance**: FR-001, FR-002, menu parts of FR-009/FR-010, and SC-001. Page-level Add Provider, GitHub App, and table
controls retain placement. Menu opening itself issues no request. Tests cover enabled/disabled accounts, all provider
types, unavailable OAuth, delayed OAuth/toggle/delete, Escape, focus restoration, and correct account dispatch.

## Phase 4: User Story 2 - Callback Before Save (Priority: P1)

**Goal**: Copy the final canonical URL before creating configuration, without abandoned database records.

**Independent Test**: Draft GET performs no write; POST with draft ID preserves URL; old POST without ID still works.
Browser pre-save copy, retry, rotation, and close/reopen scenarios never expose a stale or wrong-account callback.

- [x] T004 [P] [US2] Add schema and API regressions in `libs/schemas/src/api-contracts.test.ts` and
      `apps/api/src/modules/organization-webhooks/organization-webhooks.integration.spec.ts`, then implement the administrator-
      only, account-authorized GET draft endpoint and shared canonical callback helper in
      `apps/api/src/modules/organization-webhooks/organization-webhooks.controller.ts` and
      `apps/api/src/modules/organization-webhooks/organization-webhooks.service.ts`; extend
      `libs/schemas/src/api/organization-webhooks.ts` and exports in `libs/schemas/src/api-contracts.ts` with a strict draft
      response and optional create UUID, preserving the constraints "id is optional and must be a valid UUID when provided"
      and "Omitted ID invokes existing database generation; supplied ID is passed only to insert"; keep existing trimmed
      scope length 1–255, namespace validation, GitLab-only nesting, and trimmed secret length 16–1024; return no-store draft
      metadata with zero persistence/provider writes, sanitize primary-key and scope conflicts as 409 without upsert or
      cross-account disclosure, update Swagger/DTOs and Bruno requests at
      `apps/api/bruno/organization-webhooks/get organization webhook draft.bru` and
      `apps/api/bruno/organization-webhooks/create organization webhook.bru`, and add API-focused draft guidance in
      `docs/organization-webhook-drafts.md`; pass focused schema/API and contract checks, then add exactly one patch Changeset
      at `.changeset/organization-webhook-draft-api.md` for `repovio` and commit this task separately.

**T004 acceptance**: Auth cases 401/403, malformed input 400, missing account 404; canonical PUBLIC_URL differing from
browser origin; no secret response; supplied/omitted ID behavior; invalid UUID/unknown fields; duplicate and cross-account
ID/scope conflict without overwrite; unchanged stored URLs, scoped rotate/delete and signature verification; unsaved
callback rejected. Document actual envelope, generated OpenAPI evidence, and backward compatibility. Preserve published
OpenAPI snapshots; update current generated artifacts only through their existing owning command when applicable.

- [x] T005 [US2] After T003 and T004, add focused request-state tests at
      `apps/web/app/composables/api/organization-webhooks.test.ts` and browser regressions in
      `apps/web/tests/e2e/organization-webhooks.spec.ts`, then extend typed resources/client in
      `apps/web/app/types/api/resources.ts` and `apps/web/app/composables/api/repovio-api.ts` and implement independent draft/list
      loading, errors and retry in `apps/web/app/composables/api/organization-webhooks.ts`; integrate pre-save URL/copy and
      setup metadata into `apps/web/app/components/modules/providers/organization-webhooks-dialog.vue`, with request/session
      ownership, ignored stale responses, stable ID/URL/input through validation and save failure, exact-ID authorized-list
      recovery after a lost successful POST response, immutable existing-hook callbacks, and plaintext clearing on close;
      preserve the constraints "No local/session storage for draft secrets" and "A conflict alone never establishes
      success"; localize setup status/retry/copy feedback in `apps/web/i18n/locales/en.json` and
      `apps/web/i18n/locales/de.json`, update `docs/organization-webhooks.md`, pass focused web/browser checks, then add exactly
      one patch Changeset at `.changeset/organization-webhook-presave-url.md` for `repovio` and commit this task separately.

**T005 acceptance**: FR-003–FR-005, FR-008–FR-011, SC-002–SC-004, and lifecycle/isolation parts of SC-006. No requests per
keystroke. Independent failures leave unaffected loaded sections usable. New-draft setup cannot save without draft
metadata. Selecting existing hooks remains possible with draft failure. Preview/copy succeeds before POST; successful
save and rotation preserve exact URL; lost-response reconciliation never adopts another ID or namespace match. Add
Another gets fresh metadata; close/reopen, account switch, or delayed responses cannot restore stale secrets or URLs.

## Phase 5: User Story 3 - Clear Setup and Management (Priority: P2)

**Goal**: Make setup readable and existing hooks independently manageable at desktop and mobile widths.

**Independent Test**: Complete create/select/rotate/remove/reopen in English and German at 1102×1134 and 390×844;
inspect screenshots and keyboard traversal with long URLs and many existing configurations.

- [ ] T006 [US3] After T005, add responsive and workflow regressions in
      `apps/web/tests/e2e/organization-webhooks.spec.ts`, then reorganize
      `apps/web/app/components/modules/providers/organization-webhooks-dialog.vue` into account context and setup with callback
      before namespace/secret, compact provider-specific manual-registration instructions, save controls, and a distinct
      saved-configuration list with namespace, callback, receipt status and editing controls; extract only independently
      useful sections into `apps/web/app/components/modules/providers/organization-webhook-setup-form.vue` and
      `apps/web/app/components/modules/providers/organization-webhook-configurations.vue` if warranted; preserve GitLab tier
      guidance, secret reveal/copy/generation, rotation acknowledgement, destructive removal confirmation, full pending and
      failure states, read-only namespace on rotation, and existing component/API ownership; localize headings/help in
      `apps/web/i18n/locales/en.json` and `apps/web/i18n/locales/de.json`, update `docs/organization-webhooks.md`, verify bounded
      vertical scrolling, no horizontal modal overflow and keyboard access with EN/DE screenshots at both target sizes,
      then add exactly one patch Changeset at `.changeset/organization-webhook-dialog-layout.md` for `repovio` and commit this
      task separately after focused browser validation.

**Acceptance**: FR-006, FR-007, FR-009, FR-010, SC-005, and relevant SC-006 regression cases. Setup comes before saved
management without hiding receipt status or confusing unsaved configuration with successful provider registration.
Standalone visual validation is required; lint and types alone do not complete the task.

## Phase 6: Polish and Cross-Cutting Verification

**Purpose**: Prove the combined result meets the complete approved scope without adding features.

- [ ] T007 Run the full acceptance matrix in `specs/009-provider-actions-webhooks/quickstart.md`, check runtime/schema/Nest
      DTO/Swagger/Bruno/web-client agreement across the files in
      `specs/009-provider-actions-webhooks/contracts/ui-and-api.md`, run canonical formatting with two-pass stability,
      documentation checks, affected lint/typecheck/tests and integrated browser checks, and record exact command results,
      counts, EN/DE screenshot paths, provider/deployment limitations and per-task commit SHAs in
      `specs/009-provider-actions-webhooks/verification.md`; reconcile completion in
      `specs/009-provider-actions-webhooks/tasks.md` and the approved issue only after each task's evidence and commit exist.

**Acceptance**: All FR-001–FR-011 and SC-001–SC-006 have evidence or an explicit unresolved gap; no silent waiver. Repair
introduced defects within the responsible task's scope. Read-only verification needs no empty implementation commit or
fabricated Changeset. Any final documentation-only commit requires explicit commit authorization and reviewed scope.

## Dependencies and Execution Order

```text
T001 -> T002 -> T003 (US1 / MVP)
             -> T004 (US2 / API)
T003 + T004 -> T005 (US2 / client and lifecycle) -> T006 (US3 / layout) -> T007
```

- T001 and T002 are read-only prerequisites with evidence. They do not require empty commits.
- T003 and T004 are the only parallel candidates; they touch distinct source/test/docs files and distinct Changesets.
- T005 deliberately follows T003 because both update EN/DE resources, organization-webhook browser fixtures, and user docs.
- US1 is independently shippable. US2 API can be validated independently; the completed browser story also integrates the
  new row menu. US3 depends on the completed draft lifecycle so layout work cannot silently regress callback behavior.
- Serialize index operations, commits, pushes, issue/task updates, and `graphify update .`; graph output is shared even
  when feature source files are disjoint. Do not spawn subagents without separate applicable authorization.

## Parallel Examples by User Story

- **US1**: After T002, T003's menu work can overlap T004's schema/API work in disjoint files. Commit/graph updates serialize.
- **US2**: T004's schema and API test cases can be investigated together inside that task; T005 waits for T004's verified
  contract and T003's completed selectors. Do not parallelize the two tasks or split out a failing-tests commit.
- **US3**: Independent EN/DE desktop/mobile browser scenarios can run concurrently in isolated test contexts after T006's
  edits stabilize; source, locale, and shared-fixture editing remains sequential.

## Implementation Strategy

1. Publish the approved issue #89 and reviewed planning-only commit; record branch, commit, and artifact links in the issue.
2. Obtain separate implementation approval. Reuse this worktree and the issue-linked branch; run T001 and T002.
3. Deliver T003 as the minimal independently verified increment. Continue approved remaining scope without stopping at MVP.
4. Complete T004, T005, and T006 with focused checks, exactly one `repovio` Changeset and one commit per behavior task.
5. Complete T007, report real evidence and remaining limits, then follow the existing review/CI and separate merge gate.

Before each edit, test, and commit inspect status and relevant diff. Every substantive task commit includes its focused
tests/docs/locales, one Changeset, and refreshed `graphify-out/graph.json`; never combine task commits. Use
`graphify update .` after code changes, preserve semantic caches, and review summaries instead of rebuilding semantic
content. Push each explicitly authorized commit to its configured remote. No release PR merge, publish, deployment,
production migration, or provider webhook registration is authorized by this task list.

## Requirement Coverage

| Requirements                         | Tasks                  | Evidence                                                                            |
| ------------------------------------ | ---------------------- | ----------------------------------------------------------------------------------- |
| FR-001, FR-002, SC-001               | T003, T007             | Row menu entries, targeting, conditions, keyboard, pending/confirmation fixtures    |
| FR-003–FR-005, FR-011, SC-002–SC-004 | T004, T005, T007       | Draft/API compatibility, zero-write preview, pre-save copy and stable URL           |
| FR-006, FR-007, SC-005               | T006, T007             | Setup/management structure, EN/DE desktop/mobile screenshots and workflows          |
| FR-008, SC-006                       | T004, T005, T006, T007 | Admin/account isolation, collision, signature, stale-response and secret checks     |
| FR-009, FR-010                       | T003, T005, T006, T007 | Full-request loading, retry, clipboard errors, localization and accessible controls |

## Completion Rules

All seven tasks remain unchecked until implementation authorization and their acceptance evidence exist. T003–T006
require separate working commits; T001, T002, and T007 are verification/evidence tasks. Task-generation completion does
not establish product correctness or authorize the next workflow gate.
