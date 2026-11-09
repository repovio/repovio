# Quickstart Validation: Notifications Redesign

This guide validates the future implementation. At planning completion, application changes and live push behavior
have not been tested. Refer to [contracts](contracts/notifications.md) and [data model](data-model.md) for semantics.

## Prerequisites

- Node.js 26.13.0 and Corepack pnpm 11.28.9; existing workspace dependencies installed.
- Disposable PostgreSQL database and local API/web configuration from the documented project setup.
- System Administrator plus two non-admin Users with deliberately different Repository access.
- Existing channel fixtures, workflow/issue events, and a production-built PWA served on localhost or HTTPS.
- Valid test VAPID keys configured through existing environment variables for real push verification.
  Keep credentials out of console output, fixtures, screenshots, and commits.

## Focused Checks During Implementation

From the repository root, inspect `git status --short` and the relevant diff before each change or test run.

```sh
node --version
corepack pnpm --version
corepack pnpm --dir apps/api test --testPathPatterns=notifications
corepack pnpm --dir apps/web test
corepack pnpm --filter @repovio/schemas test
```

Start with targeted browser-push unit tests once added, then notification API/web tests. Test shared schemas whenever
new contracts are introduced. Confirm exact focused file arguments against the existing test configuration.

For the additive migration, create a disposable pre-upgrade database, apply migrations, run Prisma generation and
validation, and check that old attempts retain null attribution while new browser attempts carry the correct recipient.
Never reset a shared or production database.

## Toolbar and Wizard Browser Acceptance

Run the existing local API/web stack and use the configured Playwright base URL. Inspect
`apps/web/playwright.config.ts` and `playwright.pwa.config.ts` for local server requirements.

```sh
corepack pnpm --dir apps/web e2e tests/e2e/notifications.spec.ts
corepack pnpm --dir apps/web e2e:pwa
```

- Verify one `data-page-toolbar` on each notification route; no separate duplicate table toolbar. Exercise all Querry
  Kit controls, persisted table state, shortcuts, pagination, history navigation, and non-admin denial.
- Create EMAIL, GOTIFY, NTFY, DISCORD, CUSTOM_APPRISE, and BROWSER_PUSH channels. Advance/back through all four steps,
  verify invalid fields and type changes, review masked values, save once, and inspect the persisted channel.
- Test credential-preserving edit and explicit replacement. Test mixed/non-workflow-only events and preview no-match,
  synchronization, permission, network, retry, and stale-response states. Preview must send no message.
- Verify navbar placement across routes, no page banner, focus behavior, narrow viewport, and English/German labels.
- Keep save/preview/enrollment buttons pending throughout awaited work; failed operations retain recoverable state.

## Push Lifecycle Regression Matrix

| Scenario                                | Required evidence                                                            |
| --------------------------------------- | ---------------------------------------------------------------------------- |
| Fresh worker still installing           | Enable waits for activation; one server registration; no premature subscribe |
| Activation never completes              | Bounded timeout with recovery, no permanent loading                          |
| Permission denied or revoked            | Correct disabled state and browser-settings guidance; no automatic prompt    |
| Push unavailable/insecure/unsupported   | Distinct explanation; personal history still usable                          |
| Local subscription but no server record | Not falsely enabled; explicit enable repairs enrollment                      |
| Registration fails then retries         | No false success or duplicate enrollment                                     |
| Rotated VAPID key                       | Old local subscription replaced through explicit recovery                    |
| Sign-out/account switch                 | Previous User's device registration cleaned up; no ownership reassignment    |
| Cleanup failure                         | Visible retry; explicit sign-out still clears local auth/history state       |
| Expired device returns 404/410          | Sanitized failed attempt survives device deletion; no false DELIVERED        |
| Mixed success and retry                 | Successful devices not resent; failed targets follow bounded retry policy    |

Mock API/browser tests prove state handling, not actual Web Push. Also perform one controlled test with a supported
real browser and the production worker: enroll, trigger the existing channel test explicitly, observe OS notification,
click its safe target, reload, disable, and confirm another test no longer targets that device. Keep sanitized evidence
for worker activation, enrollment, API attempt outcome, display, and click separately. If environmental credentials or
OS capabilities prevent this, report that live push remains unverified instead of declaring the fix complete.

## Personal History Authorization

Create attempts for two recipients, multiple devices, retries, no-device failures, tests, and unrelated Repositories.
Verify at most five unique deliveries in stable newest-first order. Confirm one User's successful device does not make
another User's failed entry DELIVERED. Remove a device and change channel recipients; historical ownership must remain.
Revoke Repository access and reopen the popover; subject/title/URL must disappear. Try unauthenticated access and direct
calls as each role. Pre-upgrade unattributed attempts stay absent; administrative history remains separately restricted.

## Affected Quality Gates

```sh
corepack pnpm format:check
corepack pnpm documentation:check
corepack pnpm test:guidelines
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm --dir apps/api test:openapi
corepack pnpm --dir apps/web build
```

Run the smallest relevant checks first, then affected project targets. New endpoints need synchronized shared schemas,
DTOs, typed client methods, OpenAPI output, Bruno examples, authorization tests, and secret-safe serialization tests.
For implementation source changes run `graphify update .`, inspect node/edge summaries, then `git diff --check`.
No commit, production migration, deployment, or release follows automatically from this plan.

## Recorded Local Results (2026-11-09)

- Environment: existing task worktree `codex/003-notifications-redesign`; Node.js 26.13.0, Corepack pnpm 11.28.9;
  frozen lockfile installation, no dependency or compiler-alias changes.
- PostgreSQL: task-owned `repovio-notifications65-postgres` (`postgres:18-alpine`) on loopback port 56565. All database
  fixture cleanup targeted task-created names ending in `_test`; no existing container/database was reset.
- Migration evidence: baseline migrations applied, a legacy attempt inserted before recipient attribution remained
  null afterward; full clean migration path and upgrade corrections passed. Integration tests cover old writers,
  distinct retired device/User targets, legacy stable-key backfill idempotence, preserved duplicate protection,
  five-entry recipient grouping, live access revocation, and query planning.
- Root `pnpm lint`, `pnpm typecheck`, and `pnpm test` passed. Focused schema, browser lifecycle, draft, auth, personal
  history, HTTP validation/serialization, and real PostgreSQL tests passed. API and production web builds succeeded.
- Generated development OpenAPI at `/tmp/repovio65-openapi.json` includes both endpoints and their success/error
  responses. Bruno examples use an endpoint secret variable and inherited authentication; released archives are intact.
- Production browser notification suite: **12/12 passed**, covering all six transports, English/German destination
  validation and save lifetime, consolidated toolbars/history navigation, viewer denial, and private navbar states.
- Production PWA suite: **3/3 passed**, including actual browser notification display/metadata from synthetic push,
  notification closure, safe URL fallback, malformed JSON, and the preexisting worker/installability checks.
- Screenshots in `apps/web/test-results/` were visually inspected at desktop English and mobile German widths. Final
  screenshots disable animations; the navbar popover is opaque/readable and the expanded review remains scrollable.
- Canonical formatting converged over two passes; documentation and API TSDoc checks passed. Final Graphify sources and
  whitespace checks are tracked in tasks.md. No commit, remote CI run, Docker image build, deployment, or release was
  performed; the PostgreSQL test container alone is not an application-image verification.

### Remaining Live Acceptance

The controlled real-browser attempt used an active production worker and granted permission. Actual enrollment failed
with `AbortError: Registration failed - permission denied`, so no real Web Push send or receipt was verified.
The synthetic worker test proves handler behavior but does not replace network delivery. A physical OS click and its
focus/open behavior also remain unverified because synthetic worker clicks lack a trusted user gesture.

T017 and T047 remain unchecked for these acceptance requirements. To finish them, use a supported real browser/OS with
working push-service enrollment, configure matching test VAPID keys, explicitly enroll and send a test, observe display,
click the OS notification, disable the device, and verify subsequent targeting stops. Record each stage separately;
do not infer human receipt from push-service acceptance.

### Rollout and Rollback

Apply the notification recipient, stable-target, legacy-target backfill, and live-device uniqueness migrations before
starting the updated API. Avoid mixed-version notification workers during the rollout; preserved legacy write shapes
are a compatibility measure, not a reason to run competing delivery workers. Existing historical attempts without
recipient attribution remain absent from personal history. Application rollback can leave nullable fields/indexes
in place; do not drop those fields while new code still reads them. No production execution occurred in this task.

## PR Preparation Revalidation (2026-11-09)

The user requested another test run and a PR. The task branch was fast-forwarded to `b2d2390` (`main`, PR #66) with
all notification changes preserved and restored. The current PWA fixture isolation and worker-update checks are included.

- Fresh task-owned PostgreSQL container `repovio-notifications65-retest`, loopback port 56565, database `repovio65_test`:
  all migrations applied from an empty database; all **733 API tests** passed, including **10 migration integration tests**.
- Root tests ran with `--skip-nx-cache`; every API, web, schema, and website test target passed on the updated base.
- Root lint, documentation, guideline regressions, typecheck, canonical formatting, production web build, and API/OpenAPI
  build and export checks passed again.
- The expanded production PWA suite passed **18/18**, including runtime branding, connectivity/cache isolation,
  update lifecycle, and the notification handler regressions.
- Production notifications, dashboard, and responsive page-layout browser checks passed **30/30**.
- The PR is prepared as a draft because T017 and T047 still require real network-push receipt and a trusted physical
  OS notification click. Earlier synthetic tests and the prior failed real enrollment attempt do not close those gates.
- The preexisting implementation was intentionally left uncommitted until this PR request under AGENTS.md. Delivery
  records the already validated planning and coherent implementation without reconstructing artificial task history.

### Repeated Real-Push Probe

A fresh persistent Chromium profile reached an active production worker with notification permission granted and
obtained a real push subscription once. The isolated sender then failed with `AggregateError`; no network receipt was
observed. Another fresh-profile attempt failed during enrollment. Subscription endpoints, keys, and VAPID private
material were kept in memory and were not logged; both temporary profiles were unsubscribed/closed and removed.
This improves the enrollment evidence but does not close T017 or the physical OS-click gate in T047.
