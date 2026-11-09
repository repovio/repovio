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

## Execution Evidence (2026-11-09)

**Implementation**: `4e55316b8172cb1cfdd6306cb4b9e27aac46eb1a` on `codex/71-organization-webhook-callback`, issue #71.

**Fixture**: `/admin/providers`, synthetic administrator/viewer and mocked provider-account/organization-webhook responses.
The real Nuxt UI, typed API client/composable, form validation, and Chromium interactions ran against the local dev server.
Backend persistence, server authorization, and real provider delivery were not exercised by these browser fixtures.

**Baseline**: Before implementation, the new form-scoped assertion failed with Callback URL textbox count 0, expected 1.

**Result**: All five tests passed in 25.3 seconds. The local server used port 3071 to avoid conflicting with other
development sessions:

```sh
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3071 corepack pnpm --dir apps/web e2e tests/e2e/organization-webhooks.spec.ts
```

| Acceptance     | Observed result                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| FR-001, SC-001 | Exactly one readonly callback input inside each new/saved/selected form; no required attribute                |
| FR-002         | Empty unsaved value, localized help, disabled copy; creation pending/failure never invents an address         |
| FR-003, SC-002 | Exact server URL copied for newly created and two selected configurations; public hostname retained           |
| FR-004, SC-003 | Add another, close/reopen, and successful removal restore empty/help/disabled-copy state                      |
| FR-005         | Card callbacks, rotation, repository inheritance, and repository fallback remain working                      |
| FR-006, SC-004 | EN/1440px and DE/390px; keyboard tab/enter copy, focus return, and long URL without container overflow        |
| FR-007         | Retryable drafts survive errors; viewer gating, pending controls, secret handling, and DTO payloads preserved |

Screenshots inspected in the ignored `apps/web/test-results/` output, within the scenario directories:

- `organization-callback-empty-en.png` and `organization-callback-empty-de.png`: field/help layout before saving.
- `organization-dialog-en.png` and `organization-dialog-de.png`: populated callback inside the form and existing card.
- `organization-callback-long-en.png` and `organization-callback-long-de.png`: long public URL fits the input/container.

Actual clipboard write values were recorded with a deterministic browser stub; denied writes produced existing localized
feedback. Five expected mutation calls covered failed/successful creation, failed/successful rotation, and removal;
copying introduced no mutations. No unexpected browser runtime exceptions occurred.

Additional passing checks: web lint, focused test-file ESLint, web typecheck, documentation coverage (674 source files),
repository canonical format check, stable two-pass changed-file formatting, Changeset status, and `git diff --check`.
The single new release entry requests a `repovio` patch; pre-existing unrelated Changesets were preserved.

The environment's global pnpm was 10.33.0. Nested package scripts used the pinned pnpm after creating a temporary shim
with `corepack enable --install-directory /tmp/repovio-71-toolchain pnpm` and prepending that directory to PATH. No
manifest, lockfile, compiler alias, or version range changed.

The staged-source graph hook passed; its existing SQL parser warning remains because `tree_sitter_sql` is unavailable.
No SQL changed, and no full semantic rebuild was run. Live provider delivery, Docker behavior, and remote CI were not
verified locally. No release, deployment, or merge was performed.
