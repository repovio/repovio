# Feature Specification: Repository Settings Navigation and Dialog Removal

**Feature Branch**: `codex/88-repository-settings-navigation` (existing Codex worktree).

**Created**: 2026-11-10

**Status**: Implemented and validated for #88; unrelated baseline add-wizard failure documented.

**Issue**: [#88](https://github.com/repovio/repovio/issues/88).

**Input**: Remove the Repository details dialog. Preserve old links through Overview redirects and retain a role-aware
explicit table link. Additionally shorten the Repository navigation label to Alerts, organize Repository Settings into
secondary tabs like Alerts, and improve narrow configuration forms and their visual layout.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Open canonical Repository pages (Priority: P1)

As an authorized User, I reach one consistent Repository detail experience from the list, search, and saved links.

**Why this priority**: Removes the duplicate administration surface without losing capabilities.

**Independent Test**: Exercise every entry point as Viewer, Manager, and System Administrator.

**Acceptance Scenarios**:

1. **Given** a Repository list, **When** a name, noninteractive row area, or search result is activated, **Then** its
   Overview opens without a Repository details dialog.
2. **Given** the explicit row action, **When** a System Administrator activates it, **Then** Settings opens; other
   authorized Users reach Overview.
3. **Given** an old quick-detail address, **When** it opens, **Then** it is replaced by the corresponding Overview
   address without adding a redundant browser-history entry.
4. **Given** an inaccessible or missing Repository, **When** any entry point opens it, **Then** existing access-denied
   or unavailable feedback appears without protected content.

### User Story 2 - Navigate focused Settings sections (Priority: P1)

As a System Administrator, I can focus on one configuration task without scrolling through unrelated cards.

**Why this priority**: Replaces the cramped settings grid with directly reachable, full-width sections.

**Independent Test**: Visit each Settings tab, reload, share its address, and use Back and Forward.

**Acceptance Scenarios**:

1. **Given** Settings, **When** it first opens, **Then** General is selected and the secondary navigation offers
   General, Webhook, Workflow filters, Members, and Group access in that order.
2. **Given** any Settings tab, **When** selected, **Then** only its configuration section is visible at full available
   content width, with one active navigation item.
3. **Given** entered but unsaved values, **When** switching Settings tabs and returning, **Then** values remain within
   the current Settings visit; pending operations finish with their feedback and loading state intact.
4. **Given** Viewer or Manager access, **When** directly visiting a Settings tab, **Then** existing administrator-only
   restrictions apply and no Settings data requests or controls are exposed.

### User Story 3 - Use readable configuration controls (Priority: P1)

As a System Administrator, I can read and operate configuration forms without clipped selectors or action buttons.

**Why this priority**: The supplied screenshot shows side-by-side cards squeezing form controls.

**Independent Test**: Exercise forms with long labels, empty tables, populated tables, and request errors at narrow and
wide viewport sizes in both languages and themes.

**Acceptance Scenarios**:

1. **Given** Workflow filters, Members, or Group access, **When** viewed at 390, 1102, or 1440 pixels, **Then** form
   controls and primary actions remain visible without document-level horizontal overflow.
2. **Given** narrow content width, **When** forms render, **Then** fields and actions wrap or stack with readable
   labels; wide layouts align controls consistently.
3. **Given** Repository navigation, **When** viewed in English or German, **Then** the alert entry reads Alerts or
   Warnungen respectively while its destination and role restrictions remain unchanged.

### Edge Cases

- Empty or repeated old dialog parameters must not select an arbitrary Repository or loop.
- Missing, unknown, empty, or repeated Settings tab values must resolve predictably to General.
- Repository changes must clear prior drafts, errors, webhook secrets, and pending display state.
- Slow responses must not be shown for a different Repository or a closed Settings visit.
- Existing legacy administration routes and Settings anchors must continue to resolve.
- Back navigation from Settings must refresh list metadata and badges using existing list initialization.
- Deletion confirmation remains available; successful deletion returns to a valid list without repeating deletion.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: Remove the Repository details dialog and all entry points that generate its addresses.
- **FR-002**: Repository names, row navigation, and global-search results MUST open Overview. The explicit table action
  MUST open Settings for System Administrators and Overview for other authorized Users.
- **FR-003**: Old quick-detail links MUST resolve to Overview using replacement navigation, retaining unrelated address
  state and existing legacy-anchor behavior.
- **FR-004**: Repository Settings MUST expose five secondary tabs: General, Webhook, Workflow filters, Members, and
  Group access; General is the default. Selection MUST survive shared links, reload, and browser history.
- **FR-005**: Each tab MUST use the full available content width. Workflow filters, Members, and Group access MUST no
  longer share a two-column card grid.
- **FR-006**: Forms MUST use consistent spacing, visible labels, aligned actions, and useful empty/error/loading states.
  Controls MUST wrap or stack before they clip. Wide tables MAY scroll inside their own containers.
- **FR-007**: All existing retention, webhook, Workflow Filter, Repository Membership, and Repository Group Grant
  operations MUST remain available with existing validation, authorization, confirmations, and pending-state behavior.
- **FR-008**: Switching Settings tabs MUST preserve current-visit drafts and pending operations. Leaving Settings or
  changing Repository MUST release that visit's state, including generated secrets.
- **FR-009**: Shorten only the Repository navigation label to Alerts in English and Warnungen in German. Security Alert
  terminology, category names, routes, and underlying domain contracts MUST remain unchanged.
- **FR-010**: Keyboard focus, active navigation indicators, English/German text, and light/dark readability MUST work
  at 390, 1102, and 1440 pixels without overlapping controls or document-level horizontal overflow.
- **FR-011**: Preserve read-only Provider integrations and existing role restrictions; no backend or data migration is
  part of this feature.

### Key Entities

- **Repository**: Existing tracked resource; its identity scopes every configuration section.
- **Settings Section**: A selected presentation section; not a new stored domain entity.
- **Repository Membership / Repository Group Grant / Workflow Filter**: Existing configuration entities, unchanged.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: All identified Repository entry points reach canonical pages; zero Repository details dialogs appear.
- **SC-002**: All five Settings sections are reachable with one secondary-navigation activation and restore after reload
  and Back/Forward.
- **SC-003**: Every existing configuration capability remains operable; no protected controls appear for unauthorized
  roles.
- **SC-004**: Every tested viewport/language/theme combination has zero clipped form actions, overlapping controls, or
  document-level horizontal overflow.
- **SC-005**: Tab switches lose zero current-visit unsaved values and do not interrupt awaited operations.

## Assumptions

- Five separate tabs provide the requested focus; Members and Group access remain separate for full-width forms.
- The earlier approved dialog-removal decisions remain binding. This feature supersedes only the quick-detail-dialog
  preservation requirements of `../002-repository-detail-navigation/spec.md`; other navigation guarantees remain.
- The shorter Alerts label is presentation shorthand for the unchanged Security Alert domain term.
- Task generation and issue/planning-commit creation were separately approved on 2026-11-10. Product implementation
  and merge still require separate approval.
