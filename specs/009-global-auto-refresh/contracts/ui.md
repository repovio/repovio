# UI Contract: Global Auto Refresh

## Navbar

Insert `LayoutAutoRefreshControl` into `apps/web/app/components/layout/navbar-controls.vue`, before the notification
popover/user menu. Use a compact icon trigger with translated accessible name and tooltip describing the selected interval
or Off. Its popover exposes an explicitly labeled single-choice list: Off, 15 seconds, 30 seconds, 1 minute, 5 minutes.
Show the selected state without relying only on color. Keyboard opening, selection, Escape, and focus return must work.

All authenticated routes display the preference control. On unsupported routes the preference remains editable but creates
no content refresh registration. Document this scope in the control's translated help text. Navbar state describes the
preference, not a promise of live provider data. No countdown or automatic success toast is required.

## Manual refresh

Use proposed `CommonRefreshButton` with `i-lucide-refresh-cw`, neutral color, ghost variant, medium size, square icon-only
presentation, localized Refresh accessible name and tooltip. The same component owns focus/disabled/loading presentation.
It accepts the parent's pending state and emits activation; it performs no requests or independent scheduling.

Preserve the existing toolbar position and search/filter/sort/column controls. Manual activation calls the view's shared
refresh operation. Loading lasts through the table and supporting summaries, including rejection handling. Off never
removes or disables manual refresh.

## Targets

| View                                                      | Refresh content                                                              |
| --------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `/`                                                       | Current widgets, latest runs, issues/PR summaries, period summary, and trend |
| `/workflow-runs`                                          | Current query results; retain existing filter-option loading behavior        |
| `/workflows/awaiting-approval`                            | Approval list; retain client search                                          |
| `/workflow-runs/needs-attention`                          | Current needs-attention query                                                |
| `/issues`, `/pull-requests`                               | Current table and their existing summary/supporting reads                    |
| `/alerts/dependencies`, `/alerts/code`, `/alerts/secrets` | Current category table and existing summary/availability reads               |

The shared workflow-run, work-item, and security-alert components also register when actively embedded in repository tabs.
Do not register hidden/inactive cached tabs. Fixed repository and alert-kind scope must survive every refresh.

## Localization and authorization

Add refresh-preference strings in every application locale present at implementation time; use English/German browser
acceptance and locale-key parity checks. Reuse existing translated Refresh text when semantically correct.

Every request continues through the existing authenticated, permission-scoped API clients. No new endpoint, repository
sync request, provider request, or settings mutation belongs to this feature.

## Scheduling contract

- `registerTarget` yields a target-scoped refresh function and disposer; a stale disposer cannot remove a new registration.
- Manual and sync-completion requests use the same refresh function as scheduled work.
- Route query watchers preserve their existing ownership; expose their busy state and route their request dispatch through
  the same gate where needed to prove no overlap. Do not add automatic refresh globally to `useTable`.
- Await completion, not invocation. Do not use `Promise.resolve` around fire-and-forget callbacks as completion evidence.
- Existing 500 ms workflow sync debounce remains, but its final invocation uses the shared gate. Off disables only timers.
- Hidden/offline suspension is independent of the existing status socket and server synchronization settings.
