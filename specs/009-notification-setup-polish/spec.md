# Feature Specification: Notification Setup Follow-up

**Feature Branch**: `codex/90-notification-setup-polish`

**Issue**: [#90](https://github.com/repovio/repovio/issues/90)

**Created**: 2026-11-10

**Status**: Planning and tasks approved; issue created; implementation approved

**Input**: Four browser comments on `/notifications`: use an icon-only Delivery history action; resolve unavailable
Browser push; use the Nuxt UI stepper; place wizard navigation in the modal footer.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Understand and use Browser push (Priority: P1)

A System Administrator can select Browser push when the server supports it, or understand and recover from the specific
condition preventing selection. Configuring a global Notification Channel does not require enrolling this device.

**Why this priority**: An unexplained disabled option blocks channel setup.

**Independent Test**: Exercise server availability, disabled configuration, delayed response, and failed-read recovery
without requiring a real notification to be sent.

**Acceptance Scenarios**:

1. **Given** configured server push, **When** setup opens and availability resolves, **Then** Browser push is selectable,
   including when this device lacks support or has default or denied permission.
2. **Given** server push is unconfigured, **When** setup opens, **Then** Browser push stays disabled and an adjacent
   explanation identifies missing server setup without revealing credentials.
3. **Given** a pending or failed availability read, **When** setup opens, **Then** checking and error states are distinct
   from unconfigured; retry can recover selection without reloading the page.
4. **Given** an existing Browser push channel and unavailable server push, **When** editing, **Then** the existing type,
   recipients, and rules remain inspectable and the server availability warning remains visible.

### User Story 2 - Navigate channel setup consistently (Priority: P2)

Administrators see four clear setup steps and reach Back, Next, and Save in a consistent modal footer.

**Why this priority**: The current wrapping numbered list and body actions obscure progress and navigation.

**Independent Test**: Create and edit a channel through identity, destination, events, and review with keyboard and pointer.

**Acceptance Scenarios**:

1. **Given** a new channel, **When** setup opens, **Then** progress uses the requested Nuxt UI stepper, showing the current
   step and all four localized labels.
2. **Given** invalid current-step input, **When** moving forward by any control, **Then** validation prevents advancement
   and saving; backward navigation preserves valid draft values.
3. **Given** a long or narrow setup dialog, **When** body content scrolls, **Then** footer actions remain reachable without
   horizontal overflow or obscuring fields.
4. **Given** review, **When** Save or Enter submits, **Then** full validation runs, exactly one write occurs, and loading
   lasts through persistence and the awaited list refresh. A refresh-only retry does not duplicate the write.

### User Story 3 - Open Delivery history compactly (Priority: P3)

System Administrators open Delivery history through a compact icon action with an accessible localized name.

**Why this priority**: The visible label consumes toolbar space unnecessarily.

**Independent Test**: Focus and activate the toolbar history link in English and German.

**Acceptance Scenarios**:

1. **Given** administrator access, **When** viewing the toolbar, **Then** history displays only its icon, offers a localized
   tooltip and accessible name, and navigates to `/notifications/history`.
2. **Given** Manager or Viewer access, **When** viewing notifications or opening history directly, **Then** existing access
   restrictions remain effective.

### Edge Cases

- Slow and failed status reads, retry, close/reopen, overlapping reads, and account changes cannot publish stale state.
- Editing a saved channel preserves write-only credentials and fixed channel type.
- Step indicator clicks and keyboard activation cannot bypass validation or mutate state while saving or refreshing.
- Enter before review cannot save; validation failures and step changes preserve focus behavior.
- Failed persistence and successful persistence followed by failed refresh have distinct retry behavior.
- Missing device support, denied permission, inactive worker, and no subscriptions do not imply missing server setup.
- Long German labels and small viewports retain usable step indicators and footer actions.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: Delivery history MUST use an icon-only toolbar link with localized tooltip and accessible name, preserving
  its route, keyboard operation, and System Administrator visibility.
- **FR-002**: Setup MUST represent pending availability, configured availability, unconfigured server push, and failed
  availability reads distinctly, with an explanation outside any disabled select option.
- **FR-003**: Setup MUST refresh server availability when opened and permit an explicit retry after failure or setup
  changes. The initiating retry control MUST remain loading for the full request lifetime.
- **FR-004**: Available server push MUST permit Browser push selection independently of this device's permission,
  support, or enrollment. Passive reads MUST NOT prompt for permission or enroll a device.
- **FR-005**: Unconfigured server push MUST remain blocked for new selection; the interface MUST identify required
  server configuration without exposing secrets. Existing channel edits MUST retain their data and server validation.
- **FR-006**: The four-step indicator MUST use the requested Nuxt UI stepper and preserve step validation, draft data,
  focus management, and protection against early or duplicate writes.
- **FR-007**: Back, Next, Save, and refresh-only retry MUST use the modal footer slot; Save MUST execute the existing full
  form validation and awaited persistence lifecycle.
- **FR-008**: Changed text MUST have English and German translations and remain usable at desktop and narrow widths.
- **FR-009**: Existing authorization, encrypted credentials, event rules, preview behavior, idempotent delivery, and
  read-only provider integration MUST remain intact.

### Key Entities _(include if feature involves data)_

- **Notification Channel Draft**: In-memory identity, destination, recipients, event selections, preview, and current step.
- **Server Push Availability**: Authenticated non-secret readiness result plus client read lifecycle.
- **Device Push State**: This User's browser capability, permission, and enrollment, independent of global channel setup.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: All four availability scenarios in Story 1 show the correct distinct state; failed reads recover through a
  single explicit retry after the server responds successfully.
- **SC-002**: All six existing channel types complete setup; invalid input cannot advance, including through step clicks.
- **SC-003**: Each save flow produces exactly one channel write even after repeated clicks or a failed list refresh.
- **SC-004**: History has no visible text label, retains its localized accessible name, and opens the same authorized route.
- **SC-005**: English and German checks at 390x844 and 1102x1134 show all four steps and reachable footer controls with
  no horizontal overflow. Keyboard navigation retains meaningful focus.

## Assumptions

- This is a follow-up to merged notifications PR #68, not a continuation of its completed task checklist.
- Issue [#90](https://github.com/repovio/repovio/issues/90) records the approved planning scope. Planning commit/push is
  authorized; product implementation and per-task commits are approved. Merge and deployment remain separate.
- Production's disabled option is evidence of a symptom, not proof that VAPID configuration is missing.
- Existing Web Push transport and deployment environment loading are reused. No new transport, automatic key generation,
  database migration, dependency upgrade, or production configuration mutation is included.
- Real push delivery and OS display require separate browser/device evidence; deterministic mocked tests do not prove them.
