# Feature Specification: Global Auto Refresh

**Feature Branch**: `codex/91-global-auto-refresh`

**Issue**: [#91](https://github.com/repovio/repovio/issues/91)

**Created**: 2026-11-10

**Status**: Implemented and feature acceptance verified; PR/merge review pending

**Input**: Configure automatic refresh globally in the navbar, default to 15 seconds, and standardize manual refresh
controls as icon-only buttons across the nine annotated monitoring views.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Keep the active monitoring view current (Priority: P1)

An authenticated User sees refreshed monitoring data without repeatedly pressing Refresh.

**Why this priority**: Timely data is the primary requested outcome.

**Independent Test**: Open each supported view with no saved preference, change its underlying fixture data, and observe
updated content after the next 15-second interval without navigation or loss of table state.

**Acceptance Scenarios**:

1. **Given** no saved preference, **When** a supported view is open and visible, **Then** it refreshes every 15 seconds
   while idle, including its displayed summary data.
2. **Given** active filters, sorting, pagination, search, columns, or dashboard period, **When** refresh completes,
   **Then** those choices remain intact, subject to existing invalid-page recovery when records disappear.
3. **Given** a slow refresh, **When** another interval or manual action occurs, **Then** no second refresh starts.
4. **Given** navigation or sign-out, **When** the previous view is disposed, **Then** it stops issuing automatic requests
   and its late results cannot overwrite the new view.

### User Story 2 - Choose one refresh interval (Priority: P1)

A User changes the interval once in the global navbar and uses that setting across supported views.

**Why this priority**: One control avoids repeated per-page configuration.

**Independent Test**: Select 30 seconds, navigate between supported views, reload, then disable automatic refresh.

**Acceptance Scenarios**:

1. **Given** an authenticated view, **When** the navbar refresh settings are opened, **Then** the User can select Off,
   15 seconds, 30 seconds, 1 minute, or 5 minutes and identify the current choice.
2. **Given** a saved choice, **When** navigating or reloading in the same browser, **Then** the choice remains selected.
3. **Given** Off, **When** time advances, **Then** no interval-driven refresh occurs and manual refresh remains available.
4. **Given** a hidden tab or offline browser, **When** intervals elapse, **Then** automatic requests pause; returning
   visible and online performs at most one catch-up refresh before resuming normal scheduling.

### User Story 3 - Recognize and operate consistent refresh buttons (Priority: P2)

A User recognizes the same compact manual refresh control on every annotated view.

**Why this priority**: Consistency reduces toolbar clutter while preserving an explicit refresh action.

**Independent Test**: Compare all nine views in English and German, with keyboard and pointer input, at wide/narrow widths.

**Acceptance Scenarios**:

1. **Given** any supported view, **When** inspecting its toolbar, **Then** manual refresh uses the same icon, size, color,
   variant, focus treatment, translated accessible name, and tooltip, with no visible text label.
2. **Given** a pending refresh, **When** observing the control, **Then** loading/disabled state lasts until all related
   view requests settle; repeated activation cannot create duplicate refresh work.
3. **Given** a refresh failure, **When** it settles, **Then** existing error feedback remains visible and manual retry works.

### Edge Cases

- Corrupt, obsolete, or unavailable preference storage falls back to 15 seconds without blocking the page.
- Failed automatic requests keep the selected interval and recover on later attempts without unhandled rejections.
- Refreshing one visible view never periodically fetches all nine views or triggers repository synchronization.
- Sync-completion events, manual actions, and scheduled refreshes arriving together share duplicate protection.
- Initial loading, filter requests, and refresh requests do not overlap for the same data source.
- Route changes during in-flight work discard obsolete results; browser suspension never creates catch-up bursts.
- Existing permission failures never expose retained results from a previous user or repository.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: Apply automatic refresh to Dashboard, All workflow runs, Awaiting approval, Needs attention, Issues,
  Pull requests, Dependency alerts, Code scanning alerts, and Secret scanning alerts.
- **FR-002**: Provide one authenticated-navbar control with Off, 15 seconds (default), 30 seconds, 1 minute, and 5 minutes.
- **FR-003**: Persist the choice in the current browser across routes/reloads, with safe validation and storage fallback.
- **FR-004**: Refresh only mounted, active supported content; release timers/listeners on disposal and sign-out.
- **FR-005**: Refresh the visible data and its associated summaries together, preserving user-selected view/query state.
- **FR-006**: Prevent overlapping refreshes for the same view across manual, interval, initial, query, and sync triggers.
- **FR-007**: Pause automatic refresh while hidden or offline; resume with at most one catch-up refresh.
- **FR-008**: Use one icon-only manual refresh design across all supported views with translated names/tooltips,
  keyboard focus, and complete loading/disabled lifetimes.
- **FR-009**: Reuse permission-scoped Repovio reads and existing error behavior; never start provider synchronization,
  change provider resources, or change server-side Polling intervals.
- **FR-010**: Supply new user-visible strings in every currently supported application locale, including English/German.
- **FR-011**: Preserve the existing workflow-run sync-completion refresh even when interval refresh is Off.

### Key Entities _(include if feature involves data)_

- **Refresh preference**: Browser-wide selected interval or Off; no credentials or repository data.
- **Active refresh target**: Currently mounted supported view, its current query, pending state, and refresh operation.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: All nine annotated views request updated data after 15 seconds of visible idle time by default.
- **SC-002**: Every interval option takes effect without reload and survives navigation/reload; Off produces zero
  interval-driven requests during a simulated five-minute observation window.
- **SC-003**: Slow-response and simultaneous-trigger scenarios show at most one in-flight refresh per active target;
  hidden/offline views issue zero scheduled requests and produce no backlog on resume.
- **SC-004**: All nine views retain applicable query/display choices after refresh and display consistent icon-only controls.
- **SC-005**: English/German browser checks pass at 390 px and 1440 px widths, including keyboard access, names, loading,
  tooltip visibility, and absence of horizontal overflow caused by the new navbar control.

## Assumptions

- “Global” means one browser-local preference for all supported views, not an administrator setting for every User or
  cross-device synchronization. The choice may be shared by Users of the same browser; it contains no private data.
- Interval options above are proposed defaults. No arbitrary interval input or per-page override is required.
- Shared monitoring components embedded in repository detail tabs inherit the same behavior only while active; unrelated
  repository-header synchronization actions keep their existing semantics and presentation.
- Jobs already has independent periodic refresh. Jobs, administration forms, notification history/popovers, application
  update prompts, and provider synchronization controls are outside the nine-view scope.
- Automatic refresh updates Repovio's stored view. Provider freshness remains governed by existing synchronization.
- Issue #91 owns this feature. Its eight tasks define implementation order; implementation requires separate approval.
