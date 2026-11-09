# Data Model: Simplify Notifications Navigation

No database entities, migrations, API DTOs, or persisted state changes.

## Existing navigation presentation model

| Field                                      | Intended value/behavior                                 |
| ------------------------------------------ | ------------------------------------------------------- |
| `label`                                    | Existing localized `layout.notifications`               |
| `icon`                                     | `i-lucide-bell`                                         |
| `to`                                       | `/notifications`                                        |
| `active`                                   | True on `/notifications` and nested notification routes |
| `aria-label`                               | Visible localized label through `toMenuItem`            |
| `children`, `type: trigger`, `defaultOpen` | Absent on the Notifications item                        |

`navigationItems` contains one Notifications link. `navigationSearchItems` contains the same destination once.
No Channels or administrative Delivery history search destination remains.

## Navigation transitions

- Any application page: Notifications selection opens channel listing.
- Channels, System Administrator: toolbar Delivery history opens `/notifications/history`.
- History: Notifications breadcrumb or main link returns to channels.
- Direct history URL: existing administrator access policy applies; Notifications remains active.
- Viewer/Manager: channel access and administrative history denial remain unchanged.

Notification Channel, Notification Delivery, Delivery Attempt, and personal recent-notification data remain unchanged.
