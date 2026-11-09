# Validation: Workflow Lifecycle Awareness

Use Node.js 26.13.0 and pnpm 11.28.9. Install with pnpm install --frozen-lockfile. Read docs/coding-guidelines.md.

## Focused checks

- Generate and validate the Prisma client/schema using apps/api scripts and explicitly selected local database URLs.
- Run provider adapter, synchronization, workflow query, DTO/controller, dashboard, system-status, and MCP tests.
- Run PostgreSQL authorization integration tests only against a task-created disposable database.
- Validate both clean migration and upgrade from the previous schema; verify run 42027893756 remains FAILED with its
  original duration and the new Workflow defaults to UNKNOWN with null check/raw state.
- Run apps/web/tests/e2e/needs-attention.spec.ts against a local web server; use mocked application resources and no
  production browser state. Check English/German badges, timestamps, retained FAILED outcomes, and responsive controls.

## Final checks

Run pnpm documentation:check, pnpm format:check, pnpm lint, pnpm typecheck, affected tests, pnpm build, the offline OpenAPI
export test, git diff --check, and the staged Graphify hook. Update issue/task records with actual commit SHAs and results.

## Commit and rollout boundaries

Validate and commit one task at a time, with one focused repovio Changeset per substantive implementation commit, then
push to the issue-linked branch. No provider writes, automatic merge, release, production migration, or deployment.
