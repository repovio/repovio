# UI Contract: Repository Navigation and Settings

## Entry points

| Entry                                        | Destination                                   |
| -------------------------------------------- | --------------------------------------------- |
| Repository name or noninteractive row area   | `/repositories/:id`                           |
| Global-search Repository result              | `/repositories/:id`                           |
| Explicit administrator row action            | `/repositories/:id/settings`                  |
| Explicit Viewer/Manager row action           | `/repositories/:id`                           |
| `/repositories?repository=<nonempty scalar>` | Replace with encoded Repository Overview path |

Legacy query conversion removes only `repository`; preserve other query parameters and fragments. Empty or repeated
values do not redirect. Preserve existing legacy administration redirects and `#settings` behavior. Normal page access
checks apply; redirecting a link grants no additional permissions.

## Primary navigation

The Repository alert link uses Alerts (en) / Warnungen (de). Its `/security-alerts` path, category contract, and
Manager/System Administrator visibility remain unchanged. Other global/product Security Alert labels remain unchanged.

## Settings navigation

| Tab              | Query value                   | English          | German          |
| ---------------- | ----------------------------- | ---------------- | --------------- |
| General          | absent, or `general` accepted | General          | Allgemein       |
| Webhook          | `webhook`                     | Webhook          | Webhook         |
| Workflow filters | `workflow-filters`            | Workflow filters | Workflow-Filter |
| Members          | `members`                     | Members          | Mitglieder      |
| Group access     | `groups`                      | Group access     | Gruppenzugriff  |

- Base path is `/repositories/:id/settings`; existing administrator middleware applies to every query variant.
- General navigation omits `tab`. Other tabs push history with the listed value. Preserve unrelated query/hash state.
- Unknown, empty, or repeated values use replace navigation to remove `tab` and select General. No redirect loops.
- Exactly one secondary navigation item is active. Links support keyboard activation and visible focus.
- Navigation strip may scroll horizontally; document and form controls must not overflow the viewport.
- One full-width panel is visible. Visited panels retain current-visit state but hidden content must not be focusable
  or exposed to assistive technology. No pending mutation is canceled or resubmitted by switching tabs.
- The section is shareable; unsaved drafts are deliberately not shareable or persistent across leaving Settings.

## Configuration operations

Keep current API contracts, validation, role restrictions, confirmations, and request-lifetime loading states.
All five existing configuration areas remain operable. Opening hidden, unvisited sections must not issue their requests.
Deletion confirmation and add dialogs remain; only the Repository details dialog is removed.
