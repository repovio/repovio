# PWA Validation Guide

These steps validate a future implementation; they were not executed as part of planning.

## Prerequisites

Use Node.js 26.13.0 and pnpm 11.28.9. Install dependencies from the committed lockfile. Use a disposable API/database and
fixture users with different repository permissions for authenticated tests. Never use production tokens or records.
For device installation, expose a controlled HTTPS origin reachable by the device; localhost is sufficient for the
existing desktop automated suite. OIDC checks require a test identity provider with the exact callback origin allowed.

## Automated Baseline

From the repository root:

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm exec playwright install chromium
corepack pnpm --dir apps/web e2e:pwa
```

The existing command builds production assets and starts default and custom-brand servers on ports 3310 and 3311.
Expected baseline: manifest/icons/cache assertions, controlled update cycle, runtime branding, and invalid startup
checks pass. Do not run a second suite against the same `.output` directory while tests mutate the worker file.

Extend this suite according to [acceptance contracts](contracts/pwa.md). Mock sensitive API responses for deterministic
cache tests; separately run authenticated end-to-end cases against the disposable API. Record registration failure,
activation rejection/retry, Later, multiple tabs, repeated updates, logout, account switching, and reconnection.

## Device and Browser Checks

1. Install through native browser controls on desktop Chromium and Android Chromium, and Add to Home Screen on iOS
   Safari. Record OS/browser versions, HTTPS origin, installation method, and actual standalone launch.
2. Verify default/custom icons and names, root launch, authenticated deep links, local login, and configured OIDC login.
   Existing installations may need browser metadata refresh or reinstallation to show branding changes.
3. Exercise the update prompt in English and German at 390 and 1440 CSS pixels, using keyboard navigation as applicable.
   Capture and visually inspect screenshots for changed UI, including the failure state.
4. Disable networking, inspect Cache Storage, and verify the documented unsupported cold offline launch. Reconnect and
   verify new authorized requests. Confirm no API response was retrieved from a service-worker cache.

Mark unavailable platforms and OIDC setup as unverified. Do not substitute Chromium emulation for real iOS evidence.

## Affected Checks After Implementation

```sh
corepack pnpm --dir apps/web test
corepack pnpm --dir apps/web typecheck
corepack pnpm --dir apps/web lint
corepack pnpm documentation:check
corepack pnpm format:check
corepack pnpm branding:check
```

`e2e:pwa` already includes the web production build. Broaden checks only if implementation touches additional projects.
Inspect `git status`, relevant diffs, and `git diff --check` before checks and delivery. A substantive requested
implementation commit needs exactly one focused `repovio` Changeset; planning documents alone do not change behavior.

## Disposable Authentication Fixtures

`tests/pwa/helpers.ts` supplies synthetic Alice/Bob sessions for deterministic browser coverage. These responses are
explicit mocks and do not prove server authorization. For real integration, start a new disposable PostgreSQL database,
apply committed migrations, and start the API with `SCHEDULER_ENABLED=false` and unique test JWT/encryption keys. Create
fixture users and repository memberships only in that database. Point a separate web process at its API using
`NUXT_PUBLIC_API_BASE_URL`; do not repoint a shared deployment. Observe sign-in, logout, permitted and denied reads,
Cache Storage, and reconnection using the production service worker.

For OIDC, configure a dedicated test issuer/client and exact callback URL, using a controlled HTTPS origin reachable by
the test device. Verify the real redirect and callback in standalone mode. No device or issuer access means that evidence
remains unverified; mocks and mobile viewport emulation cannot replace it.
