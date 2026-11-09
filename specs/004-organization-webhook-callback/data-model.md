# Data Model: Organization Webhook Callback Field

## Existing entities

- `OrganizationWebhook`: Safe metadata with `id`, `providerAccountId`, `providerType`, `scope`, `callbackUrl`, and
  `lastDeliveryAt`. Keep all fields and validation unchanged.
- `CreateOrganizationWebhook`: Strict input containing only `scope` and `webhookSecret`; no callback field.
- `RotateOrganizationWebhook`: Existing write-only secret input; no callback field.

## Transient presentation

- `configurations`: Existing safe configuration list owned by the API composable.
- `editingId`: Existing selected configuration identifier; absent for a new unsaved configuration.
- Derived callback value: The matching configuration's `callbackUrl`, otherwise an empty string. Never persisted separately.

## State transitions

| Event                          | Selected configuration | Form callback                       |
| ------------------------------ | ---------------------- | ----------------------------------- |
| New form / reset / Add another | None                   | Empty, pre-save help, copy disabled |
| Creation pending or failed     | None                   | Empty, no fabricated address        |
| Creation succeeds              | Returned configuration | Exact returned callback             |
| Select existing configuration  | Selected configuration | That configuration's callback       |
| Rotation succeeds or fails     | Existing selection     | Existing configuration's callback   |
| Successful removal             | None                   | Empty                               |
| Dismiss and reopen             | None                   | Empty                               |

The list may still contain valid callback metadata when the form is reset; only the form's selection is cleared.
No migrations, schema updates, endpoint changes, or additional requests are needed.
