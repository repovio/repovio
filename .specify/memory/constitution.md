# Repovio Constitution

## Core Principles

### I. Approved Architecture and Bounded Scope

- Work MUST follow the approved architecture in `PLAN.md` and the implementation order in GitHub Issues and sub-issues.
  Specifications and implementation MUST cover only the active issue and its direct dependencies.
- Existing behavior and unrelated work MUST be preserved. Inspect `git status` and the relevant diff before every edit,
  test, and commit. Later work MUST NOT be started opportunistically.
- Before changing domain terminology, product text, or domain models, read `GLOSSARY.md`; use its terms consistently
  and update definitions when their meaning changes.
- Existing patterns MUST be reused. Machine Admin supplies structural conventions, not domain models or endpoints to
  copy. This keeps changes aligned with Repovio's approved product architecture.

### II. Read-Only Provider Integrations

- Repovio MUST remain read-only toward GitHub, GitLab, and Forgejo. Provider calls MUST NOT create, modify, dispatch,
  rerun, cancel, or delete provider resources, including workflows and webhook registrations.
- Integrations MUST use configurable polling and manually configured, signature-validated webhooks for synchronization.
  GitHub App installation-token issuance and renewal are authentication-only exceptions to outbound read requests;
  tokens MUST remain read-only. PAT/OAuth connections and polling reconciliation MUST remain supported.
- Agent tooling MAY create GitHub Issues, sub-issues, and milestones only on explicit user request. This exception
  MUST NOT enter application integrations. Local Repovio configuration and sync jobs are distinct from provider writes.

### III. Authorization and Secret Protection

- Repository authorization MUST be enforced in Prisma queries with CASL-aware restrictions. Ability-aware DTO field
  filtering MUST provide a second layer; serialization alone MUST NOT enforce authorization.
- `SYSTEM_ADMIN` administers Repovio; `VIEWER` reads explicitly assigned repositories; `MANAGER` additionally configures
  assigned repositories. Group grants MUST remain additive; Manager grants require the global Manager role.
- Pages, navigation, API calls, charts, tables, sync jobs, and notification history MUST respect repository permissions.
  Manual sync starts MUST remain administrator-only as defined in `PLAN.md`.
- Provider tokens, GitHub App private keys/webhook secrets, and notification-channel credentials MUST be encrypted at
  rest. Secrets MUST NOT be logged, exposed in responses, snapshotted, or committed. Bruno credentials MUST use secret
  variables. Runtime configuration and secrets MUST come from environment variables.

### IV. Durable Synchronization and Notifications

- Polling, webhooks, and notification delivery MUST be idempotent. Retriable operations MUST use durable records
  so repeated events and restarts do not duplicate effects.
- Provider statuses MUST normalize to `queued`, `running`, `success`, `failed`, `cancelled`, `skipped`, or `unknown`.
  Workflow blacklist patterns MUST override whitelist matches; repository retention overrides MUST preserve the global
  fallback.
- Notifications MUST support repository-scoped email, Gotify, and ntfy channels as defined in `PLAN.md`. There MUST be
  at most one delivery per notification rule and workflow run. Every attempt MUST be persisted; retries MUST use bounded
  exponential backoff. Authorized users MUST be able to inspect final delivery status and errors.

### V. Verified, Documented, and Localized Changes

- Every behavior change MUST include focused tests. Start with the smallest relevant checks, then affected project
  targets. Failures MUST be investigated and fixed; completion MUST NOT be claimed before verification. Unverified
  provider, browser, Docker, and remote GitHub Actions behavior MUST be disclosed.
- Every handwritten function and class MUST have directly attached JSDoc/TSDoc, including methods, constructors,
  accessors, and functions assigned to variables or properties. Generated code, third-party code, pure type declarations
  and anonymous inline callbacks are exempt under the explicit project instructions.
- Documentation MUST describe actual purpose and relevant parameters, returns, errors, and side effects. Use typed tags
  even in TypeScript: `@param {type} name Description` and `@returns {type} Description`, without a hyphen after the
  parameter name. Update comments when contracts change; JavaScript MUST use equivalent documentation blocks.
- Source, tests, comments, documentation, and Changesets MUST use American English. User-visible application text MUST
  exist in English and German locale files. Preserve accessibility, permission filtering, loading/error states, and
  significant whitespace. Initiating or gating buttons MUST stay loading throughout every awaited API request.
- Visual changes MUST be verified in a browser or screenshot-based test; lint and type checks alone are insufficient.

## Architecture and Engineering Standards

- Preserve the pnpm/Nx monorepo: NestJS/Fastify API in `apps/api`, framework-independent shared Zod contracts in
  `libs/schemas`, Nuxt 4 SPA (`ssr: false`) in `apps/web`, Prisma/PostgreSQL persistence, and Docker Compose deployment.
- Use Node.js 26.13.0 and pnpm 11.28.9; use Corepack when pnpm is not already the pinned version. Preserve TypeScript
  compiler aliases, manifest version ranges, and strict types. Toolchain changes require explicit user request and
  compatibility validation; framework-generated strictness overrides MUST be explicitly justified.
- API features MUST follow the module/service/controller/shared-schema/types/test layout. Public boundaries MUST use
  explicit DTOs, validation, and return types. Prefer domain types or narrowed `unknown` over `any`.
- Use `@querry-kit/nest` for resource queries, pagination, filtering, sorting, selection, and explicit ability-aware
  response mapping. Split Prisma schemas by domain. Validate API environment variables with `envalid`; use `dotenv`
  only to load local environment files before validation.
- Preserve `/api/v1`, `/docs`, `/api/health`, JWT bearer authentication, local accounts, and environment-based initial
  administrator setup. Health reporting MUST NOT expose credentials or trigger provider requests. Protected endpoint
  changes MUST update the Bruno collection and documented request examples.
- Frontend route pages MUST coordinate metadata, loading, and composition. Shells belong in `app/components/layout`,
  generic UI in `app/components/common`, and feature UI in `app/components/modules/<feature>`. Extract independently
  meaningful cards, forms, tables, dialogs, and sections into named components.
- API clients/query state belong in `app/composables/api`, presentation concerns in `app/composables/app`, enum mappings
  in `app/composables/enums`, persistent state in `app/store`, contracts in `app/types/api`, and independent helpers in
  `app/util`. Client DTO types MUST stay synchronized with the API and shared schemas.
- Use Pinia, Nuxt UI, default dark mode, and `@querry-kit/nuxt` for typed API/table state. Use
  `@querry-kit/nuxt-ui/types` only for filtering/sorting contracts, retaining full column metadata and local controls.
- Vue blocks MUST follow template, typed setup script, then optional style order. Scoped styles MUST be limited to CSS
  unavailable through established utilities. Preserve the coding guidelines' attribute order and rendering semantics.
- Use the canonical formatter/import organization and Vue layout pipeline in `docs/coding-guidelines.md`: two spaces,
  LF, single quotes, semicolons, trailing commas, and 120-character lines where applicable. Separate logical import
  groups, top-level declarations, and class members with one blank line; avoid consecutive blank lines and unrelated
  formatting changes. Keep documentation/decorators attached. Default exports MUST be limited to framework conventions.
- Dependencies, generated/vendor sources, framework/build output, coverage, and browser reports MUST remain excluded
  from handwritten-code checks. pnpm owns the lockfile. Rules MUST NOT be weakened or source broadly excluded to pass.
- Production Compose MUST include persistent PostgreSQL storage and migrations before API startup, with external TLS
  termination. API and web MUST share one `REPOVIO_VERSION` and release version.

## Delivery Workflow and Quality Gates

1. Read project rules before changes. Spec-Kit specifications, plans, and tasks MUST identify the active issue,
   bound its scope, and satisfy this constitution. Work autonomously through implementation and verification;
   ask only when genuinely blocked by unavailable information.
2. When `graphify-out/graph.json` exists, run `graphify query` before the first codebase search or source read. Use
   `graphify path` and `graphify explain` for relationships/concepts and the wiki index for navigation when present.
   Raw reads MUST follow graph-located context or earlier reads; exploration subagents MUST receive this rule. Dirty
   output MUST NOT justify skipping Graphify; stale/incorrect graph tasks or explicit user instructions may bypass it.
   After code changes, run `graphify update .`; whole-file graph rebuild diffs are expected.
3. Run relevant canonical formatting, documentation, checker regression, lint, typecheck, and test commands from
   `docs/coding-guidelines.md`. Formatting MUST be stable across two complete passes and preserve Vue rendering. For
   prose-only changes, verify structure, formatting, references, and diffs; application tests are unnecessary.
4. Tests MUST cover affected normalization, glob filters, retention, encryption, notification deduplication/retries,
   recorded provider/webhook fixtures, cross-repository authorization, or frontend login/navigation/table/empty/error
   states. CI MUST retain migration, lint, documentation, test, typecheck, and release-image checks without silently
   changing the pinned toolchain.
5. Commit only on explicit request. Before committing, run `git diff --check`, inspect the staged diff, and stage only
   reviewed scope. Every substantive implementation commit MUST include exactly one focused Changeset for `repovio`;
   generated version-release output MUST NOT gain Changesets. Push requested commits to the branch's configured remote
   unless the user requests local-only work or another remote workflow.
6. Preserve Changesets release PRs: publish only after merge, creating a GitHub release/version tag and API/web GHCR
   images with matching exact SemVer and `latest` tags. Release workflow permissions MUST remain limited to
   `contents: write`, `pull-requests: write`, and `packages: write`.

## Governance

This constitution codifies existing project rules for Spec-Kit. It does not authorize new features, provider writes,
toolchain migrations, commits, or changes to implementation order. `PLAN.md` remains the approved product architecture,
`AGENTS.md` governs agent work, `docs/coding-guidelines.md` supplies detailed engineering procedures, and `GLOSSARY.md`
defines domain terminology. Explicit user instructions take precedence, including the documentation format and
exemptions above. Remaining source discrepancies MUST be surfaced rather than silently resolved by modifying code,
checkers, or source documents.

Specifications, plans, task lists, and reviews MUST check applicable principles and quality gates. Conflicts MUST be
resolved before implementation; feature artifacts MUST NOT silently waive provider read-only behavior, authorization,
secret protection, or verification requirements.

Amendments MUST identify changed principles, rationale, affected artifacts, compatibility impact, and migration or
follow-up work. Changes outside existing authority require explicit user approval. Keep source rules consistent within
authorized scope; dependent templates and commands read this constitution at runtime and MUST NOT be rewritten merely
to duplicate it. Include a temporary Sync Impact Report for amendment review and remove it before committing.

Version this constitution independently from the application: MAJOR for incompatible principle removals/redefinitions,
MINOR for new principles or materially expanded guidance, PATCH for non-semantic clarifications. Update the last-amended
date for amendments and preserve the original ratification date. Version 1.0.0 is the first adoption; the previous file
contained only an unratified template.

**Version**: 1.0.0 | **Ratified**: 2026-11-08 | **Last Amended**: 2026-11-08
