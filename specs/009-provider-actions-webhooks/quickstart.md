# Validation Guide: Provider Account Actions and Webhook Setup

## Prerequisites

Use Node.js 26.13.0 and Corepack pnpm 11.28.9, installed workspace dependencies, generated Prisma client, and the existing
local development/test setup. Use disposable API fixtures for persistence and signature tests. No production credentials
or provider changes are required. This guide describes future implementation validation; these checks have not run yet.

Read [UI/API contract](contracts/ui-and-api.md) and [state model](data-model.md). Inspect git status and relevant diff
before each command; preserve unrelated work.

## Focused automated checks

```sh
corepack pnpm --filter @repovio/schemas test
corepack pnpm --filter @repovio/api test -- organization-webhooks.integration.spec.ts
corepack pnpm --filter @repovio/web test
corepack pnpm --dir apps/web exec playwright test tests/e2e/providers.spec.ts tests/e2e/organization-webhooks.spec.ts
corepack pnpm format:check
corepack pnpm documentation:check
corepack pnpm lint
corepack pnpm typecheck
```

Use the repository's existing test-server/fixture configuration for Playwright. Verify targeted API selection actually
runs the integration suite; narrow existing runners where needed without changing toolchain/configuration. Format only
in-scope files through the canonical formatter twice and verify byte stability. Do not run release/publish commands.

## API and schema acceptance

- Draft GET: admin success with canonical PUBLIC_URL, fresh UUID, no-store, zero database mutations/provider writes;
  unauthenticated/non-admin/malformed-ID/missing-account cases fail appropriately.
- PUBLIC_URL deliberately differs from browser origin; preview and saved callbacks must retain the canonical hostname.
- POST accepts valid draft ID, preserves it and callback; omitted ID preserves old clients. Reject invalid UUID, unknown
  fields, short secret, invalid namespace and non-GitLab nested paths through existing validation rules.
- Duplicate ID across accounts and duplicate scope return sanitized 409; no overwrite, secret rotation, or metadata leak.
- Listing/rotation/removal stay account-scoped and expose no plaintext or encrypted secret. Existing URLs remain stable.
- Unsaved callback delivery remains rejected. Signed delivery after save uses existing verification/idempotency fixtures.
- Simulate a successful insert with lost response; authorized exact-ID reload recovers saved state without a duplicate.
- Runtime schema, Nest DTO/OpenAPI, typed client, Bruno, and current docs agree on optional input and draft envelope.

## Browser acceptance

Run EN and DE at 1102×1134 and 390×844; capture screenshots for empty setup, populated setup, and open action menu.

1. Verify every provider row has one ellipsis trigger; inspect all applicable entries, conditional OAuth availability,
   Enable/Disable labels, destructive Delete, account targeting, keyboard navigation, Escape, and focus restoration.
2. Delay each existing row operation; trigger stays loading after menu dismissal, duplicates remain blocked, and delete
   confirmation stays functional. Page-level Add Provider and GitHub App controls retain placement.
3. Open Organization Webhooks without saved hooks. Before POST, verify canonical URL visibility and exact clipboard text;
   show unsaved status and manual registration guidance. Opening and closing causes no configuration persistence.
4. Fill namespace, generate/reveal/copy secret, save, and compare callback before/after. Rotate preserves callback and
   requires acknowledgement. Remove retains confirmation; Add Another creates a fresh draft.
5. Independently fail list/draft requests; verify retry and usable unaffected sections. Fail save/validation and deny
   clipboard; confirm localized feedback, stable draft/inputs, and full pending states through awaited refresh work.
6. Dismiss/reopen or switch accounts while requests are delayed. Previous secrets and URLs never reappear from stale
   responses; selecting saved hooks shows only their actual callbacks. Existing stored secrets are never fetched.
7. Populate many hooks and long URLs/group paths. Callback appears before namespace/secret; setup and saved-list headings
   remain distinct, content scrolls vertically within viewport, and controls remain keyboard-accessible without overflow.

## Evidence and completion limits

Record exact commands/results, test counts, fixture scope, screenshots, locale/viewport matrix, and any remaining gaps.
Local intercepted-browser and disposable API tests establish local behavior only. Report real provider registration,
live deployment, and remote GitHub Actions separately; this planning phase performs none of them.
