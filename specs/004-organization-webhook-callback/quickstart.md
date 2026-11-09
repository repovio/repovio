# Validation Guide: Organization Webhook Callback Field

## Prerequisites

Use Node.js 26.13.0 and Corepack pnpm 11.28.9, installed workspace dependencies, and the existing Chromium Playwright setup.
Run commands from the repository root. This guide applies after implementation; planning alone does not satisfy these checks.
No live provider credentials or production deployment are required for synthetic browser coverage.

## Focused browser check

Start the existing web development server in a separate terminal:

```sh
corepack pnpm --dir apps/web dev
```

Run the focused suite against its default `http://[::1]:3000` address:

```sh
corepack pnpm --dir apps/web e2e tests/e2e/organization-webhooks.spec.ts
```

The suite mocks API responses. Extend it to cover the [UI contract](contracts/ui.md):

1. EN/1440px and DE/390px: new form shows an empty read-only field, localized pre-save help, and disabled copy.
2. Pending and failed creation: no usable callback appears; loading and retry behavior remain correct.
3. Successful creation: form displays the exact response URL, including a public hostname different from browser origin.
4. Copy with a deterministic clipboard stub: exact URL copied; denied clipboard writes show existing error feedback.
5. Select between two saved configurations and rotate a secret: each form value matches its selected configuration.
6. Add another, close/reopen, and successful removal: previous selection's URL disappears from the form.
7. Capture and inspect empty/saved desktop and mobile screenshots; include a long callback and verify no horizontal overflow.
8. Preserve administrator/viewer gating, existing callback cards, secret handling, and repository inheritance checks.

Use accessible callback labels scoped to the form, not `input[readonly].first()`.

## Affected checks

```sh
corepack pnpm --dir apps/web lint
corepack pnpm --dir apps/web typecheck
corepack pnpm documentation:check
corepack pnpm format:check
git diff --check
```

Expected: focused browser scenarios, lint, types, documentation, formatting, and whitespace checks pass. Confirm create and
rotation payloads still omit `callbackUrl`. Record screenshots and disclose any unverified live-provider or browser behavior.
