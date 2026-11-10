# Verification: Provider Account Actions and Webhook Setup

## T001 and T002: Setup and foundation

- Implementation approved on 2026-11-10 for issue #89; existing worktree and branch reused at planning commit ea4d969.
- Spec Kit resolves feature 009 with tasks and all 16 requirements checklist items checked.
- Node.js 26.13.0 and Corepack pnpm 11.28.9 verified. Frozen offline installation succeeded without lockfile changes.
- Existing ignore rules cover dependencies, generated clients, build/test/browser output and local Graphify metadata.
- Baseline callback uses server PUBLIC_URL and database UUID. Existing primary key accepts explicit UUID insertion;
  administrator/account authorization and insertion-only uniqueness constraints remain the implementation seams.
- Local disposable PostgreSQL container repovio-89-test uses loopback port 15891 and database repovio_test.
- Prisma client generation requires DATABASE_URL and SHADOW_DATABASE_URL; supplied only synthetic local test values.
- Nested package scripts discover a global pnpm 10; use an isolated PATH shim forwarding to Corepack pnpm 11.28.9.
- Local Nuxt dev server on port 3091; Playwright Chromium available. First cold-start browser attempt timed out before
  navigation; rerun after startup separates initialization delay from feature failures.
- T003 test changed first to require the missing account action trigger; failing output retained in local test artifacts.

Application/API acceptance results and task commits are recorded below as implementation progresses.

## T003: Provider account action menu

- Red test confirmed the old row exposed three buttons instead of one.
- Six provider/webhook browser scenarios passed; additional all-provider capability/pending scenario passed.
- Nuxt web typecheck, focused ESLint, and documentation coverage passed.
- Browser regression found modal dismissal lost row focus; menu now restores live trigger focus before opening modal.
- Inspected provider-account-actions.png: compact labeled entries and separated destructive Delete.
- API baseline: 18 real PostgreSQL integration tests passed with synthetic authentication and provider adapters.
- Added action labels across existing supported locales to preserve language parity.

## T004: Stateless canonical callback API

- New tests first failed with missing draft route (404); after implementation all 20 PostgreSQL integration tests passed.
- All 20 shared-schema tests passed, including strict optional UUID and legacy input compatibility.
- Real Fastify validation/serialization and generated OpenAPI tested; authentication is synthetic, database/signatures real.
- Preview has no-store, canonical PUBLIC_URL, no record creation and no provider requests. Unsaved callbacks reject delivery.
- Cross-account UUID collision returns 409 without changing original secret/owner. Existing create without ID still works.
- Transport inspection corrected the design example: wire JSON is unwrapped; Axios supplies the client response.data.
- T003 published as cf55ace; T001/T002 evidence and T003 accepted before advancing.

## T005: Pre-save URL and session lifecycle

- Six asynchronous composable tests cover independent load failures/retry, stale responses, late mutations, exact-ID
  recovery, explicit collision rejection, full recovery pending state and duplicate blocking. All passed.
- All 135 web tests passed, including locale key/message validation for all 17 catalogs.
- Seven provider/webhook Playwright scenarios passed, including pre-save clipboard output, create/retry/rotate/remove,
  English desktop and German mobile, stable canonical hostname, denied clipboard and plaintext reset.
- Web typecheck, focused ESLint and documentation coverage passed.
- Browser rerun after source generation passed; do not run Nuxt/schema preparation concurrently with live browser tests
  because HMR can detach active controls.
- T004 published as 6b34d36; wire JSON is unwrapped consistently with current API clients.

## T006: Setup and saved-configuration layout

- Red layout assertion confirmed callback previously appeared below namespace. New order places callback first.
- Extracted the saved list into organization-webhook-configurations.vue; setup and saved metadata have distinct sections.
- Eleven provider/webhook browser tests passed across EN/DE at 1102×1134 and 390×844.
- Four additional recovery/selection scenarios passed with ten saved hooks, long callbacks, viewport bounds and no
  horizontal dialog overflow; rotation/removal, copy denial and keyboard focus still work.
- Inspected English desktop and German mobile screenshots: setup URL immediately visible, compact neutral instructions,
  saved configuration section below the form, bounded vertical scrolling.
- All 135 web tests and 21 guideline regression tests passed; web typecheck, focused ESLint and documentation checks passed.
- T005 published as 64ebf08. All shipped locales have the saved-section label.
