# Feature Specification: Repository Detail Navigation and Table Interactions

**Feature Branch**: `codex/62-repository-detail-navigation`

**Created**: 2026-11-09

**Status**: Draft

**Issue**: [#62](https://github.com/repovio/repovio/issues/62)

**Input**: Provide per-Repository detail navigation through Overview, Workflow Runs, Issues, Pull Requests, Security
Alerts, and Settings. Make data rows open existing internal detail pages and highlight data rows across all tables.
Follow-up decisions select a separate Settings section, security category selection, and hover-only behavior for rows
without an existing internal detail page. The current delivery prepares this specification only, after the issue and
branch.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Browse Repository Sections (Priority: P1)

As a User with Repository access, I can navigate its sections without repeatedly selecting the Repository in global
lists.

**Why this priority**: Repository-focused navigation is the primary requested workflow.

**Independent Test**: Open an accessible Repository, visit each permitted section, reload it, and use browser Back and
Forward. Verify the selected Repository and active section throughout.

**Acceptance Scenarios**:

1. **Given** a System Administrator viewing a Repository, **When** its detail page opens, **Then** Overview is active
   and
   horizontal toolbar navigation offers Overview, Workflow Runs, Issues, Pull Requests, Security Alerts, and Settings in
   that order.
2. **Given** an accessible Repository, **When** the User selects a permitted section, **Then** its shareable address
   opens,
   the Repository identity remains visible, and exactly that section is marked active.
3. **Given** a permitted section address, **When** it is opened directly, reloaded, or revisited using browser Back or
   Forward, **Then** the correct Repository and section appear.
4. **Given** Overview, **When** it loads, **Then** Repository metadata, synchronization status, and permitted recent
   activity previews appear; preview section links lead to that Repository's corresponding sections.
5. **Given** a Repository section, **When** a different Repository opens, **Then** the previous Repository's activity is
   never presented as belonging to the newly selected Repository.

---

### User Story 2 - Inspect Repository Activity and Security (Priority: P1)

As an authorized User, I can browse Workflow Runs, Issues, Pull Requests, and available Security Alerts for one
Repository.

**Why this priority**: Section content must consistently match the selected Repository to be trustworthy.

**Independent Test**: With two accessible Repositories containing distinct records, browse each activity section and use
search, filters, sorting, and pagination. Switch among the three security categories as an authorized User.

**Acceptance Scenarios**:

1. **Given** multiple accessible Repositories, **When** the User browses one Repository's activity, **Then** only its
   corresponding records appear, including after search, filtering, sorting, and pagination; controls cannot broaden the
   list to other Repositories.
2. **Given** an authorized User in Security Alerts without a selected category, **When** it opens, **Then** Dependencies
   is selected and Code and Secrets are also selectable without losing the Repository context.
3. **Given** a selected security category, **When** its address is reloaded, shared, or revisited through browser
   history,
   **Then** that same category is selected and only matching alerts for the selected Repository appear.
4. **Given** an unavailable category for the Repository, **When** it is selected, **Then** an unavailable state is shown
   rather than an available category with no findings; other Repositories' availability does not affect that state.
5. **Given** a Repository section, **When** it loads, **Then** displayed totals and metrics describe only that
   Repository;
   global summaries without a Repository-specific meaning are omitted.
6. **Given** no matching records or a failed activity load, **When** the section renders, **Then** relevant empty or
   error
   feedback appears without stale records, and a failed activity load can be retried.

---

### User Story 3 - Open Existing Details from Table Rows (Priority: P1)

As a User browsing a table, I can open its record's existing internal detail page without targeting only a title link.

**Why this priority**: Whole-row navigation directly improves entry into Repository and record details.

**Independent Test**: Click noninteractive areas of Repository, Issue, Pull Request, and Security Alert rows in global
and
Repository-scoped lists. Separately exercise embedded controls and tables without an internal detail destination.

**Acceptance Scenarios**:

1. **Given** a Repository data row, **When** the User clicks a noninteractive cell or unused row area, **Then** that
   Repository's internal Overview opens exactly once.
2. **Given** an Issue, Pull Request, or Security Alert data row, **When** a noninteractive row area is clicked, **Then**
   the existing internal detail page for that exact record opens exactly once.
3. **Given** an embedded link, button, checkbox, menu, or input, **When** it is operated, **Then** only that control's
   intended action occurs, without additional row navigation or duplicate activation.
4. **Given** a row without an existing internal detail destination, including Workflow Runs, **When** a noninteractive
   row area is clicked, **Then** no navigation, selection, or editing dialog occurs; explicit controls retain behavior.
5. **Given** keyboard navigation, **When** a User focuses and activates an existing detail link, **Then** the same
   internal
   detail page is reachable with visible focus and embedded controls remain independently operable.
6. **Given** a header, loading placeholder, or empty-state row, **When** it is clicked, **Then** no record navigation
   occurs.

---

### User Story 4 - Preserve Access and Administration (Priority: P1)

As a User, I can access only permitted Repository sections. As a System Administrator, I can reach existing
configuration
in a dedicated Settings section.

**Why this priority**: Navigation changes must preserve authorization and existing administration capabilities.

**Independent Test**: Browse assigned and unassigned Repositories as Viewer, Manager, and System Administrator. Visit
restricted section addresses directly and verify administrators retain existing Settings operations.

**Acceptance Scenarios**:

1. **Given** a Viewer with Repository access, **When** its detail page opens, **Then** Overview, Workflow Runs, Issues,
   and
   Pull Requests are available; Security Alerts and Settings are hidden and direct visits disclose no restricted data.
2. **Given** a Manager with Repository access, **When** its detail page opens, **Then** Security Alerts is also
   available;
   administrator-only Settings and actions remain inaccessible, including through direct visits.
3. **Given** a System Administrator, **When** Settings opens, **Then** existing general configuration, webhook
   configuration, Workflow Filters, Repository Memberships, and User Group grants are available there instead of
   Overview.
4. **Given** a missing or inaccessible Repository, **When** any section address opens, **Then** an access-denied or
   not-found state appears without exposing protected content.
5. **Given** an administrator operation awaiting completion, **When** its initiating control is observed, **Then** it
   remains loading for the complete operation and reports the result using existing behavior.

---

### User Story 5 - Recognize Hovered Rows across All Tables (Priority: P2)

As a User, I can distinguish the data row under my pointer consistently throughout the application.

**Why this priority**: Consistent feedback improves scanning in navigable and display-only tables alike.

**Independent Test**: Hover data rows in navigation, administration, selection, embedded, and display-only tables in
both
supported themes. Verify feedback without changes to selection or data.

**Acceptance Scenarios**:

1. **Given** any application table with data, **When** the pointer enters a data row, **Then** a visible, consistent row
   highlight appears and clears when the pointer leaves, without modifying selection or data.
2. **Given** a navigable row, **When** the pointer rests on a noninteractive area, **Then** the cursor communicates
   navigation; rows without detail destinations do not imply row actions through their cursor.
3. **Given** pinned columns or embedded controls, **When** a row is hovered, **Then** all its visible cells present a
   consistent highlight while controls remain legible and usable in light and dark themes.

### Edge Cases

- Slow responses for previous Repositories or security categories must not replace current content.
- Loading, empty, failed, unavailable, and access-denied states must not appear as successful zero-result summaries.
- A Repository or category with fewer results must not remain stranded on a previous selection's pagination position.
- Persisted global or other Repository filters must not remove Repository restrictions or silently affect unrelated
  views.
- Invalid security-category selections fall back to Dependencies; valid selections survive reload and browser history.
- Long Repository names, German labels, and narrow screens must not hide navigation or overlap controls.
- Successful local Repository deletion through existing controls must return the User to a valid Repository list.
- Existing Repository detail links and quick-detail dialog addresses must continue to work.
- Hover must preserve selected, disabled, pending, and keyboard-focus feedback without implying an unavailable action.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST provide horizontal Repository toolbar navigation for Overview, Workflow Runs, Issues,
  Pull Requests, Security Alerts, and Settings, in that order, subject to existing permissions.
- **FR-002**: Every permitted section MUST have a shareable address, identify its Repository and active section, and
  support direct visits, reload, and browser history. Overview MUST be the default Repository destination.
- **FR-003**: Overview MUST show metadata, synchronization status, and permitted recent activity previews. Preview
  section
  links MUST open corresponding Repository sections. Administration forms MUST reside in Settings.
- **FR-004**: Settings MUST retain existing general, webhook, Workflow Filter, Repository Membership, and User Group
  grant
  controls and their permissions. Existing administrator actions MUST remain available to authorized Users.
- **FR-005**: Activity sections MUST list only the selected Repository's corresponding records, with search, filtering,
  sorting, and pagination. User controls MUST NOT remove or broaden the Repository restriction.
- **FR-006**: Repository views MUST NOT display global summaries as Repository metrics. Metrics without an available
  Repository-specific meaning MUST be omitted from those views.
- **FR-007**: Security Alerts MUST offer Dependencies, Code, and Secrets, default to Dependencies, and preserve valid
  selections through shareable addresses, reload, and browser history.
- **FR-008**: Security rows and availability messages MUST describe only the selected Repository and category.
  Unavailable security data MUST be distinguishable from an available category containing no findings.
- **FR-009**: Existing Repository access restrictions MUST remain enforced. Security Alerts MUST remain limited to
  Managers and System Administrators; Settings and administrator-only actions MUST remain administrator-only. Direct
  visits MUST enforce the same restrictions as navigation.
- **FR-010**: Clicking a noninteractive area of a data row with an existing internal detail destination MUST open that
  record's detail page once, including Repository, Issue, Pull Request, and Security Alert lists throughout Repovio.
- **FR-011**: Rows without existing internal detail destinations MUST receive no new row-level action. This feature MUST
  NOT add Workflow Run detail pages, row-triggered editing dialogs, or row-triggered selection behavior.
- **FR-012**: Embedded links, buttons, checkboxes, menus, and inputs MUST retain intended behavior without triggering
  row
  navigation. Existing detail links MUST remain keyboard-accessible with visible focus.
- **FR-013**: Every application table MUST consistently highlight hovered data rows, including embedded, administrative,
  selection, and display-only tables, without changing data or selection.
- **FR-014**: Navigable rows MUST communicate navigation through the pointer cursor; non-navigable rows MUST NOT imply a
  row action. Headers, loading placeholders, and empty-state rows MUST NOT navigate to records.
- **FR-015**: Repository or category changes MUST NOT present stale content as belonging to the new selection. Global
  lists and distinct Repository sections MUST NOT impose unrelated filter or pagination state on one another.
- **FR-016**: Sections MUST provide loading, empty, error, retry, and denied-access feedback as applicable. Existing
  action
  controls MUST remain loading throughout every operation they await.
- **FR-017**: Added visible text MUST exist in English and German. Navigation, hover feedback, and controls MUST remain
  usable at 375-pixel and 1440-pixel viewport widths in light and dark themes. Horizontal navigation MUST be scrollable
  when it exceeds the available width.
- **FR-018**: Existing global lists, Repository detail links, quick-detail dialog addresses, and explicit table controls
  MUST remain functional except for the specified addition of row navigation and consistent hover feedback.
- **FR-019**: Repovio MUST preserve its read-only relationship with Providers. Existing local configuration and
  synchronization controls MUST NOT gain the ability to modify Provider resources.

### Key Entities

- **Repository**: A tracked Provider repository; the shared context for its Overview, activity, Security Alerts, and
  Settings. Existing identity and access rules remain authoritative.
- **Workflow Run**: One Workflow execution associated with a Repository, listed without a new internal detail
  destination.
- **Issue / Pull Request**: Repository Work Items with existing internal detail destinations used by row navigation.
- **Security Alert**: A dependency, code, or secret finding whose visibility and availability depend on existing
  permissions and Provider support.
- **User**: A Repovio identity whose Global Role and Repository access determine sections and available controls.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A System Administrator can reach all six sections from any Repository section with one navigation
  activation. Viewers see four sections and Managers see five, consistent with existing permissions.
- **SC-002**: Every permitted section address restores the correct Repository and active section after direct
  navigation,
  reload, and browser Back and Forward in the acceptance scenarios.
- **SC-003**: With two accessible Repositories containing distinct records, zero records or displayed metrics from the
  other Repository appear after search, filtering, sorting, or pagination within the selected Repository's activity.
- **SC-004**: All three security categories can be selected and restored through a shared address; unavailable and empty
  fixtures produce distinct outcomes for the selected Repository.
- **SC-005**: One click opens the correct internal detail page for all four navigable resource families.
  Embedded-control
  scenarios produce zero additional row navigations; rows without detail pages produce zero new row actions.
- **SC-006**: Every inventoried application table with data shows visible hover feedback in both themes. Keyboard Users
  can reach every permitted section and existing detail link without a pointer.
- **SC-007**: Viewer, Manager, and System Administrator scenarios disclose zero records or controls
  forbidden for the tested User through navigation or direct section visits.
- **SC-008**: All section destinations and affected table controls remain reachable without overlapping controls at both
  specified viewport widths in English and German, in light and dark themes.

## Assumptions

- Existing authentication, Repository access, Security Alert role restrictions, and administrator-only controls remain
  unchanged. This feature does not expand Manager configuration privileges.
- Existing activity lists, detail destinations, and Repository administration capabilities remain the basis of the
  experience. No new Provider capabilities, data collection, or security categories are requested.
- Global summaries do not currently provide Repository-specific metrics; omitting those summaries in Repository
  sections satisfies this feature without introducing new metrics.
- Quick-detail dialogs remain available; whole-row navigation opens full internal details instead of dialogs.
- English and German remain supported. Dependencies remains the default security category.
- The current delivery ends after this specification, its reviewed checklist, and active feature selection. Technical
  planning, task generation, product implementation, commits, and publication require a later instruction.
