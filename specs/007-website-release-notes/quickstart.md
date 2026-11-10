# Validation Guide: Website Release Notes

This guide defines implementation acceptance. Product implementation is not part of the current planning phase.

## Prerequisites

- Node.js 26.13.0, Corepack pnpm 11.28.9, local dependencies, Chromium, Docker for container acceptance.
- Run from the repository root. No application database or provider token is needed.
- Inspect `git status --short` and the relevant diff before checks. Preserve unrelated work.

## Focused checks after implementation

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm --filter @repovio/website exec vitest run tests/unit/release-notes.test.ts
corepack pnpm --filter @repovio/website docs:test
corepack pnpm --filter @repovio/website docs:check
corepack pnpm --filter @repovio/website lint
corepack pnpm --filter @repovio/website typecheck
corepack pnpm --filter @repovio/website test
corepack pnpm --filter @repovio/website build
corepack pnpm --filter @repovio/website exec playwright install chromium
corepack pnpm --filter @repovio/website test:e2e
```

The release-notes unit test path is a planned artifact. It must cover exact canonical source inclusion, full multiline
Markdown preservation, semantic descending release order, duplicate-heading rejection, no invented dates, valid-empty
history behavior, missing-source validation, and localized navigation. Existing browser suite checks preserve other tabs.

## Browser acceptance

1. Start from current and archived handbook pages. Release Notes follows existing tabs; current handbook shows all four.
2. Open `/docs/release-notes` and `/de/docs/release-notes` directly. Both return history without handbook redirects.
3. Compare first and last release headings and full multiline migration text against root `CHANGELOG.md`.
4. Follow release TOC links, reload their fragments, and switch language. Confirm active tab and stable heading targets.
5. Confirm history has no handbook selector. Return to Guides and verify its selector still works.
6. Check translated chrome for every supported locale. Inspect one RTL locale with English body language markup.
7. Capture screenshots at 375 px and 1440 px in light/dark themes for EN, DE, and one RTL locale. Check overflow, wrapping,
   sticky offsets, heading hierarchy, TOC, focus visibility, and keyboard navigation.
8. In isolated fixtures, verify valid empty history and invalid/missing source behavior. Restore fixtures before all other
   checks; never edit a shared canonical changelog to exercise failure scenarios.
9. Confirm sitemap history URL count equals supported locale count and metadata follows locale changes.
10. Inspect network requests: no GitHub/release-service call while reading history.

## Container acceptance

```sh
docker build -f apps/website/Dockerfile -t repovio-website:local .
corepack pnpm --filter @repovio/website test:container
```

The image must build from a clean checkout with root changelog available, serve history from its immutable content dump,
and work under the existing read-only container validation. Extend the focused container assertions to include history.

## Repository checks

```sh
corepack pnpm format:check
corepack pnpm documentation:check
git diff --check
```

Run canonical formatting twice if formatting writes occur; the second pass must be unchanged. After implementation code
changes run `graphify update .` and inspect graph summaries alongside the source diff. Keep tracked graph changes with
source changes when implementation commits are separately authorized.

Do not release, publish, merge, or deploy during acceptance. Website history advances only with the independently
approved website build/publication containing the updated application changelog.
