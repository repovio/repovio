# Research: Global Auto Refresh

## Existing refresh boundaries

Repository inspected at `01dd05cd97bb3ddf74bcb479c3504f2ef2274be5`. Graphify queried before source exploration.
A read-only research agent independently checked refresh ownership and lifecycle risks.

| Boundary                                                         | Existing behavior                                                            | Design consequence                                        |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------- |
| `apps/web/app/components/layout/navbar-controls.vue`             | Notifications and user menu                                                  | Add one global preference control here                    |
| `apps/web/app/pages/index.vue`                                   | `loadDashboard` groups current/historical reads; historical generation guard | Reuse whole-view operation; guard current reads too       |
| `apps/web/app/pages/workflows/awaiting-approval.vue`             | `loadRuns`, client-side search                                               | Register one target; add stale-result protection          |
| `apps/web/app/components/modules/workflow-runs/table-page.vue`   | Query Kit refresh and 500 ms debounce after sync completion                  | Route all explicit triggers through one gate              |
| `apps/web/app/components/modules/work-items/table-page.vue`      | `refreshAll` groups table/supporting reads                                   | Preserve summary updates and complete pending lifetime    |
| `apps/web/app/components/modules/security-alerts/table-page.vue` | `refreshAll` groups table/supporting reads                                   | Preserve category/repository scope and availability data  |
| `apps/web/app/composables/api/table.ts`                          | Typed query, route pagination, preferences, fixed repository filters         | Keep query semantics; never enable polling for all tables |
| `apps/web/app/composables/api/system-status.ts`                  | One status socket, validated snapshots only                                  | No new socket or general status protocol                  |
| `apps/web/app/composables/api/repository-detail.ts`              | `refreshRepository` posts administrator-only synchronization                 | Never call from content auto-refresh                      |
| `apps/web/app/pages/jobs.vue`                                    | Independent timer                                                            | Explicitly outside feature scope                          |

## Decision: Global browser preference, local active targets

Use one narrow Pinia preference store and an app composable coordinating mounted target registrations. Persist only the
validated interval, default 15000 ms; offer 0, 15000, 30000, 60000, and 300000 ms. Keep preference reactive across routes.

**Rationale**: Existing `store/settings.ts` persists application-wide server settings, including retention. A personal
browser display preference must not require administrator permission or an API/database change. New state stays within
existing ownership conventions. Navbar is already globally composed.

**Alternatives considered**: Server profile field adds contracts/migrations and cross-device scope not requested;
per-view controls repeat configuration; arbitrary millisecond input adds validation/UI work without requested value.

## Decision: Completion-driven scheduling and shared trigger gate

Schedule the next timeout after all target work settles. Skip ticks during existing initial/query work. Manual and
sync-completion refreshes join the active target promise. Pass a reactive busy predicate covering every participating read.
Preserve the existing 500 ms sync debounce; its eventual call uses the same gate, including while interval refresh is Off.

Use all-settled completion or an equivalent finally-safe aggregate for grouped reads: existing `Promise.all` can reject
before sibling requests finish. Do not clear loading/single-flight ownership at that early rejection. Expose meaningful
errors through existing view feedback without a success-toast flood.

**Rationale**: Fixed `setInterval` plus unguarded callbacks overlaps slow requests and socket-triggered updates. A wrapper
alone cannot control Query Kit's autonomous filter loads: implementation must inspect the installed API and, if necessary,
add a narrow opt-in request-dispatch seam for participating views, preserving default behavior for other tables. Prove
completion and no overlap in tests before claiming acceptance. No dependency upgrade is authorized.

**Alternatives considered**: Raw per-page timers duplicate lifecycle behavior; unconditional polling in `useTable` expands
scope and misses summaries; blindly awaiting fire-and-forget callbacks does not establish request completion.

## Decision: Suspend inactive work

Pause timer requests when hidden/offline, unregister on route deactivation/disposal/sign-out, and perform one catch-up
when eligible again. Active repository-tab instances inherit the preference; hidden cached tabs do not run. Track target
identity/generation and protect async data writes on resource changes.

**Rationale**: Reduces background traffic and stale result races. Each browser tab may refresh independently; cross-tab
leader election is outside scope. Each authenticated visible target has at most one cycle in flight.

**Alternatives considered**: Poll hidden views wastes requests; timer-only cleanup cannot protect late data writes;
refreshing every route globally would fetch unnecessary data and could include administrative actions.

## Decision: One manual refresh component

Use neutral, ghost, medium, square icon-only refresh controls with translated accessible name, tooltip, visible keyboard
focus, and full grouped loading. Use a separate navbar preference popover; do not confuse selecting cadence with invoking
manual refresh or provider synchronization.

**Rationale**: User explicitly requests compact consistency. Existing soft buttons differ between labeled dashboard/approval
views and unlabeled tables; one component prevents future divergence.

**Alternatives considered**: Remove manual buttons loses explicit retry when Off; change all icon actions would alter sync,
PWA, and unrelated workflow semantics. Soft styling is viable but ghost matches compact adjacent toolbar controls.

## Scope, tooling, and remaining gates

No matching auto-refresh issue was found with repository search on 2026-11-10. Toolbar issue #79 is related context, not
permission to modify that completed scope or create a duplicate issue. Issue #91 was subsequently created after explicit
approval; its planning-only branch/commit/push are authorized. Product implementation still requires separate approval.
No release or CI claim is made for this planning-only change.

Node.js 26.13.0 and pnpm 11.28.9 are available; this checkout initially lacks dependencies. Existing manifests provide
Nuxt/Vue, Pinia, Nuxt UI, VueUse, Query Kit, Vitest, and Playwright. Reuse pinned versions. No new dependency is proposed.
No external library API behavior is assumed beyond inspected repository usage; verify installed scheduling/query contracts
when implementing. No unresolved product clarification blocks the design; proposed defaults are explicit in the spec.
