# Validation Guide: Global Auto Refresh

## Prerequisites

Use Node.js 26.13.0 and pnpm 11.28.9. Install dependencies with `corepack pnpm install --frozen-lockfile` if absent.
Use synthetic authenticated API and socket fixtures from the existing web E2E suite. Do not depend on production credentials,
real providers, or production timing. Start the local web app with `corepack pnpm --dir apps/web dev` and use the existing
Playwright configuration/base URL conventions.

This is a future implementation validation guide. The tests named below must be authored during implementation; none are
claimed to exist or pass yet.

## Focused automated proof

1. Add fake-clock scheduler tests for default/options, invalid/inaccessible storage, settings changes, disposal,
   activation, visibility/offline suspension, one catch-up, slow requests, rejected requests, and simultaneous triggers.
2. Test target adapters with delayed list and summary promises. Assert manual/automatic/sync paths share completion,
   no overlapping initial/query reads, state preservation, and stale-response protection on route/resource changes.
3. Add a fixture-based browser suite `apps/web/tests/e2e/auto-refresh.spec.ts`, covering all nine routes and active embedded
   repository tabs. Count API requests with browser clock control; do not use long wall-clock sleeps.
4. Verify 15-second default, 30-second change, persistence on reload/navigation, Off for five simulated minutes,
   unsupported routes, no provider/sync POSTs, hidden/offline pause, catch-up, and retry after failure.
5. Verify complete manual loading while one summary is delayed; preserve filters, sort, page, search, columns, dashboard
   period, fixed repository scope, and alert category. Retain existing page recovery after rows disappear.
6. Exercise English/German at 390 px and 1440 px in light/dark themes. Capture and inspect navbar popover, representative
   toolbars, and pending controls; assert matching manual button styles on all nine routes, accessible names/tooltips,
   keyboard focus, Escape/focus return, and no new horizontal overflow.

## Affected checks

Run the new focused Vitest files directly using the repository's prepared Nuxt environment first, then:

```sh
corepack pnpm --dir apps/web test
corepack pnpm --dir apps/web lint
corepack pnpm --dir apps/web typecheck
corepack pnpm --dir apps/web build
corepack pnpm --dir apps/web e2e tests/e2e/auto-refresh.spec.ts
corepack pnpm documentation:check
corepack pnpm test:guidelines
corepack pnpm format:check
git diff --check
```

Run existing affected workflow-run, work-item, security-alert, dashboard, repository-tab, toolbar, and localization browser
regressions as identified by the implementation diff. Preserve query and authorization assertions. Update AST Graphify
with `graphify update .` after source changes and inspect node/edge summaries. Each future substantive implementation
commit needs exactly one focused `repovio` Changeset and explicit commit authority.

Record actual commands, results, screenshot paths, and limitations in feature evidence during implementation. Mocked browser
requests prove UI integration, not live provider synchronization or deployment.
