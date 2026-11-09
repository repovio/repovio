# Tasks: Workflow Lifecycle Awareness

**Issue**: [#61](https://github.com/repovio/repovio/issues/61)

**Branch**: `codex/61-workflow-lifecycle`

## Phase 1: Setup

Publish the approved Spec Kit artifacts before task commits. The implementation already exists locally; checkboxes below
track validated task commits, not the earlier editing chronology.

## Phase 2: Foundation

- [x] T001 Add the lifecycle enum, additive migration, and adapter contract in apps/api/prisma and provider-adapter.ts.

## Phase 3: User Story 1 - Current Actionable Runs

- [x] T002 [US1] Add four read-only lifecycle adapters and focused tests in apps/api/src/modules/providers.
- [x] T003 [US1] Reconcile lifecycle before event evaluation and reuse metadata in providers/sync.service.ts and
      providers/repository-metadata.service.ts; verify ordering, errors, and history preservation.
- [x] T004 [US1] Apply canonical current-view filtering and counters in workflow-runs and system-status; verify PostgreSQL
      pagination, reactivation, historical metrics, and repository authorization.

## Phase 4: User Story 2 - Preserved History

- [ ] T005 [US2] Extend shared schemas, DTOs, context loading, and API/MCP/OpenAPI contract tests in libs/schemas and apps/api.
- [ ] T006 [US2] Add the lifecycle badge, complete locales, and browser regressions in apps/web.

## Phase 5: Documentation and Verification

- [ ] T007 Document lifecycle and rollout in GLOSSARY.md and the current handbook; include scoped .changeset notes.
- [ ] T008 Verify migration preservation and affected checks; record task commits and keep graphify-out/graph.json aligned.

## Dependencies and Execution Order

T001 precedes T002, then T003 and T004, then T005 and T006. T007 and T008 complete delivery. Each task forms a working
increment with focused validation; T001-T006 each require their own focused Changeset. Commit and push after each task.
Pure verification does not require an empty commit. Keep implementation and commit evidence in issue #61.

## Implementation Strategy

Finish US1 before US2. Reuse the existing selected worktree and issue-linked branch. Preserve native workflow identities,
read-only provider access, CASL restrictions, historical outcomes, and retention throughout the sequence.

## Commit Records

Task commit SHAs and actual check results are added as each commit succeeds. No task is considered delivered solely
because its code was edited or tested before issue #61 was created.

## Completed Task Commits

| Task | Commit    | Validation                                                                                  |
| ---- | --------- | ------------------------------------------------------------------------------------------- |
| T001 | `96780ff` | Staged schema validation, clean migrations, and API typecheck passed.                       |
| T002 | `f68e97b` | Staged four-adapter test suites and API typecheck passed.                                   |
| T003 | `e15f607` | Staged synchronization/metadata tests and API typecheck passed.                             |
| T004 | `466aa4d` | Staged query/counter tests, PostgreSQL authorization integration, and API typecheck passed. |
