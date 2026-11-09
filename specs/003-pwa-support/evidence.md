# PWA Audit Evidence — Issue #64

## Environment and Scope

- Worktree: existing Codex-managed checkout on `codex/pwa-support-plan`.
- Starting application revision: `cd5a0c4`; specifications committed and pushed as `974495f` before implementation.
- Node.js 26.13.0; Corepack pnpm 11.28.9; committed lockfile installed without manifest/version changes.
- User authorized implementation after seeing issue #64. No merge, release, or deployment authorization.
- Project rules, glossary, coding guidelines, constitution, and feature artifacts reviewed; no extension hooks or
  requirements checklists are configured. Existing ignore rules cover dependencies, output, reports, and environment files.
- Native Android/iOS installation and a real OIDC provider require external environments. No claim is made from emulation.

## Requirement Matrix

| Requirement | Initial classification | Evidence / remaining validation                                               |
| ----------- | ---------------------- | ----------------------------------------------------------------------------- |
| FR-001      | Verified scope         | Existing architecture preserved; classify each new observation before repairs |
| FR-002      | Missing coverage       | Existing runtime identity/icons; expand identity assertions                   |
| FR-003      | Missing coverage       | Existing prompt success; failure/loading/duplicate handling need proof        |
| FR-004      | Missing coverage       | Existing anonymous cache assertion; authenticated account-switch proof needed |
| FR-005      | Missing coverage       | Registration failure and repeated update cycles need tests                    |
| FR-006      | Missing evidence       | Native installation/device matrix and guidance pending                        |
| FR-007      | Missing evidence       | EN/DE pending/failure keyboard and viewport checks pending                    |
| FR-008      | Missing evidence       | Preserve worker import; local/OIDC and deep-link proof pending                |

## Task Log

- T001: Scope and environment inventory complete. All application behavior changes require a reproduced defect.

- T002: `corepack pnpm install --frozen-lockfile` passed. The initial nested script found system pnpm 10.33.0;
  a temporary PATH-only Corepack wrapper ensured nested commands used pinned pnpm 11.28.9. No project toolchain changes.
  `pnpm --dir apps/web e2e:pwa` then passed all 7 baseline scenarios against the production build (3.5 seconds).
  Manifest no-store, icon responses/dimensions, runtime defaults/overrides, worker activation, Later, accepted update,
  and invalid branding startup passed. Worker uses static precaching, no navigation fallback, no runtime cache rules.

- T003: One Playwright worker serializes shared build mutations; per-test restoration prevents failed scenarios from
  leaking a changed worker into the next test. All 7 production scenarios and scoped ESLint/documentation checks passed.

- T004: Synthetic Alice/Bob fixtures, real sign-in form helper, controlled-worker readiness, and all-cache URL inspection
  implemented. Disposable API/OIDC prerequisites documented. Mocked browser evidence remains separate from server proof.

- T005: Default/custom manifest assertions now include stable id, scope, start URL, and standalone display. Both
  manifest unit tests and production runtime-branding assertions passed; no manifest implementation defect found.

- T006/T007: Production local sign-in, authenticated deep-link reload, and denied repository UI passed using explicit
  synthetic responses. HTTP 403 was observed on the API request; the private title was absent. No routing or manifest
  application repair needed. Mocked authorization is not claimed as real server evidence.

- T008: Native desktop/Android/iOS installation paths, secure contexts, metadata refresh, stable identity, and standalone
  local/OIDC checks documented in `docs/theming.md`. Device installation is not inferred from browser emulation.

- T011: Real production worker tests passed two successive versions (exactly four expected reloads), Later preserving a
  waiting worker, explicit acceptance in two tabs, and rejected registration with a usable online sign-in page and no
  uncaught error. Worker imports still include `notification-sw.js`. A unique worker query selects each test release,
  matching the existing suite's update technique; this is lifecycle evidence, not deployment/CDN cache validation.

- T010/T012: Regression reproduced in all four EN/DE/viewport scenarios: the real update component had no accessible
  live status region. Added `role="status"` to the existing alert; tests now pass failure announcement semantics, held
  request loading, disabled duplicate clicks, retry, and Later. A focused compiled-component setup test verifies absent
  `$pwa` remains inert. These test/fix tasks form one working increment rather than committing a failing intermediate.
- T013/T014: Existing EN/DE translations required no text changes. Keyboard focus/Enter, 390/1440 px width, scroll-width
  assertions, pending/failure screenshots, and explicit retry passed. Screenshots visually inspected for English mobile
  and German desktop failure states, plus mobile pending state: readable text, contained buttons, no overflow.
  Full production suite passed 17 scenarios (16.2 seconds); four prompt scenarios reran after duplicate-click coverage.
  Lifecycle uses the real generated worker; prompt failure injection replaces only the reactive plugin boundary.

- T015/T017: Authenticated synthetic API traffic, sign-out and Bob sign-in, manifest/branding/realtime requests, and
  all-cache inspection passed in one worker-controlled context. Both allowed and denied API responses were observed and
  were not worker responses. No protected URLs entered caches; no cache configuration repair was necessary.

- T016: A fully mounted page survives network loss; real uncached manifest requests fail offline, a new document cannot
  cold-start offline, and reconnection obtains a fresh network response. The test does not use mocked API responses as
  offline evidence. `navigateFallback: null` and `runtimeCaching: []` remain unchanged.

- T018 (local portion): Opt-in `local-api` project passed against a freshly migrated PostgreSQL 18 container and the
  built Nest API on port 3331, with the same production web build on port 3313. Two real Viewer accounts and an Alice-only
  repository were seeded only in this disposable database; provider disabled and scheduler disabled. No API mocks.
  Verified Alice's 200 response and permitted deep-link reload, actual logout persistence cleanup, Bob's denied read,
  all-cache exclusion, authenticated offline failure, and fresh Bob identity after reconnection. The committed opt-in
  regression passed (1 test, 2.4 seconds); a separate direct browser check also passed. Real OIDC remains unverified.
- T009/T018 external evidence: No Android/iOS device or dedicated OIDC issuer has been made available in this session.
  Native desktop installation and installed-device callback flows were not executed. T009 and T018 remain unchecked;
  Chromium installability and real local-account evidence do not substitute for those missing observations.

- T019: Documented online-only protected data, unsupported cold offline startup, stale rendered information, existing
  HTTP/session-storage boundaries, update retry/multi-tab behavior, and links to both fixture validation modes.

- Integration fixture correction: rebuilding while the manually started third web process was still running left its
  startup asset metadata stale and caused the subsequent login page to stall. The opt-in project now owns a fresh,
  loopback-only web process with `reuseExistingServer: false`; the API remains separately disposable. Rebuilt and reran
  the complete suite with this correction: all 18 production scenarios passed (19.5 seconds), including the real API.
- Availability confirmed by the user: no Android/iOS devices or isolated OIDC test instance are available. T009 and the
  OIDC portion of T018 cannot be completed in this environment and remain explicitly unverified.

## Final Requirement Assessment

| Requirement | Result           | Evidence                                                                                                   |
| ----------- | ---------------- | ---------------------------------------------------------------------------------------------------------- |
| FR-001      | Verified         | Baseline inventory, scoped repairs, and classified evidence                                                |
| FR-002      | Verified         | Default/custom manifest identity, icons, production runtime tests                                          |
| FR-003      | Verified         | Held activation, disabled duplicate input, rejection, retry, dismissal, live status region                 |
| FR-004      | Verified locally | Synthetic traffic plus real Nest/PostgreSQL authorization and all-cache inspection                         |
| FR-005      | Verified         | Registration failure, two worker versions, two tabs, absent-plugin setup                                   |
| FR-006      | Partial          | Installation guidance and Chromium installability pass; native installation unavailable                    |
| FR-007      | Verified scope   | EN/DE, 390/1440 px, keyboard, accessibility semantics, screenshots; no spoken screenreader session claimed |
| FR-008      | Partial          | Notification import and real local login/deep links pass; installed OIDC callback unavailable              |

## Final Checks and Task Reconciliation

- T020: Every functional requirement and story acceptance scenario mapped to evidence above. No known application
  defect remains in tested scope. T009 is unverified; T018 has real local API evidence but no OIDC evidence. Both remain
  unchecked after the user confirmed these environments are unavailable.
- T021: Full current production build and all 18 Playwright scenarios passed, including the opt-in real API project.
  All 48 web unit tests passed. Web typecheck, web lint plus scoped PWA test/config ESLint, documentation coverage,
  branding check, and canonical formatting passed. Two-pass scoped formatting and local link checks are stable.
  Nuxt emits its existing module-type warning; checks exit successfully. No remote CI, live providers, native installs,
  OIDC instance, registry publishing, release, or deployment behavior is claimed.
- T022: Specifications committed/pushed before implementation. Each substantive test/application implementation commit
  contains one focused `repovio` Changeset. AST graph refreshed; scope diffs reviewed. SQL graph extraction remains
  unavailable because optional `tree_sitter_sql` is not installed; this feature changes no SQL. Existing semantic graph
  data was preserved; no semantic rebuild performed. Review delivery is a draft while external evidence remains open.

### Commit Traceability

- `974495f`: docs: specify PWA support audit for #64
- `e4112d5`: docs: record PWA audit scope and environment (#64 T001)
- `54f0dcb`: docs: verify production PWA baseline (#64 T002)
- `fc2492c`: test: isolate production PWA worker scenarios (#64 T003)
- `1b7de0c`: test: add authenticated PWA fixtures (#64 T004)
- `3625347`: test: preserve runtime PWA identity (#64 T005)
- `0412e15`: test: verify installed-app routing boundaries (#64 T006 T007)
- `7f8d75b`: docs: describe native PWA installation (#64 T008)
- `4bcd2bc`: test: cover repeated PWA updates and registration failures (#64 T011)
- `86ec0d5`: fix: announce PWA update failures accessibly (#64 T010 T012 T013 T014)
- `9521c5f`: test: verify authenticated PWA cache isolation (#64 T015 T017)
- `bec246a`: test: prove PWA connectivity boundaries (#64 T016)
- `a5f86b8`: test: verify PWA sessions against disposable API (#64 T018)
- `944fc96`: docs: explain PWA online-data and update boundaries (#64 T019)
- `196c5c4`: test: keep denied PWA fixture responses private (#64)
- `bcd1b79`: test: restart disposable PWA web fixtures per build (#64)
