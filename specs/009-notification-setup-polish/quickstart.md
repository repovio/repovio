# Validation Guide: Notification Setup Follow-up

## Prerequisites

Use Node.js 26.13.0 and pinned pnpm 11.28.9. Install workspace dependencies with `corepack pnpm install --frozen-lockfile`.
Use a disposable local environment and synthetic Users/channels. Browser tests need the existing web app/test server;
consult `apps/web/playwright.config.ts` for its configured URL and startup behavior.

This guide describes future implementation acceptance. Planning alone does not establish application behavior.

## Focused checks

```sh
corepack pnpm --dir apps/web exec vitest run app/composables/app/browser-push.test.ts
corepack pnpm --dir apps/web e2e tests/e2e/notifications.spec.ts
corepack pnpm --dir apps/web lint
corepack pnpm --dir apps/web typecheck
corepack pnpm --dir apps/web test
corepack pnpm format:check
corepack pnpm documentation:check
corepack pnpm test:guidelines
git diff --check
```

Add any new focused draft-transition test to the first pass. Run affected API/schema tests only if their code changes.
Inspect status and relevant diff before edits and tests. If source changes, run `graphify update .` and inspect summaries.

## Deterministic acceptance matrix

| Area                | Scenarios                                                           | Expected evidence                                                     |
| ------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------- |
| History             | Admin, Manager, Viewer; empty/error table; English/German           | Icon only; localized tooltip/name; same route and guards              |
| Status              | Delayed read, configured, unconfigured, failed read then retry      | Distinct visible states; loading lasts; selection recovers            |
| Device independence | Unsupported browser; default/denied permission; no enrollment       | Configured global push remains selectable; no passive prompt          |
| Lifecycle           | Reopen, account switch, overlapping reads, failed device inspection | No stale account/read data; successful server status retained         |
| Stepper             | All four steps; Back; next-step click; future jump; keyboard        | Validation cannot be bypassed; values/focus preserved                 |
| Footer              | All six channel types; invalid fields; Enter; long content          | Single form validation; footer reachable; no early writes             |
| Save                | Deferred write and list refresh; repeated clicks; both failures     | Loading through awaited work; refresh-only retry; one write           |
| Edit                | Stored credentials; fixed type; unavailable push                    | No secret readback/loss; recipients and events preserved              |
| Layout              | English/German at 390x844 and 1102x1134                             | No overflow, readable progress, visible footer; screenshots inspected |

Use the repository's existing mocked API fixtures for deterministic response delays and failures. Verify both the rendered
state and resulting requests, not just click success. Capture screenshots using synthetic data in test output only.

## Server configuration diagnosis

For an authorized environment, inspect the non-secret authenticated status response. `available=false` identifies server
readiness; it does not reveal which setting is absent. Verify the presence and validity of `WEB_PUSH_VAPID_PUBLIC_KEY`,
`WEB_PUSH_VAPID_PRIVATE_KEY`, and `WEB_PUSH_VAPID_SUBJECT` without printing their values. Existing `.env` loading is already
wired in Compose. Record an environment prerequisite if missing; do not disable guards or silently mutate production.
If actual evidence reveals a source/template defect, add a regression at its existing owning layer before fixing it.

## Real push evidence boundary

On a separately authorized configured HTTPS test deployment, enroll an actual supported browser through explicit user
interaction, select an authorized recipient, and request one test delivery. Record enrollment, accepted/rejected delivery,
worker/OS display, and click navigation as separate outcomes. Never infer OS display from service acceptance or a mocked
API response. Physical browser/OS checks may require user interaction; report gaps explicitly.

No production configuration, restart, deployment, provider mutation, issue creation, or commit is authorized by this guide.
