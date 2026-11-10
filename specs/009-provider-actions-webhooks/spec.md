# Feature Specification: Provider Account Actions and Webhook Setup

**Feature Branch**: `codex/89-provider-actions-webhooks`

**Created**: 2026-11-10

**Status**: Planned; task generation and issue/planning-commit publication approved; implementation pending.

**Issue**: [#89](https://github.com/repovio/repovio/issues/89)

**Input**: Browser feedback on `/admin/providers`: move all row actions into a three-dot menu; redesign the
Organization Webhooks dialog and display the webhook URL directly.

## User Scenarios & Testing

### User Story 1 - Find provider account actions in one menu (Priority: P1)

A System Administrator opens one labeled three-dot menu for a Provider Account and selects the required action.

**Why this priority**: Repeated icon buttons crowd every row and obscure action labels.

**Independent Test**: Open each provider type's row menu and verify every previously available action remains reachable.

**Acceptance Scenarios**:

1. Given a Provider Account row, when rendered, it has exactly one three-dot action trigger replacing standalone actions.
2. Given an open menu, when inspecting entries, Organization Webhooks, Enable or Disable, and Delete are labeled;
   GitLab additionally offers its existing Connect or Reauthorize action with existing availability restrictions.
3. Given a pending row action, when its menu closes, the trigger remains busy and duplicate actions remain blocked until
   the complete request finishes. Deletion retains confirmation and destructive styling.
4. Given keyboard navigation, when opening and dismissing the menu, focus returns to its trigger; selecting an entry
   applies only to that row's Provider Account.

### User Story 2 - Copy the callback before saving (Priority: P1)

A System Administrator opens Organization Webhooks and immediately finds a read-only callback URL for a new local
configuration without first saving a namespace or signing secret.

**Why this priority**: Manual provider setup requires a callback address before the administrator completes registration.

**Independent Test**: Open an empty dialog, copy its callback, save valid configuration, and compare the resulting URL.

**Acceptance Scenarios**:

1. Given an account without configurations, when setup metadata finishes loading, the form displays a real, copyable
   callback URL before any save. The initial metadata request creates no stored configuration.
2. Given a copied draft callback, when the configuration is saved, its callback URL is unchanged. Help explains that
   delivery acceptance requires saving locally and registering the webhook manually at the Provider.
3. Given metadata loading or failure, when viewing the URL field, loading or retry feedback replaces a blank unexplained
   field; copying is unavailable until an actual callback is available. Failure never offers another account's URL.
4. Given failed validation or save, when retrying, the draft callback and entered values remain stable. Duplicate
   identifiers never overwrite an existing configuration.
5. Given an existing configuration selected for rotation, when editing or saving, its actual callback remains unchanged.

### User Story 3 - Complete a clear webhook setup flow (Priority: P2)

A System Administrator sees the account context, callback, organization or GitLab group, signing secret, and manual
provider instructions in a clear setup area, with existing configurations in a distinct management section.

**Why this priority**: Setup and management currently compete inside a long modal.

**Independent Test**: Complete create, switch, rotate, remove, cancel, and reopen journeys at desktop and mobile widths.

**Acceptance Scenarios**:

1. Given the dialog opens, when reading its setup area, account context and callback precede namespace and secret;
   concise provider-specific instructions and GitLab tier guidance remain available.
2. Given saved configurations, when selecting one, its namespace, URL, and receipt status remain identifiable;
   rotation requires confirmation and removal retains destructive confirmation.
3. Given a long callback or many configurations, when using a 390-pixel or 1102-pixel viewport, content remains reachable
   through bounded vertical scrolling without horizontal dialog overflow; English and German labels remain usable.
4. Given dismissal or account switching, when reopening setup, previous plaintext secrets and callback selections are
   cleared. Failed operations preserve retryable input while the dialog stays open.

### Edge Cases

- Public callback hostname differs from the browser hostname or API client base URL.
- Draft initialization fails independently of loading existing configurations; either operation remains retryable.
- Multiple dialogs or late responses must not attach draft metadata to the wrong account or a dismissed dialog.
- Abandoned drafts, identifier collisions, duplicate scopes, or a lost create response must not produce duplicate hooks.
- Clipboard denial, long nested GitLab group paths, disabled accounts, unavailable OAuth, and pending removal.
- Unsaved callbacks reject deliveries; no provider registration or signature bypass follows from previewing a URL.

## Requirements

### Functional Requirements

- **FR-001**: Replace every Provider Account row action cluster with one accessible three-dot menu.
- **FR-002**: Preserve current action availability, labels, pending states, confirmation, and account targeting.
- **FR-003**: Display a canonical, copyable callback URL before the first configuration save completes.
- **FR-004**: Keep the callback stable across form edits, save failures, successful creation, and secret rotation.
- **FR-005**: Obtain preview metadata without persisting a configuration or contacting a Provider.
- **FR-006**: Clearly distinguish unsaved setup, saved configuration, receipt history, and manual provider registration.
- **FR-007**: Organize setup above existing-configuration management with responsive, bounded scrolling and keyboard access.
- **FR-008**: Preserve administrator-only access, encrypted stored secrets, write-only stored-secret behavior, namespace
  validation, account isolation, and existing saved callback URLs.
- **FR-009**: Preserve retryable input and loading indicators for every awaited request; clear plaintext on dismissal.
- **FR-010**: Provide English and German text, accessible control names, copy feedback, and actionable errors.
- **FR-011**: Preserve existing clients that create configurations without requesting preview metadata.

### Key Entities

- **Provider Account**: Existing configured connection whose actions and webhook settings are administered locally.
- **Organization Webhook**: Existing saved, account-scoped incoming configuration with immutable callback and scope.
- **Webhook Setup Draft**: Temporary callback identity and unsaved inputs; no persistent record until explicit save.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Every row exposes exactly one action trigger; all applicable existing actions remain reachable within two
  selections from the table.
- **SC-002**: Every successful fresh-dialog setup displays and copies its final callback before any configuration save.
- **SC-003**: Copied and persisted callback URLs match in all create/retry cases; rotations preserve all existing URLs.
- **SC-004**: Preview and dismissal create zero persisted configurations and issue zero provider writes.
- **SC-005**: English and German create/rotate/remove journeys pass at 390-pixel and 1102-pixel widths with no horizontal
  modal overflow or inaccessible controls.
- **SC-006**: Unauthorized, collision, stale-response, and duplicate-click checks expose no secret or cross-account state.

## Assumptions

- “All actions” means row-specific actions in the table's Actions column; page-level Add Provider, GitHub App, and table
  controls retain their current placement.
- “Directly” means after read-only setup metadata loads and before the first save; an unsaved URL is not delivery-ready.
- Existing Organization Webhooks support is reused for all currently supported provider types.
- This request supersedes the after-save-only UX assumption in `specs/004-organization-webhook-callback` without editing
  historical artifacts. Earlier saved callbacks and the read-only provider model remain authoritative.
- Current Codex worktree is reused; planning does not authorize issue creation, commits, implementation, or deployment.
