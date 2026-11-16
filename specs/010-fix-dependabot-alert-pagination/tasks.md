---
description: 'Implementation tasks for GitHub Dependabot alert pagination'
---

# Tasks: Fix GitHub Dependabot Alert Pagination

**Issue**: [repovio/repovio#97](https://github.com/repovio/repovio/issues/97)

**Branch**: `97-fix-github-dependabot-alert-pagination`

**Input**: [Specification](spec.md), [plan](plan.md), [research](research.md), [data model](data-model.md),
[provider contract](contracts/github-dependabot-pagination.md), and [quickstart](quickstart.md).

## Phase 1: Setup

- [x] T001 Prepare the existing API test environment using `specs/010-fix-dependabot-alert-pagination/quickstart.md`.
      Confirm the linked branch and worktree, use Node.js 26.13.0 and Corepack pnpm 11.28.9, and prepare the generated
      API client using the existing setup. Review `docs/coding-guidelines.md` and keep the workspace manifests pinned.

## Phase 2: Foundational

- [x] T002 Run the focused baseline in `apps/api/src/modules/providers/github/github-actions.adapter.spec.ts`.
      Use `corepack pnpm --filter @repovio/api test github-actions.adapter.spec.ts`. Confirm the existing normalization
      and availability fixtures pass before making changes. Review the adjacent adapter and the existing queue warning
      and retry tests in `apps/api/src/modules/providers/sync-queue.service.spec.ts`.

## Phase 3: User Story 1 – Complete Repository Synchronization (P1, MVP)

**Goal**: Read the complete Dependabot collection so the existing synchronization flow can proceed past Alerts.

**Independent test**: Use a fixture that returns HTTP 400 for a numbered Dependabot request and two cursor-linked
pages for the supported request. Assert that all fixture alerts reach the adapter's normalized result. Run the
existing alert persistence and queue tests to verify the downstream contract.

- [x] T003 [US1] Fix Dependabot pagination in `apps/api/src/modules/providers/github/github-actions.adapter.ts`.
      Deliver these steps as one working increment, with the regression fixtures and patch Changeset included.

  1. In `apps/api/src/modules/providers/github/github-actions.adapter.spec.ts`, add fixtures for empty and single-page
     results and for a short intermediate page with an encoded cursor, multiple link relations, and a canonical
     repository-ID path on a configured API base. The fixtures must reject `page=1`. Cover malformed or repeated next
     URLs, embedded credentials, off-origin targets, continuation redirects, and a later-page rate limit. Verify that
     refused targets receive no request and existing Code Scanning, Secret Scanning, and unavailability tests still pass.
     Run the focused regression before the fix and confirm failure on the old pagination.
  2. Give Dependabot its own cursor reader using the existing URL builder, GitHub headers, injected fetch, and
     `providerRequestError`. Start with `per_page=100`. Follow only the `next` relation through complete collection
     retrieval, including links from short pages, and pass the result to existing normalization.
  3. Resolve each next URL against the current request. Keep its path and query, require HTTP(S) and the configured
     API origin, reject embedded credentials, and ignore fragments when detecting repeated URLs. Use a fixed,
     credential-free error for invalid or cyclic continuations and `redirect: 'manual'` on continuation GETs.
     Keep existing per-kind availability and retry handling, including mid-collection failures.
  4. Rerun the focused adapter suite and the existing `security-alert-sync.service.spec.ts` and
     `sync-queue.service.spec.ts` in `apps/api/src/modules/providers/`. Document the changed declarations per the
     repository rules and generate exactly one focused patch Changeset for `repovio` in `.changeset/`.

## Phase 4: Final Verification

- [x] T004 Complete the local checks in `specs/010-fix-dependabot-alert-pagination/quickstart.md`. Run the API test,
      typecheck, and lint targets, the canonical formatting and documentation checks, and `git diff --check`. Refresh
      `graphify-out/graph.json` with the repository's AST update after the source change. Record the live retry as a
      post-release check and report its verification status.

**Validation**: The full API suite passed (111 suites, 807 tests) with an isolated PostgreSQL 18 database.
API type checking, lint, documentation, guideline tests, canonical formatting, and the AST graph refresh passed.
The live retry is pending deployment.

## Dependencies & Execution Order

T001 → T002 → T003 (US1) → T004. US1 has no other story dependencies. It uses the existing adapter interface,
Security Alert Sync State, and Repository Sync Request.

## Parallel Execution Example

During T004, after T003 and any required shared build outputs are ready, the AST graph refresh can run alongside
the read-only verification commands. T003's regression and implementation run in sequence to verify the old failure
before applying the fix.

## Implementation Strategy

Ship US1 as the MVP after final verification. Keep the pagination fix, its tests, Changeset, and graph update
together in the implementation increment. Use the post-release check in the quickstart to verify a previously
failed job on the deployed build.
