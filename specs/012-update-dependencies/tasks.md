# Tasks: Update Dependencies

The [specification](spec.md), [plan](plan.md), [research](research.md), and [quickstart](quickstart.md) define the
scope. Each substantive increment includes the repository-required Changeset and its verification.

## Phase 1 - Setup

- [ ] T001 Verify the linked task branch is based on current `main` and record the environment and dependency baseline
      in `specs/012-update-dependencies/research.md`.

## Phase 2 - Foundation

- [ ] T002 Compare direct, resolved, and peer versions from `package.json`, the workspace manifests,
      `pnpm-workspace.yaml`, and `pnpm-lock.yaml`. Check runtime requirements, affected overrides, and patch ownership.

## Phase 3 - US1 - Dependency security

**Independent test.** Frozen install, advisory range inspection, dependency tests, web and website checks and builds.

- [ ] T003 [US1] Upgrade Nuxt to 4.6.4 in `apps/web/package.json` and `apps/website/package.json`; refresh the Nuxt
      kit, schema, Vite server, and Nitro resolutions in `pnpm-lock.yaml`. Verify affected package ranges and both builds.
- [ ] T004 [US1] Set the bounded node-forge floor to 1.4.3 in `pnpm-workspace.yaml`, regenerate `pnpm-lock.yaml`,
      and run the checks in `scripts/check-dependency-security.test.mjs`.

## Phase 4 - US2 - Compatible updates

**Independent test.** Compare direct and resolved versions. Verify affected API, web, website, and tooling targets.

- [ ] T005 [US2] Update compatible API dependencies in `apps/api/package.json` and `pnpm-lock.yaml`; validate Nest
      peers, API lint, type check, tests, build, and offline OpenAPI export.
- [ ] T006 [US2] Update compatible frontend dependencies in `apps/web/package.json`, `apps/website/package.json`,
      and `pnpm-lock.yaml`; verify browser behavior, website SSR, lint, type checks, tests, and builds.
- [ ] T007 [US2] Update compatible tooling and remaining eligible resolutions in `package.json`,
      `libs/schemas/package.json`, `pnpm-workspace.yaml`, and `pnpm-lock.yaml`. Recheck `.github/workflows/` action
      pins, patch applicability, security protections, and canonical format stability.

## Phase 5 - US3 - Dependabot PR disposition

**Independent test.** Inspect #100 through #104 and verify merged image tags on `main`.

- [ ] T008 [US3] Record final PR and check states in `specs/012-update-dependencies/research.md`. Verify the build and
      runtime image tags in `apps/api/Dockerfile`, `apps/web/Dockerfile`, and `apps/website/Dockerfile`.

## Phase 6 - US4 - Stable major migrations

**Independent test.** Install and validate each migration separately against its application and runtime contracts.

- [ ] T009 [US4] Migrate Querry Kit Nest, Nuxt, and Nuxt UI in `apps/api/package.json`, `apps/web/package.json`,
      `apps/web/app/composables/api/`, and the affected API query modules. Verify DTO selection, CASL enforcement,
      filters, sorting, pagination, and web table state.
- [ ] T010 [US4] Migrate Fastify Multipart in `apps/api/package.json` and the affected upload path. Verify accepted
      uploads, limits, malformed payload responses, and the Fastify peer line.
- [ ] T011 [US4] Migrate both Vite PWA packages in `apps/web/package.json` and `apps/web/nuxt.config.ts`. Verify
      generated assets and run `apps/web/playwright.pwa.config.ts` against a production build.
- [ ] T012 [US4] Migrate web-push in `apps/api/package.json` and
      `apps/api/src/modules/notifications/browser-push.service.ts`. Verify ESM imports, VAPID, and terminal and retryable
      failures with the existing notification tests and a synthetic integration check.
- [ ] T013 [US4] Migrate Apprise in `apps/api/Dockerfile`. Verify the CLI invocation and synthetic delivery from
      `apps/api/src/modules/notifications/apprise-notification.adapter.ts` in the API image.
- [ ] T014 [US4] After explicit approval of the pin change, migrate to pnpm 12 in `package.json`,
      `pnpm-workspace.yaml`, `pnpm-lock.yaml`, the Dockerfiles, and CI. Verify clean installs, dependency patch behavior,
      and API deployment output. Record any unavailable stable Prisma or Node target in
      `specs/012-update-dependencies/research.md`.

## Final verification

- [ ] T015 Run the full checks in `specs/012-update-dependencies/quickstart.md`, verify the Graphify output if source
      changed, and record results and any deferred targets in `specs/012-update-dependencies/research.md`.

## Dependencies and execution strategy

- T001 and T002 establish the baseline. T003 and T004 deliver the security minimum.
- T005 through T007 share `pnpm-lock.yaml`; run their mutations sequentially.
- T008 is independent of local package changes. Validate each Docker PR against its current base.
- T009 through T013 follow compatible updates. T014 is last so package and toolchain regressions remain diagnosable.
- Independent read-only peer and upstream release checks can run together. Independent checks of already fixed
  packages can also run together when their build output directories do not overlap.
- T015 verifies the combined result.
