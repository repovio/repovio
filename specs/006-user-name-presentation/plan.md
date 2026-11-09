# Implementation Plan: App-Wide User Name Presentation

**Branch**: `codex/76-user-name-presentation`, based on `origin/main` at `19dada5`. **Date**: 2026-11-09.
**Issue**: [#76](https://github.com/repovio/repovio/issues/76).
**Spec**: [spec.md](spec.md). **Input**: `specs/006-user-name-presentation/spec.md`.

## Summary

Reuse existing User identity helpers for personal-name-first presentation throughout Repovio. User selectors show
`First Last (@username)`; other identity displays may omit the username, or show it only in parentheses. Trim name
parts and retain existing partial-name and username fallback. Cover groups, repository access, browser recipients,
account navigation, administration, identity dialogs, confirmations, summaries, and accessible descriptions.

Preserve nullable personal names through notification projections and shared contracts. Extend existing paginated User
search to first name, last name, full name, and username. Preserve identity IDs, authorization, loading/error behavior,
and credential fields. No database migration, provider interaction, or dependency changes.

## Technical Context

**Language/Version**: Existing TypeScript compiler aliases; Node.js 26.13.0 and pnpm 11.28.9.
**Primary Dependencies**: Existing Nuxt 4, Vue 3, Nuxt UI, Pinia, NestJS/Fastify, Prisma, Zod, CASL, and Query Kit.
**Storage**: Existing PostgreSQL User names and relations; additive projections only, no persistence change.
**Testing**: Vitest helpers/composables, Jest API tests, shared-schema contracts, Playwright browser tests.
**Target Platform**: Browser SPA and existing REST API, English/German, desktop and narrow viewports.
**Project Type**: Existing pnpm/Nx web application monorepo.
**Performance Goals**: No additional provider requests or per-option identity fetches; retain paginated authorized search.
**Constraints**: Safe DTO mapping, CASL restrictions, no credential exposure, no required-name migration or toolchain change.
**Scale/Scope**: Every Repovio User identity surface, including later search pages and browser recipients beyond the
current 100-account choice limit. Website marketing and Provider Actor presentation are outside scope.

## Constitution Check

| Gate                            | Before research                                                | After design                                       |
| ------------------------------- | -------------------------------------------------------------- | -------------------------------------------------- |
| Approved architecture and scope | PASS: direct user-requested planning within existing workflows | PASS: no unrelated features                        |
| Active issue and delivery order | Issue #76; planning commit authorized                          | Approved plan/tasks; implementation pending        |
| Provider read-only              | PASS: no provider integration changes                          | PASS: no provider calls required                   |
| Authorization and secrets       | PASS: reuse authorized resources                               | PASS: safe name projections and permission tests   |
| Durable operations              | PASS: no delivery/retry semantics changed                      | PASS: assignment IDs remain unchanged              |
| Verification and localization   | PASS: affected checks identified                               | PASS: contracts, permissions, EN/DE browser matrix |
| Engineering conventions         | PASS: reuse helpers and module boundaries                      | PASS: no dependencies or architectural layer added |

Issue #76 owns this scope. The user approved plan/task generation and issue creation with planning-file commit/push.
Implementation remains a separate approval gate. No constitutional exception is proposed.

## Project Structure

### Documentation (this feature)

```text
specs/006-user-name-presentation/
├── spec.md
├── checklists/requirements.md
├── plan.md
├── research.md
├── data-model.md
├── contracts/user-identity.md
├── quickstart.md
└── tasks.md
```

[tasks.md](tasks.md) contains the approved ordered breakdown. `.specify/feature.json` selects this feature locally and
remains ignored runtime context; the committed feature-directory path resolves the same artifacts in another checkout.

### Source Code (repository root)

```text
apps/web/app/
├── utils/user-identity.ts
├── utils/user-identity.spec.ts
├── composables/api/repovio-api.ts
├── composables/app/notification-channel-draft.ts
├── components/layout/user-menu.vue
├── components/modules/{users,user-groups,mcp,notifications}/
├── components/modules/repositories/details/members-card.vue
└── pages/{admin,notifications}/
apps/web/tests/e2e/
apps/web/i18n/
apps/api/src/modules/{auth,users,user-groups,notifications}/
apps/api/bruno/
libs/schemas/src/api/notifications.ts
libs/schemas/src/contracts.ts
```

**Structure Decision**: Extend existing utilities, composables, components, DTOs, and shared schemas. Retain the existing
`app/utils/user-identity.ts` seam; do not relocate it or add an identity service. Keep page components focused.

## Design and Delivery Boundaries

1. Normalize and test shared identity helpers; preserve avatar behavior except any specifically demonstrated regression.
2. Add nullable names to safe notification recipient responses. Add optional nullable `requestedBy` identity to delivery
   resources while retaining `requestedByUsername`. Update projections, DTOs, strict schemas, clients, fixtures, and
   relevant Bruno/API documentation together. Updated servers emit explicit nulls; clients accept older absent names.
3. Apply shared labels to every surface in [research.md](research.md). Selectors include username disambiguation;
   compact non-selector displays may use the personal name alone.
4. Extend existing User search: username matches the whole query OR every whitespace-delimited name token matches
   firstName OR lastName, case-insensitively. Preserve deterministic username/ID ordering and authorization predicates.
5. Replace notification choice loading's fixed 100-User truncation with paginated authorized discovery. Preserve selected
   and configured recipient labels across pages; avoid fetching all Users or individual names without need.
6. Verify focused unit/contract/API tests, permission isolation, complete browser surface inventory, locales, and narrow
   layouts. Later implementation tasks each include scoped tests/docs and exactly one focused `repovio` Changeset.

## Risks and Controls

- Missing names: available parts or username fallback; no fabricated names or mandatory profile updates.
- Duplicate/long names: parenthesized usernames, stable ID values, accessible full labels, narrow-layout validation.
- API drift: align strict schemas, projections, DTOs, clients, fixtures, and examples in a coherent increment.
- Historical deliveries: preserve username compatibility; deleted requester remains null, no identity reconstruction.
- Permission leaks: name matching remains inside existing resource restrictions; test unauthorized candidates explicitly.
