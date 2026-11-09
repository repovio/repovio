# Feature Specification: Notifications Redesign

**Feature Branch**: `codex/003-notifications-redesign`

**Created**: 2026-11-09

**Status**: Implemented locally; live network-push and physical OS-click acceptance pending

**Input**: Redesign notifications: combine breadcrumb and table toolbars on channels and delivery history,
add delivery-history navigation, repair browser push, create channels through four steps, and replace the browser
notifications banner with a navbar notification button and recent history.

## Scope and Authority

The active implementation issue is [#65](https://github.com/repovio/repovio/issues/65), created at the user's explicit request on
2026-11-09. This scope covers only that issue and its direct dependencies. Issue #62 concerns repository detail
navigation and remains outside this feature. The user approved implementation with `$speckit-implement` after issue creation and task generation.
The subsequent PR request authorizes the necessary delivery commits and push. Production migrations, deployment,
and releases remain outside this request.
`PLAN.md` remains the architecture baseline. Existing global channels and browser push follow the current glossary
and implementation; their differences from the older repository-scoped architecture text are recorded in research.

## User Scenarios & Testing

### User Story 1 - Enable Working Browser Push (Priority: P1)

A signed-in user explicitly enables browser notifications and receives a notification on that device.

**Why this priority**: Delivery currently fails according to the user; reliable enrollment is essential.

**Independent Test**: Enroll a fresh supported browser, trigger an authorized test notification, observe its display,
and reload to confirm accurate enrollment status.

**Acceptance Scenarios**:

1. **Given** no existing enrollment, **When** the user allows notifications, **Then** enrollment completes and the
   device can display a test notification, including after a fresh application load.
2. **Given** denied permission, unsupported browser, unavailable configuration, or enrollment failure, **When** the
   user opens notifications, **Then** the interface shows the specific state and a suitable recovery action.
3. **Given** a previous account or expired enrollment, **When** the current account enables notifications,
   **Then** enrollment never silently transfers another account's subscription or reports false success.

### User Story 2 - Navigate Channels and Delivery History (Priority: P2)

An authorized user operates table controls beside the page breadcrumb without a second toolbar.

**Why this priority**: Consolidates related controls and makes delivery history discoverable.

**Independent Test**: Open each route, operate sorting/filtering/column options, and navigate between routes.

**Acceptance Scenarios**:

1. **Given** the channels page, **When** it renders, **Then** one responsive toolbar contains breadcrumbs, table
   controls, and permitted channel creation and delivery-history actions.
2. **Given** delivery-history access, **When** its navigation action is selected, **Then** the history page opens
   with one toolbar, a history breadcrumb, and working table controls.
3. **Given** a user without delivery-history access, **When** either toolbar renders, **Then** no forbidden history
   action appears and direct navigation remains denied.

### User Story 3 - Create a Channel in Four Steps (Priority: P2)

A System Administrator creates a channel using name/type, destination parameters, events, and preview steps.

**Why this priority**: Reduces configuration overload while preserving existing channel capabilities.

**Independent Test**: Complete each supported channel type, navigate backward, correct validation errors, and save once.

**Acceptance Scenarios**:

1. **Given** a new channel, **When** its dialog opens, **Then** four ordered steps are visible: name and type;
   destination parameters; events; preview and review.
2. **Given** incomplete required fields, **When** advancing, **Then** the current step identifies its errors and
   retains entered values; later steps cannot be skipped to save invalid configuration.
3. **Given** a browser-push channel, **When** configuring its destination, **Then** recipient selection replaces
   URL/token fields and device enrollment remains a separate user action.
4. **Given** a valid channel, **When** reviewing it, **Then** a secret-safe summary and applicable event preview are
   shown; only final confirmation persists it, with no outbound test delivery caused by preview.
5. **Given** an existing channel, **When** editing it, **Then** its type remains fixed and stored credentials remain
   unchanged unless explicitly replaced.

### User Story 4 - Access Personal Notifications from the Navbar (Priority: P2)

A signed-in user opens notifications immediately left of the user dropdown and sees recent personal history.

**Why this priority**: Makes notifications available throughout the application without the page banner.

**Independent Test**: Open the navbar on multiple routes and accounts; verify device controls and five recent entries.

**Acceptance Scenarios**:

1. **Given** any authenticated application route, **When** its navbar renders, **Then** the notification button sits
   immediately left of the user dropdown; the old browser-notifications banner is absent from the channels page.
2. **Given** recent personal browser-push attempts, **When** the button is opened, **Then** at most five distinct
   Notification Deliveries appear newest first, with localized event, subject, time, and personal send state.
3. **Given** no history or a loading/request failure, **When** opening the popover, **Then** an explicit empty,
   loading, or retryable error state appears independently of device enrollment controls.
4. **Given** another recipient's delivery or revoked Repository access, **When** history is requested,
   **Then** neither the entry nor its subject or link is exposed.

### Edge Cases

- Worker installation stalls; browser permission is denied or later revoked; VAPID configuration is absent or rotated.
- Browser subscription exists while server enrollment is missing; sign-out or account switching interrupts cleanup.
- All devices expire, some devices succeed, or delivery retries occur; history shows no duplicate logical deliveries.
- A channel changes recipients, a subscription is deleted, or Repository access is revoked after an attempt.
- A user changes channel type mid-draft; hidden incompatible values cannot enter the saved payload.
- Preview is stale, unavailable, empty, partially synchronized, or irrelevant to non-workflow events.
- Saving fails, the dialog closes/reopens, or an asynchronous preview returns after its input changed.
- Mobile width, keyboard navigation, focus restoration, German labels, and long subject names.

## Requirements

### Functional Requirements

- **FR-001**: Both notification routes MUST expose one breadcrumb/action toolbar and preserve existing table state,
  pagination, shortcuts, metadata, loading states, and authorization.
- **FR-002**: The channels toolbar MUST expose delivery-history navigation only to System Administrators.
- **FR-003**: Channel creation MUST use the four ordered steps described above, retaining valid values when moving back.
- **FR-004**: Step-local validation and final full validation MUST reject incomplete or incompatible payloads.
- **FR-005**: All six existing channel types, event subscriptions, repository filters, workflow patterns, enabled state,
  and write-only credential behavior MUST remain supported. Editing MUST preserve existing semantics.
- **FR-006**: Preview MUST summarize configuration without exposing credentials and distinguish historical workflow
  matches from unsimulated event types. Preview failures MUST offer retry without destroying the draft.
- **FR-007**: Browser enrollment MUST distinguish browser capability, permission, worker readiness, server availability,
  local subscription, and authenticated-user enrollment; enabling MUST require explicit user interaction.
- **FR-008**: Enrollment MUST recover from first-install timing and failed registration without false enabled states;
  account changes and key rotation MUST preserve subscription ownership and protect the previous account's delivery.
- **FR-009**: Expired/rejected push targets MUST have accurate sanitized attempts; push-service acceptance MUST NOT be
  presented as proof that a user saw a notification. Existing durable deduplication and bounded retries MUST remain.
- **FR-010**: The notification navbar button MUST replace the old page banner, provide current-device controls,
  and expose the latest five personal browser-push deliveries across authenticated routes.
- **FR-011**: Personal history MUST require recorded recipient ownership and current Repository access, including for
  System Administrators; admin-wide delivery history MUST retain its separate existing authorization.
- **FR-012**: History MUST group retries/devices into one entry per logical delivery; no unread count, read receipts,
  mark-as-read, general inbox, or new real-time transport is required.
- **FR-013**: All visible text MUST support English and German; dialogs/popovers MUST support keyboard/focus navigation
  and mobile layouts. Initiating buttons MUST remain loading until their awaited operation completes.

### Key Entities

- **Notification Channel**: Existing global destination, configuration, event subscriptions, and optional recipients.
- **Notification Event Subscription**: Existing event selection and optional Repository/workflow filters.
- **Notification Delivery / Delivery Attempt**: Existing logical delivery and recorded transport outcomes.
- **Notification Recipient**: Existing User selected as a browser-push destination; historical visibility requires
  attribution at attempt time rather than inference from today's channel membership.
- **Channel Draft**: Temporary dialog values, active step, validation errors, and input-specific preview state.

### Assumptions and Dependencies

- “Preview” means the existing historical workflow-rule preview plus a masked review summary, not a message send.
- “Short history” means five personal browser-push deliveries, including test attempts; it is independent of OS support.
- Pre-upgrade attempts lacking reliable recipient attribution remain absent from personal history.
- Creation adopts the wizard; editing may reuse it while preserving fixed type and explicit secret replacement.
- Live push confirmation requires a supported secure-context browser, configured VAPID keys, and an explicit test send.

## Success Criteria

- **SC-001**: Each notification route has exactly one breadcrumb/action toolbar at desktop and mobile widths.
- **SC-002**: All six channel types can be created through four steps; invalid steps prevent advancement and one final
  save creates exactly one channel in the normal successful flow.
- **SC-003**: A fresh supported browser enrolls and displays a controlled test notification; denied permission,
  missing server enrollment, account switching, and expired targets never appear falsely successful.
- **SC-004**: Every authenticated route exposes the navbar button in the requested position, with no old page banner.
- **SC-005**: Personal history contains at most five distinct authorized deliveries, including across retries;
  cross-user and revoked-access tests expose zero unauthorized entries.
- **SC-006**: English/German, keyboard, empty/error/loading, and mobile acceptance scenarios pass before implementation
  is considered complete.
