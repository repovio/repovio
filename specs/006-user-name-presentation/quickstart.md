# Validation Guide: App-Wide User Name Presentation

This guide validates future implementation. Planning has not changed product code or browser behavior.

## Prerequisites

Use Node.js 26.13.0 and Corepack pnpm 11.28.9 with dependencies installed. Follow existing development setup for the API,
web app, and a disposable local PostgreSQL database, including existing migrations and Prisma generation. No feature
migration is required. Default Playwright URL is `http://[::1]:3000`; override with `PLAYWRIGHT_BASE_URL` when needed.

Seed synthetic authorized local/OIDC Users with complete, first-only, last-only, null, blank, Unicode, duplicate, and
long names. Include more than 100 Users, a later-page target, and an unauthorized candidate. Use no real credentials.

## Focused Checks

Inspect `git status --short` and relevant diffs before each check. Start with helpers and the channel composable:

```sh
corepack pnpm --filter @repovio/web exec vitest run app/utils/user-identity.spec.ts app/composables/app/notification-channel-draft.test.ts
```

Run focused notification schema/API tests through existing package test commands, including authorization integration
tests against the disposable database. Then run the affected Nx targets and required guideline checks:

```sh
corepack pnpm nx run-many -t test,typecheck,lint -p web,api,schemas
corepack pnpm documentation:check
corepack pnpm test:guidelines
corepack pnpm format:check
git diff --check
```

If formatting is needed, use the canonical pipeline only on scoped files and prove its second pass changes no bytes.

## Browser Scenarios

With the local stack running, extend existing suites and the relevant repository access scenario:

```sh
corepack pnpm --dir apps/web e2e tests/e2e/user-management.spec.ts tests/e2e/user-groups.spec.ts tests/e2e/notifications.spec.ts
```

1. Open repository membership, group membership, and browser recipient selectors. Expect `Vera Viewer (@viewer)` in open
   options, selected values, and chips. Duplicate names retain different usernames and correct IDs.
2. Search first name, last name, full name, and username. Find later-page Users and recipients beyond the old 100-choice
   cap. Change searches quickly; stale responses must not replace current results or select a different User.
3. Save/reopen selections. Verify exact IDs, roles, name-first rows, summaries, and retained selected labels across pages.
4. Check administration, navigation, password reset/delete text, MCP target description, group removal labels, and delivery
   requester details against [the contract](contracts/user-identity.md). Verify every [inventory row](research.md).
5. Verify all fallback cases in [data-model.md](data-model.md), including deleted requesters and older responses.
6. Update a local profile name, refresh affected screens, and verify new names without assignment changes. OIDC fixtures
   use existing names without provider requests.
7. Repeat English/German with keyboard navigation at desktop and 390-pixel viewport width. Inspect screenshots for name
   priority, clipping, and parenthesized usernames; verify full accessible identity labels.
8. Prove unauthorized Users remain unavailable and API resources contain no credential fields. Credential input fields
   and Provider Actor references remain outside this identity presentation rule.

## Evidence

During implementation, record actual checks/results, tested locales/viewports, per-surface screenshots or browser
assertions, permission fixtures, and concrete environment blockers. Baseline CI is not feature validation. Planning
requires no deployment, release, provider interaction, or remote CI run.
