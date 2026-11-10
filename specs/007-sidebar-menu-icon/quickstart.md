# Validation Guide: Sidebar Menu Icon

This guide validates the local implementation. Results are recorded in [evidence.md](evidence.md).

## Prerequisites

- Node.js 26.13.0 and pnpm 11.28.9, existing workspace dependencies installed.
- A web dev server serving the implementation checkout; do not assume an existing localhost server uses this worktree.
- Existing Playwright mocked application fixtures or a working authenticated local session.

## Focused Checks

1. Extend `apps/web/tests/e2e/page-layout.spec.ts` with the [UI contract](contracts/ui.md).
2. Verify the open button contains `i-tabler:menu-2` and has a nonempty computed icon mask/background; a class alone
   does not prove the icon rendered. Block external icon services using the existing bundled-icon test pattern.
3. At 982 × 1134 and 390 × 844, capture the closed sidebar and visually inspect three lines. Open with pointer and
   keyboard, dismiss, and confirm the current route remains unchanged.
4. Repeat English/German and light/dark checks. At 1440 × 900 verify desktop collapse/expand remains functional.
5. Save screenshots in ignored test output; record actual results during implementation.

## Commands

From the repository root, after starting the implementation checkout's web server:

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm --filter @repovio/schemas build
corepack pnpm --dir apps/web exec nuxt dev --host 127.0.0.1 --port 3107
```

In another terminal, point Playwright at that server:

```sh
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3107 corepack pnpm --dir apps/web e2e tests/e2e/page-layout.spec.ts
corepack pnpm --dir apps/web lint
corepack pnpm --filter @repovio/schemas build
corepack pnpm --dir apps/web exec nuxt typecheck
corepack pnpm format:check
corepack pnpm documentation:check
git diff --check
```

Use a separate port if 3000 is occupied. Expected result: visible bundled three-line icon, working navigation, no
external icon fetch, and all affected checks passing. See [data-model.md](data-model.md) for preserved state boundaries.

## Local Environment

Node.js 26.13.0 and Corepack pnpm 11.28.9 were verified in this worktree. Dependencies were installed with the frozen
lockfile. The validation server was started from this checkout at `http://127.0.0.1:3107`; the existing server on port
3000 was left untouched. The nested bare `pnpm` in the web typecheck script resolves to global pnpm 10.33.0 here, so
the commands above invoke the same schema build and Nuxt typecheck explicitly through Corepack.
