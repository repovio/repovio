# Notification Setup Follow-up Evidence

## Authorization and baseline (T001)

- Issue #90; branch `codex/90-notification-setup-polish`, based on `01dd05c`; planning commit `ee95b3b`.
- User approved implementation of T001–T007 with separate task commits and pushes on 2026-11-10. No merge or deployment.
- Requirements checklist: 14/14 checked; no extension hooks. Existing ignore files cover generated artifacts and secrets.
- Node.js 26.13.0; pnpm 11.28.9. Frozen-lockfile install succeeded without tracked dependency changes. A temporary
  Corepack shim fixes nested scripts finding global pnpm 10.33.0; repository toolchain remains unchanged.
- Baseline push and draft unit tests: 16 passed across two files.
- Baseline notification browser suite: 19/20 passed. Initial cold-development-server navigation lookup timed out;
  immediate focused rerun passed (1/1). No source changes preceded these checks; retain this as a startup timing observation.
- Local Nuxt server uses an isolated test port; browser tests use mocked API responses and synthetic identities.
- Static diagnosis confirms server availability requires all three VAPID settings; Compose already loads the environment.
  No production configuration or authenticated production status was inspected. Missing production settings are not proven.
- Browser support, permission, and enrollment describe this device; they do not define global channel readiness.
- Existing code exposes only an availability boolean to the dialog. Pending/failure/unconfigured states are ambiguous.
- Application tests and configuration unchanged by T001. This evidence-only task needs no package Changeset.

## Server readiness (T002)

- Three added regressions failed before implementation; 19 focused push/draft tests pass after the change.
- Added explicit readiness/read-pending state, cancellation, retry and stale-account/read protection.
- Successful server status survives device inspection failure; passive inspection does not prompt or register.
- Focused ESLint and repository documentation checks passed. Web typecheck caught a narrowed local stage type;
  an explicit union corrected it before commit.
- Final web typecheck passed.

## Availability explanation and retry (T003)

- Added English/German browser regressions failed before the change; after implementation 3 focused browser scenarios
  pass, including Browser push setup without local push support and the existing channel-creation journey.
- 29 push/draft/catalog unit tests passed; web typecheck, focused ESLint, and documentation coverage passed.
- All 17 shipped catalogs include the three new messages, preserving required catalog parity. English/German are
  explicitly covered by browser tests. Existing Browser push channel recipients survive unavailable server state.
- Each dialog open checks readiness; retry shows loading for its full request; close invalidates pending results.
- After extending imported Vue prop types, the local development server needed a restart to refresh compiled props.
  A fixture used an invalid recipient UUID initially; corrected to the existing synthetic UUID convention.

## Controlled Stepper (T004)

- New navigation regression failed before implementation; 21 push/draft tests pass afterward.
- Four focused browser scenarios passed: full channel journey, English/German field validation, and pointer/keyboard
  Stepper requests. Web typecheck, focused ESLint, and documentation check passed.
- Inspected the German 390x844 review screenshot: four labeled indicators fit without horizontal overflow.
  Screenshot: `apps/web/test-results/notifications-validates-no-3eac9-before-save-and-preview-de--chromium/notification-review-de.png`.
- Explicit values 0–3 use a controlled Stepper with application validation; future jumps and all pending navigation
  paths are guarded. Back preserves draft values. Footer relocation follows in T005.

## Modal footer and save recovery (T005)

- Footer browser regressions failed before implementation. All six transport creation scenarios pass after the move;
  English/German deferred-write and deferred-refresh checks pass with exactly one write and two refresh attempts.
- Browser coverage exposed swallowed Query Kit refresh errors. The page now propagates its table error to the existing
  persisted-save recovery path. Retry performs only a list read, never another channel write.
- 22 push/draft unit tests pass, including a failed persistence retry. Typecheck, focused ESLint and documentation passed.
- During one development browser run, a concurrent Nuxt typecheck refreshed templates and detached a control.
  The isolated English/German rerun passed (2/2); final browser validation must not run alongside Nuxt preparation.
- Inspected German 390x844 and English 1102x1134 screenshots: separate modal footer stays reachable, all four steps fit.
  Files are `notification-footer-{locale}-{width}.png` in each footer test's local Playwright output directory.
- Save invokes the existing form instance's validated `submit()`; modal dismissal/close and navigation are blocked
  while persistence/refresh is awaited. Unit tests retain duplicate prevention and refresh-only recovery.

## Delivery history icon (T006)

- Both new icon-only assertions failed before the change. Six English/German history/role browser cases pass afterward.
- History retains its route and administrator guard, localized accessible name, hover tooltip, and keyboard activation.
  Empty/error tables keep the action available; Manager and Viewer history restrictions remain covered.
- Focused ESLint, documentation coverage, and web typecheck passed. Inspected the German toolbar screenshot: compact
  history icon is visible beside Add channel, without a text label. Existing translations were reused.

## Final acceptance and pending-control correction (T007)

- Scope review found a remaining retry lifetime defect: successful server status hid the control before passive device
  inspection finished. A deterministic production-browser regression failed before correction and passed afterward.
  The control now remains visible/loading through the entire awaited operation. This scoped correction has one focused
  `repovio` Changeset, `.changeset/notification-push-pending.md`.
- Complete web suite: **135 tests passed in 25 files**. Web lint and typecheck passed.
- Production Nuxt build passed; the complete notification Chromium suite passed **26/26** against that build in 37.2 s.
  No Nuxt preparation/typecheck ran concurrently with the production-browser suite.
- Canonical formatting, documentation coverage (699 handwritten files), 21 guideline regression tests, focused browser
  test ESLint, Changesets status, and whitespace checks passed. No version/release commands ran.
- Two additional English/German screenshot scenarios passed after adding captures, without changing application code.
- Inspected production screenshots for Stepper/footer at 390x844 and 1102x1134, English/German, and unconfigured push
  guidance on German mobile. Controls and labels fit; no horizontal clipping observed. History remains icon-only.
- Final browser fixtures cover configured/unconfigured/checking/failure/retry; unsupported devices; mocked granted
  permission with delayed inspection; existing channel recipients; all six transports; invalid input; keyboard/focus;
  deferred persistence/refresh; refresh-only recovery; and administrator/Manager/Viewer route guards.
- Main remains `01dd05c` at final fetch. No API/schema/database/toolchain source changes, provider writes, secret output,
  production configuration changes, merge, release, or deployment occurred.
- Graph updates use AST extraction only. Existing SQL-extractor warnings remain: `tree_sitter_sql` is unavailable.
  This does not affect the changed Vue/TypeScript tests; no dependency installation was added to silence the warning.

### Local screenshot outputs

- Footer: `apps/web/test-results/notifications-keeps-valida-{case}-chromium/notification-footer-{locale}-{width}.png`
  (runner-generated case directory names; four English/German and mobile/desktop captures).
- Validation/review: `notification-validation-{locale}.png` and `notification-review-{locale}.png` under the matching
  notification validation test output directory.
- Push guidance/checking: `apps/web/test-results/push-review/` contains `notification-push-unconfigured-{locale}.png`
  and `notification-push-checking-{locale}.png`. All screenshots use synthetic mocked data and remain untracked.

### Remaining external evidence

Production VAPID configuration and the original deployed availability response were not inspected. Actual device enrollment,
push-service acceptance, native OS notification display, and OS click navigation were not exercised. The browser suite
mocks API responses and one device-inspection/permission boundary; it does not establish live Web Push delivery or server
authorization enforcement. Existing server guards and permission restrictions were retained. These are explicit evidence
limits, not claims of live verification. No external environment is required to prove the scoped state/layout corrections.

## Approved merge preparation (2026-11-10)

- User approved merging PR #93 after successful current-head CI and required review/branch checks.
- The original head `4d546b4` passed both CI and CodeQL workflows. Main advanced to `7349aae` through PR #92,
  producing a hosted graph merge conflict. The configured local union driver merged it without manual conflict edits.
- Merged current main into the feature branch without rewriting completed task commits. Verified every changed locale
  leaf from both branches survived; no unmerged paths or absolute graph source paths remain.
- Revalidation on the combined tree passed: 141 web tests in 26 files, web lint/typecheck, production build,
  26 notification browser cases against that build, canonical formatting, documentation coverage, and whitespace checks.
- This integration commit imports already-merged base work and records verification; it adds no package Changeset.
  Fresh CI must pass for the updated head before the approved squash merge.
