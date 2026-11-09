# Quickstart and Acceptance: Organization Webhooks

## Local verification

Use Node.js 26.13.0 and pnpm 11.28.9. Install the pinned workspace dependencies and generate the Prisma client. Point
`DATABASE_URL` and `SHADOW_DATABASE_URL` only at disposable PostgreSQL databases; integration cleanup requires a database
name ending in `_test`. Apply migrations there before running database-backed tests.

```sh
pnpm --dir apps/api db:generate
pnpm --dir apps/api db:migrate:deploy
pnpm --dir apps/api test --testPathPatterns=organization-webhooks
pnpm --dir libs/schemas test
pnpm --dir apps/web test
pnpm format:check
pnpm documentation:check
pnpm lint
pnpm typecheck
pnpm --dir apps/api build
pnpm --dir apps/web build
node --test scripts/check-openapi-export.test.mjs
```

Run `organization-webhooks.spec.ts` against a running production web build using `PLAYWRIGHT_BASE_URL`. Avoid sharing a
Nuxt build directory between active development and production builds. Inspect English/desktop and German/mobile screenshots.

## Manual acceptance

1. As a System Administrator, open Provider accounts and choose Organization webhooks on one connection.
2. Add an organization or GitLab full group path, generate a secret, save, and copy URL/secret into provider settings.
3. Verify two matching tracked repositories inherit the blue Organization badge without individual secret setup.
4. Verify a repository in another organization/connection is unaffected. For GitLab, include a descendant and prefix collision.
5. Send a test delivery, reopen management, and inspect its accepted-delivery timestamp.
6. Rotate the secret and update the provider. Old-secret deliveries must fail; current-secret deliveries must succeed.
7. Remove local organization configuration and verify existing repository-specific configuration returns.
8. Verify viewers cannot administer hooks and GitHub App delivery remains unchanged.

Provider registration and production deployment require separate operational execution; no live provider test is claimed.
