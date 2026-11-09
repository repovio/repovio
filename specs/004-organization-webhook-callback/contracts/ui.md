# UI Contract: Organization Webhook Form Callback

## Location and accessibility

The organization webhook setup form contains exactly one labeled callback URL input beside organization and secret setup.
Use existing localized callback and copy labels; the native input is read-only, focusable, selectable, and not required.
The trailing copy control is an explicit non-submit button and has an accessible localized name.

## Value and interaction

- Unsaved form: empty input, localized help explaining availability after saving, copy disabled.
- Saved or selected configuration: exact server-returned `callbackUrl`, copy enabled.
- Copy: existing clipboard helper writes the exact visible URL and reports clipboard denial through localized feedback.
- No callback URL is submitted with create or rotation requests.
- Reset, successful removal, and reopening restore the unsaved form state.
- Existing configuration-card callback fields remain available; tests scope form controls separately.

## Compatibility

Keep all existing management routes, request/response contracts, repository badge behavior, provider permissions, and
pending/error controls. A pending request must not release its initiating button early or allow duplicate submission.
The callback field must fit the dialog on a 390px viewport, including long addresses.

## API reference

The existing safe `OrganizationWebhook.callbackUrl` is authoritative. Backend construction uses the configured public
application URL and persisted hook ID. No browser-origin reconstruction, preview endpoint, or provider registration occurs.
