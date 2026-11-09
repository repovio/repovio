# UI Contract: Notifications Navigation

## Shared application navigation

- Exactly one localized Notifications link targets `/notifications`, using the existing bell icon and accessible label.
- No Notifications collapsible trigger, Channels child, or Delivery history child remains.
- Expanded desktop, collapsed desktop, mobile navigation, global search, and command palette use that single destination.
- Channels and history both mark Notifications active. Selecting the active link still returns to channels.

## History discovery and compatibility

- The channel toolbar retains its existing localized Delivery history link to `/notifications/history` for
  `SYSTEM_ADMIN` only, including channel empty/error states.
- Sidebar, search, command palette, and navbar notification popover expose no administrative history link.
- Direct history URLs, page refresh, browser back/forward, history details, and the return breadcrumb remain supported.
- Existing history authorization and backend query restrictions remain authoritative; navigation visibility is not security.
- Personal recent notifications and browser-push controls in the navbar popover remain unchanged.

## Localization and accessibility

Reuse `layout.notifications` and `notifications.tabs.history`; retain any channel labels used outside navigation.
Verify English and German through visible labels and accessible names, without introducing hard-coded product text.
The item is a keyboard-operable link, with no expansion affordance; active styling and accessible current-page state
must agree with the current notification section.

No HTTP API, provider, authentication, database, or notification delivery contract changes.
