# Feature Specification: Sidebar Menu Icon

**Feature Branch**: `codex/sidebar-menu-icon`, based on `779265e`.
**Created**: 2026-11-10
**Status**: Implemented and verified; commit, push, and PR creation requested.
**Input**: Browser comment on the dashboard's “Open sidebar” control: use three lines, Tabler menu-2.

## User Scenarios & Testing

### User Story 1 - Recognize and Open Navigation (Priority: P1)

As a user viewing the dashboard with the sidebar hidden, I recognize the navigation button by its three-line menu
symbol and use it to open the sidebar.

**Why this priority**: This is the exact control and visual correction requested in the browser comment.

**Independent Test**: At the reported 982 × 1134 viewport, inspect the closed-sidebar button, activate it, and verify
navigation opens. Repeat with keyboard activation and a narrow viewport.

**Acceptance Scenarios**:

1. **Given** the sidebar is hidden, **When** the dashboard loads, **Then** its open control shows three horizontal lines
   matching the requested Tabler menu-2 symbol.
2. **Given** the open control is visible, **When** activated by pointer or keyboard, **Then** navigation opens as before.
3. **Given** the sidebar is open, **When** dismissed, **Then** the same three-line open control remains available.
4. **Given** English or German and either supported theme, **When** the control appears, **Then** its accessible name,
   visibility, and interaction remain intact.

### Edge Cases

- Below the desktop breakpoint, the menu symbol must load without an external icon request.
- On desktop, preserve the existing dedicated collapse/expand controls and persisted sidebar behavior.
- Opening and closing navigation must not change the current route or require a page reload.

## Requirements

### Functional Requirements

- **FR-001**: The selected “Open sidebar” control MUST display three horizontal lines using the requested menu-2 symbol.
- **FR-002**: Existing pointer activation, keyboard activation, dismissal, and navigation behavior MUST remain intact.
- **FR-003**: Existing accessible labels and English/German behavior MUST remain intact.
- **FR-004**: The icon MUST render from the application's bundled assets without external icon services.
- **FR-005**: Desktop collapse/expand controls, surrounding layout, and sidebar preferences MUST remain intact.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Visual inspection at 982 × 1134 and 390 × 844 shows exactly three horizontal menu lines.
- **SC-002**: Pointer and keyboard opening plus dismissal pass in English and German.
- **SC-003**: Both light and dark themes show a visible icon; desktop collapse/expand remains functional at 1440 × 900.
- **SC-004**: No external icon request is needed to render the control.

## Assumptions

- The browser comment requests an icon correction only; no redesign of sidebar behavior or layout is required.
- Reuse the current menu-icon mapping and existing bundled Tabler collection.
- No matching active issue exists among the open issues inspected during planning; issue creation is not authorized.
