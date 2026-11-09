# Implementation Plan: Workflow Lifecycle Awareness

**Branch**: `codex/61-workflow-lifecycle` | **Date**: 2026-11-09 | **Issue**: [#61](https://github.com/repovio/repovio/issues/61)
**Spec**: [spec.md](spec.md)

## Summary

Persist authoritative lifecycle observations independently of run status. Exclude confirmed inactive workflows from
current actionable views, preserve historical data, and expose localized lifecycle badges through existing contracts.
Reuse the established provider adapters, synchronization coordinator, query service, DTOs, and workflow-run table.

## Technical Context

- TypeScript, Node.js 26.13.0, pnpm 11.28.9; preserve compiler aliases and dependency ranges.
- NestJS/Fastify, Prisma/PostgreSQL, shared Zod contracts and Query Kit, CASL, Nuxt/Vue.
- PostgreSQL migrations are additive. No schema reset or production mutation is authorized.
- Jest/PostgreSQL integration tests, shared-schema tests, Vitest, Chromium, canonical formatting and documentation checks.
- See [research.md](research.md), [data-model.md](data-model.md), [contracts/api.md](contracts/api.md), and
  [quickstart.md](quickstart.md) for implementation decisions and validation.

## Constitution Check

- Approved scope: issue #61 and tasks T001-T008 only; preserve unrelated work.
- Provider integrations remain read-only. Tokens and credentials are neither logged nor exposed.
- CASL restrictions remain in database queries; lifecycle predicates precede pagination/counts.
- Outcomes, retention, historical statistics, and notification delivery history remain unchanged.
- Every behavior change includes focused checks. UI text is localized and browser-verified.
- Apply docs/coding-guidelines.md and AGENTS.md. Keep the graph with staged sources and one focused repovio Changeset
  per substantive implementation commit. Commit and push each completed task; do not merge or deploy.

## Project Structure

### Documentation (this feature)

```text
specs/002-workflow-lifecycle/
  spec.md
  plan.md
  research.md
  data-model.md
  contracts/api.md
  quickstart.md
  checklists/requirements.md
  tasks.md
```

### Source Code

- apps/api/prisma owns the enum, Workflow columns, and additive migration.
- apps/api/src/modules/providers owns observations, four adapter implementations, and sync reconciliation.
- workflow-runs and system-status own canonical current-view filtering and counters.
- Shared schemas, resource/dashboard DTOs, existing controllers, and MCP own transport compatibility.
- apps/web owns the shared lifecycle badge, workflow-run table, complete locales, and browser regression tests.

## Implementation Decisions

- The adapter returns only confirmed observations. Omitted identities preserve stored lifecycle state and check time.
- GitHub maps active/deleted/disabled_*; Gitea also checks valid nonzero deleted_at.
- Forgejo has_actions and GitLab builds_access_level classify repository CI availability. Enabled repository CI restores
  UNKNOWN because individual workflow existence cannot be established from pipeline names.
- Refresh known lifecycle states before run discovery; explicit repository CI disabling skips unavailable run APIs.
- Check only newly discovered identities afterward; reuse repository-wide observations rather than repeat metadata reads.
- Commit observations after successful reads; historical run upserts omit lifecycle updates.
- Notification evaluation reads the persisted workflow state and skips inactive workflows. Removal never means recovery.
- Apply one shared inactive-workflow predicate only to current views. Historical queries stay unchanged.

## Delivery and Rollout

The initial implementation already existed locally before issue #61. Preserve that fact in delivery records while splitting
it into dependency-ordered task commits. The first commit publishes these Spec Kit artifacts; each T001-T008 commit and
validation result is recorded in tasks.md and issue #61. No retrospective issue-first chronology is claimed.

Migration precedes application rollout. Initial UNKNOWN records remain visible until polling classifies them. Application
rollback leaves the additional columns intact. Production deployment and migration execution remain outside scope.

## Complexity Tracking

No new runtime dependency, endpoint, service boundary, or provider write is introduced.
