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
