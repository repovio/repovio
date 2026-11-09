# Validation Guide: Consistent Table Toolbars

These steps validate a future implementation. They have not been executed as runtime acceptance during planning.

## Prerequisites

- Node.js 26.13.0, Corepack pnpm 11.28.9, installed workspace dependencies and Playwright Chromium.
- Use the local web application with the existing E2E API fixtures; no production credentials are needed.
- Start the web application in another terminal from the repository root:

```sh
corepack pnpm --dir apps/web dev
```

The existing Playwright configuration defaults to `http://[::1]:3000`; set `PLAYWRIGHT_BASE_URL` when needed.

## Focused browser checks

```sh
corepack pnpm --dir apps/web e2e tests/e2e/page-layout.spec.ts tests/e2e/work-items.spec.ts tests/e2e/security-alerts.spec.ts tests/e2e/user-groups.spec.ts
corepack pnpm --dir apps/web e2e tests/e2e/repository-detail.spec.ts tests/e2e/repository-navigation.spec.ts
```

Extend those suites during implementation before treating their success as proof of this feature.

1. Visit all six routes in [contracts/ui.md](contracts/ui.md), using mocked authenticated resources and deterministic data.
2. At 1065 × 1134, compare visible controls with Workflow runs. Check one merged group header and capture screenshots.
3. Repeat bounds/reachability checks at 390 × 844 and 1440 × 900. Page width must not exceed viewport width;
   table-specific scrolling is allowed. Include English/German and light/dark screenshots.
4. Open filtering and exercise labels, path, and date bounds. Assert intercepted request predicates against
   [data-model.md](data-model.md), including multiple-label AND and UTC start/end boundaries.
5. Set only a specialized criterion and verify active indication. Close/reopen; verify value preservation.
6. Exercise keyboard opening, tab order, Escape dismissal, focus return, sorting, columns, and pagination.
7. Exercise dashboard preset clearing, repository embedding, empty/loading/error states, unavailable-alert warnings,
   and delayed refresh requests. Check unauthorized scope remains unavailable.
8. On User groups, exercise search, sort, create, rename, membership, and confirmed deletion using existing mocked flows.

## Affected checks

```sh
corepack pnpm nx run web:lint
corepack pnpm nx run web:typecheck
corepack pnpm nx run web:test
corepack pnpm format:check
corepack pnpm documentation:check
corepack pnpm test:guidelines
git diff --check
```

Run canonical formatting twice when formatting changes; confirm the second complete pass is byte-stable.
Run `graphify update .` after code changes and inspect its node/edge summary. No provider, Docker, or deployment
validation is required by this frontend scope; report any behavior that remains unverified.
