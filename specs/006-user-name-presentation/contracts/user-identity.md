# User Identity UI and API Contract

## Presentation

Every Repovio User choice, selected value, and chip uses the selection label in [data-model.md](../data-model.md).
Other User references use compact or selection labels. Secondary usernames must be parenthesized; no bare `@username`
secondary line for a named User. Accessible descriptions and confirmations receive the same identity through localized
copy. Preserve IDs, keyboard behavior, role choices, loading/error states, and stale-response protection.

Names remain primary in narrow layouts. When truncating, expose the full identity accessibly. Preserve credential
inputs, destination-service usernames, Provider Accounts, and Provider Actor references.

## Existing Resource Queries

- `GET /api/v1/users` retains authorized resource querying, existing User DTO names, field filtering, and page metadata.
- Nonempty search: whole entered query matches username OR every whitespace-delimited token matches firstName OR lastName,
  case-insensitively. Empty search adds no name predicate. Retain deterministic username/ID ordering.
- Group-member and repository-member resource identities and mutation contracts remain unchanged.
- Notification User discovery is paginated and authorized. Retain selected labels across page/search changes and hydrate
  existing choices from safe configured recipient resources; do not require all recipients in the current result page.

## Additive Response Changes

| Resource                       | Change                                                             |
| ------------------------------ | ------------------------------------------------------------------ |
| Channel `browserRecipients[]`  | Keep `id`/`username`; add nullable `firstName`/`lastName`          |
| Delivery `requestedBy`         | Add optional nullable safe `{ id, username, firstName, lastName }` |
| Delivery `requestedByUsername` | Retain unchanged                                                   |

New names may be absent when parsing older API responses. Updated server mapping emits explicit string/null values.
Declare new properties in strict shared schemas and DTOs; align controller/service relation selects, channel/delivery
mapping, frontend types, and fixtures. Update relevant Bruno examples/API docs, and verify consuming-client compatibility.
New client fallback for older username-only responses follows existing missing-name rules.

No display names enter mutation payloads. Preserve recipient visibility, field filtering, assignment IDs, and delivery
semantics. Deleted requesters remain null; no invented or reconstructed identities. No credentials or unrelated User
fields are added. No provider calls or persistence migration.

## Required Evidence

- Formatter truth table, Unicode, duplicate and whitespace cases.
- Named, null-name, older-response, and deleted-requester schema parsing.
- API recipient visibility, authorization, field filtering, and credential exclusion.
- First/last/full-name/username search beyond page one and the old 100-choice cap.
- All [inventory surfaces](../research.md), selected values, confirmations, profile refresh, EN/DE, keyboard access,
  and narrow browser layouts.
