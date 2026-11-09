# Feature Specification: App-Wide User Name Presentation

**Feature Branch**: `codex/76-user-name-presentation`

**Issue**: [#76](https://github.com/repovio/repovio/issues/76)

**Created**: 2026-11-09

**Status**: Plan and tasks approved; issue and planning commit authorized; implementation pending

**Input**: User description: "User selection should always show first and last names, with usernames at most in
parentheses. Enforce this throughout the application."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Choose Users by Personal Name (Priority: P1)

As an administrator, I can identify people by their first and last names when assigning repository access, managing
group members, or selecting browser notification recipients.

**Why this priority**: These choices assign access or notification recipients to specific people.

**Independent Test**: Open every User selector with named test users and select one by personal name.

**Acceptance Scenarios**:

1. **Given** a User named Vera Viewer with username `viewer`, **When** a User selector opens, **Then** its option and
   selected value show `Vera Viewer (@viewer)`.
2. **Given** two Users with the same personal name, **When** either appears in a selector, **Then** their parenthesized
   usernames distinguish them and selection retains the correct identity.
3. **Given** a searchable selector with multiple pages, **When** an administrator searches a first name, last name,
   full name, or username, **Then** matching authorized Users can be found beyond the first page.

### User Story 2 - Recognize Users Throughout the Application (Priority: P1)

As a User, I see the same personal-name-first convention wherever the application identifies a Repovio User.

**Why this priority**: A selector-only change would leave inconsistent identities in the surrounding workflow.

**Independent Test**: Compare the same User in account navigation, administration, memberships, notification recipients,
delivery details, and identity-specific dialogs or accessible labels.

**Acceptance Scenarios**:

1. **Given** a named User, **When** their identity appears outside a selector, **Then** the first and last names are
   primary and any displayed username appears only in parentheses after the name.
2. **Given** a User's personal name changes, **When** affected data is refreshed or the screen is reopened, **Then** the
   new personal name appears consistently without changing assignments.
3. **Given** English or German is selected, **When** a User identity appears in visible text or accessible descriptions,
   **Then** the same identity convention applies and surrounding copy is localized.

### User Story 3 - Identify Accounts with Incomplete Names (Priority: P2)

As an administrator, I can still identify existing local and OIDC Users whose personal names are incomplete.

**Why this priority**: Existing accounts permit missing personal names; they must remain usable.

**Independent Test**: Compare Users with only a first name, only a last name, blank names, and no names.

**Acceptance Scenarios**:

1. **Given** only one personal-name part is available, **When** the User is displayed, **Then** that part is primary and
   the username is parenthesized.
2. **Given** both personal-name parts are absent or whitespace-only, **When** the User is displayed, **Then** the username
   is the fallback with no empty parentheses or fabricated name.

### Edge Cases

- Leading or trailing whitespace in name parts must not create extra spaces; preserve spelling, case, and Unicode.
- A personal name identical to a username must not cause duplicate identity text.
- Long names must remain identifiable with narrow layouts and keyboard or assistive-technology navigation.
- Stale search responses, loading failures, and pagination must not select a different User or overwrite newer results.
- Deleted Users in historical delivery records retain the existing missing-identity behavior.
- Provider Actors and destination-service credentials are distinct from Repovio Users.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: Every Repovio User selector MUST show available first and last names in that order, followed by the
  username in parentheses when it adds identifying information.
- **FR-002**: All other person-identifying Repovio User displays MUST use the same name-first convention. These include
  account navigation, administration, membership lists, notification summaries, delivery details, action dialogs,
  confirmations, and accessible identity text. Non-selector displays MAY omit the username.
- **FR-003**: Missing personal names MUST use the available part, or the username when no personal name is available.
  No User may become unselectable solely because their personal name is incomplete.
- **FR-004**: Searchable User selectors MUST match first name, last name, full name, and username case-insensitively while
  retaining authorization and pagination. Full-name searches MUST match all entered name tokens across personal-name
  fields; usernames MUST remain searchable as a complete entered value.
- **FR-005**: The same User MUST remain distinguishable by username in selection workflows when personal names collide.
- **FR-006**: Identity presentation MUST preserve User identity, authentication, authorization, membership assignments,
  recipient IDs, loading/error states, and keyboard interaction.
- **FR-007**: The convention MUST apply to local and OIDC Users, English and German, visible text, and accessible labels.
- **FR-008**: Showing names MUST NOT expose additional Users, credentials, or private authentication information.

### Key Entities

- **User**: A Repovio sign-in identity with a stable identifier, username, optional first name, and optional last name.
- **User identity label**: Presentation of a User's available personal name with an optional parenthesized username.
- **User selection**: An authorized choice of a User for repository membership, group membership, or browser notifications.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: All inventoried User selectors display complete personal names for named fixtures, including selected values.
- **SC-002**: All inventoried Repovio User identity displays follow the same convention; no named User is identified only
  by a bare username or a separate unparenthesized username.
- **SC-003**: First-name, last-name, full-name, and username searches find the expected authorized fixture beyond page one.
- **SC-004**: Complete, partial, absent, whitespace-only, duplicate, and Unicode name cases pass in English and German.
- **SC-005**: Access assignments and recipients retain exactly the selected User IDs; unauthorized Users remain unavailable.

## Assumptions

- Scope covers Repovio Users, not Provider Actors, Provider Accounts, or notification-service credential usernames.
- Login forms and explicit username editing fields continue to display the actual username as an editable credential.
- Existing local and OIDC profile names are authoritative; no required-name migration or provider lookup is introduced.
- Username fallback for missing names is necessary for compatibility. Existing `(@username)` punctuation is retained.
- The user approved the plan, tasks, issue #76, and planning-file commit/push. Product implementation and merge require
  separate workflow approvals.
