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
