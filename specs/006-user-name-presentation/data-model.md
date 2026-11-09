# Data Model: User Identity Presentation

## Existing User

| Field       | Meaning             | Rule                                                   |
| ----------- | ------------------- | ------------------------------------------------------ |
| `id`        | Stable identity     | Selection/membership/recipient writes keep using IDs   |
| `username`  | Required login name | Parenthesized after personal name; standalone fallback |
| `firstName` | Nullable first name | Trim surrounding whitespace; display first             |
| `lastName`  | Nullable last name  | Trim surrounding whitespace; display second            |

Existing authenticated User, User resource, repository membership, and group membership contracts supply these fields.
No database migration, uniqueness change, profile requirement, or authentication change.

## Derived Labels

Join nonempty trimmed name parts with one space. Preserve internal spelling, Unicode, case, and internal name spacing.
Compact display uses the name or username fallback. Selection appends ` (@username)` if it adds identifying information.
Detect actual personal-name presence independently of string equality. Never store derived labels.

| First name | Last name  | Username | Selection label         |
| ---------- | ---------- | -------- | ----------------------- |
| Vera       | Viewer     | viewer   | `Vera Viewer (@viewer)` |
| `Vera`     | `Viewer`   | viewer   | `Vera Viewer (@viewer)` |
| Vera       | null       | viewer   | `Vera (@viewer)`        |
| null       | Viewer     | viewer   | `Viewer (@viewer)`      |
| null       | null       | viewer   | `viewer`                |
| whitespace | whitespace | viewer   | `viewer`                |
| viewer     | null       | viewer   | `viewer`                |

Duplicate names remain distinguishable by username and stable ID. Compact non-selector presentation may omit username.

## Notification Projections

- `browserRecipients[]`: retain `id`/`username`; add nullable `firstName`/`lastName`.
- Delivery `requestedBy`: additive optional nullable `{ id, username, firstName, lastName }`; deleted relation is null.
- Delivery `requestedByUsername`: retained unchanged for compatibility and older-response fallback.
- New name properties may be absent in older responses; current API explicitly emits string/null values.
- Read current related User names on refresh, rather than persisting historical display names.
- Select/map only safe fields through existing authorization and DTO boundaries. Never add emails, password hashes,
  tokens, OIDC subjects, or notification credentials to these projections.

## Relationships and State

User-to-Repository Membership, User-to-User Group, recipient, and requester relations remain unchanged. Search affects
candidate discovery only. User IDs and mutation payloads remain stable. Existing fetch/refresh updates computed labels;
no new background synchronization or state machine is introduced.
