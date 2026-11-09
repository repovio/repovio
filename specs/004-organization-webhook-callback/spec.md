# Feature Specification: Organization Webhook Callback Field

**Feature Branch**: `codex/71-organization-webhook-callback`

**Created**: 2026-11-09

**Status**: Plan and tasks approved; issue creation and planning commit/push authorized. Implementation awaits approval.

**Issue**: [#71](https://github.com/repovio/repovio/issues/71)

**Input**: The organization webhook creation form is missing a read-only callback URL field.

## User Scenarios & Testing

### User Story 1 - Find the callback address in the setup form (Priority: P1)

A System Administrator adding an Organization Webhook finds its callback URL beside the organization and signing secret,
so manual registration at the Provider does not require finding a separate configuration card.

**Why this priority**: The callback address is essential for manual provider setup.

**Independent Test**: Open the empty form, create a configuration, and copy its callback address from the form.

**Acceptance Scenarios**:

1. Given a new configuration, when the form opens, a labeled read-only callback field is visible and explains that the
   address becomes available after saving. Copying is unavailable until a real callback address exists.
2. Given valid organization and secret inputs, when saving succeeds, the form shows the returned callback address and
   permits copying its exact value. The address cannot be edited.
3. Given an existing configuration, when it is selected for secret rotation, the form shows that configuration's callback
   address. Successful rotation preserves the address.
4. Given a populated form, when the administrator starts another configuration, removes the selected configuration, or
   closes and reopens the dialog, the form clears the previous address and restores the new-configuration explanation.
5. Given a failed creation request, when the error appears, the form does not offer a fabricated or stale address and
   retains retryable organization and secret input.

### Edge Cases

- Multiple configurations must never cause the form to display or copy another configuration's callback address.
- A callback using a public hostname different from the browser hostname must retain the supplied public hostname.
- Clipboard denial uses the existing localized error feedback.
- Long addresses remain usable on mobile without expanding the dialog beyond the viewport.
- Pending saves preserve existing loading, dismissal, validation, and secret handling behavior.

## Requirements

### Functional Requirements

- **FR-001**: Show an accessible, read-only callback URL field within the organization webhook form.
- **FR-002**: Explain address availability before the first successful save; do not display a usable-looking placeholder URL.
- **FR-003**: Display and copy the selected or newly saved configuration's actual callback address.
- **FR-004**: Clear the form's callback address when its selected configuration is cleared.
- **FR-005**: Preserve configuration cards, secret rotation, removal, and manual provider registration.
- **FR-006**: Provide English and German text and keyboard-accessible controls at desktop and mobile widths.
- **FR-007**: Preserve administrator access, request loading/error behavior, and write-only stored secrets.

### Key Entities

- **Organization Webhook**: Existing local configuration with an immutable callback address and a write-only signing secret.
- **Setup Form**: Transient organization, signing-secret, and selected-configuration presentation state.

## Success Criteria

### Measurable Outcomes

- **SC-001**: New, saved, and selected-existing form states each show exactly one labeled callback field in the form.
- **SC-002**: Every copied callback matches the configuration being edited, including after switching configurations.
- **SC-003**: Reset, successful removal, and dialog reopening expose no previous configuration's address in the form.
- **SC-004**: English desktop and German mobile journeys complete setup with no editable callback or horizontal overflow.

## Assumptions

- The callback identifier is assigned during local configuration creation; a usable address is available after saving.
- An empty read-only field with localized explanatory help satisfies the initial creation state. Preallocating callback
  addresses before saving is outside this correction's scope.
- The existing organization webhook feature is the dependency; this correction does not alter its approved artifacts.
- No new provider operations, persistence changes, releases, commits, or deployment are authorized by planning.
