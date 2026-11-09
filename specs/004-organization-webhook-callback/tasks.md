# Tasks: Organization Webhook Callback Field

**Input**: Design documents in `specs/004-organization-webhook-callback/`.

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [UI contract](contracts/ui.md), and [quickstart.md](quickstart.md).

**Issue**: [#71](https://github.com/repovio/repovio/issues/71)

**Branch**: `codex/71-organization-webhook-callback`

**Authorization**: Plan, tasks, issue creation, planning commit/push, and implementation are approved. Merge requires
separate approval. Reuse this checkout; no new worktree is needed. The original organization-webhook specification remains
unchanged.

**Tests**: Required by the specification's acceptance scenarios, approved plan, and repository constitution. The browser
regressions and implementation belong to one coherent implementation task, avoiding a committed failing-test intermediate.

## Format and paths

Use `- [ ] Tnnn [P?] [US1?] Description with file path`. `[P]` identifies independent verification work after the story
implementation. Paths below are repository-relative. Only US1 is in scope; all later feature work is excluded.

## Phase 1: Setup

**Purpose**: Resolve feature context and prepare the existing workspace without changing the toolchain.

- [x] T001 Verify `specs/004-organization-webhook-callback/spec.md` and `plan.md` resolve through `.specify/feature.json` using `.specify/scripts/bash/check-prerequisites.sh --json --require-spec --require-tasks --include-tasks`; inspect Git status/diffs, read `AGENTS.md`, `GLOSSARY.md`, and `docs/coding-guidelines.md`, verify Node.js 26.13.0 and Corepack pnpm 11.28.9 against `package.json`, and install pinned workspace dependencies if absent without changing manifests or `pnpm-lock.yaml`.

## Phase 2: Foundational

**Purpose**: Verify the existing callback lifecycle before changing presentation. No new infrastructure is needed.

- [x] T002 Confirm `specs/004-organization-webhook-callback/contracts/ui.md` against `apps/web/app/composables/api/organization-webhooks.ts`, `libs/schemas/src/api/organization-webhooks.ts`, and `apps/api/src/modules/organization-webhooks/organization-webhooks.service.ts`: the server supplies the public callback after persistence; preserve the data-model constraints "Strict input containing only `scope` and `webhookSecret`; no callback field" and "Existing write-only secret input; no callback field"; require no endpoint, schema, database, composable, or provider-write changes.

**Checkpoint**: Approved issue/implementation authorization and verified existing contracts are required before T003.

## Phase 3: User Story 1 - Find the callback address in the setup form (Priority: P1)

**Goal**: An administrator sees a read-only callback field throughout setup and can copy the correct real address after
saving or selecting a configuration.

**Independent Test**: With synthetic API responses, open an empty form, save a configuration, and copy its exact returned
callback. Select another configuration, rotate, reset, remove, and reopen; the form always matches its current selection.
Run English at 1440px and German at 390px, including failure, clipboard-denial, and long-address cases.

### Regression coverage and implementation

- [ ] T003 [US1] Deliver the complete callback-field correction: first extend `apps/web/tests/e2e/organization-webhooks.spec.ts` with form-scoped accessible selectors and confirm the missing-field regression fails; then update `apps/web/app/components/modules/providers/organization-webhooks-dialog.vue` to compute the selected callback from `configurations` and `editingId`, preserving "The matching configuration's `callbackUrl`, otherwise an empty string. Never persisted separately." Add exactly one labeled, focusable, selectable, read-only, non-required input inside the form, reuse existing callback/copy labels and clipboard error helper, give the copy button `type="button"`, disable it for an empty value, and add pre-save help in `apps/web/i18n/locales/en.json` and `apps/web/i18n/locales/de.json`. Cover successful create, create-pending/failure with retryable scope/secret input, two-configuration switching, rotation success/failure, Add another, successful removal, close/reopen, exact public-hostname copying, clipboard denial, unchanged request payloads, loading/dismissal behavior, existing cards, viewer restrictions, and repository inheritance. Keep callback outside strict form/request state; never synthesize a URL or change stored-secret handling. Add exactly one `repovio` patch Changeset at `.changeset/organization-webhook-callback-field.md` through the existing Changesets workflow, run `graphify update .` for `graphify-out/graph.json`, document any new callable, and pass focused browser coverage plus affected lint/type/format/documentation checks before the separately authorized task commit and push.

**Checkpoint**: US1 is the complete MVP. No additional stories, API work, or abstraction are needed.

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Verify the finished correction without adding behavior. T004 and T005 may run concurrently after T003.

- [ ] T004 [P] Run `corepack pnpm --dir apps/web e2e tests/e2e/organization-webhooks.spec.ts` against the web server described in `specs/004-organization-webhook-callback/quickstart.md`; inspect screenshots from `apps/web/tests/e2e/organization-webhooks.spec.ts` for empty/saved English desktop and German mobile states, keyboard access, long callback usability, and no horizontal overflow at 390px. Verify each form-scoped callback value and actual clipboard stub content, not a list-card value. Preserve existing administrator/viewer, secret, pending/error, and inherited-badge assertions.
- [ ] T005 [P] Run the affected checks defined by `apps/web/package.json`, `package.json`, and `scripts/format.mjs`: `corepack pnpm --dir apps/web lint`, `corepack pnpm --dir apps/web typecheck`, `corepack pnpm documentation:check`, `corepack pnpm format:check`, and `git diff --check`; confirm canonical formatting is stable across two passes and review only in-scope source, locale, test, Changeset, and graph changes. Investigate failures without weakening rules or changing unrelated files.
- [ ] T006 Reconcile observed verification outcomes in `specs/004-organization-webhook-callback/quickstart.md` and completion state in `specs/004-organization-webhook-callback/tasks.md`; record commands, screenshot evidence, any remaining limitations, and authorized commit references. Check FR-001 through FR-007 and SC-001 through SC-004 against `specs/004-organization-webhook-callback/spec.md`; mark implementation complete only after required checks and its authorized commit succeed. Disclose live-provider, Docker, or remote CI behavior that was not verified; do not deploy, release, or merge.

## Dependencies & Execution Order

```text
T001 (workspace/context)
  T002 (existing contracts)
    T003 (US1: regression, implementation, locales, Changeset, graph, verification)
      T004 (browser and visual verification)
      T005 (static and formatting verification)
        T006 (evidence and acceptance reconciliation; requires both T004 and T005)
```

- Setup precedes foundation; foundation and explicit implementation approval gate the only user story.
- T003 owns the complete releasable increment, including its regression coverage and release metadata. Create its own
  authorized commit only after it passes; never commit intentionally failing tests as a separate implementation task.
- Within T003, browser-test edits can be prepared alongside component/localization edits after the failing regression is
  observed, but the shared test file must have one writer. No independent partial implementation commits are planned.
- T004 and T005 are read-only verification tasks. They may run concurrently once the implementation is stable; do not
  repeat identical successful checks unless a changed head or unresolved concern requires it.
- Any fix discovered during final verification must be completed, retested, and delivered under the same approved scope.
  Follow repository Changeset and separate task-commit rules for substantive follow-up changes.
- Read-only setup/verification tasks do not require empty commits. Commit requests and approvals remain separate from
  this generated checklist. Recheck Git status and relevant diffs before every edit, test, and authorized commit.

## Parallel Example: User Story 1

After T003, run these independent verification activities together:

```text
T004: Focused Playwright suite and screenshot inspection using apps/web/tests/e2e/organization-webhooks.spec.ts.
T005: Web lint/typecheck and repository documentation/format checks from apps/web/package.json and package.json.
```

Component, locale, and regression changes remain one coherent US1 increment. Parallel verification does not authorize
spawning agents or require a parallel execution environment.

## Implementation Strategy

1. Issue #71 and planning commit/push are approved; obtain separate implementation approval through the coding workflow.
2. Complete setup and contract verification in this existing checkout; preserve unrelated work and pinned versions.
3. Deliver US1 as the smallest complete correction: visible empty field/help before save; exact selected callback and copy
   afterward; reliable reset and error behavior; both locales; focused tests; one Changeset and graph update.
4. Verify US1 independently and inspect desktop/mobile results. T004/T005 can reuse fresh T003 evidence when unchanged.
5. Record final acceptance evidence. Leave deployment, release, and merge to their explicitly authorized workflows.

## Coverage Summary

| Requirement or outcome                                      | Coverage         |
| ----------------------------------------------------------- | ---------------- |
| FR-001, SC-001: labeled read-only form field                | T003, T004       |
| FR-002: pre-save help and no fabricated URL                 | T003, T004       |
| FR-003, SC-002: exact selected callback and copy            | T002, T003, T004 |
| FR-004, SC-003: reset/removal/reopen                        | T003, T004       |
| FR-005: existing configuration and provider behavior        | T002, T003, T004 |
| FR-006, SC-004: locales, keyboard access, responsive layout | T003, T004, T005 |
| FR-007: permissions, pending/errors, secrets                | T002, T003, T004 |
| Whole-feature acceptance and honest evidence                | T006             |
