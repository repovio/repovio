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
