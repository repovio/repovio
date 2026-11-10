# UI and Existing API Contracts

## Toolbar history

The System Administrator toolbar exposes a `UButton` link with `i-lucide-history`, destination
`/notifications/history`, no visible label, localized accessible name, and matching localized tooltip.
The action remains reachable during table empty/error states. Manager and Viewer visibility/access remain unchanged.

## Availability boundary

Retain authenticated `GET /api/v1/browser-push` and its existing response:

```text
available: boolean
publicKey: string | null
subscriptionCount: number
```

No new endpoint or response fields are planned. Client view state carries read lifecycle separately from the response.
Only a successful available result enables new Browser push selection. An unsupported browser or denied permission does
not disable global channel configuration. Existing channel type and recipient data remain visible when server push is off.

The dialog boundary supplies availability state and a retry action instead of only an ambiguous boolean. Exact prop/event
names should follow repository conventions during task generation. A visible explanation is adjacent to the type control,
so disabled options are not the only source of information. Retry exposes pending state for its entire awaited operation.

## Wizard

Four `UStepper` items use explicit values 0 through 3 and localized titles. Current draft step is authoritative. Click,
keyboard, Back, Next, and Enter pathways follow the same validation and pending-state guards.
Direct jumps beyond the next step are rejected; next-step requests run current-step validation before accepting a value.

`UModal #body` owns the single `UForm` and active step section. `UModal #footer` owns navigation actions. Footer Save
calls `channelForm.submit()`, preserving the existing validated submit event and write/refresh lifecycle. No direct save
handler call bypasses form validation. Pre-review Enter cannot persist; repeated activation cannot create duplicate writes.

## Accessibility, locales, and permissions

Keep step labels, error text, checking state, retry text, and history tooltip/name in English and German locale files.
Step changes move focus into visible content. Invalid navigation retains useful focus and field errors. Footer controls
remain reachable with keyboard and at narrow widths; modal focus trapping and close behavior remain intact.
Existing role guards and API authorization remain the enforcement boundaries. No foreign User enrollment details or
credential values appear in diagnostics, rendered errors, fixtures, screenshots, or logs.

The draft exposes `requestStep(value)` for controlled stepper transitions. Next, Back, and indicator requests reject
changes while submitting, recovering a persisted save, or previewing. A forward request validates exactly the current step.

The page propagates Query Kit table error state after awaiting refresh so the persisted-save dialog remains open for
refresh-only recovery. The modal close action is hidden during submission; outside click and Escape remain blocked.

The history tooltip wraps the administrator-only link; its accessible name remains the existing localized history label.
