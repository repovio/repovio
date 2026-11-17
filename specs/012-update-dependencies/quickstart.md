# Verify Dependency Updates

1. Use Node.js 26.13.0 and Corepack pnpm 11.28.9. Run `corepack pnpm install --frozen-lockfile` in a clean checkout.
2. Build schemas with `corepack pnpm --filter @repovio/schemas build`. Run `corepack pnpm test:dependencies` and inspect
   Nuxt, Nuxt Schema, Nitro, and node-forge versions in the lockfile.
3. Run `corepack pnpm format:check`, `corepack pnpm lint`, `corepack pnpm typecheck`, and `corepack pnpm test`.
4. Build API, web, and website. Exercise the API build, production web browser flows, and website server rendering.
5. Check current required CI on each merge candidate and verify the reported Dependabot PR states on GitHub.
6. For each major migration, run its acceptance checks in the [implementation plan](plan.md) before combining groups.
