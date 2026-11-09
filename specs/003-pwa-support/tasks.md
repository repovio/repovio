# Tasks: PWA Support Audit and Gap Closure

**Issue**: [#64](https://github.com/repovio/repovio/issues/64) | **Branch**: `codex/pwa-support-plan`

**Input**: [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md), [data-model.md](data-model.md),
[contracts/pwa.md](contracts/pwa.md), and [quickstart.md](quickstart.md).

**Authorization**: The user authorized implementation of issue #64 after task generation and requested that specifications
be committed first. Specifications are committed as `974495f`. No merge, release, or deployment is authorized.

**Tests**: Required by FR-004/FR-005 and the constitution. Add coverage before any corresponding fix; baseline behavior
may already pass. Demonstrate a failing regression for a reproduced defect, then fix it. Do not manufacture failures
for existing correct behavior. Every conditional fix must record either the reproduced failure and repair or evidence
that no application change is needed.

**Format**: `- [ ] Tnnn [P?] [USn?] Description with paths`. `[P]` permits concurrent work only after prerequisites,
without shared files, accounts, ports, or mutable build artifacts. Paths are repository-relative. Evidence paths below
are future outputs; do not mark tasks complete merely because a plan exists.

## Phase 1: Setup

**Purpose**: Establish scope, pinned tooling, and a reproducible production baseline.

- [x] T001 Confirm issue #64 scope against `specs/003-pwa-support/spec.md`, `PLAN.md`, `AGENTS.md`, `GLOSSARY.md`, and `docs/coding-guidelines.md`; create `specs/003-pwa-support/evidence.md` with revision, commands, environment versions, and a FR-001 through FR-008 evidence matrix. Inspect status/diffs before changes and checks; preserve unrelated work.
- [x] T002 Install the committed lockfile using Node.js 26.13.0 and Corepack pnpm 11.28.9, run the existing `apps/web/package.json` `e2e:pwa` command, and inventory `apps/web/nuxt.config.ts`, generated worker caches, manifest headers/icons, and current test coverage in `specs/003-pwa-support/evidence.md`. Classify each finding as verified, missing coverage, confirmed defect, or platform limitation without changing version ranges or compiler aliases.

## Phase 2: Foundational Prerequisites

**Purpose**: Ensure production tests can safely exercise worker updates and authenticated sessions.

- [x] T003 Harden `apps/web/tests/pwa/pwa.spec.ts` worker mutation cleanup and `apps/web/playwright.pwa.config.ts` suite isolation before adding scenarios: restore original worker bytes after assertion failures, prevent concurrent mutation of one `.output` directory, and explicitly include new lifecycle/cache/launch spec files in the correct project. Keep runtime-branding tests on their configured custom server.
- [x] T004 Add reusable fixture helpers in `apps/web/tests/pwa/helpers.ts` for worker readiness, cache enumeration, sanitized request observations, and deterministic authenticated users with different repository access. Document a disposable API/database and test OIDC setup in `specs/003-pwa-support/quickstart.md`; never use or record production credentials. Fixtures must allow mocked tests and real authenticated integration evidence to be distinguished.

**Checkpoint**: T001–T004 complete before story execution. No new runtime package, API endpoint, or database model.

## Phase 3: US1 — Install and Launch the Existing Application (P1)

**Goal**: Preserve native installation, runtime identity, standalone sign-in, and authorized deep links.

**Independent test**: Run production manifest/launch tests with default and custom branding; install and launch on the
platform matrix, then verify local/OIDC login and a permitted deep link. Unsupported controls preserve browser use.

### Tests and Evidence

- [x] T005 [P] [US1] Extend `apps/web/tests/pwa/branding-runtime.spec.ts` manifest/icon assertions and `apps/web/server/utils/branding-manifest.spec.ts` identity tests: preserve `id`, `scope`, and `start_url` as `/`, `display` as `standalone`, `no-store`, PNG dimensions, optional maskable behavior, and default/custom runtime branding without rebuild.
- [x] T006 [P] [US1] Add `apps/web/tests/pwa/launch.spec.ts` production tests for root/deep-link routing, normal online use without installation APIs, and local login with permitted/denied repository routes using T004 fixtures. Keep mocked routing assertions distinct from real local/OIDC authentication validation.

### Implementation and Acceptance

- [x] T007 [US1] Fix only defects reproduced by T005/T006 in `apps/web/server/utils/branding-manifest.ts`, `apps/web/server/routes/manifest.webmanifest.get.ts`, or `apps/web/nuxt.config.ts`; preserve manifest identity, runtime customization, and existing sign-in ownership. If behavior passes, record no-change evidence in `specs/003-pwa-support/evidence.md` rather than refactor.
- [x] T008 [US1] Document native desktop Chromium/Android Chromium installation and iOS Safari Add to Home Screen in `docs/theming.md`, including HTTPS, metadata refresh/reinstallation, and unsupported installation controls; do not add an install banner or infer installation state from a missing event.
- [ ] T009 [US1] Execute real desktop/Android/iOS installation and standalone root/deep-link launch checks, including disposable local and configured OIDC sign-in; record OS/browser versions, observed display mode, result, and sanitized evidence in `specs/003-pwa-support/evidence.md`. Mark unavailable devices or OIDC configuration unverified; emulation cannot complete real-device evidence.

**Checkpoint**: US1 is independently testable; automated success does not complete unavailable device checks.

## Phase 4: US2 — Receive Updates Without Unexpected Interruption (P1)

**Goal**: Make explicit update acceptance and recoverable failures verifiable without disrupting open sessions.

**Independent test**: An active production worker receives two successive updates; Later preserves the active version,
failed acceptance permits retry, loading spans the request, and accepted updates settle without reload loops.

### Tests and Evidence

- [x] T010 [P] [US2] Add `apps/web/tests/pwa/update-prompt.spec.ts` deterministic component-boundary browser scenarios for absent `$pwa`, delayed activation, rejected activation, visible localized error, retry, duplicate-click protection, and loading through the awaited request. Use an isolated test fixture without exposing test controls in the shipped application; exercise the real prompt component.
- [x] T011 [P] [US2] Add `apps/web/tests/pwa/update-lifecycle.spec.ts` production-worker scenarios for Later, no activation before acceptance, two successive versions, registration failure with usable online routing and no unhandled rejection, multiple controlled tabs, and bounded reload counts. Use T003 isolation; do not mutate worker output concurrently with another suite.

### Implementation and Acceptance

- [x] T012 [US2] Repair only reproduced prompt defects in `apps/web/app/components/common/pwa-update-prompt.vue`; keep prompt dismissal local, activation failure recoverable, and Update loading for the full awaited operation. Change existing registration configuration in `apps/web/nuxt.config.ts` only if T011 reproduces a registration defect; preserve `registerType: 'prompt'` and notification worker imports.
- [x] T013 [US2] For any changed prompt text, update `apps/web/i18n/locales/en.json` and `apps/web/i18n/locales/de.json`, preserving existing locale fallback and keys; verify failure and pending states with keyboard focus, readable text, and no overflow at 390/1440 CSS pixels in `apps/web/tests/pwa/update-prompt.spec.ts`. Capture and visually inspect screenshots; record paths/results in `specs/003-pwa-support/evidence.md`.
- [x] T014 [US2] Run T010/T011 against production output, verify acceptance in one tab may update another controlled tab without promising per-tab worker versions, and confirm `/notification-sw.js` remains imported by generated `/sw.js`; record failure/retry, loading, registration, notification-import, and repeated-version evidence in `specs/003-pwa-support/evidence.md`.

**Checkpoint**: US2 can be validated with its fixtures independently of native installation.

## Phase 5: US3 — Keep Protected Information Outside Worker Caches (P1)

**Goal**: Demonstrate cache isolation across authentication changes and connectivity loss.

**Independent test**: In the same browser context, request protected resources as one fixture user, sign out, authenticate
as a differently authorized user, inspect all caches and response sources, then interrupt/reconnect networking.

### Tests and Evidence

- [x] T015 [P] [US3] Add `apps/web/tests/pwa/cache-isolation.spec.ts` deterministic authenticated scenarios covering API/authentication, realtime traffic, manifest, and runtime-branding exclusion from every Cache Storage entry; verify user A logout/user B login in one context and prove user B cannot receive A-only data from network or worker responses. Observe representative requests actually occurring, not just empty caches.
- [x] T016 [P] [US3] Add `apps/web/tests/pwa/connectivity.spec.ts` tests for an already-open screen losing connectivity, unsupported cold offline navigation, and fresh authorized requests after reconnection. Preserve `navigateFallback: null`; assertions must not require cached HTML, offline repository data, or fabricated fresh status.

### Implementation and Acceptance

- [x] T017 [US3] If T015/T016 reproduce a cache or worker-routing defect, narrow `apps/web/nuxt.config.ts` precache/runtime behavior while preserving public static assets, `navigateFallback: null`, and `runtimeCaching: []`; otherwise record passing no-change evidence in `specs/003-pwa-support/evidence.md`. Do not introduce offline persistence or weaken authorization.
- [ ] T018 [US3] Execute T015/T016 scenarios against disposable real local/OIDC authenticated sessions with differing repository permissions and the production worker; record sanitized request/cache observations and unavailable OIDC setup in `specs/003-pwa-support/evidence.md`. Mocked authorization results alone do not prove actual server restrictions.
- [ ] T019 [US3] Update `docs/theming.md` with the verified cache boundary, online-data requirement, unsupported cold offline startup, and reconnection behavior. Cross-reference the reproducible disposable validation steps in `specs/003-pwa-support/quickstart.md` without claiming offline support or unavailable environments verified.

**Checkpoint**: US3 privacy claims require actual cache observations and authorized online responses.

## Phase 6: Polish and Cross-Cutting Validation

**Purpose**: Reconcile story evidence, run affected checks, and prepare reviewable delivery.

- [ ] T020 Reconcile FR-001 through FR-008, every story acceptance scenario, and `specs/003-pwa-support/contracts/pwa.md` against `specs/003-pwa-support/evidence.md`; classify remaining defects, platform limitations, and unavailable device/OIDC evidence explicitly. Do not mark unsupported or unexecuted scenarios as passed.
- [ ] T021 Run `apps/web/package.json` web test, typecheck, lint, and `e2e:pwa` targets plus root documentation/branding/canonical formatting checks from `specs/003-pwa-support/quickstart.md`; investigate affected failures, run two stable formatting passes, inspect status/diffs and `git diff --check`, and record exact results in `specs/003-pwa-support/evidence.md`. Broaden checks only for additional changed projects.
- [ ] T022 If substantive implementation is prepared for a requested commit, add exactly one focused `repovio` Changeset per such commit under `.changeset/`, refresh `graphify-out/graph.json` with changed sources under the repository rules, and review scoped diffs. Update completion status in `specs/003-pwa-support/tasks.md`; commit/push/PR/merge remain subject to their explicit authorization rules, and no deployment is included.

## Dependencies and Execution Order

```text
T001 -> T002 -> T003 -> T004
                       |
                       +-> US1: T005 + T006 -> T007 -> T008 -> T009
                       +-> US2: T010 + T011 -> T012 -> T013 -> T014
                       +-> US3: T015 + T016 -> T017 -> T018 -> T019
All story evidence -> T020 -> T021 -> T022
```

All stories have P1 priority; default execution order is US1, US2, then US3. They have no functional dependency on one
another after the shared foundation, but share configuration, documentation, evidence, and mutable production builds.
Serialize edits to `apps/web/nuxt.config.ts`, `docs/theming.md`, and `evidence.md`; reconcile results before continuing.
Use separate build copies and ports if running worker-mutating suites concurrently. `[P]` is not blanket permission to
run all browser processes against the same build. Generated task labels describe opportunities, not agent dispatch.

## Parallel Examples by Story

- US1: T005 manifest/branding tests and T006 launch tests own different files after T004; merge their results before T007.
- US2: T010 deterministic prompt tests and T011 lifecycle test authoring own different files after T004. Production runs
  must use isolated outputs; otherwise run sequentially before T012.
- US3: T015 cache-isolation and T016 connectivity test authoring own different files after T004. Do not share mutable
  users, sessions, or worker output when executing them concurrently.

## Implementation Strategy

1. Complete setup and foundation, then US1 as the first independently validated increment (MVP: installation/launch).
2. Validate US2 update recovery and US3 cache isolation as subsequent increments; the full issue requires all stories.
3. Fix only demonstrated gaps; preserve passing behavior and record no-change decisions rather than add architecture.
4. Finish cross-cutting checks and evidence reconciliation. Any unavailable device/OIDC evidence remains open or explicitly
   unverified in delivery; never mark the corresponding full task complete from partial automated coverage.

## Requirement Traceability and Counts

| Requirement                                       | Tasks                              |
| ------------------------------------------------- | ---------------------------------- |
| FR-001 inventory and bounded repairs              | T001, T002, T007, T012, T017, T020 |
| FR-002 runtime identity and icons                 | T005, T007                         |
| FR-003 update interaction and loading             | T010–T014                          |
| FR-004 authenticated cache proof                  | T004, T015, T018                   |
| FR-005 failure/repeated-update coverage           | T010, T011, T014                   |
| FR-006 platform guidance and real-device evidence | T008, T009                         |
| FR-007 EN/DE, accessibility, responsive UI        | T013                               |
| FR-008 notifications and local/OIDC behavior      | T006, T009, T012, T014, T018       |

22 tasks: 2 setup, 2 foundational, 5 US1, 5 US2, 5 US3, and 3 cross-cutting. Six `[P]` tasks form three independent
file-ownership pairs. No task is complete at generation time.
