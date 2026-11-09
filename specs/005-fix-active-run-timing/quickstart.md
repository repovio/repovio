# Validation Guide: Active Workflow Run Timing

## Prerequisites

Use Node.js 26.13.0 and Corepack pnpm 11.28.9. Install locked workspace dependencies if absent with
`corepack pnpm install --frozen-lockfile`. Use disposable local test data and existing API/web development setup.
Do not edit live provider resources or execute production data repairs.

## Focused Checks After Implementation

```sh
corepack pnpm --dir apps/api test --runTestsByPath src/modules/providers/forgejo/forgejo-actions.adapter.spec.ts src/modules/providers/sync.service.spec.ts
corepack pnpm --dir apps/web test
corepack pnpm --dir apps/api test
corepack pnpm --dir apps/api typecheck
corepack pnpm --dir apps/web typecheck
corepack pnpm documentation:check
corepack pnpm lint
corepack pnpm format:check
```

Run newly added read-projection tests individually before the API suite. Run any new timing utility test individually
before the web suite. Run canonical formatting twice to prove stable bytes. These commands are implementation acceptance
instructions, not checks claimed as already executed by planning.

## Browser Acceptance

Use the existing Playwright setup with the local web app and mocked or disposable API rows. Run
`corepack pnpm --dir apps/web e2e` for the applicable regression scenarios; capture screenshots in English and German.

1. Queue a fixture with epoch-sentinel completion and negative duration; open Workflow Runs and dashboard latest runs.
   Expect unavailable final timing and intact status/approval metadata.
2. Repeat with RUNNING, plausible stale completion, and positive duration. Final timing remains unavailable.
3. Serve a previously persisted active row before any sync. Assert API projection returns null timing and UI is safe.
4. Serve a stale cached bad response directly to the UI. Confirm defensive rendering still shows unavailable.
5. Transition the same fixture to terminal success with valid completion and duration. Confirm timing becomes visible,
   no duplicate row appears, and provider/repository identity is unchanged.
6. Repeat with terminal failed/cancelled/skipped, zero duration, missing start, invalid completion, and negative duration.
   Check the availability matrix in [contracts/ui-api.md](contracts/ui-api.md).
7. Verify repository-scoped access and existing selected-field behavior remain intact.

## Planning Verification

Review spec checklist, plan gates, artifact links, placeholders and whitespace. Product tests and live-provider/browser
checks belong to implementation and are not required to claim the planning artifacts complete.
