# Global Auto Refresh Evidence

## Authority and setup (T001)

Issue #91; planning commit `742fd9e`; implementation of all eight tasks approved on 2026-11-10. Branch
`codex/91-global-auto-refresh` in the existing Codex worktree. Base `01dd05c` is unchanged from planning.
Requirements checklist: 16 checked, zero unchecked. No extension hooks exist. Ignore files already cover dependencies,
build/generated output, local configuration, and browser artifacts; no publishing/ignore changes required.

Installed pinned dependencies using `corepack pnpm install --frozen-lockfile`. Baseline web tests: 25 files / 129 tests pass.
Baseline web typecheck and canonical formatting pass. Nested package scripts initially found host pnpm 10.33.0; a temporary
PATH shim invoking Corepack supplies pinned pnpm 11.28.9 without modifying repository manifests or host configuration.
Nuxt emits its existing MODULE_TYPELESS_PACKAGE_JSON warning; no toolchain changes made.

## Verified integration boundaries

Installed Query Kit 0.2.10 exports awaitable `initialize` and `refresh`. Query watchers call an internal closure directly;
replacing its returned refresh does not intercept them. It versions requests to discard obsolete results, but does not
serialize transport. Use an opt-in Axios adapter queue on participating table clients to serialize initial/query/manual/
automatic reads, aborting queued/in-flight requests on scope disposal. Query Kit remains owner of query and response state.
Test this seam using real Axios and Query Kit, not a mocked refresh return value.

Repository detail children use NuxtPage keys for repository/path/category; they remount on identity changes. No keep-alive
cache is configured. Register in the shared table instance, not route wrappers; unregister on scope disposal/deactivation.
Dashboard already versions historical reads; add current/approval generation guards. Supporting table loaders already
version their responses. All grouped refreshes must await every sibling before releasing pending state.

## Task results

- T001: Read-only dependency/ownership checks and baseline verification complete. No product behavior changed.

## Limitations

No live provider, production synchronization, deployment, or feature browser behavior verified during setup.
Graphify warns SQL extraction lacks tree_sitter_sql; existing graph remains usable.

- T002: Scheduler and real Pinia preference store complete. Twelve focused tests pass after the missing-module red run; web lint/typecheck, declaration documentation, scoped canonical formatting and stable second pass pass. One focused patch Changeset included.

- T003: Dashboard/approval adapters complete. Serial period queue test, three browser scenarios (default cadence, navigation disposal, delayed summary plus failed trend), web lint/typecheck, documentation and stable formatting pass. Initial dev-server dependency optimization caused a blank first load; warmed reruns pass. Existing UAlert exposes text rather than alert role; assertion uses its visible error text.

- T004: Workflow runs/Needs attention adapters and opt-in Axios queue complete. Real Query Kit watcher/transport tests prove maximum concurrency one, newest query ownership, and cancellation of queued disposed reads. Eight focused/table regressions and two browser cadence/query scenarios pass; web lint/typecheck/docs and stable formatting pass. Existing sync debounce now invokes the same guarded refresh and remains independent of Off.

- T005: Issues/PR/security adapters complete. Six browser cases pass across all five routes, including exact table+summary request counts, retained page, no writes, and delayed supporting-response lifetime. Adapter lifetime coverage is consolidated in real browser tests rather than duplicating it in mocked unit adapters; task file records this location adjustment. Web lint/typecheck/docs and stable formatting pass.

- T006: Global navbar preference complete in all 17 locales. Three preference/locale unit tests and eight EN/DE × 390/1440 × light/dark browser cases pass, including native radio selection, Escape/focus return, persisted choice, reload, Off for five simulated minutes, and no page overflow. All eight screenshots inspected; review montage saved under the task visualization directory as auto-refresh/navbar-matrix.png. Web lint/typecheck/docs and stable formatting pass. Browser cookie setup now derives the configured base URL; two representative cases rerun successfully.

- T007: Common icon-only refresh button replaces all five host implementations across nine routes. Ten real-component/cadence/pending browser cases and 19 existing monitoring regressions pass. All nine tooltip/focus screenshots inspected in auto-refresh/controls-matrix.png. Existing ambiguous Refresh selectors now use exact names to distinguish the navbar preference. Browser integration replaces mock-only component coverage. Web lint/typecheck/docs, stable formatting and production build pass.

## Integrated acceptance (T008)

- `corepack pnpm --dir apps/web test`: 30 files / 145 tests pass.
- Web typecheck, `corepack pnpm exec eslint apps/web --max-warnings=0`, declaration documentation (718 files), 21 guideline
  regression tests, canonical formatting and whitespace checks pass. Scoped formatting is byte-stable on its second pass.
- `corepack pnpm --dir apps/web build`: production build passes. No application source changed after this build.
- Against the production preview: `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3017 corepack pnpm --dir apps/web e2e auto-refresh
--workers=3 --output=/tmp/repovio91-production-results`: all 32 feature browser cases pass.
- Coverage includes every interval and Off, persisted/reloaded choices, all nine routes, real visible row updates with
  unchanged search/query, real browser offline events, simulated document visibility events, one catch-up, active scoped
  repository tabs/disposal, and real Socket.IO protocol sync-completion invalidation while Off. No sync/provider writes.
- Manual controls compared on all nine routes in English/German at 390/1440 px, with compact light/wide dark themes;
  identical computed styles, localized names/tooltips, keyboard focus, and no new viewport overflow. All 36 production
  control screenshots inspected, plus eight preference theme/locale/width screenshots. Copies and montage are retained in
  the task visualization directory under `auto-refresh/production-controls-matrix.png` and `auto-refresh/navbar-matrix.png`.
- Nineteen existing dashboard/approval/needs-attention/work-item/security browser regressions pass.
- Broader repository/navigation/toolbar/localization run: 69 of 73 initially passed. A selector coupled to Nuxt UI's
  `leadingIcon` slot was replaced with the exact localized manual Refresh accessible name; the affected German 1440 px
  toolbar case passes three production repeats. An initial row-navigation failure also occurred on the baseline cold
  server, then passed on the warm baseline and three current production repeats. No navigation implementation changed.

## Existing regression limits

Two independent Repository tests fail identically against the unchanged `01dd05c` baseline in a disposable archive:

1. `repository-navigation.spec.ts:105`: brand-link test expects text `Repovio`, while the existing brand renders an image
   with an accessible name and empty text content.
2. `repository-navigation.spec.ts:430`: after removing a webhook, the existing dialog does not show the expected
   `Not configured` text. Reproduced on the warmed baseline after the initial cold-server run.

Baseline evidence logs: `/tmp/repovio91-baseline-viewer.log` and `/tmp/repovio91-baseline-warm.log`; the original broad
run is `/tmp/repovio91-final-regressions.log`. These are outside the refresh implementation; no unrelated product changes
or weakened assertions were made. The complete existing browser suite is therefore not claimed green.

The new exact-boundary test initially used a running clock and could drift by real action time; freezing the clock before
selecting a cadence proves the exact deadline without tolerance. The socket test initially expected the wrong existing
status label; it now asserts `Fetching workflows from provider`. Both corrected tests pass in production.

## Requirement reconciliation

| Requirements                           | Actual evidence                                                                                                         |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| FR-001, FR-004, FR-005, FR-009; SC-001 | Nine-route adapters, visible row/search update, active Repository tab scope/disposal, zero write capture                |
| FR-002, FR-003; SC-002                 | Every cadence at exact deadlines, Pinia storage failure/validation tests, navbar persistence/reload and five-minute Off |
| FR-006, FR-007; SC-003                 | Real Query Kit transport concurrency/cancellation, delayed siblings, offline/visibility resume, fake-clock scheduler    |
| FR-008, FR-010; SC-004, SC-005         | Shared control in 36 real host screenshots, eight navbar matrices, keyboard/focus tests, 17-locale key coverage         |
| FR-011                                 | Synthetic Socket.IO protocol completion event refreshes the workflow table while Off                                    |

All eight tasks are complete under the implementation approval. Each substantive implementation increment has its own
focused `repovio` patch Changeset and commit; no API, database, dependency, toolchain, server Polling, or deployment change.
Provider authorization and synchronization behavior are preserved by existing clients; mocked/browser evidence does not
prove live provider freshness, remote CI, or production deployment. No implementation extension hooks are configured.

## Current-main integration

Main advanced to `7349aae` (provider actions / organization webhook setup, PR #92) during implementation. Merged this
upstream commit without rewriting task commits. All 17 locale conflicts were resolved structurally: assert our catalog
minus the new autoRefresh block equals the merge base, retain the complete upstream catalog, then append exactly that
refresh block. Compared with current main, every locale has only the six refresh lines added. No upstream API/schema
changes enter this feature's PR diff.

On the integrated source: 31 web unit suites / 151 tests, web typecheck, full web ESLint, 720-file documentation check,
and production web build pass. All 32 feature browser cases pass again against a fresh integrated production preview.
The merge commit records integration/evidence only; it adds no new feature behavior or package release entry.
