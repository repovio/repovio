# Implementation Plan: Provider Account Actions and Webhook Setup

**Branch**: `codex/89-provider-actions-webhooks` | **Date**: 2026-11-10 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/009-provider-actions-webhooks/spec.md`.

**Feature context**: `009-provider-actions-webhooks`. Issue: [#89](https://github.com/repovio/repovio/issues/89).
Reuse the preexisting Codex worktree `/mnt/projects/.codex-worktrees/17ad/repovio`. The issue branch starts at verified
`origin/main` commit `01dd05cd97bb3ddf74bcb479c3504f2ef2274be5`; product implementation remains separately gated.

## Summary

Replace provider-account row icon clusters with one labeled three-dot menu. Reorganize Organization Webhooks into an
immediately visible setup section and separate saved-configuration management. A read-only, administrator-only draft
endpoint supplies a server-generated UUID and canonical callback before save. Create accepts that optional UUID while
retaining legacy server-generated identities. No persistent draft, database migration, or provider registration.

## Technical Context

**Language/Version**: TypeScript with existing compiler aliases; Node.js 26.13.0; pnpm 11.28.9.

**Primary Dependencies**: Existing Nuxt 4, Vue 3, Nuxt UI 4, NestJS/Fastify, Zod, Prisma, and querry-kit workspace packages.
No upgrades or new dependencies.

**Storage**: Existing PostgreSQL OrganizationWebhook table; explicit UUID on create uses the existing primary key.
Draft state exists only in the current dialog and is never persisted before save.

**Testing**: Existing schema tests, API integration tests, web Vitest tests, Playwright organization-webhooks and providers
fixtures; canonical formatting, lint, documentation checks, and affected type checks.

**Target Platform**: Existing web SPA and API; desktop and mobile browsers; English and German.

**Project Type**: Full-stack web application in the existing pnpm/Nx monorepo.

**Performance Goals**: One read-only draft request per fresh setup session or explicit new draft; no requests per
keystroke. Menu opening is local. No provider round trips during preview. Draft requests use no-store semantics.

**Constraints**: SYSTEM_ADMIN only, canonical PUBLIC_URL ownership stays server-side, zero provider writes, stored secrets
remain write-only, old URLs and create clients remain valid, no production migration/deployment.

**Scale/Scope**: `/admin/providers`, provider row actions, Organization Webhooks dialog, its API/client/shared contract,
focused documentation/localization/tests only. No other table migration or page-toolbar redesign.

## Constitution Check

Pre-research and post-design gates pass for planning; implementation evidence remains future work.

| Principle                  | Design evidence                                                                               | Pre / post  |
| -------------------------- | --------------------------------------------------------------------------------------------- | ----------- |
| I: Bounded architecture    | User-requested two UI changes and their direct callback dependency only; issue #89 recorded   | Pass / Pass |
| II: Read-only providers    | Preview reads account metadata; save mutates local configuration only                         | Pass / Pass |
| III: Authorization/secrets | Existing admin/account guards; strict optional UUID; insert-only conflicts; no secret DTO     | Pass / Pass |
| IV: Durable processing     | Existing delivery/signature/idempotency paths unchanged; unsaved UUID is not a stored hook    | Pass / Pass |
| V: Verified/localized      | Focused API/schema/browser matrix; EN/DE, focus, pending state, responsive checks required    | Pass / Pass |
| Toolchain/structure        | Existing aliases, pins, module boundaries, typed DTOs and API composables reused              | Pass / Pass |
| Delivery gates             | Plan only; tasks, issue, planning commit, implementation, and merge remain separate decisions | Pass / Pass |

Documentation wording differs between constitution and coding guidelines for typed tags. Follow explicit AGENTS.md and
constitution precedence for implementation documentation; do not modify standards as part of this feature.

## Phase 0: Research

Completed findings and rejected alternatives: [research.md](research.md). Current callback requires a stored UUID and
uses server PUBLIC_URL. Client hostname reconstruction is insufficient. No unresolved design clarifications remain.
The stateless draft is a setup address, not a promise that an unsaved webhook accepts delivery.

## Phase 1: Design

### Provider action menu

Use the existing feature-owned `account-actions.vue` and Nuxt UI dropdown pattern. Keep the current emitted events and
page handlers. Entries retain provider conditions and OAuth unavailable explanation. Separate Delete visually and mark
it destructive. The trigger's accessible label identifies the Provider Account. Trigger remains loading for the complete
pending row operation after dropdown dismissal; disable duplicates and preserve delete confirmation.

### Webhook setup dialog

Use the existing modal with a viewport-bounded scrollable body and responsive width. Order: account context, setup
heading, read-only callback/copy, namespace, signing secret, concise provider instructions, save controls; then a distinct
saved-configurations section with namespace, callback, receipt metadata, and edit controls. Keep GitLab tier guidance
visible where applicable. Use localized, compact guidance instead of a dominant instruction alert.

Keep component ownership explicit: extract a setup form or saved-list component only when independently useful; route
page remains composition. Existing selection for rotation retains immutable scope and server callback. Retain secret
reveal/copy/generation, rotation acknowledgement, and removal confirmation. Do not fetch stored secrets.

### Draft and request lifecycle

Initialize list and draft metadata on dialog opening; independent error/pending states permit retrying either request.
Keep setup disabled until draft metadata exists, without blocking access to an already loaded saved configuration.
Bind every response to account and dialog generation; ignore late results after dismissal, reopening, or selection change.
Use a typed draft resource `{ id, callbackUrl }` in the API composable. Store namespace/secret only in transient form state.

POST includes the draft ID. Successful response replaces the form with saved metadata and must retain the copied URL.
Keep the ID across validation/save errors. On uncertain POST outcome, refresh the authorized account list and reconcile
only an exact draft ID before offering retry; do not infer success from namespace alone or silently adopt a conflict.
Explicit duplicate ID conflicts are non-destructive and display retryable feedback. Starting another setup or reopening
creates fresh metadata. Clear plaintext on close; no local/session storage for draft secrets.

### API compatibility and security

Add GET draft before dynamic webhook routes; authenticate and require the selected account before generating metadata.
Return an uncacheable UUID/URL pair computed through the same canonical URL helper as saved DTOs. Add optional UUID `id`
to the strict shared create schema and transport DTO. Omission preserves old behavior. Insert supplied IDs; never upsert.
Map both primary-key and scope uniqueness conflicts to sanitized 409 responses without leaking another account's hook.
No draft table or migration. Preview confers no authorization and bypasses no signature checks.

Update runtime schemas, API/web DTOs, OpenAPI, Bruno, and current user docs together. Published handbook snapshots remain
unchanged. Preserve existing callbacks, encrypted secret handling, scoped rotate/delete, and delivery processing.

### Validation and delivery order

Implement coherent increments in this order after task generation and implementation approval: action menu; draft API
and contract/client plumbing; redesigned dialog and lifecycle; integrated browser/docs acceptance as needed. Each future
implementation task includes its own focused tests and exactly one repovio Changeset in its separately requested commit.
Detailed task IDs and coherent commit boundaries are defined in the approved-generation output [tasks.md](tasks.md).

Use the [quickstart](quickstart.md) for the acceptance matrix. API-contract checks cover validator/serializer/client/docs
agreement and admin/account isolation. Vue-feature checks cover trigger focus, disabled/loading/error states, translated
labels, clipboard, and responsive screenshots. External provider registration is manual and not part of local proof.

## Project Structure

### Documentation (this feature)

```text
specs/009-provider-actions-webhooks/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── tasks.md
├── checklists/requirements.md
└── contracts/ui-and-api.md
```

### Source Code (repository root)

```text
apps/web/app/pages/admin/providers.vue
apps/web/app/components/modules/providers/{account-actions,organization-webhooks-dialog}.vue
apps/web/app/composables/api/{organization-webhooks,repovio-api}.ts
apps/web/app/types/api/resources.ts
apps/web/tests/e2e/{providers,organization-webhooks}.spec.ts
apps/api/src/modules/organization-webhooks/
libs/schemas/src/
apps/api/bruno/
docs/
```

**Structure Decision**: Extend existing provider UI, organization-webhook module, shared schemas, API client, locale
resources, and focused tests. Keep API state out of presentation and pages. Resolve exact locale/doc filenames from the
current checkout during implementation; update current supported locale parity without editing published archives.

## Complexity Tracking

No constitution violations or additional infrastructure. Stateless preview and optional create ID are the smallest
canonical-URL extension that meets pre-save display while preserving existing routes and clients.
