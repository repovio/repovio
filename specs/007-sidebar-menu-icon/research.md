# Research: Sidebar Menu Icon

## Decision: Reuse the Existing Nuxt UI Menu Mapping

Change only `ui.icons.menu` in `apps/web/app/app.config.ts` from `i-tabler-menu` to `i-tabler-menu-2`.

**Rationale**: The current app config explicitly selects `menu`. The installed Tabler data defines that icon with two
horizontal paths; `menu-2` has three. This matches the reported visual issue and the requested asset exactly.

**Alternatives considered**: Override the navbar toggle's icon prop locally; replace the button; change desktop panel
icons; draw a custom SVG. These duplicate existing configuration or exceed the requested scope.

## Decision: Preserve Framework-Owned Toggle Behavior

`apps/web/app/components/layout/navbar.vue` uses `UDashboardNavbar` without overriding its default toggle. Installed
Nuxt UI `dist/runtime/components/DashboardNavbar.vue:37-44` creates `UDashboardSidebarToggle`.
`DashboardSidebarToggle.vue:57-62` resolves the closed icon from `ui.icons.menu`, retains `ui.icons.close` for the open
state, supplies accessible labels, and calls the existing sidebar toggle handler. Desktop
`DashboardSidebarCollapse.vue:56` independently uses `panelOpen`/`panelClose`.

**Rationale**: Updating the menu mapping reaches the selected responsive button without replacing interactions or
altering desktop controls. The open-state close symbol remains unchanged.

**Alternatives considered**: Edit `UDashboardSidebarCollapse` in the navbar. Rejected because it controls desktop
collapse/expand, not the selected “Open sidebar” button.

## Decision: Keep Existing Icon Bundling

`apps/web/nuxt.config.ts` already includes Tabler and scans `app/**`. Icon API fallback is disabled. A literal
`i-tabler-menu-2` in app config should be discovered by the existing bundler; verify actual rendered output and blocked
external icon services during implementation before adding any explicit bundle entry.

**Alternatives considered**: Add a dependency, enable remote icon loading, or preemptively modify bundle configuration.
Existing collection and scan configuration make those changes unnecessary unless validation proves otherwise.

## Evidence and Limits

- Current worktree: app config, navbar, Nuxt icon configuration, package manifests, and existing browser tests inspected.
- Planning initially inspected installed dependencies in the main checkout. Implementation installed the frozen
  lockfile in this worktree and confirmed the same framework mapping and three-line Tabler asset locally.
- Reuse `apps/web/tests/e2e/page-layout.spec.ts` and the rendered bundled-icon assertion pattern in
  `apps/web/tests/e2e/admin-tables.spec.ts`.
- No product implementation or visual acceptance run occurred during planning. Subsequent local implementation and
  browser verification are recorded separately in [evidence.md](evidence.md); no provider operation or upgrade occurred.
- All design questions are resolved; no external API documentation is needed for this source-verified mapping.

## Implementation Finding: Restart the Icon Scanner

Changing app config through HMR updated the icon class before the client icon bundle was rescanned. The rendered SVG
assertion caught an empty mask and the dev server reported `failed to load icon tabler:menu-2`. Restarting the dev server
regenerated the local bundle and all four locale/theme regression cases passed. No explicit bundle entry was necessary.
