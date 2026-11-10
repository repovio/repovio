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

## T007: Integrated acceptance

- Root lint passed: all five Nx targets, documentation coverage (701 handwritten files), and 21 guideline regressions.
- Root typecheck passed: five targets. API and web production builds passed.
- Root tests passed: five targets; API 111 suites / 798 tests, web 26 files / 135 tests, schemas 20 tests.
- Initial broad API run inherited the deliberately different PUBLIC_URL from the focused callback test and failed four
  unrelated default-hostname assertions. Rerunning with the standard hostname passed all 798 tests; no source waiver.
- Production web server on loopback port 3092: 15 provider/webhook/GitLab OAuth Playwright cases passed.
- Updated the preexisting GitLab OAuth browser suite to use menu items and the row trigger's full-request loading state;
  conversion, reauthorization, failure/retry, EN/DE and desktop/mobile navigation all passed.
- Focused API contract tests exercise real Fastify/Zod/Swagger transport and PostgreSQL; authentication is synthetic.
- Browser API fixtures are intercepted/synthetic, so no real provider registration or live device behavior is claimed.
- Canonical formatting and diff whitespace checks passed; changed sources converged across two formatter passes.
- No database migration, provider mutation, publish, production deployment, or release-PR change performed.
- Graphify is AST-only; its existing missing SQL parser warning remains a navigation coverage limitation, not API proof.

### Task commits

| Task      | Commit  | Result                                                       |
| --------- | ------- | ------------------------------------------------------------ |
| T001–T003 | cf55ace | Setup/foundation evidence and action menu                    |
| T004      | 6b34d36 | Stateless callback API and backward-compatible optional UUID |
| T005      | 64ebf08 | Pre-save URL, request state and recovery                     |
| T006      | 3e4c07b | Dialog organization and responsive saved-list component      |

### Visual evidence

Nine synthetic screenshots were copied outside the checkout under
`/home/tobiaswaelde/.codex/visualizations/2026/11/10/01a1c52e-c71a-7471-a4c1-dec46f51a06f/provider-actions-webhooks/`:
`provider-account-actions.png`, and `webhook-{setup,saved}-{en,de}-{1102,390}.png`.
These are local review artifacts, not published provider screenshots.
