# Research: Organization Webhook Callback Field

## Callback availability

**Decision**: Show the field immediately; show a localized explanation until the first successful local save.

**Rationale**: `OrganizationWebhooksService.toDto` builds the callback from `ENV.PUBLIC_URL` and the persisted hook ID:
`/api/webhooks/organization/{id}`. Creation supplies that ID. Scope and browser origin cannot reconstruct a valid URL.

**Alternatives considered**: Guessing from scope/browser origin yields incorrect addresses. Preallocating identifiers or
adding a draft endpoint expands the API and persistence lifecycle beyond the requested field correction.

## Presentation state

**Decision**: Compute the callback from the configuration selected by `editingId`.

**Rationale**: `useOrganizationWebhooks` already updates its configuration list with server-returned metadata after saving.
The component sets `editingId` after creation and on selection; its existing reset clears that ID. This avoids duplicate
state and makes configuration switching safe. The strict creation request has no callback property.

**Alternatives considered**: A separate mutable callback ref needs redundant save/edit/reset synchronization. Adding a
callback property to `form` would violate the strict request schema unless explicitly filtered.

## UI and validation patterns

**Decision**: Reuse the existing labeled read-only input, trailing copy button, labels, and clipboard error helper.
Add only English/German pre-save helper text and scoped browser assertions.

**Rationale**: The list cards already implement this presentation. Existing Playwright coverage exercises English desktop
and German mobile flows, synthetic requests, pending behavior, rotation, removal, and repository inheritance.

**Alternatives considered**: Removing card fields creates unrelated UI changes. Keeping only card fields leaves the
requested setup form incomplete. New component abstractions are unnecessary for a single small addition.

## Research validation

A delegated read-only design review confirmed the selected-ID approach and identified the existing
`input[readonly].first()` browser assertion as fragile once the form gains another read-only field.

All design questions are resolved within the assumptions in [spec.md](spec.md). Research used current repository sources;
no new framework APIs or external service contracts are introduced.
