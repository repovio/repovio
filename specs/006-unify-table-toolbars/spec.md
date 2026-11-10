# Feature Specification: Consistent Table Toolbars

**Feature Branch**: `79-unify-monitoring-list-toolbars-and-merge-user-groups-header-controls`
**Feature Identifier**: `006-unify-table-toolbars`
**Created**: 2026-11-09
**Status**: Implemented and feature-verified on 2026-11-10; see [evidence.md](evidence.md) for baseline exceptions.
**Input**: Browser comments 1–5 request toolbars like Workflow runs on Issues, Pull requests, Dependency alerts,
Code scanning alerts, and Secret scanning alerts. Comment 6 requests merging User groups controls into the toolbar above.
**Tracking**: [GitHub issue #79](https://github.com/repovio/repovio/issues/79). Planning commit/push approved.

## User Scenarios & Testing

### User Story 1 - Use consistent monitoring controls (Priority: P1)

As a User, I can recognize and use the same compact toolbar arrangement across Workflow runs and the five marked lists.

**Why this priority**: Inline filter controls currently crowd the breadcrumbs and wrap into multiple rows.

**Independent Test**: Compare each marked list with Workflow runs; search and common actions occupy the header,
while specialized criteria remain reachable through filtering.

**Acceptance Scenarios**:

1. **Given** any of the five lists, **When** I open it at the supplied 1065-pixel viewport width,
   **Then** its toolbar shows breadcrumbs, search, refresh, sorting, filtering, and column options without inline
   Labels, Path, or date controls.
2. **Given** Issues or Pull requests, **When** I select multiple labels and an updated-date range through filtering,
   **Then** results retain the existing all-selected-labels match and inclusive UTC date-boundary behavior.
3. **Given** Code scanning alerts, **When** I select a path and updated-date range through filtering,
   **Then** results retain the existing path and date constraints.
4. **Given** any alert list, **When** data is unavailable or results are empty,
   **Then** availability messages, summary cards, and empty states remain visible as before.

### User Story 2 - Manage groups from one header (Priority: P1)

As a System Administrator, I can search, sort, and create User Groups from the breadcrumb toolbar.

**Why this priority**: A separate controls row consumes space and differs from other list pages.

**Independent Test**: Open User groups and exercise search, sorting, and New group from one header.

**Acceptance Scenarios**:

1. **Given** User groups, **When** I open the page, **Then** breadcrumbs, search, sorting, and New group share
   one page toolbar, with no second table-controls row.
2. **Given** the merged toolbar, **When** I create or rename a group, manage members, or delete a group,
   **Then** existing dialogs, permissions, pending states, errors, and refresh behavior remain functional.

### User Story 3 - Use controls across sizes and languages (Priority: P2)

As a User, I can access every control on narrow screens, in English or German, and with the keyboard.

**Why this priority**: Compact layouts must remain usable beyond the supplied desktop screenshots.

**Independent Test**: Repeat toolbar navigation at 390, 1065, and 1440 pixels in both languages.

**Acceptance Scenarios**:

1. **Given** a narrow screen or long German labels, **When** controls wrap, **Then** no control is clipped,
   the page has no horizontal overflow, and all controls remain reachable.
2. **Given** filtering or sorting is open, **When** I navigate with the keyboard and dismiss it,
   **Then** labels, focus visibility, dismissal, and focus return remain usable.

### Edge Cases

- Empty label/path options and options loading must not hide active criteria or discard current values.
- Empty, loading, and failed requests must preserve toolbar access and current filters.
- Multiple labels retain AND matching; blank dates remain unbounded; existing date validation stays unchanged.
- Dashboard presets and persisted table filtering must not lose constraints when a popover closes or reopens.
- Repository-scoped embedded lists must retain their Repository constraint and must not gain Provider switching.
- Refresh remains loading until table and supporting requests finish.
- Table horizontal scrolling and pagination must remain usable independently of toolbar wrapping.

## Requirements

### Functional Requirements

- **FR-001**: The five marked monitoring lists MUST use the Workflow runs arrangement of visible toolbar controls.
- **FR-002**: Labels, Code scanning Path, and updated-date bounds MUST move into the filtering surface and retain
  their current behavior; no filtering capability may be removed.
- **FR-003**: Filtering MUST indicate active specialized criteria even when generic filters are empty.
- **FR-004**: User groups MUST merge search, sorting, and New group into its breadcrumb toolbar with one state owner.
- **FR-005**: Existing table actions, summaries, warnings, pagination, errors, dashboard presets, and permissions
  MUST retain their behavior.
- **FR-006**: Controls MUST remain keyboard-accessible and localized in English and German.
- **FR-007**: All six pages MUST avoid page-level horizontal overflow at 390, 1065, and 1440 pixels;
  necessary responsive wrapping is allowed.
- **FR-008**: Shared embedded versions of the affected lists MUST preserve their existing local toolbar and scope.
- **FR-009**: This change MUST NOT add provider mutations, new permissions, or new data-management operations.

### Key Entities

- **List criteria**: Existing search, selected labels or path, updated-date bounds, sorting, and column preferences.
- **User Group**: Existing local group; creation, membership, rename, and deletion semantics remain unchanged.

## Success Criteria

### Measurable Outcomes

- **SC-001**: All five monitoring lists show the same visible control categories as Workflow runs.
- **SC-002**: User groups renders exactly one header containing breadcrumbs and its three existing control types.
- **SC-003**: All existing label, path, date, sorting, column, pagination, and group-management acceptance flows pass.
- **SC-004**: All six pages pass overflow and control-reachability checks at all three stated viewport widths.
- **SC-005**: Keyboard and English/German checks pass for every moved control, including active-filter indication.

## Assumptions

- “Like workflow runs” means keeping search and compact action buttons in the breadcrumb header, with detailed
  criteria behind filtering. It does not request changing Workflow runs itself.
- Only the six marked pages and shared implementations directly required by them are in scope.
- There is no request to remove filter capabilities or redesign summary cards, tables, or provider integration.
- Existing invalid-date behavior is preserved; redesigning validation is outside scope.
- Production screenshots describe the problem; local source defines the implementation baseline.
