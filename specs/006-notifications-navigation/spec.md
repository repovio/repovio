# Feature Specification: Simplify Notifications Navigation

**Feature Branch**: `codex/notifications-navigation`.

**Created**: 2026-11-09

**Status**: Implemented and locally verified; PR creation requested.

**Input**: Keep only one Notifications menu item opening the channel page. Delivery history is reached through the
channel page toolbar button.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Open Notification Channels Directly (Priority: P1)

As a signed-in User, I want one Notifications menu item that opens Notification Channels immediately.

**Why this priority**: Removes an unnecessary navigation level and duplicate notification destinations.

**Independent Test**: Select Notifications from another screen and verify that the channel page opens in one action.

**Acceptance Scenarios**:

1. **Given** the expanded application sidebar, **When** a User selects Notifications, **Then** the channel page opens
   without expanding a submenu, and no Channels or Delivery history child entries appear.
2. **Given** a collapsed sidebar or mobile navigation, **When** a User selects Notifications, **Then** the same page opens
   and its localized accessible name identifies Notifications.
3. **Given** application navigation search, **When** a User searches notification destinations, **Then** one Notifications
   destination opens channels, with no separate Channels or Delivery history destination.

### User Story 2 - Open Administrative Delivery History from the Toolbar (Priority: P2)

As a System Administrator, I want to open Notification Delivery history from the channel page toolbar.

**Why this priority**: Keeps history available without a permanent menu entry.

**Independent Test**: Open channels, select Delivery history in the toolbar, and return using the Notifications breadcrumb.

**Acceptance Scenarios**:

1. **Given** a System Administrator on channels, **When** Delivery history is selected in the toolbar, **Then** delivery
   history opens and Notifications remains the active application menu item.
2. **Given** a Viewer or Manager, **When** channels opens, **Then** no administrative history toolbar button appears and
   existing direct-access restrictions remain enforced.
3. **Given** a bookmarked history page, **When** a System Administrator opens it, **Then** history still loads and the
   Notifications breadcrumb returns to channels.

### Edge Cases

- Both English and German use localized menu and toolbar labels.
- Empty or failed channel loading does not remove the administrator's toolbar history entry point.
- Direct navigation, refresh, and browser back/forward preserve active menu state on channels and history.
- The private recent-notification bell popover is separate from administrative Delivery history and stays unchanged.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: Application navigation MUST contain exactly one Notifications link that opens channels in one action.
- **FR-002**: Notifications MUST have no expandable submenu or separate Channels and Delivery history menu entries.
- **FR-003**: Application navigation search MUST expose Notifications as the sole notification-page destination.
- **FR-004**: The channel toolbar MUST remain the only in-app entry point to administrative Delivery history.
- **FR-005**: Existing history bookmarks and administrator-only authorization MUST remain valid.
- **FR-006**: Notifications MUST remain active throughout channel and history navigation, including page refresh.
- **FR-007**: Desktop, collapsed, and mobile navigation MUST preserve accessible localized labels in English and German.
- **FR-008**: Channel management, notification delivery, and personal recent-notification behavior MUST remain unchanged.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Each navigation presentation exposes one Notifications destination and zero notification child entries.
- **SC-002**: Users reach channels with one menu selection; administrators reach history with one additional toolbar action.
- **SC-003**: English and German scenarios pass across expanded, collapsed, and mobile navigation.
- **SC-004**: Viewer and Manager scenarios expose zero administrative history entry points; direct-access checks still deny
  unauthorized history access.

## Assumptions

- Existing channel and administrative history locations remain stable; bookmarks are not application menu entry points.
- The request covers shared application navigation, including navigation search, rather than only hiding sidebar children.
- Existing role visibility and history authorization remain authoritative.
- No backend, persistence, delivery, provider, dependency, or glossary change is required.
- The user explicitly requested implementation and PR creation on 2026-11-09. No matching active issue exists; the PR
  tracks this requested scope and may reference the closed notification redesign issue #65 for context. No new issue
  creation, merge, or deployment is authorized.
