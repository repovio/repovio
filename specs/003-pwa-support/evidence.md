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
