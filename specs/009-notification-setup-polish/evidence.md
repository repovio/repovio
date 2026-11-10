# Notification Setup Follow-up Evidence

## Authorization and baseline (T001)

- Issue #90; branch `codex/90-notification-setup-polish`, based on `01dd05c`; planning commit `ee95b3b`.
- User approved implementation of T001–T007 with separate task commits and pushes on 2026-11-10. No merge or deployment.
- Requirements checklist: 14/14 checked; no extension hooks. Existing ignore files cover generated artifacts and secrets.
- Node.js 26.13.0; pnpm 11.28.9. Frozen-lockfile install succeeded without tracked dependency changes. A temporary
  Corepack shim fixes nested scripts finding global pnpm 10.33.0; repository toolchain remains unchanged.
- Baseline push and draft unit tests: 16 passed across two files.
- Baseline notification browser suite: 19/20 passed. Initial cold-development-server navigation lookup timed out;
  immediate focused rerun passed (1/1). No source changes preceded these checks; retain this as a startup timing observation.
- Local Nuxt server uses an isolated test port; browser tests use mocked API responses and synthetic identities.
- Static diagnosis confirms server availability requires all three VAPID settings; Compose already loads the environment.
  No production configuration or authenticated production status was inspected. Missing production settings are not proven.
- Browser support, permission, and enrollment describe this device; they do not define global channel readiness.
- Existing code exposes only an availability boolean to the dialog. Pending/failure/unconfigured states are ambiguous.
- Application tests and configuration unchanged by T001. This evidence-only task needs no package Changeset.
