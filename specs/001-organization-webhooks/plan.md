# Implementation Plan: Organization Webhooks

**Branch**: `codex/58-organization-webhooks` | **Date**: 2026-11-09 | **Spec**: [spec.md](spec.md)

**Issue**: [#58](https://github.com/repovio/repovio/issues/58)

## Summary

Add encrypted administrator-owned organization/group hook configuration, verified durable delivery processing, and automatic
repository inheritance with a blue Organization badge. Preserve existing repository/App hooks and read-only providers.

## Technical Context

**Language/Version**: TypeScript with the existing compiler aliases; Node.js 26.13.0, pnpm 11.28.9.

**Primary Dependencies**: Existing NestJS/Fastify, shared Zod schemas, Prisma, Nuxt/Vue, Nuxt UI, and Query Kit.

**Storage**: PostgreSQL; additive configuration and receipt tables, existing durable repository synchronization queue.

**Testing**: Jest with disposable PostgreSQL 18 and Fastify, shared-schema tests, Vitest, Playwright, offline OpenAPI export.

**Target Platform**: Existing Linux API and web deployments; desktop and mobile browsers.

**Project Type**: Existing pnpm/Nx application monorepo.

**Performance Goals**: Accept webhooks asynchronously without outbound provider calls; use indexed durable deduplication.

**Constraints**: No provider writes, automatic repository import, secret disclosure, or toolchain changes.

**Scale/Scope**: Multiple organizations per Provider Account; all four existing providers; current repository administration.

## Constitution Check

- Pass: issue #58 and T1–T3 bound the approved scope; `PLAN.md`, `GLOSSARY.md`, and coding guidelines remain authoritative.
- Pass: provider operations remain read-only, credentials encrypted, authorization enforced before scoped queries.
- Pass: additive migration, durable retries, shared explicit DTOs, locale coverage, and browser verification are required.
- Pass: preserve the existing worktree and unrelated work; one focused Changeset and staged-source graph per task commit.
- Delivery correction: implementation originally existed uncommitted. Preserve it and validate isolated task snapshots before
  committing T1, T2, and T3; do not pretend the implementation originally followed that commit chronology.
- Rechecked after design: no architectural or toolchain exceptions required.

## Project Structure

### Documentation (this feature)

```text
specs/001-organization-webhooks/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/api.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code

```text
apps/api/prisma/organization-webhook.prisma
apps/api/prisma/migrations/20261109120000_organization_webhooks/
apps/api/src/modules/organization-webhooks/
apps/api/src/modules/webhooks/
apps/api/src/modules/repositories/
libs/schemas/src/api/
apps/web/app/components/modules/providers/
apps/web/app/components/modules/repositories/
apps/web/app/composables/api/
apps/web/tests/e2e/organization-webhooks.spec.ts
```

**Structure Decision**: Keep local configuration in its own Nest module, delivery in the existing webhooks module,
repository presentation in existing configuration DTOs, and browser requests/state in typed API composables.

## Implementation and task boundaries

- **T1**: Add encrypted configuration/receipt models, migration, administrator CRUD, safe shared contracts, Bruno requests,
  complete Spec-Kit artifacts and management contract tests. Register the configuration module without the T2 receiver.
- **T2** (depends on T1): Add signed callback and namespace matching, transactional receipt/delivery/queue persistence,
  delivery-header reuse, and real-signature/transaction integration tests. Repository presentation remains unchanged here.
- **T3** (depends on T1/T2): Add effective repository metadata and deepest-scope selection, management dialog/composable,
  explicit blue badge, inherited details, locales, setup docs, browser coverage, and final regression checks.

Preserve existing repository secrets/endpoints. Namespace is immutable; removal and recreation change it. Organization
configuration wins presentation only; valid repository deliveries still work. For GitLab, match exact namespace or its
slash-delimited descendants and display the deepest matching configured group. Signed unknown/ping events are acknowledged
without imports. Commit receipts and queue changes together and roll them back on queue failure.

## Validation and rollout

Validate each staged task in an isolated index snapshot with its own workspace dependency links. Run focused tests first,
then applicable format/documentation/lint/type/build checks. The final feature also receives full API/web/schema tests,
production-build browser checks, clean/upgrade migration validation and deterministic offline OpenAPI export.

Apply the additive migration before application deployment. Older applications can retain the new tables during rollback.
Provider hooks must be registered manually. No production migration, deployment, release, or merge is authorized here.
