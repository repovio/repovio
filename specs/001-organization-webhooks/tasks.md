# Tasks: Organization Webhooks

**Input**: [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md), [data-model.md](data-model.md),
[contracts/api.md](contracts/api.md), [quickstart.md](quickstart.md).

**Issue**: [#58](https://github.com/repovio/repovio/issues/58)

**Branch**: `codex/58-organization-webhooks`, linked through GitHub's issue-development association.

The user authorized issue creation, this branch, and separate task commits/pushes. Existing implementation is being preserved
and reviewed in dependency-ordered staged snapshots. T1–T3 retain the identifiers from the approved plan.

## Phase 1: Setup and foundations

Covered by T1: reuse the existing worktree/toolchain, register `.specify/feature.json`, and persist the complete feature artifacts.
No repository/toolchain initialization or new provider credentials are needed.

## Phase 2: User Story 1 — Configure once per organization

**Goal**: Administrator-only local configuration with encrypted secrets and an additive migration.

**Independent test**: Real configuration HTTP requests cover validation, authorization, uniqueness, scope isolation, and secrets.

- [ ] T1 [US1] Add `apps/api/prisma/organization-webhook.prisma`, its migration and Provider Account relation;
      `apps/api/src/modules/organization-webhooks/` administrator configuration/controller/module and management tests;
      `libs/schemas/src/api/organization-webhooks.ts` contracts; Bruno requests and complete Spec-Kit artifacts.
      Register configuration independently of the T2 receiver. Validate clean/upgrade migrations and task checks, then commit
      with exactly one focused Changeset and staged-source graph and push before starting the next delivery task.

## Phase 3: User Story 2 — Synchronize matching tracked repositories

**Goal**: Verified, isolated, retry-safe organization/group delivery using existing provider adapters and queue.

**Independent test**: Real signatures and PostgreSQL exercise valid/invalid/repeated/concurrent deliveries and rollback.

- [ ] T2 [US2] Add `apps/api/src/modules/webhooks/organization-webhook.service.ts`, its stable/versioned controller callback,
      module registration and shared delivery headers; add organization namespace matching and delivery integration coverage.
      Depends on T1. Keep repository metadata unchanged until T3. Validate provider/isolation/transaction cases, then commit
      with exactly one focused Changeset and staged-source graph and push.

## Phase 4: User Story 3 — Recognize inherited configuration

**Goal**: Automatic effective metadata, localized management, explicit blue badge, and preserved repository fallback.

**Independent test**: Production-build English/desktop and German/mobile browser journeys and viewer restrictions.

- [ ] T3 [US3] Update repository configuration DTO/schema/service, `apps/web/app/components/modules/providers/` management,
      repository badge/details, typed API composables, English/German text and existing locale fallbacks;
      `apps/web/tests/e2e/organization-webhooks.spec.ts`, glossary and setup docs. Depends on T1/T2. Run final regression and
      standards checks, then commit with exactly one focused Changeset and staged-source graph and push.

## Dependencies and execution strategy

T1 precedes T2; T3 depends on both. T1 is a usable configuration increment; T2 adds functional event processing; T3 adds
management and automatic presentation. Each increment is independently validated from the staged index before committing.
Within a task, schema/HTTP tests or locale/browser checks can execute independently when they do not share build output.
No parallel agents are required. No merge, deployment, or production migration is authorized.

## Delivery records

Commit SHAs and current validation outcomes are recorded in issue #58 after each successful task commit and push. The next
task commit also carries the preceding task's SHA in this document, avoiding impossible self-referential commit hashes.

## Verification evidence

- API: 105 suites, 611 tests passed against disposable PostgreSQL 18, including actual signatures for all four providers.
- Web: 15 suites, 47 tests passed. Shared schemas: 15 tests passed.
- Browser: all three new organization-webhook cases passed against the production build, including English/desktop,
  German/mobile, inherited details, creation/rotation/removal, loading/error states, fallback, and viewer restrictions.
  Provider setup, GitHub App setup, repository-detail regressions, and the main administration table also passed.
- Broader browser selection: 12 passed, 2 failed. Both failures reproduced unchanged in an isolated archive of the starting
  commit: `adds multiple repositories selected from an enabled provider account` expects missing `Selected: 2` text;
  `repository dialog loads retention, filters, and members` expects a disabled workflow-filter button. Unrelated source
  and assertions were preserved.
- Canonical formatting converged after two passes. Root lint, documentation checks, root typechecks, and API/web builds
  passed. The real application's deterministic offline OpenAPI export passed its existing regression test.
- All 41 migrations applied to an empty database. An upgrade from the preceding 40 migrations preserved an existing
  repository and its signing secret. Prisma reported no schema drift after the clean migration path.
- Provider calls in webhook integration tests were forbidden and never occurred. Live provider registration, production
  migration, container image builds, and remote CI were not performed.
